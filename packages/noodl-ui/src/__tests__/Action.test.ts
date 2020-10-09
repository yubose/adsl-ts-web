// @ts-nocheck
import { expect } from 'chai'
import sinon from 'sinon'
import Action, { DEFAULT_TIMEOUT_DELAY } from '../Action'
import { NOODLPageJumpObject } from '../types'

const mockPageJumpAction: NOODLPageJumpObject = {
  actionType: 'pageJump',
  destination: 'VideoChat',
}

let action: Action<NOODLPageJumpObject>

beforeEach(() => {
  action = new Action(mockPageJumpAction, { callback: async () => {} })
})

afterEach(() => {
  action.clearTimeout()
})

describe('Action', () => {
  it('should have a way to retrieve the original action object', () => {
    expect(action.original).to.equal(mockPageJumpAction)
  })

  it('should reset the result/error state to their default values when executing', () => {
    const err = new Error('fsdfd')
    action.error = err
    action.result = 'abc'
    expect(action.error).to.equal(err)
    expect(action.result).to.equal('abc')
    action.execute()
    expect(action.error).to.be.null
    expect(action.result).to.be.undefined
  })

  it('should assign an id on init', () => {
    expect(action.id).to.be.a('string')
  })

  it(`should default to ${DEFAULT_TIMEOUT_DELAY} seconds`, () => {
    expect(action.timeoutDelay).to.eq(DEFAULT_TIMEOUT_DELAY)
  })

  it('should output the correct result', async () => {
    action.callback = async () => 'abc'
    const result = action.execute()
    return result.then((res) => {
      expect(res).to.eq('abc')
      expect(action.result).to.eq('abc')
    })
  })

  it('should set status to resolved if the execution was successful', () => {
    action.callback = async () => 'abc'
    const result = action.execute()
    return result.then(() => {
      expect(action.status).to.eq('resolved')
    })
  })

  it('should set the error property to the error if the execution failed', () => {
    action.callback = async () => {
      throw new Error('abc')
    }
    const result = action.execute()
    return result.catch((err) => {
      expect(action.status).to.eq('error')
      expect(action.error).to.eq(err)
    })
  })

  it('should clear the timeout callback on success', async () => {
    action.callback = async () => {}
    await action.execute()
    expect(action.isTimeoutRunning()).to.be.false
  })

  it('should clear the timeout callback on error', () => {
    action.callback = async () => {
      throw new Error('abc')
    }
    return action.execute().catch((err) => {
      expect(err).to.be.instanceOf(Error)
      expect(action.isTimeoutRunning()).to.be.false
    })
  })

  it('should set the onTimeout function', () => {
    const mockOnTimeout = sinon.spy()
    expect(action.onTimeout).to.be.undefined
    action.onTimeout = mockOnTimeout
    expect(action.onTimeout).not.to.be.undefined
    expect(action.onTimeout).to.equal(mockOnTimeout)
  })

  it('should set the error object on the error property if error and flip status to "error"', async () => {
    const err = new Error('eh')
    action.callback = async () => {
      throw err
    }
    await expect(action.execute({ abc: 'letters' })).to.eventually.rejected
    expect(action.error).to.eq(err)
    expect(action.status).to.eq('error')
  })

  it('should set status to resolved if the execution was a success (async)', async () => {
    action.callback = async () => {
      return 'abc'
    }
    await expect(action.execute({ abc: 'letters' })).to.eventually.fulfilled
    expect(action.status).to.eq('resolved')
  })

  it('(async) should set a timeout while running the execution and clear it when resolved ', async () => {
    action.callback = async () => {
      return 'abc'
    }
    expect(action.isTimeoutRunning()).to.be.false
    const promise = action.execute({ abc: 'letters' })
    expect(action.isTimeoutRunning()).to.be.true
    await promise
    expect(action.isTimeoutRunning()).to.be.false
  })

  it('(synchronous) should set a timeout while running the execution and clear it when resolved', async () => {
    action.callback = () => {
      return 'abc'
    }
    expect(action.isTimeoutRunning()).to.be.false
    const promise = action.execute({ abc: 'letters' })
    expect(action.isTimeoutRunning()).to.be.true
    await promise
    expect(action.isTimeoutRunning()).to.be.false
  })

  it('should call the "onPending" callback if pending', () => {
    const spy = sinon.spy()
    action.onPending = spy
    expect(spy.called).to.be.false
    expect(action.status).to.be.null
    action.status = 'pending'
    expect(action.status).to.eq('pending')
    expect(spy.called).to.be.true
  })

  it('should call the "onResolved" callback if resolved', () => {
    const spy = sinon.spy()
    action.onResolved = spy
    expect(spy.called).to.be.false
    expect(action.status).to.be.null
    action.status = 'resolved'
    expect(action.status).to.eq('resolved')
    expect(spy.called).to.be.true
  })

  it('should call the "onTimeout" callback if timed out', () => {
    const spy = sinon.spy()
    action.onTimeout = spy
    expect(spy.called).to.be.false
    expect(action.status).to.be.null
    action.status = 'timed-out'
    expect(action.status).to.eq('timed-out')
    expect(spy.called).to.be.true
  })

  it('should call the "onError" callback if error', () => {
    // TODO: different variations of "error"
    const spy = sinon.spy()
    action.onError = spy
    expect(spy.called).to.be.false
    expect(action.status).to.be.null
    action.status = 'error'
    expect(action.status).to.eq('error')
    expect(spy.called).to.be.true
  })

  it('should call the "onAbort" callback if aborted', () => {
    const spy = sinon.spy()
    action.onAbort = spy
    expect(spy.called).to.be.false
    expect(action.status).to.be.null
    action.status = 'aborted'
    expect(action.status).to.eq('aborted')
    expect(spy.called).to.be.true
  })
})
