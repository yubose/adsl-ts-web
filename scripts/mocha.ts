process.env.TS_NODE_PROJECT = 'tsconfig.test.json'
import 'ts-mocha'
import 'jsdom-global/register'
import Mocha from 'mocha'
import globby from 'globby'
import fs from 'fs-extra'
import chalk from 'chalk'

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

// mocha.parallelMode(true)

mocha.globalSetup((done) => {
  import('../packages/noodl-ui/src/setupTests')
})

globby('./packages/noodl-ui/src/__tests__/Page.test.ts').then((filepaths) => {
  const numFiles = filepaths.length

  for (let index = 0; index < numFiles; index++) {
    const filepath = filepaths[index]
    console.log(`Adding file: ${chalk.cyan(filepath)}`)
    mocha.addFile(filepath)
  }

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
