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
  describe('when adding actions', () => {
    it('should set the builtIns using single object or array of objects', () => {
      const mockBuiltInFn = sinon.spy()
      actionChain = new ActionChain(actions)
      expect(actionChain.builtIn).not.to.have.property('hello')
      expect(actionChain.builtIn).not.to.have.property('hi')
      expect(actionChain.builtIn).not.to.have.property('monster')
      expect(actionChain.builtIn).not.to.have.property('dopple')
      const getBuiltIn = (name: string) => ({
        funcName: name,
        executor: mockBuiltInFn,
      })
      actionChain.use({ builtIn: getBuiltIn('hello') })
      expect(actionChain.builtIn).to.have.property('hello')
      actionChain.use({ builtIn: [getBuiltIn('hi')] })
      expect(actionChain.builtIn).to.have.property('hi')
      actionChain.use([{ builtIn: getBuiltIn('monster') }])
      expect(actionChain.builtIn).to.have.property('monster')
      actionChain.use([
        { builtIn: [getBuiltIn('dopple'), getBuiltIn('laptop')] },
      ])
      expect(actionChain.builtIn).to.have.property('laptop')
    })

    xit('should set the actions', () => {
      const actionChain = new ActionChain([
        popUpDismissAction,
        updateObjectAction,
        pageJumpAction,
      ])
      const popup = sinon.spy()
      const update = sinon.spy()
      const pagejump = sinon.spy()
      const popupObj = { actionType: 'popUp', fns: [popup] }
      const updateObj = { actionType: 'updateObject', fns: [update] }
      const pagejumpObj = { actionType: 'pageJump', fns: [pagejump] }
      actionChain.add([popupObj, updateObj, pagejumpObj] as any)
      expect(actionChain.popUp).to.have.length(1)
    })
  })

  xit('should invoke all the funcs if their corresponding action is executed', async () => {
    const popup = sinon.spy(() => Promise.resolve())
    const update = sinon.spy(() => Promise.resolve())
    const pagejump = sinon.spy(() => Promise.resolve())

    const actionChain = new ActionChain([
      popUpDismissAction,
      updateObjectAction,
      pageJumpAction,
    ])

    actionChain.add([
      { actionType: 'popUp', fns: [popup] },
      { actionType: 'updateObject', fns: [update] },
      { actionType: 'pageJump', fns: [pagejump] },
    ] as any)

    await actionChain.build({ context: {}, parser: {} } as any)({} as any)
    expect(popup.called).to.be.true
    // expect(update.called).to.be.true
    // expect(pagejump.called).to.be.true
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
