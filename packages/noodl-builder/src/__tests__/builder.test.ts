import type { ReferenceString } from 'noodl-types'
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

const builder = new Builder()

describe(`builder.test.ts`, () => {
  describe(`NoodlValue`, () => {
    it(`[setValue] should not set as a node`, () => {
      const value = new NoodlValue()
      expect(value.getValue()).to.be.undefined
      value.setValue('hello')
      expect(value.getValue()).to.eq('hello')
      value.setValue(new NoodlValue(500))
      expect(value.getValue()).to.eq(500)
      value.setValue(new NoodlString('hello'))
      expect(value.getValue()).to.eq('hello')
      value.setValue({})
      expect(value.getValue()).to.deep.eq({})
      value.setValue([1, 2, {}])
      expect(value.getValue()).to.deep.eq([1, 2, {}])
      value.setValue(() => {})
      expect(value.getValue()).to.be.a('function')
    })

    it(`[getValue] should not return as a node`, () => {
      const value = new NoodlValue()
      expect(value.getValue()).to.be.undefined
      value.setValue('hello')
      expect(value.getValue()).to.eq('hello')
      value.setValue(new NoodlValue(500))
      expect(value.getValue()).to.eq(500)
      expect(is.node(value.getValue())).to.be.false
    })

    it(`[toString] should returned the stringified value`, () => {
      expect(new NoodlValue({ hello: 'yes' }).toString()).to.eq(
        JSON.stringify({ hello: 'yes' }),
      )
      expect(new NoodlValue(5550).toString()).to.eq('5550')
      expect(new NoodlValue([]).toString()).to.eq('[]')
      expect(new NoodlValue(null).toString()).to.eq('null')
      expect(new NoodlValue(undefined).toString()).to.eq('undefined')
      expect(new NoodlValue('$1;').toString()).to.eq('$1;')
      expect(new NoodlValue('').toString()).to.eq('')
      expect(new NoodlValue().toString()).to.eq('undefined')
      expect(new NoodlValue({}).toString()).to.eq('{}')
    })
  })

  describe(`NoodlString`, () => {
    it(`[setValue] should set the value as a NoodlValue`, () => {
      const node = new NoodlString('')
      expect(node.getValue(true)).to.be.instanceOf(NoodlValue)
    })

    it(`[setValue] should always stringify values in the output`, () => {
      const node = new NoodlString('')
      expect(node.getValue(false)).to.eq('')
      node.setValue('hello')
      expect(node.getValue(false)).to.eq('hello')
      node.setValue(null)
      expect(node.getValue(false)).to.eq('null')
      node.setValue([])
      expect(node.getValue(false)).to.eq('[]')
      node.setValue({})
      expect(node.getValue(false)).to.eq('{}')
      node.setValue(() => ({}))
      expect(node.getValue(false)).to.eq('() => ({})')
      node.setValue(50000)
      expect(node.getValue(false)).to.eq('50000')
    })

    it(`[getValue] should return as a node if asNode is true or if no args`, () => {
      expect(new NoodlString('').getValue(true)).to.be.instanceOf(NoodlValue)
      expect(new NoodlString('').getValue()).to.be.instanceOf(NoodlValue)
    })

    it(`[getValue] should not return as a node if asNode is false`, () => {
      expect(new NoodlString('').getValue(false)).not.to.be.instanceOf(
        NoodlValue,
      )
    })

    it(`[isEmpty] should return true if value is an empty string`, () => {
      expect(new NoodlString('').isEmpty()).to.be.true
    })

    it(`[isEmpty] should return true if value is "null" or "undefined"`, () => {
      expect(new NoodlString(null).isEmpty()).to.be.true
      expect(new NoodlString(undefined).isEmpty()).to.be.true
    })

    for (const ref of [
      '.Topo',
      '..topo',
      '=.Topo',
      '=..topo',
      '~/topo',
      '~/..topo',
      '~/..topo@',
      'abc@',
      '_.',
      '_.@',
      '_.3323@',
      '_________.3323',
    ] as ReferenceString[]) {
      it(`[isReference] should return true for "${ref}"`, () => {
        expect(new NoodlString(ref).isReference()).to.be.true
      })
    }

    for (const str of ['Topo', 'topo', '_', '____a', '_a@f']) {
      it(`[isReference] should return false for "${str}"`, () => {
        expect(new NoodlString(str).isReference()).to.be.false
      })
    }

    it(`[toJSON] should return as a string`, () => {
      expect(new NoodlString('fsafsa').toJSON()).to.be.a('string')
    })
  })

  describe(`NoodlProperty`, () => {
    it(`[setKey] should set the key as a NoodlString`, () => {
      const value = new NoodlProperty()
      expect(value.getKey()).not.to.be.instanceOf(NoodlString)
      value.setKey('hello')
      expect(value.getKey()).to.be.instanceOf(NoodlString)
    })

    it(`[setValue] should set the value as a NoodlString if string`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).not.to.be.instanceOf(NoodlString)
      value.setValue('hello')
      expect(value.getValue(true)).to.be.instanceOf(NoodlString)
    })

    it(`[setValue] should set the value as a NoodlValue if boolean, number, or null`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).to.be.instanceOf(NoodlValue)
      value.setValue(null)
      expect(value.getValue(true)).to.be.instanceOf(NoodlValue)
      value.setValue(false)
      expect(value.getValue(true)).to.be.instanceOf(NoodlValue)
      value.setValue(222)
      expect(value.getValue(true)).to.be.instanceOf(NoodlValue)
    })

    it(`[setValue] should set the value as a NoodlObject if object`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).not.to.be.instanceOf(NoodlObject)
      value.setValue({})
      expect(value.getValue(true)).to.be.instanceOf(NoodlObject)
    })

    it(`[setValue] should set the value as a NoodlArray if array`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).not.to.be.instanceOf(NoodlArray)
      value.setValue([])
      expect(value.getValue(true)).to.be.instanceOf(NoodlArray)
    })

    it(`[getValue] should return the value as a node if asNode is true or if no args`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).not.to.be.instanceOf(NoodlArray)
      value.setValue([])
      expect(value.getValue(true)).to.be.instanceOf(NoodlArray)
      expect(value.getValue()).to.be.instanceOf(NoodlArray)
    })

    it(`[getValue] should not return the value as a node if asNode is false`, () => {
      const value = new NoodlProperty()
      expect(value.getValue()).not.to.be.instanceOf(NoodlArray)
      value.setValue([])
      expect(value.getValue(false)).not.to.be.instanceOf(NoodlArray)
    })

    it(`[getValue] should return the stringified value if asNode is false`, () => {
      let value = new NoodlProperty()
      value.setValue([])
      expect(value.getValue(false)).to.deep.eq([])
      value.setValue({})
      expect(value.getValue(false)).to.deep.eq({})
      value.setValue({ hello: 'yes', fruit: [] })
      expect(value.getValue(false)).to.deep.eq({ hello: 'yes', fruit: [] })
      value.setValue({ hello: 'yes', fruit: [{ a: { b: { c: [] } } }] })
      expect(value.getValue(false)).to.deep.eq({
        hello: 'yes',
        fruit: [{ a: { b: { c: [] } } }],
      })
    })

    it(`[toJSON] should return the snapshot expectedly`, () => {
      const value = new NoodlProperty()
      value.setKey('greeting')
      value.setValue('hello')
      const snapshot = value.toJSON()
      expect(snapshot).to.have.property('key').to.eq('greeting')
      expect(snapshot).to.have.property('value').to.eq('hello')
    })

    it(`[build] should build the result as a key/value pair`, () => {
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
      expect(arr.getValue(0).getValue(false)).to.eq('hello')
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

    it(`[createProperty] should return the NoodlProperty`, () => {
      const value = new NoodlObject()
      expect(value.createProperty('a', 'hello')).to.be.instanceOf(NoodlProperty)
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

    describe(`when using getProperty`, () => {
      it(`[getProperty] should return a NoodlProperty`, () => {
        const value = new NoodlObject()
        value.createProperty('hello', 100)
        expect(value.getProperty('hello')).to.be.instanceOf(NoodlProperty)
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
      const evalObject = new NoodlObject()
      evalObject.createProperty('actionType', 'evalObject')
      evalObject.createProperty('object', []).build()
      expect(evalObject.build()).to.deep.eq({
        actionType: 'evalObject',
        object: [],
      })
    })
  })

  describe(`Builder`, () => {
    it(`should create an action object`, () => {
      expect(builder.action('builtIn').build()).to.deep.eq({
        actionType: 'builtIn',
      })
    })

    it(`should create a component object`, () => {
      expect(builder.component('button').build()).to.deep.eq({
        type: 'button',
      })
    })

    it(`should create an emit object`, () => {
      const emit = builder.object()
      const property = emit.createProperty('emit')
      property?.setValue({})
      const emitObject = property?.getValue() as NoodlObject
      emitObject.createProperty('dataKey')
      const dataKeyProp = emitObject.getProperty('dataKey')
      dataKeyProp?.setValue({ var1: '' })
      const actonsProp = emitObject.createProperty('actions')
      actonsProp.setValue([])
      const result = emit.build()
      expect(result).to.deep.eq({
        emit: { dataKey: { var1: '' }, actions: [] },
      })
    })

    it(`should create a goto object`, () => {
      const goto = builder.object()
      const prop = goto.createProperty('goto')
      prop.setValue('SignIn')
      expect(goto.build()).to.deep.eq({ goto: 'SignIn' })
    })

    it(`should create an array`, () => {
      const components = builder.array()
      const button = builder.component('button')
      const image = builder.component('image')
      button.createProperty('text', 'Click me')
      image.createProperty('path', new NoodlString('abc.png'))
      image.createProperty('viewTag', 'imageViewTag')
      const view = builder.component('view')
      components.add(button)
      components.add(image)
      components.add(view)
      const output = components.build()
      expect(output).to.be.an('array').with.lengthOf(3)
      expect(output).to.deep.eq([
        { type: 'button', text: 'Click me' },
        { type: 'image', path: 'abc.png', viewTag: 'imageViewTag' },
        { type: 'view' },
      ])
    })

    it(`should create a components list`, () => {
      const components = builder.array()
      const button = builder.component('button')
      const image = builder.component('image')
      image.createProperty('path', new NoodlString('abc.png'))
      image.createProperty('viewTag', 'imageViewTag')
      const view = builder.component('view')
      const childrenProp = view
        .createProperty('children')
        .setValue(new NoodlArray(view))
      const children = childrenProp.getValue() as NoodlArray
      const list = builder.component('list')
      const listChildrenProp = list.createProperty('children').setValue([])
      const listChildren = listChildrenProp.getValue() as NoodlArray
      listChildren.add(builder.component('listItem'))
      const listItem = listChildren.getValue(0) as NoodlObject
      listItem.createProperty('style', new NoodlObject())
      listItem.createProperty('style', new NoodlObject())
      listItem.createProperty('style', new NoodlObject())
      listItem.createProperty('style', new NoodlObject())
      children.add(list)
      components.add(button)
      components.add(image)
      components.add(view)
      expect(components.build()).to.deep.eq([
        { type: 'button' },
        { type: 'image', path: 'abc.png', viewTag: 'imageViewTag' },
        {
          type: 'view',
          children: [
            { type: 'list', children: [{ type: 'listItem', style: {} }] },
          ],
        },
      ])
    })

    describe(`when given a whole page object as an object literal`, () => {
      it(`should deeply create a page object starting from the base object method`, () => {
        const obj = builder.object()
        const pageObject = {
          title: 'AiTmedContact',
          formData: { password: 'mypassword' },
          components: [
            { type: 'button', text: 'Click me' },
            { type: 'textField', dataKey: 'AiTmedContact.password' },
            {
              type: 'view',
              children: [
                {
                  type: 'image',
                  path: 'abc.png',
                  style: { fontSize: '1.8vh' },
                },
              ],
            },
          ],
        }
        obj.createProperty('AiTmedContact', pageObject)
        expect(obj.build()).to.deep.eq({ AiTmedContact: pageObject })
      })
    })

    describe(`when building a whole page object using nodes`, () => {
      it(`should deeply create a page object`, () => {
        const obj = builder.object()
        const pageProp = obj.createProperty('AiTmedContact')
        const pageObject = builder.object()
        pageProp.setValue(pageObject)
        const formData = builder.object()
        formData.createProperty('password', new NoodlString('mypassword'))
        pageObject.createProperty('title', 'AiTmedContact')
        pageObject.createProperty('formData', formData)
        const components = builder.array()
        pageObject.createProperty('components', components)
        const button = builder.component('button')
        const image = builder.component('image')
        image.createProperty('path', new NoodlString('abc.png'))
        image.createProperty('viewTag', 'imageViewTag')
        const view = builder.component('view')
        const childrenProp = view
          .createProperty('children')
          .setValue(new NoodlArray(view))
        const children = childrenProp.getValue() as NoodlArray
        const list = builder.component('list')
        const listChildrenProp = list.createProperty('children').setValue([])
        const listChildren = listChildrenProp.getValue() as NoodlArray
        listChildren.add(builder.component('listItem'))
        const listItem = listChildren.getValue(0) as NoodlObject
        listItem.createProperty('style', new NoodlObject())
        listItem.createProperty('style', new NoodlObject())
        listItem.createProperty('style', new NoodlObject())
        listItem.createProperty('style', new NoodlObject())
        children.add(list)
        components.add(button)
        components.add(image)
        components.add(view)
        expect(obj.build()).to.deep.eq({
          AiTmedContact: {
            title: 'AiTmedContact',
            formData: { password: 'mypassword' },
            components: [
              { type: 'button' },
              { type: 'image', path: 'abc.png', viewTag: 'imageViewTag' },
              {
                type: 'view',
                children: [
                  { type: 'list', children: [{ type: 'listItem', style: {} }] },
                ],
              },
            ],
          },
        })
      })
    })

    it(`should create all nested keys/values as nodes`, () => {
      const obj = builder.object()
      const pageObject = {
        title: 'AiTmedContact',
        formData: { password: 'mypassword' },
        components: [
          { type: 'button', text: 'Click me' },
          { type: 'textField', dataKey: 'AiTmedContact.password' },
          {
            type: 'view',
            children: [
              { type: 'image', path: 'abc.png', style: { fontSize: '1.8vh' } },
            ],
          },
        ],
      }
      obj.createProperty('AiTmedContact', pageObject)
      const pageProp = obj.getProperty('AiTmedContact') as NoodlProperty
      expect(pageProp).to.be.instanceOf(NoodlProperty)
      const pageObjNode = pageProp.getValue() as NoodlObject
      expect(pageObjNode).to.be.instanceOf(NoodlObject)
      expect(pageObjNode.getProperty('title')).to.be.instanceOf(NoodlProperty)
      expect(pageObjNode.getProperty('title')?.getValue()).to.be.instanceOf(
        NoodlString,
      )
      expect(pageObjNode.getProperty('formData')).to.be.instanceOf(
        NoodlProperty,
      )
      expect(pageObjNode.getProperty('formData')?.getValue()).to.be.instanceOf(
        NoodlObject,
      )
      const componentsNode = pageObjNode
        .getProperty('components')
        ?.getValue() as NoodlArray
      expect(componentsNode).to.be.instanceOf(NoodlArray)
      expect(componentsNode.getValue(0)).to.be.instanceOf(NoodlObject)
      expect(componentsNode.getValue(1)).to.be.instanceOf(NoodlObject)
      expect(componentsNode.getValue(2)).to.be.instanceOf(NoodlObject)
      expect(componentsNode.getValue(0).getProperty('type')).to.be.instanceOf(
        NoodlProperty,
      )
      expect(
        componentsNode.getValue(0).getProperty('type').getValue(),
      ).to.be.instanceOf(NoodlString)
      expect(
        componentsNode.getValue(0).getProperty('text').getValue(),
      ).to.be.instanceOf(NoodlString)
      expect(
        componentsNode.getValue(2).getProperty('children').getValue(),
      ).to.be.instanceOf(NoodlArray)
    })
  })
})
