import { expect } from 'chai'
import sinon from 'sinon'
import makeRootsParser from '../factories/makeRootsParser'
import ActionChain from '../ActionChain/ActionChain'
import Action from '../Action'
import BuiltIn from '../BuiltIn'
import {
  NOODLUpdateObject,
  NOODLPageJumpObject,
  NOODLPopupDismissObject,
} from '../types'

const parser = makeRootsParser({ roots: {} })

const pageJumpAction: NOODLPageJumpObject = {
  actionType: 'pageJump',
  destination: 'MeetingRoomCreate',
}

const popUpDismissAction: NOODLPopupDismissObject = {
  actionType: 'popUpDismiss',
  popUpView: 'warningView',
}

const updateObjectAction: NOODLUpdateObject = {
  actionType: 'updateObject',
  object: {
    '.Global.meetroom.edge.refid@': '___.itemObject.id',
  },
}

let actions: [NOODLPopupDismissObject, NOODLUpdateObject, NOODLPageJumpObject]

let actionChain: ActionChain

beforeEach(() => {
  actions = [popUpDismissAction, updateObjectAction, pageJumpAction]
  actionChain = new ActionChain(actions)
})

describe('ActionChain', () => {
  describe('add', () => {
    it('should set the builtIns', () => {
      const mockOnChainAborted = sinon.spy()
      const mockOnSaveObject = sinon.spy()
      const mockBuiltInFn = sinon.spy()
      const helloBuiltInFn = new BuiltIn(mockBuiltInFn, { funcName: 'hello' })
      actionChain = new ActionChain(actions)
      actionChain.add(helloBuiltInFn)
      expect(actionChain.builtIn).to.have.property('hello')
      // expect(actionChain.onChainAborted).to.eq(mockOnChainAborted)
      // expect(actionChain.saveObject[0].actionType).to.eq('saveObject')
    })
  })

  it('should convert each raw action object in the actions list as their corresponding instances and store it in the "actions" property', () => {
    actions = [popUpDismissAction, updateObjectAction, pageJumpAction]
    actionChain = new ActionChain(actions)
    expect(actionChain.actions?.[0]).to.be.instanceOf(Action)
    expect(actionChain.actions?.[1]).to.be.instanceOf(Action)
    expect(actionChain.actions?.[2]).to.be.instanceOf(Action)
  })

  it('should start with a status of null', () => {
    const actionChain = new ActionChain([pageJumpAction])
    expect(actionChain.status).to.be.null
  })

  it('should start with current as undefined', () => {
    const actionChain = new ActionChain([pageJumpAction])
    expect(actionChain.current).to.be.undefined
  })

  it('should update the "status" property when starting the action chain', () => {
    const actionChain = new ActionChain([pageJumpAction])
    const btn = document.createElement('button')
    btn.addEventListener('click', async (args) => {
      const fn = actionChain.build({ parser } as any)
      await fn(args)
      return expect(actionChain.status).to.eq('done')
    })
    expect(actionChain.status).to.equal(null)
    btn.click()
    expect(actionChain.status).to.equal('in.progress')
  })

  xit('the status should be an object with an "aborted" property after explicitly calling "abort"', async () => {
    try {
      const spy = sinon.spy()
      const actionChain = new ActionChain([pageJumpAction], {
        pageJump: spy,
      })
      expect(actionChain.status).to.be.null
      const btn = document.createElement('button')
      const handler = () => {
        try {
          actionChain.abort()
        } catch (error) {}
      }
      btn.addEventListener('click', handler)
      btn.click()
      btn.removeEventListener('click', handler)
      expect(actionChain.status).to.have.property('aborted')
    } catch (error) {}
  })

  xit('calling abort should reset the queue', () => {
    const actionChain = new ActionChain(
      [pageJumpAction, popUpDismissAction, updateObjectAction],
      {
        pageJump: (action) => null,
        //
      },
    )
  })

  xit('should skip actions that didnt have a callback attached from the consumer', () => {
    //
  })

  xit('skipped actions should have the status "aborted" with some "unregistered callback" reason', () => {
    //
  })

  describe("calling an action's 'execute' method", () => {
    describe('if the caller returned a string', () => {
      //
    })

    describe('if the caller returned a function', () => {
      //
    })

    describe('if the caller returned an object', () => {
      xit('should inject the result to the beginning of the queue if the result is an action noodl object', () => {
        //
      })

      xit('should add the object to the "intermediary" list if the returned result was an action noodl object', () => {
        //
      })
    })

    describe('if the caller called the "abort" callback', () => {
      //
    })

    xit('should add the result of execute to its history', () => {
      //
    })
  })

  describe('"if" conditions', () => {
    xit('should return item 2 if truthy', () => {
      actionChain = new ActionChain([pageJumpAction])
    })

    xit('should return item 3 if falsey', () => {
      //
    })
  })
})
