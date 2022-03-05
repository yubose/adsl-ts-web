const u = require('@jsmanifest/utils')
const { expect } = require('chai')
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

describe(`gatsby-node.js`, () => {
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
