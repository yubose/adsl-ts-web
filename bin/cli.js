#!/usr/bin/env node
'use strict'

const meow = require('meow')
const execa = require('execa')

const cli = meow('', {
  autoHelp: true,
})

const [cmd, ...args] = cli.input

if (['nt', 'nui', 'ndom'].includes(cmd)) {
  const mapping = {
    nt: 'noodl-types',
    nui: 'noodl-ui',
    ndom: 'noodl-ui-dom',
  }

  execa.command(`lerna exec --scope ${mapping[cmd]} ${args.join(' ')}`, {
    shell: true,
    stdio: 'inherit',
  })
}
