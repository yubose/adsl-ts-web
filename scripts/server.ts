import express from 'express'
import difference from 'lodash/difference'
import chalk from 'chalk'
import cors from 'cors'
import yaml from 'yaml'
// import { use } from 'body-parser'
import fs from 'fs-extra'
import path from 'path'

const getPath = (...paths: string[]) =>
  path.resolve(path.join(process.cwd(), ...paths))

const getServerFilePath = (...paths: string[]) =>
  getPath(path.join('scripts/serverFiles'), ...paths)

const loadFile = (
  filepath: string,
  opts?: Parameters<typeof fs.readFileSync>[1],
) => fs.readFileSync(getServerFilePath(filepath), { encoding: 'utf8' })

fs.ensureDirSync(getServerFilePath('assets'))
const cadlEndpointConfig = yaml.parse(loadFile('cadlEndpoint.yml'))
const basePages = cadlEndpointConfig.preload
const pages = cadlEndpointConfig.page
const assetPaths = fs.readdirSync(getServerFilePath('assets'), 'utf8')

// console.log(`BASE PAGES: `, basePages)
// console.log(`PAGES: `, pages)

const app = express()
const dirFiles = fs.readdirSync(getServerFilePath(''), {
  encoding: 'utf8',
  withFileTypes: false,
})

const files = dirFiles.reduce(
  (acc, filename) => {
    const withoutExt = filename.substring(0, filename.indexOf('.'))
    if (basePages.includes(withoutExt)) acc.basePages.push(withoutExt)
    else if (pages.includes(withoutExt)) acc.pages.push(withoutExt)
    return acc
  },
  { basePages: [], pages: [] },
)

app.use(
  cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  }),
)

console.log('')

files.basePages.forEach((name) => {
  const route = `/${name}_en.yml`
  console.log(route)
  app.get(route, (req, res) => {
    res.send(loadFile(name + '.yml'))
  })
})
files.pages.forEach((page) => {
  const route = `/${page}_en.yml`
  const obj = loadFile(page + '.yml')
  app.get(route, (req, res) => {
    res.send(obj)
  })
})

assetPaths.forEach((assetPath) => {
  app.get(`/assets/${assetPath}`, (req, res) => {
    res
      .writeHead(200, { 'Content-Type': 'image/png' }, 'buffer')
      .end(fs.readFileSync(getServerFilePath(`/assets/${assetPath}`)))
  })
})

app.get('/HomePageUrl_en.yml', (req, res) => {
  res.send(``)
})

const otherFiles = [
  'cadlEndpoint.yml',
  'message.yml',
  'meet2d.yml',
  'testpage.yml',
]
const serverPath = getServerFilePath('')
otherFiles.forEach((filename) => {
  if (fs.existsSync(path.join(serverPath, filename))) {
    const route = `/${filename}`
    console.log(chalk.yellow(`Registering route: ${route}`))
    app.get(route, (req, res) => {
      res.send(loadFile(filename))
    })
  }
})

// app.get('/aitmed.yml', (req, res) => {
//   res.send(loadFile('aitmed.yml'))
// })

// app.get('/testpage.yml', (req, res) => {
//   res.send(loadFile('testpage.yml'))
// })

// app.get('/cadlEndpoint.yml', (req, res) => {
//   res.send(loadFile('cadlEndpoint.yml'))
// })

// app.get('/BaseCSS_en.yml', (req, res) => {
//   res.send(loadFile('BaseCSS.yml'))
// })

// app.get('/BasePage_en.yml', (req, res) => {
//   res.send(loadFile('BasePage.yml'))
// })

// app.get('/BaseDataModel_en.yml', (req, res) => {
//   res.send(loadFile('BaseDataModel.yml'))
// })

// app.get('/BootNoodlForMobile_en.yml', (req, res) => {
//   res.send(loadFile('BootNoodlForMobile.yml'))
// })

// app.get('/PatientChartDM_en.yml', (req, res) => {
//   res.send(loadFile('PatientChartDM.yml'))
// })

// app.get('/PatientDashboard_en.yml', (req, res) => {
//   res.send(loadFile('PatientDashboard.yml'))
// })

app.listen(3001)
