import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import Builder from '../Builder'
import NoodlBase from '../Base'
import NoodlValue from '../Value'
import NoodlString from '../String'
import NoodlObject from '../Object'
import NoodlProperty from '../Property'
import is from '../utils/is'

describe(`utils`, () => {
  describe(`is`, () => {
    it(`[is.node] should return true`, () => {
      expect(is.node(new NoodlBase())).to.be.true
      expect(is.node(new NoodlValue())).to.be.true
      expect(is.node(new NoodlString())).to.be.true
      expect(is.node(new NoodlProperty())).to.be.true
      expect(is.node(new NoodlObject())).to.be.true
    })

    for (const [method, Klass] of [
      ['baseNode', NoodlBase],
      ['valueNode', NoodlValue],
      ['stringNode', NoodlString],
      ['propertyNode', NoodlProperty],
      ['objectNode', NoodlObject],
    ] as const) {
      it(`[is.${method}] should return true`, () => {
        // @ts-expect-error
        expect(is[method](new Klass())).to.be.true
      })
    }
  })
})
