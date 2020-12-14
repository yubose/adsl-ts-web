import { expect } from 'chai'
import sinon from 'sinon'
import { ActionChain, actionTypes } from 'noodl-ui'
import { noodlui } from '../utils/test-utils'

const commonKeysInOptionsArg = [
  // 'context', TODO - Deprecate context for spread instead
  'event',
  'getState',
  'getPageObject',
  'plugins',
  'snapshot',
]

const noodlDefinedActionTypes = actionTypes.filter(
  (actionType) => !/(anonymous|goto|emit)/i.test(actionType),
)

describe('actions', () => {
  noodlDefinedActionTypes
    .filter((f) => f !== 'builtIn')
    .forEach((actionType) => {
      it(`should be given the correct args for actionType "${actionType}"`, async () => {
        const spy = sinon.spy()
        noodlui.removeCbs(actionType)
        noodlui.use({ actionType, fn: spy })
        const image = noodlui.resolveComponents({
          type: 'image',
          path: 'abc.png',
          onClick: [{ actionType, object: [] }] as any,
        })
        // @ts-expect-error
        await image?.get?.('onClick')?.()
        const [action, options, actionsContext] = spy?.args?.[0] || []
        expect(options).to.have.property('component').eq(image)
        expect(options).to.have.property('ref').instanceOf(ActionChain)
        expect(actionsContext).to.have.property('noodlui')
        commonKeysInOptionsArg.concat('ref').forEach((key) => {
          expect(options).to.have.property(key).eq(options[key])
        })
      })
    })

  it(`should be given the correct args for actionType "builtIn" handlers`, async () => {
    const spy = sinon.spy()
    noodlui.removeCbs('builtIn')
    noodlui.use({ actionType: 'builtIn', fn: spy, funcName: 'hello' })
    const image = noodlui.resolveComponents({
      type: 'image',
      path: 'abc.png',
      onClick: [{ actionType: 'builtIn', funcName: 'hello' }] as any,
    })
    // @ts-expect-error
    await image?.get?.('onClick')?.()
    const [action, options, actionsContext] = spy?.args?.[0] || []
    expect(options).to.have.property('component').eq(image)
    expect(options).to.have.property('ref').instanceOf(ActionChain)
    expect(actionsContext).to.have.property('noodlui')
    commonKeysInOptionsArg.concat('ref').forEach((key) => {
      expect(options).to.have.property(key).eq(options[key])
    })
  })
})
