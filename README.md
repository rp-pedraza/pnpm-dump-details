# @rp-pedraza/pnpm-dump-details

Used for dumping active test data in pnpm's test suites

This virtually should be placed in 'pnpm/__utils__' if it's actually integrated in pnpm's source code.

## Example Usage

**pnpm/pkg-manager/plugin-commands-installation/test/link.ts**
```js
import { dumpDetails } from '@rp-pedraza/pnpm-dump-details'

...
test('relative link from workspace package', async () => {
  prepareEmpty()

  // Store common values
  const logFilename = 'relative-link-from-workspace-package.pnpm.log'
  const logFilenameExtra = logFilename + '.extra'

  await writePkg('workspace/packages/project', {
    name: 'project',
    version: '1.0.0',
    dependencies: {
      '@pnpm.e2e/hello-world-js-bin': '*',
    },
  })

  const workspaceDir = path.resolve('workspace')
  const projectDir = path.resolve('workspace/packages/project')

  f.copy('hello-world-js-bin', 'hello-world-js-bin')
  writeYamlFile(path.join(workspaceDir, 'pnpm-workspace.yaml'), { packages: ['packages/*'] })
  process.chdir(projectDir)

  // First call to dumpDetails
  dumpDetails(logFilename, { increment: true, showPackageJsonContents: true })

  await link.handler({
    ...DEFAULT_OPTS,
    dedupeDirectDeps: false,
    dir: process.cwd(),
    globalPkgDir: '',
    lockfileDir: workspaceDir,
    rootProjectManifest: {
      dependencies: {
        '@pnpm.e2e/hello-world-js-bin': '*',
      },
    },
    rootProjectManifestDir: workspaceDir,
    workspaceDir,
    workspacePackagePatterns: ['packages/*'],
  }, ['../../../hello-world-js-bin'])

  // Second call to dumpDetails
  dumpDetails(logFilename, { increment: true, showPackageJsonContents: true })

  // Execute custom commands
  process.chdir(workspaceDir)
  executeCommandAndDumpOutput('cat node_modules/.pnpm-workspace-state.json',
    logFilenameExtra, { increment: true })
  process.chdir(projectDir)
  executeCommandAndDumpOutput(`${process.env.HOME}/projects/pnpm/pnpm/bin/pnpm.cjs link ../../../hello-world-js-bin`,
    logFilenameExtra, { increment: true })

  // Third call to dumpDetails
  dumpDetails(logFilename, { increment: true, showPackageJsonContents: true })

  const manifest = loadJsonFile<{ pnpm?: { overrides?: Record<string, string> } }>(path.join(workspaceDir, 'package.json'))
  expect(manifest.pnpm?.overrides?.['@pnpm.e2e/hello-world-js-bin']).toBe('link:../hello-world-js-bin')

  const workspace = assertProject(workspaceDir);
  [workspace.readLockfile(), workspace.readCurrentLockfile()].forEach(lockfile => {
    expect(lockfile.importers['.'].dependencies?.['@pnpm.e2e/hello-world-js-bin'].version).toBe('link:../hello-world-js-bin')
    expect(lockfile.importers['packages/project'].dependencies?.['@pnpm.e2e/hello-world-js-bin'].version).toBe('link:../../../hello-world-js-bin')
  })

  const validateSymlink = (basePath: string, properValue: string) => {
    const symlink = path.join(basePath, 'node_modules', '@pnpm.e2e', 'hello-world-js-bin')
    expect(fs.readlinkSync(symlink)).toBe(properValue)
  }

  validateSymlink(workspaceDir, '../../../hello-world-js-bin')
  validateSymlink(projectDir, '../../../../../hello-world-js-bin')
})
```
