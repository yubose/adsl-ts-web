#!/usr/bin/env node
console.clear()
const { cyan, magenta, red, white } = require('noodl-common')
const get = require('lodash/get')
const set = require('lodash/set')
const meow = require('meow')
const yaml = require('yaml')
const fs = require('fs-extra')

/** @type { Record<string, any> } */
const config = yaml.parse(fs.readFileSync('noodl.yml', 'utf8'))
const tag = (s) => cyan(`[${s}]`)

const cli = meow(
  `
  Usage

  $ op update --lib (or -l) ${magenta(`@aitmed/cadl`)}
  $ op start (or -s) --lib (or --app) --env test
  $ op build (or -b) --lib (or --app) --env stable
`,
  {
    flags: {
      start: { alias: 's', type: 'string' },
      build: { alias: 'b', type: 'string' },
      convert: { alias: 'c', type: 'string' },
      test: { alias: 't', type: 'string' },
      update: { alias: 'u', type: 'string' },
      deploy: { alias: 'd', type: 'boolean', default: true },
    },
  },
)

const { flags, input } = cli
const { lib } = flags
const script = input[0]

console.log(`\n${cyan('Args')}`, flags)
console.log(`${cyan('Input')}: ${white(input.join(', '))}\n`)

switch (script) {
  case 'build':
  case 'start':
    require('./buildOrStart')(getCliArgs())
    break
  case 'convert':
  case 'split':
  case 'sync':
  case 'update':
    require(`./${script}`)(getCliArgs())
    break
  default:
    throw new Error(
      `${red('Invalid script')}. Current available options are: ${cyan(
        `build`,
      )}, ${cyan(`start`)}, ${cyan(`convert`)}, ${cyan(`split`)}, ${cyan(
        `sync`,
      )}, ${cyan(`update`)}`,
    )
}

function getCliArgs() {
  return {
    config,
    flags,
    input,
    script: input[0],
    tag,
  }
}

module.exports = getCliArgs()
