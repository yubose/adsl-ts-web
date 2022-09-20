#!/usr/bin/env node
'use strict'
const { spawnSync } = require('child_process')
const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const fg = require('fast-glob')
const meow = require('meow')
const partialR = require('lodash/partialRight')
const path = require('path')
const winston = require('winston')

/**
 * @typedef ScriptUtils
 * @type { object }
 * @property { (command: string) => import('child_process').SpawnSyncReturns } ScriptUtils.exec
 * @property { Record<string, any> } ScriptUtils.flags
 * @property { typeof fg } ScriptUtils.fg
 * @property { typeof fs } ScriptUtils.fs
 * @property { import('winston').Logger } ScriptUtils.log
 * @property { typeof path } ScriptUtils.path
 * @property { typeof u } ScriptUtils.u
 */

const exec = partialR(spawnSync, { shell: true, stdio: 'inherit' })

const log = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({
      colors: { info: 'cyan', error: 'red', warn: 'yellow' },
    }),
    winston.format.cli({ message: true }),
  ),
  transports: [new winston.transports.Console({ level: 'debug' })],
})

const cli = meow('', {
  autoHelp: true,
  flags: {},
})

const { flags, input } = cli

/** @type { ScriptUtils } */
const scriptUtils = { exec, fg, fs, flags, log, path, u }

u.newline()

console.log({ flags, input })

u.newline()

//
;(async () => {
  try {
    let cmd = ''
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    log.error(`[${u.yellow(err.name)}] ${u.yellow(err.message)}`)
    throw err
  }
})()

exports.scriptUtils = scriptUtils
