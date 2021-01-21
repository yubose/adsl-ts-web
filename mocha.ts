// @ts-expect-error
process.env.TS_CONFIG_PATHS = true
process.env.TS_NODE_PROJECT = 'tsconfig.test.json'
import 'ts-mocha'
import 'jsdom-global/register'
import Mocha from 'mocha'
import path from 'path'
import globby from 'globby'
import fs from 'fs-extra'
import chalk from 'chalk'
import { Command } from 'commander'

const cli = new Command()

cli.parse(process.argv)

const getFilePath = (...args) => path.resolve(path.join(process.cwd(), ...args))

const dirs = {
  noodlui: 'packages/noodl-ui',
  noodluidom: 'packages/noodl-ui-dom',
  noodlutils: 'packages/noodl-utils',
}

const getFilesList = async () => {
  switch (cli.args[0]) {
    case 'redraw':
      return globby(path.join(dirs.noodluidom, 'src/__tests__/redraw.test.ts'))
    case 'resolver':
      return [
        path.join(dirs.noodlui, 'src/__tests__/ComponentResolver.test.ts'),
      ]
    default:
      return []
  }
}

const mocha = new Mocha({
  checkLeaks: true,
  color: true,
  fullStackTrace: true,
  rootHooks: {
    beforeAll() {},
    afterAll() {},
    beforeEach() {},
    afterEach() {},
  },
  inlineDiffs: true,

  // parallel: true,
  // reporter: 'list',
  ui: 'bdd',
})

// mocha.enableGlobalSetup(true)

// mocha.globalSetup((done) => {
//   // import(getFilePath(dirs.noodluidom, 'src/setupTests.ts'))

//   done()
// })

getFilesList()
  .then((files) => {
    files.forEach((f) => {
      console.log(`Adding file: ${chalk.cyan(f)}`)
      mocha.addFile(f)
    })
  })
  .then(() => {
    mocha
      .run((failures) => {
        process.on('exit', () => {
          process.exit(failures) // exit with non-zero status if there were failures
        })
      })
      .on('pass', (test) => {
        //
      })
      .on('fail', (test, err) => {
        //
      })
      .on('pending', (test) => {
        //
      })
      .on('start', () => {
        //
      })
      .on('hook', (hook) => {
        //
      })
      .on('hook end', (hook) => {
        //
      })
      .on('test', (test) => {
        //
      })
      .on('test end', (test) => {
        //
      })
      .on('suite', (suite) => {
        //
      })
      .on('suite end', (suite) => {
        //
      })
      .on('end', () => {
        //
      })
  })
  .catch((err) => {
    console.error(err)
    throw new Error(err)
  })
