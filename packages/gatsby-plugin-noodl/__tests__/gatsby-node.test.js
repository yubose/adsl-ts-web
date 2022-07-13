const u = require('@jsmanifest/utils')
const sinon = require('sinon')
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
  onCreatePage,
  paths,
  reset,
  dumpMetadata,
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
  reset()

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



const getDumpedMetadata = () => dumpMetadata()


describe.only(`gatsby-node.js`, () => {
  it.only(``, () => {
    console.log(appRoot)
    console.log(process.cwd())
    console.log(__dirname)
  })

  describe(`onPreInit`, () => {
    it(`should convert back slashes to forward slashes on all provided paths from the user`, async () => {
      const pluginOptions = {
        output: 'meetd2',
        src: 'C:\\Users\\Chris\\abc\\drafts',
        template: 'D:/Users\\Chris/drafts',
      }
      onPreInit({}, pluginOptions)
      expect(pluginOptions.output).to.eq('meetd2')
      expect(pluginOptions.src).to.eq('C:/Users/Chris/abc/drafts')
      expect(pluginOptions.template).to.eq('D:/Users/Chris/drafts')

      console.log(await getDumpedMetadata())
    })
  })

  describe(`onPluginInit`, () => {
    xit(`should set the cache directory`, async () => {})
    xit(`should set the cwd`, async () => {})
    xit(`should set the configKey`, async () => {})
    xit(`should set the configUrl`, async () => {})
    xit(`should set the deviceType`, async () => {})
    xit(`should set the ecosEnv`, async () => {})
    xit(`should set the loglevel`, async () => {})
    xit(`should set resolvedOutputNamespacedWithConfig`, async () => {})
    xit(`should set resolvedAssetsDir`, async () => {})
    xit(`should set resolvedConfigsDir`, async () => {})
    xit(`should set the appKey`, async () => {})
    xit(`should set resolvedAppConfigFile`, async () => {})
    xit(`should set the loader`, async () => {})
    xit(`should set the ecos env on the loader`, async () => {})
    xit(`should set the config key on the loader`, async () => {})
    xit(`should set load the root config on the loader from the directory`, async () => {})
    xit(`should save each jsonified preload page in the pages object`, async () => {})
    xit(`should save each jsonified page in the pages object`, async () => {})
    xit(`should create the output dir if it doesn't exist`, async () => {})
    xit(`should create the assets dir if it doesn't exist`, async () => {})
    xit(`should create the config folder in the output dir if it doesn't exist`, async () => {})
    xit(`should save the app config file if it doesn't exist`, async () => {})
    xit(`should load the app config on the loader`, async () => {})
    xit(`should load the app config using the provided fallback function if it couldn't fetch remotely`, async () => {})
    xit(`should download each page yml file to disk if it doesn't exist`, async () => {})
    xit(`should download each asset file to disk if it doesn't exist`, async () => {})
    xit(`should detect missing page files`, async () => {})
    xit(`should detect missing asset files`, async () => {})
    xit(`should download missing page files`, async () => {})
    xit(`should download missing asset files`, async () => {})

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

  describe(`sourceNodes`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`createPages`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`onCreatePage`, () => {
    xit(``, () => {
      //
    })
  })
})
