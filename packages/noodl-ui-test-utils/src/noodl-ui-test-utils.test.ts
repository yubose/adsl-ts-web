import { expect } from 'chai'
import { Builder } from 'noodl-builder'
import * as u from '@jsmanifest/utils'
import * as lib from './noodl-ui-test-utils'
import actionFactory from './factories/action'
import componentFactory from './factories/component'

const ui = { ...actionFactory, ...componentFactory }
const builder = new Builder()

const createTest = <Exp extends Record<string, any>>({
  value,
  expected,
}: {
  value: any
  expected: Exp
}) => [value, expected] as [any, Exp]

describe(u.yellow(`noodl-ui-test-utils`), () => {
  it(`should create a goto object`, () => {
    const goto = actionFactory.goto('SignIn')
    expect(goto).to.be.an('object').to.have.property('goto', 'SignIn')
  })
  it(`should create an evalObject`, () => {
    const obj = actionFactory.evalObject()
    expect(obj).to.be.an('object').to.have.property('object', undefined)
  })

  it(`should auto assign the key and value if given the funcName`, () => {
    const res = ui.builtIn({ funcName: 'bob', wait: true })
    expect(res).to.have.property('funcName', 'bob')
    expect(res).to.have.property('wait', true)
  })

  it(`[removeSignature] should create dataKey and dataObject properties`, () => {
    const res = ui.removeSignature({ dataKey: 'fa', dataObject: {} })
    expect(res).to.have.property('dataKey')
    expect(res).to.have.property('dataObject')
  })

  xit(`[goto] should create the goto object`, () => {
    expect(ui.goto()).to.have.property('goto')
    expect(ui.goto('hello')).to.have.property('goto', 'hello')
    expect(ui.goto({ destination: 'af' }))
      .to.have.property('goto')
      .to.be.an('object')
      .to.have.property('destination', 'af')
  })

  it(`[ifObject] should create the if object`, () => {
    expect(ui.ifObject([{}, {}, {}]))
      .to.have.property('if')
      .to.deep.eq([{}, {}, {}])
    expect(ui.ifObject({ if: [{}, {}, {}] }))
      .to.have.property('if')
      .to.deep.eq([{}, {}, {}])
  })

  it(`[emit] should create the emit object`, () => {
    console.log(ui.emit({ dataKey: {}, actions: [{ f: 'f' }] }))
    expect(ui.emit({ dataKey: {}, actions: [{ f: 'f' }] })).to.deep.eq({
      emit: { dataKey: {}, actions: [{ f: 'f' }] },
    })
  })
})
