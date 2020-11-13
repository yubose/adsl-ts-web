import { expect } from 'chai'
import sinon from 'sinon'
import makeRootsParser from '../factories/makeRootsParser'
import ActionChain from '../ActionChain/ActionChain'
import Action from '../Action'
import {
  NOODLUpdateObject,
  NOODLPageJumpObject,
  NOODLPopupDismissObject,
  IAction,
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

let actionChain: ActionChain<string>

beforeEach(() => {
  actions = [popUpDismissAction, updateObjectAction, pageJumpAction]
  actionChain = new ActionChain(actions)
})

describe('ActionChain', () => {
  describe('when instantiating', () => {
    it('should start with a status of null', () => {
      const actionChain = new ActionChain([pageJumpAction])
      expect(actionChain.status).to.be.null
    })

    it('should start with current as undefined', () => {
      const actionChain = new ActionChain([pageJumpAction])
      expect(actionChain.current).to.be.undefined
    })
  })

  describe('when adding actions', () => {
    it('should set the builtIns either by using a single object or an array', () => {
      const mockBuiltInFn = sinon.spy()
      actionChain = new ActionChain(actions)
      expect(actionChain.fns.builtIn).not.to.have.property('hello')
      expect(actionChain.fns.builtIn).not.to.have.property('hi')
      expect(actionChain.fns.builtIn).not.to.have.property('monster')
      expect(actionChain.fns.builtIn).not.to.have.property('dopple')
      actionChain.useBuiltIn({ funcName: 'hello', fn: mockBuiltInFn })
      expect(actionChain.fns.builtIn)
        .to.have.property('hello')
        .that.includes(mockBuiltInFn)
      actionChain.useBuiltIn({ funcName: 'lion', fn: [mockBuiltInFn] })
      expect(actionChain.fns.builtIn)
        .to.have.property('lion')
        .that.includes(mockBuiltInFn)
      actionChain.useBuiltIn([{ funcName: 'hi', fn: mockBuiltInFn }])
      expect(actionChain.fns.builtIn)
        .to.have.property('hi')
        .that.includes(mockBuiltInFn)
      actionChain.useBuiltIn([
        {
          funcName: 'monster',
          fn: [mockBuiltInFn, mockBuiltInFn, mockBuiltInFn],
        },
      ])
      expect(actionChain.fns.builtIn)
        .to.have.property('monster')
        .that.is.an('array')
        .that.includes(mockBuiltInFn)
        .with.lengthOf(3)
    })

    it('should set the actions', () => {
      const actionChain = new ActionChain(actions)
      const popup = sinon.spy()
      const update = sinon.spy()
      const popupObj = { actionType: 'popUp', fn: [popup] }
      const updateObj = { actionType: 'updateObject', fn: update }
      actionChain.useAction(popupObj)
      actionChain.useAction([updateObj])
      expect(actionChain.fns.action).to.have.property('popUp')
      expect(actionChain.fns.action.popUp)
        .to.be.an('array')
        .that.includes(popup)
      expect(actionChain.fns.action.updateObject).to.have.lengthOf(1)
      expect(actionChain.fns.action).to.have.property('updateObject')
      expect(actionChain.fns.action.updateObject)
        .to.be.an('array')
        .that.includes(update)
      expect(actionChain.fns.action.updateObject).to.have.lengthOf(1)
    })

    xit(
      'should forward the built ins to useBuiltIn if any builtIn objects ' +
        'were passed in',
      () => {
        //
      },
    )
  })

  describe('when creating action instances', () => {
    it('should return an action instance when registering builtIn objects', () => {
      expect(
        actionChain.createAction({ actionType: 'builtIn', funcName: 'hello' }),
      ).to.be.instanceOf(Action)
    })

    it(
      'should return an action instance when registering custom objects ' +
        '(non builtIns)',
      () => {
        expect(
          actionChain.createAction({
            actionType: 'pageJump',
            destination: 'hello',
          }),
        ).to.be.instanceOf(Action)
      },
    )
  })

  describe('when running actions', () => {
    it(
      'should call the builtIn funcs that were registered by their funcName ' +
        'when being run',
      async () => {
        const actionChain = new ActionChain([
          ...actions,
          { actionType: 'builtIn', funcName: 'red' },
        ])
        const spy = sinon.spy()
        actionChain.useBuiltIn({ funcName: 'red', fn: spy })
        const func = actionChain.build({} as any)
        await func()
        expect(spy.called).to.be.true
      },
    )

    it(
      'should call the non-builtIn funcs that were registered by actionType ' +
        'when being run',
      async () => {
        const actionChain = new ActionChain(actions)
        const spy = sinon.spy()
        actionChain.useAction({ actionType: 'popUpDismiss', fn: spy })
        const func = actionChain.build({} as any)
        await func()
        expect(spy.called).to.be.true
      },
    )
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

  describe('when action chains finish', () => {
    it('should refresh after done running', async () => {
      const spy = sinon.spy()
      const actionChain = new ActionChain([pageJumpAction])
      const onClick = actionChain
        .useAction([{ actionType: 'pageJump', fn: spy }])
        .build({} as any)
      await onClick()
      const refreshedAction = actionChain.actions?.[0] as IAction
      const refreshedQueue = actionChain.getQueue()
      expect(refreshedAction.status).to.be.null
      expect(refreshedQueue).to.have.lengthOf(1)
      expect(refreshedQueue[0].status).to.be.null
      // expect(refreshedQueue[0].).to.
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
