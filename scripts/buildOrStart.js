const u = require('@jsmanifest/utils')
const path = require('path')
const fs = require('fs-extra')
const execa = require('execa')
const { spawn } = require('child_process')
const esbuild = require('esbuild')
const color = require('./colors')
const rollup = require('rollup')

const colors = [color.aquamarine, color.cyan, color.coolGold, color.fadedSalmon]

/**
 *
 * @param { import('./op') } props
 */
async function buildOrStart(props) {
  const libShell = execa.command(`npm run lib:start`, {
    encoding: 'utf8',
    stdio: 'inherit',
  })

  const appShell = execa.command(`npm run start:test`, {
    encoding: 'utf8',
    shell: true,
    stdio: 'ignore',
  })

  // const nuiPkgPath = path.resolve(path.join(process.cwd(), 'packages/noodl-ui'))
  // const nuiRollupConfigPath = path.join(nuiPkgPath, 'rollup.config.js')
  // const nuiEntryPointPath = path.join(nuiPkgPath, 'src/index.ts')
  // const nuiPkgRollupConfigCode = await fs.readFile(nuiRollupConfigPath, 'utf8')
  // const nuiCodeTransformResult = await esbuild.transform(
  //   nuiPkgRollupConfigCode,
  //   {
  //     charset: 'utf8',
  //     color: true,
  //     format: 'cjs',
  //     target: 'es6',
  //   },
  // )

  // const nuiCode = eval(nuiCodeTransformResult.code)

  // console.log(typeof nuiCode)

  // rollup
  //   .rollup({})
  //   .then((build) => {
  //     build
  //   })
  //   .catch((err) => {
  //     console.error(err)
  //   })
}

module.exports = buildOrStart
