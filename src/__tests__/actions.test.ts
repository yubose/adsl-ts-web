import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import { Action } from 'noodl-ui'
import { noodlui, page } from '../utils/test-utils'

const commonKeysInOptionsArg = [
  // 'context', TODO - Deprecate context for spread instead
  'event',
  'getState',
  'getPageObject',
  'plugins',
  'snapshot',
]

describe('actions', () => {
  describe('anonymous', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('emit', () => {
    xit('should have the dataObject in the instance', () => {
      //
    })

    xit('should have dataKey populated in the instance with the dataObject(s)', () => {
      //
    })

    xit('should have the iteratorVar in the instance if the component is a list consumer', () => {
      //
    })

    xit('should have the trigger in the instance', () => {
      //
    })
  })

  describe('evalObject', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('goto', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('pageJump', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('popUp', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('popUpDismiss', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('refresh', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe('saveObject', () => {
    xit('should be given the correct args', () => {
      //
    })
  })

  describe.only('updateObject', () => {
    it('should be given the correct args', async () => {
      const spy = sinon.spy()
      noodlui.removeCbs('updateObject')
      noodlui.use({ actionType: 'updateObject', fn: spy })
      const image = noodlui.resolveComponents({
        type: 'image',
        path: 'abc.png',
        onClick: [{ actionType: 'updateObject', object: [] }],
      })
      console.info(noodlui.getCbs())
      await image.get('onClick')()
      const [action, options, actionsContext] = spy.args[0]
      expect(spy).to.have.been.called
      expect(action).to.be.instanceOf(Action)
      expect(options).to.have.property('component').eq(image)
      expect(actionsContext).to.have.property('noodlui')
      commonKeysInOptionsArg.concat('ref').forEach((key) => {
        expect(options).to.have.property(key).eq(options[key])
      })
    })
  })
})
