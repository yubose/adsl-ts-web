process.stdout.write('\x1Bc')
const express = require('express')
const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const kebabCase = require('lodash/kebabCase')
const path = require('path')
const meow = require('meow')

const cli = meow('', {
  flags: {
    port: { alias: 'p', type: 'number', default: 3000 },
  },
})

const { flags } = cli
const { port } = flags

const log = console.log
const getPath = (...s) => path.join(__dirname, ...s)

const PATH_TO_HTML_PAGES = './html'

const app = express()

app.use(express.json())

const pageNames = fs
  .readdirSync(getPath(PATH_TO_HTML_PAGES), 'utf8')
  .filter((s) => s.endsWith('.html'))

/** @type { Record<string, { filename: string; filepath: string; html: string }> } */
const pages = pageNames.reduce((acc, pageName) => {
  const filepath = getPath(PATH_TO_HTML_PAGES, pageName)
  acc[pageName] = {
    filename: `${pageName}.html`,
    filepath,
    html: fs.readFileSync(filepath, 'utf8'),
  }
  return acc
}, {})

u.entries(pages).forEach(([pageName, { filename, filepath, html }]) => {
  log(`Registering route ${u.yellow(filename)}`)

  app.get(
    new RegExp(`(${kebabCase(pageName).split('-').join('|')})`, 'i'),
    (req, res) => {
      log(`${u.white('Sending')} ${u.yellow(filename)}`)
      res.send(html)
    },
  )
})

app.listen(port, () => {
  const hostname = `127.0.0.1`
  const serverUrl = `http://${hostname}:${port}`

  log(`${u.white(`Server listening at`)} ${u.cyan(serverUrl)}`)
})
