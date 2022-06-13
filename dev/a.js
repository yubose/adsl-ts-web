process.stdout.write('\x1Bc')
const axios = require('axios').default
const fs = require('fs-extra')
const path = require('path')
const u = require('@jsmanifest/utils')
const ws = require('ws')

const tag = `[${u.magenta('wsClient')}]`
const wsClient = new ws('ws://127.0.0.1:3020')

wsClient
  .on('open', () => {
    console.log(`${tag} Opened`)
  })
  .on('message', (data) => {
    console.log(`${tag} Message`, JSON.parse(data))
  })
  .on('error', (err) => {
    console.log(`${tag} Error`, u.pick(err, ['name', 'message', 'stack']))
  })
  .on('close', (code, reason) => {
    console.log(`${tag} Closed`, { code, reason: reason.toString() })
  })

//
;(async () => {
  try {
    const resp = await axios.get(`http://127.0.0.1:3000/routes`)
    resp.data.stack.forEach((obj) => {
      if (obj.route?.path) {
        console.dir(obj.route?.path, { depth: Infinity })
      }
    })

    console.log(
      `[analysis] Response data`,
      (await axios.get(`http://127.0.0.1:3000/analysis/app/analysis.yml`)).data,
    )
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    if (axios.isAxiosError(err)) {
      const errResp = err.response
      console.log({
        name: err.name,
        message: err.message,
        respData: errResp?.data,
        respStatus: errResp?.status,
        respStatusText: errResp?.statusText,
      })
    } else {
      console.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`, err)
    }
  }
})()
