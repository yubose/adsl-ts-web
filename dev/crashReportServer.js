const axios = require('axios').default
const express = require('express')
const u = require('@jsmanifest/utils')

;(async () => {
  try {
    const app = express()

    app.post('/crashReport', (req, res, next) => {
      console.log(`Request to ${u.yellow('/crashReport')}`)

      console.log(`Request body: `, req.body)

      res.status(200).json({
        status: 'success',
      })
    })

    app.listen(3025, () => {
      console.log(`${u.cyan(`Server listening at http://127.0.0.1:3025`)}`)
      console.log(
        `${u.white(
          `Send a POST request to http://127.0.0.1:3025/crashReport`,
        )} with the data in the request body to send and upload crash reports`,
      )
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  }
})()
