const u = require('@jsmanifest/utils')
const path = require('path')
const { expect } = require('chai')
const { data, onPreInit } = require('../gatsby-node')

const getMockCache = () => {
  const cache = new Map()
  return {
    get: async (key) => cache.get(key),
    set: async (key, value) => {
      cache[key] = value
    },
  }
}

describe(`gatsby-node.js`, () => {
  describe(`onPreInit`, () => {
    it(
      `should convert back slashes to forward slashes on pluginOptions.path ` +
        `and pluginOptions.pageTemplate`,
      async () => {
        const pluginOptions = {
          config: 'meetd2',
          path: 'C:\\Users\\Chris\\abc\\drafts',
          pageTemplate: 'D:/Users\\Chris/drafts',
        }
        await onPreInit({}, pluginOptions)
        expect(pluginOptions.path).to.eq('C:/Users/Chris/abc/drafts')
        expect(pluginOptions.pageTemplate).to.eq('D:/Users/Chris/drafts')
      },
    )
  })

  describe(`onPluginInit`, () => {
    xit(`should set the configKey in cache`, () => {
      //
    })

    xit(`should set the configKey in cache`, () => {
      //
    })
  })
})
