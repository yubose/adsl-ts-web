import { expect } from 'chai'
import NoodlBase from '../Base'
import NoodlValue from '../Value'
import NoodlString from '../String'
import NoodlObject from '../Object'
import NoodlProperty from '../Property'
import is from '../utils/is'
import setIn from '../utils/setIn'
import unwrap from '../utils/unwrap'
import * as fp from '../utils/fp'

describe(`utils`, () => {
  xit(`[createNode] should set the value deeply`, () => {
    const cereal = [{ fruits: ['apple'], if: [] }]
    const value = new NoodlObject()
    expect(value.hasProperty('cereal')).to.be.false
    value.setValue('cereal.abc.123', cereal)
    expect(value.getProperty('cereal'))
    console.dir(value.toJSON(), { depth: Infinity })
    expect(value.build()).to.deep.eq({ cereal: { abc: { '123': cereal } } })
  })

  it.skip(`[createNode] should set intermediary values as nodes if asNodes === true`, () => {
    const cereal = [{ fruits: ['apple'], if: [] }]
    const value = new NoodlObject()
    const result = setIn(
      value,
      'hello.good.morning.have.0.1.2.a.good.day',
      cereal,
    )
    console.log(result)
  })

  describe(`is`, () => {
    it(`[is.node] should return true`, () => {
      expect(is.node(new NoodlBase())).to.be.true
      expect(is.node(new NoodlValue())).to.be.true
      expect(is.node(new NoodlString(''))).to.be.true
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

  describe(`set`, () => {
    it(`should set the value`, () => {
      const value = 'hello'
      const obj = { fruit: {} }
      fp.set(obj, 'apple.bonita', value)
      expect(obj).to.have.property('apple').to.have.property('bonita', value)
      fp.set(obj, 'apple.bonita'.split('.'), value)
      expect(obj).to.have.property('apple').to.have.property('bonita', value)
    })

    it(`should set the value`, () => {
      const value = { hello: 'hi' }
      const obj = {}
      fp.set(obj, 'apple.bonita', value)
      expect(obj)
        .to.have.property('apple')
        .to.have.deep.property('bonita', value)
      fp.set(obj, 'apple.bonita'.split('.'), value)
      expect(obj)
        .to.have.property('apple')
        .to.have.deep.property('bonita', value)
    })

    it(`should set the value`, () => {
      const value = { hello: 'hi' }
      const obj = {}
      fp.set(obj, '', value)
      expect(obj).to.have.property('').to.have.property('hello', 'hi')
      fp.set(obj, [''], value)
      expect(obj).to.have.property('').to.have.property('hello', 'hi')
    })

    it(`should set the value`, () => {
      const path = 'hello.hi.3.no.yes[1].hehe'
      const value = { hello: 'hi' }
      const obj = {} as Record<string, any>
      fp.set(obj, path, value)
      expect(obj).to.have.property('hello').not.to.be.an('array')
      expect(obj.hello)
        .to.have.property('hi')
        .to.be.an('array')
        .with.lengthOf(4)
      expect(obj.hello.hi[3])
        .to.be.an('object')
        .to.have.property('no')
        .to.be.an('object')
        .to.have.property('yes')
        .to.be.an('array')
        .to.have.lengthOf(2)
      expect(obj.hello.hi[3].no.yes[1]).to.have.deep.property('hehe', value)
    })
  })

  describe(`unwrap`, () => {
    it.skip(`should unwrap the NoodlProperty`, () => {
      const prop = new NoodlProperty()
      prop.setKey('emit')
      prop.setValue({ hello: 'yes' })
      const result = unwrap(prop)
      console.dir(result, { depth: Infinity })
      expect(result)
        .to.be.an('object')
        .to.have.property('emit')
        .to.be.an('object')
        .to.have.property('hello', 'yes')
    })
  })
})
