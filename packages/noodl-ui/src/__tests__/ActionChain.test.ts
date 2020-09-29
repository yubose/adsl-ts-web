import { expect } from 'chai'
import sinon from 'sinon'
import makeRootsParser from '../factories/makeRootsParser'
import ActionChain from '../ActionChain'
import Action from '../Action'
import {
  NOODLChainActionUpdateObject,
  NOODLChainActionPageJumpObject,
  NOODLChainActionPopupDismissObject,
} from '../types'

const parser = makeRootsParser({ roots: {} })

const pageJumpAction: NOODLChainActionPageJumpObject = {
  actionType: 'pageJump',
  destination: 'MeetingRoomCreate',
}

const popUpDismissAction: NOODLChainActionPopupDismissObject = {
  actionType: 'popUpDismiss',
  popUpView: 'warningView',
}

const updateObjectAction: NOODLChainActionUpdateObject = {
  actionType: 'updateObject',
  object: {
    '.Global.meetroom.edge.refid@': '___.itemObject.id',
  },
}

let actions: [
  NOODLChainActionPopupDismissObject,
  NOODLChainActionUpdateObject,
  NOODLChainActionPageJumpObject,
]

let actionChain: ActionChain

beforeEach(() => {
  actions = [popUpDismissAction, updateObjectAction, pageJumpAction]
  actionChain = new ActionChain(actions)
})

describe('ActionChain', () => {
  it('should append the listeners to the instance', () => {
    const mockOnChainAborted = sinon.spy()
    const mockOnSaveObject = sinon.spy()
    const builtIn = {
      abc: sinon.spy(),
    }
    actionChain = new ActionChain(actions, {
      builtIn,
      onChainAborted: mockOnChainAborted,
      saveObject: mockOnSaveObject,
    })
    expect(actionChain.builtIn).to.deep.eq(builtIn)
    expect(actionChain.onChainAborted).to.eq(mockOnChainAborted)
    expect(actionChain.saveObject).to.eq(mockOnSaveObject)
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
      const fn = actionChain.build({ parser })
      await fn(args)
      return expect(actionChain.status).to.eq('done')
    })
    expect(actionChain.status).to.equal(null)
    btn.click()
    expect(actionChain.status).to.equal('in.progress')
  })

  it('the status should be an object with an "aborted" property after explicitly calling "abort"', async () => {
    const spy = sinon.spy()
    const actionChain = new ActionChain([pageJumpAction], {
      pageJump: spy,
    })
    expect(actionChain.status).to.be.null
    const btn = document.createElement('button')
    const handler = () => actionChain.abort()
    btn.addEventListener('click', handler)
    btn.click()
    btn.removeEventListener('click', handler)
    expect(actionChain.status).to.have.property('aborted')
  })

  it.skip('should set the status to an object with property "aborted" with a nested "reason" property as an array of strings', () => {
    //
  })

  it.skip('should set the status to an object with property "aborted" with a nested "reason" property as a value of true', () => {
    //
  })

  describe.skip("calling an action's 'execute' method", () => {
    it('if the caller returned a string', () => {
      //
    })

    it('if the caller returned a function', () => {
      //
    })

    it('if the caller returned an object', () => {
      //
    })

    it('if the caller called the "abort" callback', () => {
      //
    })
  })
})
