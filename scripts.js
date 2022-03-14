const u = require('@jsmanifest/utils')
const execa = require('execa')
const meow = require('meow')
const fs = require('fs-extra')
const path = require('path')

const cli = meow('', {
  flags: {
    generate: { type: 'boolean', alias: 'g' },
    server: { type: 'string', alias: 's' },
  },
})

/**
 * @param { object } cli
 * @param { Record<string, any> } cli.flags
 * @param { string[] } cli.input
 */
async function invokeScript({ flags, input }) {
  try {
    if (flags.server) {
      let cmd = `node ../noodl-cli/cli --server -c ${flags.server}`
      if (flags.generate) cmd += ` -g app`
      await execa.command(cmd, {
        shell: true,
        stdio: 'inherit',
      })
    }
  } catch (error) {
    logErr(error)
  }
}

console.log({ flags: cli.flags, input: cli.input })

invokeScript(cli)

function logErr(error) {
  const err = error instanceof Error ? error : new Error(String(error))
  // if (axios.isAxiosError(err)) {
  //   const errResp = err.response
  //   console.log({
  //     name: err.name,
  //     message: err.message,
  //     respData: errResp.data,
  //     respStatus: errResp.status,
  //     respStatusText: errResp.statusText,
  //   })
  // } else {
  console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`, err.stack || '')
  // }
}
