// eslint-disable-next-line
require('jsdom-global/register')
const Mocha = require('mocha')
const globby = require('globby')
const fs = require('fs-extra')
const chalk = require('chalk')
const path = require('path')

const mocha = new Mocha({
  color: true,
  fullStackTrace: true,
  inlineDiffs: true,
  ui: 'bdd',
  reporterOptions: {},
})

const filepath = path.resolve(path.join(process.cwd(), 'scripts/pos.js'))

mocha.addFile(filepath)

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
