import chai, { expect } from 'chai'
import { Action, EmitAction, createComponent } from 'noodl-ui'
import chaiNoodl from './chai-noodl'

chai.use(chaiNoodl)

before(() => {
  console.clear()
})

describe('chai-noodl', () => {
  it('fasdsad', () => {
    const emitAction = new EmitAction(
      { emit: { dataKey: { var1: 'hello' }, actions: [] } },
      { trigger: 'onChange' },
    )
    expect(emitAction).to.be.an.actionOf('emit')
  })
})
