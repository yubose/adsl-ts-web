import { expect } from 'chai'
import sinon from 'sinon'
import nock from 'nock'
import PiWorker from '../noodl-pi'
import { createMockDb, mockFetchResponse } from './helpers'
import * as c from '../constants'

let getDbCache = (db) => db.cache
let pi: PiWorker

beforeEach(() => {
  pi = new PiWorker((() => {}) as any)
})

xdescribe(`noodl-pi`, () => {
  for (const evtName of [
    'message',
    'messageerror',
    'error',
    'rejectionhandled',
    'unhandledrejection',
  ]) {
    xit(`should register a listener to the ${evtName} event`, () => {
      const spy = sinon.spy()
      // @ts-expect-error
      global.self = { addEventListener: spy }
      //
    })
  }

  xit(`should initiate the stores on the instance`, () => {
    const _store = {
      storeName: 'CPT',
      url: `http://127.0.0.1:3000/cpt`,
      version: '1.0.3',
    }
    // @ts-expect-error
    const pi = new PiWorker([_store])
    const storeObject = pi.stores.get('CPT')
    expect(storeObject).to.be.an('object')
    expect(storeObject).to.have.property('storeName', 'CPT')
    expect(storeObject).to.have.property('url', _store.url)
    expect(storeObject).to.have.property('version', _store.version)
  })

  xit(`should throw if an object store did not provide its storeName`, () => {
    expect(
      // @ts-expect-error
      () => new PiWorker([{ storeName: '', url: '', version: '' }]),
    ).to.throw()
  })

  describe(`when initializing`, () => {
    it(`should initialize the store object to database if it doesnt exist`, async () => {
      const spy = sinon.spy()
      const db = createMockDb({
        addEventListener: spy,
        initialValue: { CPT: {} },
      })
      // @ts-expect-error
      await pi.init(db)
      // @ts-expect-error
      expect(pi.db.objectStoreNames.contains('CPT')).to.be.true
    })

    it(`should emit ${c.storeEvt.STORE_EMPTY} if there is no data`, async () => {
      const spy = sinon.spy()
      const listenerSpy = sinon.spy()
      // @ts-expect-error
      const pi = new PiWorker([
        {
          storeName: 'CPT',
          url: `http://127.0.0.1:3000/cpt`,
          version: '1.0.3',
        },
      ])
      pi.use({ storeEmpty: listenerSpy })
      const db = createMockDb({ addEventListener: spy })
      // @ts-expect-error
      await pi.init(db)
      expect(listenerSpy).to.be.calledOnce
      expect(listenerSpy.firstCall).to.be.calledWith(pi.stores.get('CPT'))
    })

    it(`should fetch the store data if url was provided`, async () => {
      mockFetchResponse({
        CPT: { version: '1.0.3', content: { C0: 'Abcasd' } },
      })
      const spy = sinon.spy()
      const fetchedSpy = sinon.spy()
      pi.use({ [c.storeEvt.FETCHED_STORE_DATA]: fetchedSpy })
      const db = createMockDb({
        addEventListener: spy,
        initialValue: { CPT: { abc: 'content', version: '1.0.1' } },
      })
      // @ts-expect-error
      await pi.init(db)
      expect(fetchedSpy).to.be.calledOnce
      expect(fetchedSpy.firstCall.args[0])
        .to.be.an('object')
        .to.have.property('response')
      expect(fetchedSpy.firstCall.args[0].response)
        .to.be.an('object')
        .to.have.property('CPT')
        .to.have.property('content')
        .to.deep.eq({ C0: 'Abcasd' })
    })

    it(`should pass in the cached version along with the response when emitting ${c.storeEvt.FETCHED_STORE_DATA}`, async () => {
      const resp = { CPT: { version: '1.0.5', content: { C0: 'Abcasd' } } }
      mockFetchResponse(resp)
      const fetchedSpy = sinon.spy()
      pi.use({ [c.storeEvt.FETCHED_STORE_DATA]: fetchedSpy })
      const db = createMockDb({
        initialValue: { CPT: { version: '0.0.001', content: 'hi' } },
      })
      // @ts-expect-error
      await pi.init(db)
      const args = fetchedSpy.firstCall.args[0]
      expect(args).to.have.property('cachedVersion', '0.0.001')
    })
  })
})
