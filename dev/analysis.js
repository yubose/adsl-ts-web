process.stdout.write('\x1Bc')
const axios = require('axios').default
const y = require('yaml')
const fse = require('fs-extra')
const path = require('path')
const fg = require('fast-glob')
const n = require('noodl-core')
const u = require('@jsmanifest/utils')
const ny = require('noodl-yaml')
const { factory } = require('./assert')
const assertInit = require('./assert/init')
const assertList = require('./assert/components/list')
const assertRef = require('./assert/reference')
const { runDiagnosticsbyConfig } = require('./cst')

async function runDiagnostics({ baseUrl, config: configKey }) {
  try {
    const diagnostics = await runDiagnosticsbyConfig({ baseUrl, configKey })
    return diagnostics
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

module.exports.runDiagnostics = runDiagnostics
