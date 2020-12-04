import express from 'express'
import cors from 'cors'
import yaml from 'yaml'
// import { use } from 'body-parser'
import fs from 'fs-extra'
import path from 'path'

const getPath = (...paths: string[]) =>
  path.resolve(path.join(process.cwd(), ...paths))

const getServerFilePath = (...paths: string[]) =>
  getPath(path.join('scripts/serverFiles'), ...paths)

const loadFile = (filepath: string) =>
  fs.readFileSync(getServerFilePath(filepath), { encoding: 'utf8' })

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

allPages.forEach((page) => {
  app.get(`/${page}_en.yml`, (req, res) => {
    res.send(loadFile(page + '.yml'))
  })
})
;['testpage.yml', 'cadlEndpoint.yml', 'pi.html'].forEach((filepath) => {
  app.get(`/${filepath}`, (req, res) => {
    res.send(loadFile(filepath))
  })
})

assetPaths.forEach((assetPath) => {
  app.get(`/assets/${assetPath}`, (req, res) => {
    res.send(loadFile(`assets/${assetPath}`))
  })
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
