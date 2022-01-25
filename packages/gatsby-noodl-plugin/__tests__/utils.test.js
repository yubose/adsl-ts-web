const u = require('@jsmanifest/utils')
const { expect } = require('chai')
const utils = require('../utils')

describe.only(`utils`, () => {
  describe(`ensureYmlExt`, () => {
    for (const [value, expectedValue] of [
      ['', '.yml'],
      ['.', '.yml'],
      ['.ym', '.yml'],
      ['.yml', '.yml'],
      [
        'https://public.aitmed.com/config/meetd2.yml',
        'https://public.aitmed.com/config/meetd2.yml',
      ],
    ]) {
      it(`should end with .yml if given "${value}"`, () => {
        expect(utils.ensureYmlExt(value)).to.eq(expectedValue)
      })
    }
  })

  describe(`getConfigVersion`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`replaceNoodlPlaceholders`, () => {
    xit(``, () => {
      //
    })
  })
})
