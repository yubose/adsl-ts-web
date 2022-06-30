import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import chalk from 'chalk'
import fs from 'fs-extra'
import * as path from 'path'
import nock from 'nock'
import sinon from 'sinon'
import y from 'yaml'
import { ensureExt } from 'noodl-file'
import loadFiles from '../utils/loadFiles'
import Loader from '../Loader'
import loadFile from '../utils/loadFile'
import Loaderv2 from '../Loaderv2'
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
    it(``, async () => {
      const loader = new Loaderv2()
      const filepathToConfig = path.join(__dirname, './fixtures/meetd2.yml')
      const url = `https://public.aitmed.com/cadl/admindd8.28/SideMenuBarDM_en.yml`

      const loaded = await loader.load(filepathToConfig)
      console.log(loader.root)
    })

    xit(`should load root config props`, () => {
      //
    })

    xit(`should load app config props`, () => {
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
    xit(`should load root config props`, () => {
      //
    })

    xit(`should load app config props`, () => {
      //
    })

    xit(`should load preload urls`, () => {
      //
    })

    xit(`should load page urls`, () => {
      //
    })
  })
})
