import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import Builder from '../Builder'
import NoodlValue from '../Value'
import NoodlString from '../String'
import NoodlObject from '../Object'
import NoodlProperty from '../Property'
import { createObject } from '../utils'

describe(`builder.test.ts`, () => {
  describe(`NoodlValue`, () => {
    it(`should return true if value is NoodlValue`, () => {
      expect(NoodlValue.is(new NoodlValue())).to.be.true
    })

    it(`should return false if value is not NoodlValue`, () => {
      expect(NoodlValue.is('hello')).to.be.false
    })

    it(`should set the value`, () => {
      const value = new NoodlValue()
      expect(value.getValue()).to.be.undefined
      value.setValue('hello')
      expect(value.getValue()).to.eq('hello')
    })

    it(`should return the snapshot expectedly`, () => {
      const value = new NoodlValue()
      value.setValue('hello')
      const snapshot = value.toJSON()
      expect(snapshot).to.have.property('value').to.be.a('string')
      expect(snapshot).to.have.property('isReference').to.be.a('boolean')
    })
  })

  describe(`NoodlString`, () => {
    it(`should return true if value is NoodlString`, () => {
      expect(NoodlString.is(new NoodlString())).to.be.true
    })

    it(`should return false if value is not NoodlString`, () => {
      expect(NoodlString.is(55)).to.be.false
    })

    it(`should set the value as a NoodlValue string`, () => {
      const value = new NoodlString()
      expect(value.getValue()).to.be.undefined
      value.setValue('hello')
      expect(value.getValue()).to.eq('hello')
      value.setValue(null)
      expect(value.getValue()).to.eq('null')
      value.setValue([])
      expect(value.getValue()).to.eq('[object Array]')
      value.setValue({})
      expect(value.getValue()).to.eq('[object Object]')
      value.setValue(() => {})
      expect(value.getValue()).to.eq('[object Function]')
    })

    it(`should return the snapshot expectedly`, () => {
      const value = new NoodlString()
      value.setValue('hello')
      const snapshot = value.toJSON()
      expect(snapshot).to.have.property('value').to.be.a('string')
      expect(snapshot).to.have.property('isReference').to.be.a('boolean')
    })
  })

  describe(`NoodlProperty`, () => {
    it(`should return true if value is NoodlProperty`, () => {
      expect(NoodlProperty.is(new NoodlProperty())).to.be.true
    })

    it(`should return false if value is not NoodlProperty`, () => {
      expect(NoodlProperty.is(55)).to.be.false
      expect(NoodlProperty.is('f')).to.be.false
      expect(NoodlProperty.is(null)).to.be.false
      expect(NoodlProperty.is(undefined)).to.be.false
      expect(NoodlProperty.is({})).to.be.false
      expect(NoodlProperty.is([])).to.be.false
    })

    it(`should set the key as a NoodlString`, () => {
      const value = new NoodlProperty()
      expect(value.getKey()).to.be.undefined
      value.setKey('hello')
      expect(value.getKey()).to.be.instanceOf(NoodlString)
    })

    it(`should set the value as a NoodlValue`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).to.be.undefined
      value.setValue('hello')
      expect(value.getValue()).to.be.instanceOf(NoodlValue)
    })

    it(`should return the snapshot expectedly`, () => {
      const value = new NoodlProperty()
      value.setKey('greeting')
      value.setValue('hello')
      const snapshot = value.toJSON()
      expect(snapshot).to.have.property('key').to.eq('greeting')
      expect(snapshot).to.have.property('value').to.eq('hello')
    })

    it(`should build the result as a key/value pair`, () => {
      const value = new NoodlProperty()
      value.setKey('greeting')
      value.setValue('hello')
      const result = value.build()
      expect(u.keys(result)).to.have.lengthOf(1)
      expect(result).to.have.property('greeting', 'hello')
    })
  })

  describe(`NoodlObject`, () => {
    it(`should return true if value is NoodlObject`, () => {
      expect(NoodlObject.is(new NoodlObject())).to.be.true
    })

    it(`should return false if value is not NoodlObject`, () => {
      expect(NoodlObject.is('hello')).to.be.false
    })

    it(`should set the key and value to undefined if it is undefined`, () => {
      const value = new NoodlObject()
      expect(value.hasProperty('cereal')).to.be.false
      value.setValue('cereal')
      expect(value.hasProperty('cereal')).to.be.true
      expect(value.getProperty('cereal')).to.be.undefined
    })

    it(`should set the value`, () => {
      const cereal = [{ fruits: ['apple'], if: [] }]
      const value = new NoodlObject()
      expect(value.hasProperty('cereal')).to.be.false
      value.setValue('cereal', cereal)
      expect(value.hasProperty('cereal')).to.be.true
      expect(value.build()).to.have.property('cereal').to.deep.eq(cereal)
    })
  })

  describe(`Builder`, () => {
    xit(`should create an action object`, () => {
      const builder = new Builder()
      expect(builder.action('builtIn').build()).to.have.property('actionType')
    })

    xit(`should initialize the actionType`, () => {
      const builder = new Builder()
      expect(builder.action('builtIn').build()).to.have.property(
        'actionType',
        'builtIn',
      )
    })
  })
})
