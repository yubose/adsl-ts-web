const u = require('@jsmanifest/utils')
const { expect } = require('chai')
const { data, onPreInit } = require('../gatsby-node')

describe(`gatsby-node.js`, () => {
  describe(`onPreInit`, () => {
    it(`should set configKey, configUrl, and path`, () => {
      onPreInit({}, { config: 'meetd2', path: './abc' })
      expect(data.configKey).to.eq('meetd2')
      expect(data.configUrl).to.eq(
        `https://public.aitmed.com/config/meetd2.yml`,
      )
    })
  })
})
