const execa = require('execa')
const u = require('@jsmanifest/utils')
const path = require('path')
const { readdir } = require('fs-extra')
const { magenta, newline, red } = require('noodl-common')

const pkgs = {
  lvl2: '@aitmed/ecos-lvl2-sdk',
  sdk: '@aitmed/cadl',
  noodlTypes: 'noodl-types',
  noodlActionChain: 'noodl-action-chain',
}

/**
 *
 * @param { import('./op') } props
 */
async function test(props) {
  const { flags } = props
  const { test: testPreset } = flags

  /** @type Parameters<typeof execa.commandSync>[1] */
  const args = { shell: true, stdio: 'inherit' }

  switch (testPreset) {
    case 'ntil':
      return execa.commandSync(`npm run test:ntil`, {
        shell: true,
        stdio: 'inherit',
      })
    case 'register':
      return execa.commandSync(`npm run test:nui`, {
        shell: true,
        stdio: 'inherit',
      })
  }
}

module.exports = test
