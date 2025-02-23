export declare const getIncrementedFilename: (filename: string) => string;
export declare const dumpDetails: (filename: string, opts?: {
    append?: boolean;
    dir?: string;
    increment?: boolean;
    logsDir?: string;
    showPackageJsonContents?: boolean;
}) => void;
export declare const executeCommandAndDumpOutput: (command: string, filename: string, opts?: {
    increment?: boolean;
    logsDir?: string;
}) => void;
