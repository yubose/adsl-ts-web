const u = require('@jsmanifest/utils')
const { expect } = require('chai')
const appRoot = require('app-root-path')
const mfs = require('mock-fs')
const fs = require('fs-extra')
const fg = require('fast-glob')
const {
  onPreInit,
  onPluginInit,
  sourceNodes,
  createPages,
} = require('../gatsby-node')

const getMockCache = () => {
  const cache = new Map()
  return {
    get: async (key) =>
      key === undefined
        ? [...cache.entries()].reduce(
            (acc, [k, v]) => u.assign(acc, { [k]: v }),
            {},
          )
        : cache.get(key),
    set: async (key, value) => {
      cache.set(key, value)
    },
  }
}

beforeEach(() => {
  function getAllFiles() {
    //
  }
  mfs({
    packages: {
      [`packages/gatsby-plugin-noodl`]: {
        __tests__: {},
        node_modules: {},
        'gatsby-node.js': '',
        'package.json': '{}',
        'tsconfig.json': '{}',
        'types.d.ts': '',
        'utils.js': '',
      },
      [`packages/homepage`]: {
        src: {
          resources: {
            assets: [
              'a_animation1.png',
              'a_animation2.png',
              'a_animation3.png',
              'abdominal_pain_in_children.png',
              'aboutRed.svg',
              'IconAwesomeCheck.png',
              'zhuanquan.gif',
            ].reduce(
              (acc, filename) => u.assign(acc, { [filename]: Buffer.from([]) }),
              {},
            ),
            images: { 'logo.png': Buffer.from([]) },
            'favicon.ico': 'favicon data',
          },
          static: {
            'BaseCSS.json': '{}',
            'logo.png': Buffer.from([]),
            'robots.txt': '',
          },
          templates: {
            [`page.tsx`]: '',
          },
          'theme.ts': '',
        },
        [`gatsby-browser.js`]: '',
        [`gatsby-config.js`]: '',
        [`gatsby-node.js`]: '',
        [`gatsby-ssr.js`]: '',
        [`package.json`]: '{}',
        [`tsconfig.json`]: '{}',
      },
    },
  })
  console.log(`Mock root:`)
  console.log(fs.readdirSync('.'))
})

afterEach(() => {
  mfs.restore()
})

describe(`gatsby-node.js`, () => {
  it.only(``, () => {
    console.log(appRoot)
    console.log(process.cwd())
    console.log(__dirname)
  })

  describe(`onPreInit`, () => {
    it(
      `should convert back slashes to forward slashes on pluginOptions.path ` +
        `and pluginOptions.template`,
      async () => {
        const pluginOptions = {
          config: 'meetd2',
          path: 'C:\\Users\\Chris\\abc\\drafts',
          template: 'D:/Users\\Chris/drafts',
        }
        onPreInit({}, pluginOptions)
        expect(pluginOptions.path).to.eq('C:/Users/Chris/abc/drafts')
        expect(pluginOptions.template).to.eq('D:/Users/Chris/drafts')
      },
    )
  })

  describe(`onPluginInit`, () => {
    xit(`should set the configKey and configUrl in cache`, async () => {
      const cache = getMockCache()
      await onPluginInit(
        { cache },
        {
          config: 'meetd2',
          path: 'C:\\Users\\Chris\\abc\\drafts',
          template: 'D:/Users\\Chris/drafts',
        },
      )
      expect(await cache.get('configKey')).to.eq('meetd2')
      expect(await cache.get('configUrl')).to.eq(
        'https://public.aitmed.com/config/meetd2.yml',
      )
    })
  })
})
