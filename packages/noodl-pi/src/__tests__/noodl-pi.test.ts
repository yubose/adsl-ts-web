// @ts-nocheck
import { expect } from 'chai'
import sinon from 'sinon'
import nock from 'nock'
import PiWorker from '../noodl-pi'
import { createMockDb, mockFetchResponse } from './helpers'
import * as c from '../constants'

let pi: PiWorker

beforeEach(() => {
  pi = new PiWorker((() => {}) as any)
})

describe.only(`noodl-pi`, () => {
  for (const evtName of [
    'message',
    'messageerror',
    'error',
    'rejectionhandled',
    'unhandledrejection',
  ]) {
    it(`should register a listener to the ${evtName} event`, () => {
      const spy = sinon.spy()
      // @ts-expect-error
      global.self = { addEventListener: spy }
      pi = new PiWorker((() => {}) as any)
      expect(spy.args.some(([msg]) => msg === evtName)).to.be.true
    })
  }

  it(``, () => {
    console.log(pi)
  })
})
