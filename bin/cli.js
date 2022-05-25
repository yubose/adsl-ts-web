#!/usr/bin/env node
'use strict'
// const partialRight = require('lodash/partialRight')
const u = require('@jsmanifest/utils')
const partialRight = require('lodash/partialRight')
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

const exec = partialRight(spawnSync, { shell: true, stdio: 'inherit' })
const { newline } = u

const log = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({
      colors: { info: 'cyan', error: 'red', warn: 'yellow' },
    }),
    winston.format.cli({ message: true }),
  ),
  transports: [new winston.transports.Console({ level: 'debug' })],
})

function getHelp() {
  const $ = `${u.magenta('$')}`
  const tag = `${u.cyan('nui')}`
  const prefix = `${$} ${tag}`
  const cmd = (s, or) =>
    `${u.yellow(`--${s}`)}${or ? ` (${u.yellow(`-${or}`)})` : ''}`
  const val = (s) => `${u.white(s)}`
  const lines = []
  lines.push(
    `${prefix} ${cmd('start')} ${val('homepage')} ${cmd('config', 'c')} ` +
      `${val('www')} ${cmd('clean')}`,
  )
  lines.push(`${prefix} ${cmd('server', 'admind3')} ${cmd('g')} ${val('app')}`)
  return lines.join('\n')
}

const cli = meow(getHelp(), {
  autoHelp: true,
  flags: {
    config: { alias: 'c', type: 'string' },
    clean: { type: 'boolean' },
    deploy: { type: 'string' },
    start: { type: 'string' },
    build: { type: 'string' },
    bundle: { type: 'string' },
    publish: { alias: 'p', type: 'string' },
    test: { type: 'string' },
    server: { type: 'string' },
    generate: { alias: 'g', type: 'boolean' },
  },
})

const { flags, input } = cli

/** @type { ScriptUtils } */
const scriptUtils = { del, exec, fg, fs, flags, log, path, u }

newline()

console.log({ flags, input })

newline()

//
;(async () => {
  try {
    const isStart = input[0] === 'start' || flags.start
    const isBuild = flags.build && !isStart
    const isTest = flags.test && !(isStart && isBuild)
    const isPublish = flags.publish && !(isStart && isBuild && isTest)
    const pkg =
      input[0] === 'start'
        ? input[1]
        : flags.start ||
          flags.build ||
          flags.test ||
          flags.deploy ||
          flags.publish

    let cmd = ''

    if (isStart || isBuild || isTest) {
      // Static web app
      if (/static|homepage/i.test(pkg)) {
        let command = isBuild ? 'build' : isTest ? 'test:watch' : 'start'
        cmd = `lerna exec --scope homepage \"`
        if (!isTest) {
          if (flags.config) cmd += `npx cross-env CONFIG=${flags.config} `
          if (flags.clean) cmd += `gatsby clean && `
        }
        cmd += `npm run ${command}`
        cmd += `\"`
      }
      // noodl-core documentation
      else if (/docs/i.test(pkg)) {
        let command = isBuild ? 'build' : 'start'
        cmd = `lerna exec --scope noodl-core-docs \"`
        cmd += `npm run ${command}`
        cmd += `\"`
      } else if (/yaml|core/i.test(pkg)) {
        let command = isBuild ? 'build' : isTest ? 'test' : 'start'
        cmd = `lerna exec --scope `
        if (/core/i.test(pkg)) cmd += 'noodl-core '
        else if (/yaml/i.test(pkg)) cmd += 'noodl-yaml '
        cmd += `\"npm run ${command}\"`
        exec(cmd)
      } else {
        throw new Error(
          `"${pkg}" is not supported yet. Supported options: "static", "homepage"`,
        )
      }
      exec(cmd)
    }
    // Prep web app bundle for noodl-app (electron)
    else if (flags.bundle) {
      log.info(`Bundling ${bundle}`)

      if (flags.bundle === 'webApp') {
        const outputDir = path.join(process.cwd(), 'lib')
        await require('../scripts/bundleWebApp')(scriptUtils, outputDir)
        log.info(`Finished bundling!`)
      } else {
        throw new Error(`Invalid value for bundling. Choose one of: "webApp"`)
      }
    }
    // Publish
    else if (isPublish) {
      if (/action-chain|core|loader|yaml|types|utils|ui/i.test(pkg)) {
        const folder = `noodl-${pkg}`
        cmd = `cd packages/${folder} `
        cmd += `&& npm run build`
        cmd += `&& npm version patch -f && npm publish -f --access public`
        cmd += `&& cd ../..`
        exec(cmd)
      } else {
        throw new Error(
          `Invalid value for publishing. Choose one of: "action-chain", "core", "loader", "yaml", "types", "utils", "ui"`,
        )
      }
    }
    // Start local server using noodl-cli
    else if (flags.server) {
      cmd = `noodl --server -c ${flags.server}`
      if (flags.generate) cmd += ` -g app`
    } else if (flags.deploy) {
      if (/docs/i.test(pkg)) {
        cmd = `cd packages/core-docs && git add . && git commit -m \"update\" && git push && cd ../..`
      } else {
        throw new Error(
          `"${pkg}" is not supported yet for deploy script. Supported options: "docs"`,
        )
      }
      exec(cmd)
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    log.error(`[${u.yellow(err.name)}] ${u.yellow(err.message)}`)
    throw err
  }
})()

exports.scriptUtils = scriptUtils
