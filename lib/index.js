"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCommandAndDumpOutput = exports.dumpDetails = exports.getIncrementedFilename = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const process = __importStar(require("process"));
const child_process_1 = require("child_process");
const shell_quote_1 = require("shell-quote");
const getTempDirRoot = (dir) => {
    const parts = dir.split('/');
    const index = parts.findIndex(part => part === 'pnpm_tmp');
    return index === -1 ? null : parts.splice(0, index + 3).join('/');
};
const counter = {};
const q = (arg) => (0, shell_quote_1.quote)([arg]);
const LOGS_DIR = '/var/tmp';
const executeCommand = (command, fd) => {
    try {
        const stdout = (0, child_process_1.execSync)(command).toString();
        fs.writeSync(fd, stdout);
    }
    catch (error) {
        if (typeof error === 'object') {
            const castedError = error;
            if (castedError.stderr) {
                fs.writeSync(fd, castedError.stderr);
            }
            if (castedError.message) {
                fs.writeSync(fd, `Error: ${castedError.message}\n`);
            }
            if (castedError.status) {
                fs.writeSync(fd, `Status: ${castedError.status}\n`);
            }
        }
    }
};
const getIncrementedFilename = (filename) => {
    counter[filename] ??= -1;
    return filename + '.' + (counter[filename] += 1);
};
exports.getIncrementedFilename = getIncrementedFilename;
const dumpDetails = (filename, opts) => {
    const pwd = process.cwd();
    const dir = opts?.dir ?? getTempDirRoot(pwd);
    if (opts?.increment) {
        filename = (0, exports.getIncrementedFilename)(filename);
    }
    const fd = fs.openSync(path.join(opts?.logsDir ?? LOGS_DIR, filename), opts?.append ? 'a' : 'w');
    fs.writeSync(fd, '--------------------------------------------------------------------------------\n');
    fs.writeSync(fd, `PWD: ${pwd}\n\n`);
    if (dir) {
        executeCommand(`/usr/bin/tree -I store -a --charset=utf8 ${q(dir)}`, fd);
        fs.writeSync(fd, '\n');
        if (opts?.showPackageJsonContents) {
            fs.readdirSync(dir, { recursive: true, withFileTypes: true }).forEach((ent) => {
                if (ent.isFile() && ent.name === 'package.json') {
                    try {
                        const completePath = path.join(ent.path, ent.name);
                        const data = fs.readFileSync(completePath, 'utf8');
                        fs.writeSync(fd, `${completePath}: \n${data}EOF\n`);
                    }
                    catch (error) {
                        if (typeof error === 'object') {
                            fs.writeSync(fd, `Error: ${error.message}\n`);
                        }
                    }
                    fs.writeSync(fd, '\n');
                }
            });
        }
    }
    else {
        fs.writeSync(fd, 'Temporary directory not detected.\n\n');
    }
    fs.closeSync(fd);
};
exports.dumpDetails = dumpDetails;
const executeCommandAndDumpOutput = (command, filename, opts) => {
    if (opts?.increment) {
        filename = (0, exports.getIncrementedFilename)(filename);
    }
    const fd = fs.openSync(path.join(opts?.logsDir ?? LOGS_DIR, filename), 'w');
    executeCommand(command, fd);
    fs.closeSync(fd);
};
exports.executeCommandAndDumpOutput = executeCommandAndDumpOutput;
//# sourceMappingURL=index.js.map