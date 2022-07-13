import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import chalk from 'chalk'
import fs from 'fs-extra'
import * as path from 'path'
import nock from 'nock'
import sinon from 'sinon'
import y from 'yaml'
import { ensureExt } from 'noodl-file'
import {
  getFixturePath,
  getPathToBaseCss,
  getPathToBaseDataModel,
  getPathToBasePage,
  getPathToConfig,
  getPathToCadlEndpoint,
  getPathToSignInPage,
} from './test-utils'
import loadFiles from '../utils/loadFiles'
import Loader from '../Loader'
import loadFile from '../utils/loadFile'
import Loaderv2 from '../Loader/Loader'
import * as c from '../constants'

const meetd2yml = fs.readFileSync(path.join(__dirname, './fixtures/meetd2.yml'))
const baseCssObject = loadFile(
  path.join(__dirname, './fixtures/BaseCSS.yml'),
  'json',
)

const config = 'meetd2'
const pathToFixtures = path.join(__dirname, './fixtures')

const loadYmlFactory =
  (filename = '') =>
  () =>
    fs.readFileSync(
      path.join(pathToFixtures, `${ensureExt(filename, 'yml')}`),
      'utf8',
    )

const getRootConfigYml = loadYmlFactory(config)
const getAppConfigYml = loadYmlFactory(`cadlEndpoint`)

const rootConfig = y.parse(getRootConfigYml())
const appConfig = y.parse(getAppConfigYml())
const preloadPages = (appConfig.preload || []) as string[]
const pages = (appConfig.page || []) as string[]
const data = loadFiles(pathToFixtures, { as: 'object' })

const mockAllPageRequests = (_loader = loader) => {
  for (let page of [...preloadPages, ...pages] as string[]) {
    page.startsWith('~/') && (page = page.replace('~/', ''))
    nock(baseUrl).get(new RegExp(page, 'i')).reply(200, data[page])
  }
}

let loader: Loader<typeof config, 'map'>
let assetsUrl = `http://127.0.0.1:3001/assets/`
let baseConfigUrl = `http://127.0.0.1:3001/config`
let baseUrl = `http://127.0.0.1:3001/`

beforeEach(() => {
  loader = new Loader({ config: 'meetd2', loglevel: 'error' })
  nock(baseConfigUrl).get('/meetd2.yml').reply(200, meetd2yml)
  nock(baseUrl).get('/cadlEndpoint.yml').reply(200, getAppConfigYml())
})

afterEach(() => {
  nock.cleanAll()
})

async function init(
  _loader = loader as ConstructorParameters<typeof Loader>[0] | Loader,
) {
  let options: ConstructorParameters<typeof Loader>[0]
  if (!(_loader instanceof Loader)) {
    options = _loader
    _loader = new Loader(options)
  }
  return (_loader as Loader).init({
    dir: pathToFixtures,
    loadPages: false,
    loadPreloadPages: false,
    ...(u.isObj(options) ? options : { config: options }),
  })
}

describe.only(`Loaderv2`, () => {
  describe(`when loading by url`, () => {
    xit(``, async () => {
      const loader = new Loaderv2()
      const url = `https://public.aitmed.com/cadl/admindd8.28/SideMenuBarDM_en.yml`

      const loaded = await loader.load(getPathToConfig())
      console.log(loader.root)
    })

    xit(`should load root config props`, async () => {
      //
    })

    xit(`should load app config props`, async () => {
      //
    })

    xit(`should load preload urls`, () => {
      //
    })

    xit(`should load page urls`, () => {
      //
    })
  })

  describe(`when loading by file path`, () => {
    it(`should load root config props`, async () => {
      const loader = new Loaderv2()
      loader.config.configKey = 'meetd2'
      await loader.load(getPathToConfig())
      expect(loader.config.apiHost).to.eq('albh2.aitmed.io')
      expect(loader.config.apiPort).to.eq('443')
      expect(loader.config.viewWidthHeightRatio).to.have.property('min', 0.56)
      expect(loader.config.viewWidthHeightRatio).to.have.property('max', 0.7)
      expect(loader.config.webApiHost).to.eq('apiHost')
      expect(loader.config.appApiHost).to.eq('apiHost')
      expect(loader.config).to.have.property('loadingLevel', 1)
      expect(loader.config.baseUrl).to.eq('http://127.0.0.1:3001/')
      expect(loader.config.appKey).to.eq('cadlEndpoint.yml')
      expect(loader.config).to.have.property('timestamp').to.eq(5272021)
    })

    it(`should load app config props`, async () => {
      const loader = new Loaderv2()
      loader.config.configKey = 'meetd2'
      await loader.load(getPathToConfig())
      await loader.load(getPathToCadlEndpoint())
      expect(loader.cadlEndpoint.assetsUrl).to.eq(`\${cadlBaseUrl}assets/`)
      expect(loader.cadlEndpoint.baseUrl).to.eq(`\${cadlBaseUrl}`)
      expect(loader.cadlEndpoint.languageSuffix).to.be.an('object')
      expect(loader.cadlEndpoint.fileSuffix).to.eq('.yml')
      expect(loader.cadlEndpoint.startPage).to.eq('SignIn')
      expect(loader.cadlEndpoint.preload).to.be.an('array')
      expect(loader.cadlEndpoint.pages).to.be.an('array')
      expect(loader.cadlEndpoint.preload).to.include.members([
        'BasePage',
        'BaseCSS',
        'BaseDataModel',
      ])
      expect(loader.cadlEndpoint.pages).to.include.members([
        'AboutAitmed',
        'AddContact',
        'DocumentNotes',
        'EditContact',
        'ReferenceTest',
      ])
    })

    it.only(`should load preload files`, async () => {
      const loader = new Loaderv2()
      loader.config.configKey = 'meetd2'
      await loader.load(getPathToConfig())
      await loader.load(getPathToCadlEndpoint())
      expect(loader.root).not.to.have.property('Style')
      expect(loader.root).not.to.have.property('ImageStyle')
      expect(loader.root).not.to.have.property('LabelStyle')
      await loader.load(getPathToBaseCss())
      console.log(loader.root)
      console.log(getPathToBaseCss())
      // expect(loader.root).to.have.property('Style')
      // expect(loader.root).to.have.property('ImageStyle')
      // expect(loader.root).to.have.property('LabelStyle')
    })

    xit(`should load page files`, () => {
      //
    })
  })
})
