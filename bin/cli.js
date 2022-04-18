#!/usr/bin/env node
'use strict'
// const partialRight = require('lodash/partialRight')
const u = require('@jsmanifest/utils')
const meow = require('meow')
const { spawnSync } = require('child_process')
const winston = require('winston')
const del = require('del')
const path = require('path')
const fs = require('fs-extra')
const fg = require('fast-glob')

/**
 * @typedef ScriptUtils
 * @type { object }
 * @property { typeof del } ScriptUtils.del
 * @property { (command: string) => import('child_process').SpawnSyncReturns } ScriptUtils.exec
 * @property { Record<string, any> } ScriptUtils.flags
 * @property { typeof fg } ScriptUtils.fg
 * @property { typeof fs } ScriptUtils.fs
 * @property { import('winston').Logger } ScriptUtils.log
 * @property { typeof path } ScriptUtils.path
 * @property { typeof u } ScriptUtils.u
 */

// prettier-ignore
const partialRight = (fn, ...args) => (...rest) => fn(...rest, ...args)
const exec = partialRight(spawnSync, { shell: true, stdio: 'inherit' })

const log = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({
      colors: {
        info: 'cyan',
        error: 'red',
        warn: 'yellow',
      },
    }),
    winston.format.cli(),
  ),
  transports: [new winston.transports.Console({ level: 'info' })],
})

const cli = meow('', {
  autoHelp: true,
  flags: {
    clean: { type: 'boolean' },
    serve: { type: 'string' },
    start: { type: 'string' },
    build: { type: 'string' },
    bundle: { type: 'string' },
    stats: { type: 'boolean' },
    types: { alias: 't', type: 'boolean' },
  },
})

const { flags } = cli

const [cmd, ...args] = cli.input
/** @type { ScriptUtils } */
const scriptUtils = { del, exec, fg, fs, flags, log, path, u }

;(async () => {
  try {
    if (flags.start || flags.build) {
      const pkg = flags.start || flags.build
      const isBuild = flags.build && !flags.start

      if (/static|homepage/i.test(pkg)) {
        const command = isBuild ? 'build' : 'start'
        let cmd = `lerna exec --scope homepage \"`
        if (flags.clean) cmd += `gatsby clean && `
        cmd += `npm run ${command}`
        cmd += `\"`
        exec(cmd)
      } else {
        throw new Error(
          `"${pkg}" is not supported yet. Supported options: "static", "homepage"`,
        )
      }
    } else if (flags.bundle) {
      log.info(`Bundling ${bundle}`)

      if (flags.bundle === 'webApp') {
        const outputDir = path.join(process.cwd(), 'lib')
        await require('../scripts/bundleWebApp')(scriptUtils, outputDir)
        log.info(`Finished bundling!`)
      } else {
        throw new Error(`Invalid value for bundling. Choose one of: "webApp"`)
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    log.error(`[${u.yellow(err.name)}] ${u.yellow(err.message)}`)
    throw err
  }
})()

exports.scriptUtils = scriptUtils
