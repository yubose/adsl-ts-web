import { expect } from 'chai'
import Builder from '../Builder'
import NoodlValue from '../Value'
import NoodlString from '../String'
import NoodlArray from '../Array'
import NoodlObject from '../Object'
import NoodlProperty from '../Property'
import is from '../utils/is'
import setIn from '../utils/setIn'
import * as fp from '../utils/fp'

describe(`builder.test.ts`, () => {
  describe(`NoodlValue`, () => {
    it(`should set the value as a non-node`, () => {
      const value = new NoodlValue()
      expect(value.getValue()).to.be.undefined
      value.setValue('hello')
      expect(value.getValue()).to.eq('hello')
    })
  })

  describe(`NoodlString`, () => {
    it(`should set empty value to empty string`, () => {
      expect(new NoodlString(null as any).getValue()).to.eq('')
    })

    it(`should set the value as a NoodlValue string`, () => {
      const value = new NoodlString('')
      expect(value.getValue()).to.eq('')
      value.setValue('hello')
      expect(value.getValue()).to.eq('hello')
      value.setValue(null)
      expect(value.getValue()).to.eq('')
      value.setValue([])
      expect(value.getValue()).to.eq('[object Array]')
      value.setValue({})
      expect(value.getValue()).to.eq('[object Object]')
      value.setValue(() => {})
      expect(value.getValue()).to.eq('[object Function]')
    })
  })

  describe(`NoodlProperty`, () => {
    it(`should set the key as a NoodlString`, () => {
      const value = new NoodlProperty()
      expect(value.getKey()).to.be.undefined
      value.setKey('hello')
      expect(value.getKey()).to.be.instanceOf(NoodlString)
    })

    it(`should set the value as a NoodlString if string`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).to.be.undefined
      value.setValue('hello')
      expect(value.getValue(true)).to.be.instanceOf(NoodlString)
    })

    it(`should set the value as a NoodlValue if boolean, number, or null`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).to.be.undefined
      value.setValue(null)
      expect(value.getValue(true)).to.be.instanceOf(NoodlValue)
      value.setValue(false)
      expect(value.getValue(true)).to.be.instanceOf(NoodlValue)
      value.setValue(222)
      expect(value.getValue(true)).to.be.instanceOf(NoodlValue)
    })

    it(`should set the value as a NoodlObject if object`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).to.be.undefined
      value.setValue({})
      expect(value.getValue(true)).to.be.instanceOf(NoodlObject)
    })

    it(`should set the value as a NoodlArray if array`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).to.be.undefined
      value.setValue([])
      expect(value.getValue(true)).to.be.instanceOf(NoodlArray)
    })

    it(`should return the value as a node if asNode === true`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).to.be.undefined
      value.setValue([])
      expect(value.getValue(true)).to.be.instanceOf(NoodlArray)
      expect(value.getValue()).to.be.instanceOf(NoodlArray)
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
      expect(Object.keys(result)).to.have.lengthOf(1)
      expect(result).to.have.property('greeting', 'hello')
    })
  })

  describe(`NoodlArray`, () => {
    it(`[add] should add the value as a node`, () => {
      const arr = new NoodlArray()
      arr.add('hello')
      expect(arr.getValue(0)).to.be.instanceOf(NoodlString)
      expect(arr.getValue(0).getValue()).to.eq('hello')
    })

    it(`[setValue] should set the value at the index position`, () => {
      const arr = new NoodlArray()
      expect(arr.build()).to.deep.eq([])
      arr.setValue(5, 'hello')
      expect(arr.build()).to.deep.eq([
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'hello',
      ])
      arr.setValue(3, {})
      arr.setValue(1, 'hello')
      arr.setValue(5, 'pop')
      arr.setValue(6, [{ hi: 'hi' }])
      expect(arr.build()).to.deep.eq([
        undefined,
        'hello',
        undefined,
        {},
        undefined,
        'pop',
        [{ hi: 'hi' }],
      ])
    })

    it(`[setValue] should set array values as NoodlArray`, () => {
      const arr = new NoodlArray()
      arr.setValue(2, [{}])
      expect(arr.getValue(2)).to.be.instanceOf(NoodlArray)
    })

    it(`[setValue] should set object values as NoodlObject`, () => {
      const arr = new NoodlArray()
      arr.setValue(10, {})
      expect(arr.getValue(10)).to.be.instanceOf(NoodlObject)
    })

    for (const type of ['number', 'null', 'boolean']) {
      it(`should set ${type} values as NoodlValue`, () => {
        const arr = new NoodlArray()
        arr.setValue(
          2,
          type === 'number' ? 22 : type === 'boolean' ? false : null,
        )
        expect(arr.getValue(2)).to.be.instanceOf(NoodlValue)
      })
    }

    it(`[setValue] should set string values as NoodlString`, () => {
      const arr = new NoodlArray()
      arr.setValue(2, 'hello')
      expect(arr.getValue(2)).to.be.instanceOf(NoodlString)
    })
  })

  describe(`NoodlObject`, () => {
    it(`[createProperty] should set properties as primitives`, () => {
      const value = new NoodlObject()
      expect(value.getValue('hello')).to.be.undefined
      value.createProperty('hello', 'hi')
      value.removeProperty('hello')
      expect(value.getValue('hello')).not.to.exist
      value.createProperty(new NoodlString('hello'), 'hi')
      expect(value.getValue('hello')).to.exist
    })

    it(`[createProperty] should set the value as undefined if the value is undefined`, () => {
      const value = new NoodlObject()
      value.createProperty('a')
      expect(value.hasProperty('a')).to.be.true
      expect(value.getValue('a', false)).to.be.undefined
    })

    it(`[createProperty] should set as NoodlProperty`, () => {
      const value = new NoodlObject()
      value.createProperty('a', 'hello')
      expect(value.getValue('a')).to.be.instanceOf(NoodlProperty)
      value.createProperty('a', new NoodlValue('abc'))
      expect(value.getValue('a')).to.be.instanceOf(NoodlProperty)
    })

    it(`[getValue] should return the value of the property`, () => {
      const value = new NoodlObject()
      value.createProperty('a', 'hello')
      expect(is.propertyNode(value.getValue('a'))).to.be.true
      expect(value.getValue('a', false)).to.eq('hello')
    })

    it(`[setValue] should set the key and value to undefined if it is undefined`, () => {
      const value = new NoodlObject()
      expect(value.hasProperty('cereal')).to.be.false
      value.setValue('cereal')
      expect(value.hasProperty('cereal')).to.be.true
      expect(value.getValue('cereal')).to.be.undefined
    })

    it(`[setValue] should set the value`, () => {
      const cereal = [{ fruits: ['apple'], if: [] }]
      const value = new NoodlObject()
      expect(value.hasProperty('cereal')).to.be.false
      value.setValue('cereal', cereal)
      expect(value.hasProperty('cereal')).to.be.true
      expect(value.build()).to.have.property('cereal').to.deep.eq(cereal)
    })

    it(`[unwrapProperty] should unwrap the property`, () => {
      const value = new NoodlObject()
      value.createProperty('hello', 100)
      expect(value.getValue('hello')).to.be.instanceOf(NoodlProperty)
      expect(value.unwrapProperty(value.getValue('hello'))).to.eq(100)
    })

    describe.skip(`when using getProperty`, () => {
      it(`[getProperty] should return a NoodlProperty`, () => {
        const value = new NoodlObject()
        value.createProperty('hello', 100)
        expect(value.getProperty('hello')).to.be.instanceOf(NoodlProperty)
        console.log(value.getProperty('hello')?.toJSON())
      })

      it(`[getProperty] should set the parent`, () => {
        const value = new NoodlObject()
        value.createProperty('hello', 100)
        expect(value.getProperty('hello')?.parent).to.eq(value)
      })
    })

    it(`[getProperty] should return `, () => {
      //
    })

    it(`[build] should build into an evalObject`, () => {
      const value = new NoodlObject()
      const evalObject = value
        .createProperty('actionType', 'evalObject')
        .setValue('object', [])
        .build()
      expect(evalObject).to.deep.eq({ actionType: 'evalObject', object: [] })
    })
  })

  describe(`Builder`, () => {
    it(`should create an action object`, () => {
      const builder = new Builder()
      expect(builder.action('builtIn').build()).to.have.property('actionType')
    })

    it(`should initialize the actionType`, () => {
      const builder = new Builder()
      expect(builder.action('builtIn').build()).to.have.property(
        'actionType',
        'builtIn',
      )
    })

    it.only(`should create an emit object`, () => {
      const builder = new Builder()
      const emit = builder.object()
      const property = emit.createProperty('emit').getProperty('emit')
      property?.setValue({})
      console.log('key', property?.getKey())
      console.log(`value`, property?.getValue())
      const emitObject = property?.getValue() as NoodlObject
      emitObject
        .createProperty('dataKey')
        .getProperty('dataKey')
        ?.setValue({ var1: '' })
      emitObject.createProperty('actions').getProperty('actions')?.setValue([])
      console.log(emitObject)
    })
  })
})
