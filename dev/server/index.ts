import express from 'express'
import chalk from 'chalk'
import cors from 'cors'
import yaml from 'yaml'
// import { use } from 'body-parser'
import fs from 'fs-extra'
import path from 'path'

const getPath = (...paths: string[]) =>
  path.resolve(path.join(process.cwd(), ...paths))

const getServerFilePath = (...paths: string[]) =>
  getPath(path.join('dev/server/serverFiles'), ...paths)

const loadFile = (
  filepath: string,
  opts?: Parameters<typeof fs.readFileSync>[1],
) => fs.readFileSync(getServerFilePath(filepath), { encoding: 'utf8' }, opts)

fs.ensureDirSync(getServerFilePath('assets'))
const assetPaths = fs.readdirSync(getServerFilePath('assets'), 'utf8')
const rootFiles = fs.readdirSync(getServerFilePath(''), 'utf8')
const cadlEndpointConfig = yaml.parse(loadFile('cadlEndpoint.yml'))
const allPages = cadlEndpointConfig.page.concat(cadlEndpointConfig.preload)

const app = express()

app.use(
  cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  }),
)

console.log('')
rootFiles
  .filter((o) => o.endsWith('.yml'))
  .forEach((rootFile) => {
    console.log(`Route opened: ${chalk.yellow('/' + rootFile)}`)
    app.get(`/${rootFile}`, (req, res) => {
      res.send(loadFile(rootFile))
    })
  })
console.log('')

allPages.forEach((page) => {
  app.get(`/${page}_en.yml`, (req, res) => {
    res.send(loadFile(page + '.yml'))
  })
})

assetPaths.forEach((assetPath) => {
  app.get(`/assets/${assetPath}`, (req, res) => {
    res
      .writeHead(200, { 'Content-Type': 'image/png' }, 'buffer')
      .end(fs.readFileSync(getServerFilePath(`/assets/${assetPath}`)))
  })
})

app.listen(3001)
