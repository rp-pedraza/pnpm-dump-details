import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as process from 'process'
import { execSync } from 'child_process'
import { quote } from 'shell-quote'

const getTempDirRoot = (dir: string): string | null => {
  const parts = dir.split('/')
  const index = parts.findIndex(part => part === 'pnpm_tmp')
  return index === -1 ? null : parts.splice(0, index + 3).join('/')
}

const counter: Record<string, number> = {}

const q = (arg: string): string => quote([arg])

const LOGS_DIR = '/var/tmp'

const executeCommand = (command: string, fd: number) => {
  try {
    const stdout = execSync(command).toString()
    fs.writeSync(fd, stdout)
  } catch (error) {
    if (typeof error === 'object') {
      const castedError = error as { stdout?: string, stderr?: string, message?: string, status?: number }

      if (castedError.stderr) {
        fs.writeSync(fd, castedError.stderr)
      }
      if (castedError.message) {
        fs.writeSync(fd, `Error: ${castedError.message}\n`)
      }
      if (castedError.status) {
        fs.writeSync(fd, `Status: ${castedError.status}\n`)
      }
    }
  }
}

export const getIncrementedFilename = (filename: string) => {
  counter[filename] ??= -1
  return filename + '.' + (counter[filename] += 1)
}

export const dumpDetails = (
  filename: string,
  opts?: {
    append?: boolean
    dir?: string
    increment?: boolean
    logsDir?: string
    showPackageJsonContents?: boolean
  }
) => {
  const pwd = process.cwd()
  const dir = opts?.dir ?? getTempDirRoot(pwd)

  if (opts?.increment) {
    filename = getIncrementedFilename(filename)
  }

  const fd = fs.openSync(path.join(opts?.logsDir ?? LOGS_DIR, filename), opts?.append ? 'a' : 'w')

  fs.writeSync(fd, '--------------------------------------------------------------------------------\n')
  fs.writeSync(fd, `PWD: ${pwd}\n\n`)

  if (dir) {
    executeCommand(`/usr/bin/tree -I store -a --charset=utf8 ${q(dir)}`, fd)
    fs.writeSync(fd, '\n')

    if (opts?.showPackageJsonContents) {
      fs.readdirSync(dir, { recursive: true, withFileTypes: true }).forEach((ent: fs.Dirent) => {
        if (ent.isFile() && ent.name === 'package.json') {
          try {
            const completePath = path.join(ent.path, ent.name)
            const data = fs.readFileSync(completePath, 'utf8')
            fs.writeSync(fd, `${completePath}: \n${data}EOF\n`)
          } catch (error) {
            if (typeof error === 'object') {
              fs.writeSync(fd, `Error: ${(error as Error).message}\n`)
            }
          }

          fs.writeSync(fd, '\n')
        }
      })
    }
  } else {
    fs.writeSync(fd, 'Temporary directory not detected.\n\n')
  }

  fs.closeSync(fd)
}

export const executeCommandAndDumpOutput = (
  command: string,
  filename: string,
  opts?: {
    increment?: boolean
    logsDir?: string
  }
) => {
  if (opts?.increment) {
    filename = getIncrementedFilename(filename)
  }

  const fd = fs.openSync(path.join(opts?.logsDir ?? LOGS_DIR, filename), 'w')
  executeCommand(command, fd)
  fs.closeSync(fd)
}
