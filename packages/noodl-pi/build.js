const childProcess = require('child_process')
const u = require('@jsmanifest/utils')
const meow = require('meow')
const rollup = require('rollup')
const partialRight = require('lodash/partialRight')

const {
  flags: { watch },
} = meow('', { flags: { watch: { alias: 'w', type: 'boolean' } } })

if (watch) {
  let spawnOptions = { encoding: 'utf8', shell: true, stdio: 'inherit' }
  const shell = partialRight(childProcess.spawnSync, spawnOptions)
  shell(`rollup -c rollup.config.js -w BUILD:development`)
  shell(
    `tsc --declaration --emitDeclarationOnly --declarationDir dist --skipLibCheck -w`,
  )
} else {
  const rollupConfig = require('./rollup.config.js')
  rollup
    .rollup(rollupConfig)
    .then(async (buildResult) => {
      const stripRootDir = (s = '') =>
        `./${s.substring(s.search(/(packages|node_modules)/))}`

      u.newline()
      const output = (
        await buildResult.write({
          exports: rollupConfig.output.exports,
          file: rollupConfig.output.file,
          format: rollupConfig.output.format,
          name: rollupConfig.output.name,
          sourcemap: rollupConfig.output.sourcemap,
        })
      ).output[0]

      let moduleEntries = u.entries(output.modules)

      moduleEntries.forEach(([filepath]) => {
        console.log(`[${u.cyan('Build')}] ${u.yellow(stripRootDir(filepath))}`)
      })

      console.log(
        `[${u.cyan('Build')}] Generated ${u.yellow(output.fileName)})`,
      )
    })
    .catch((error) => {
      u.logError(error instanceof Error ? error : new Error(String(error)))
    })
    .finally(() => u.newline())
}
