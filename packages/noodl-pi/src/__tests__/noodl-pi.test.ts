import { expect } from 'chai'
import sinon from 'sinon'
import nock from 'nock'
import * as u from '@jsmanifest/utils'
import PiWorker from '../noodl-pi'
import { createMockDb } from './helpers'
import * as c from '../constants'
import * as t from '../types'

const getDbCache = (db) => db.cache

describe(`noodl-pi`, () => {
  for (const evtName of [
    'message',
    'messageerror',
    'error',
    'rejectionhandled',
    'unhandledrejection',
  ]) {
    it(`should register a listener to the ${evtName} event`, () => {
      const spy = sinon.spy()
      global.self = { addEventListener: spy }
      new PiWorker([
        {
          storeName: 'CPT',
          url: `http://127.0.0.1:3000/cpt`,
          version: '1.0.3',
        },
      ])
    })
  }

  it(`should initiate the stores on the instance`, () => {
    const _store = {
      storeName: 'CPT',
      url: `http://127.0.0.1:3000/cpt`,
      version: '1.0.3',
    }
    const pi = new PiWorker([_store])
    const storeObject = pi.stores.get('CPT')
    expect(storeObject).to.be.an('object')
    expect(storeObject).to.have.property('storeName', 'CPT')
    expect(storeObject).to.have.property('url', _store.url)
    expect(storeObject).to.have.property('version', _store.version)
  })

  it(`should throw if an object store did not provide its storeName`, () => {
    expect(
      () => new PiWorker([{ storeName: '', url: '', version: '' }]),
    ).to.throw()
  })

  describe(`when initializing`, () => {
    it(`should initialize the store object to database if it doesnt exist`, async () => {
      const spy = sinon.spy()
      const pi = new PiWorker([
        {
          storeName: 'CPT',
          url: `http://127.0.0.1:3000/cpt`,
          version: '1.0.3',
        },
      ])
      const db = createMockDb({ addEventListener: spy })
      await pi.init(db)
      expect(pi.db.objectStoreNames.contains('CPT')).to.be.true
    })

    it(`should emit ${c.storeEvt.STORE_EMPTY} if there is no data`, async () => {
      const spy = sinon.spy()
      const listenerSpy = sinon.spy()
      const pi = new PiWorker([
        {
          storeName: 'CPT',
          url: `http://127.0.0.1:3000/cpt`,
          version: '1.0.3',
        },
      ])
      pi.use({ storeEmpty: listenerSpy })
      const db = createMockDb({ addEventListener: spy })
      await pi.init(db)
      expect(listenerSpy).to.be.calledOnce
      expect(listenerSpy.firstCall).to.be.calledWith(pi.stores.get('CPT'))
    })

    it(`should fetch the store data if url was provided`, async () => {
      nock(`http://127.0.0.1:3000`)
        .get('/cpt')
        .reply(200, { CPT: { version: '1.0.3', content: { C0: 'Abcasd' } } })
      const spy = sinon.spy()
      const fetchedSpy = sinon.spy()
      const pi = new PiWorker([
        {
          storeName: 'CPT',
          url: `http://127.0.0.1:3000/cpt`,
          version: '1.0.3',
        },
      ])
      pi.use({ [c.storeEvt.FETCHED_STORE_DATA]: fetchedSpy })
      const db = createMockDb({ addEventListener: spy })
      getDbCache(db).CPT = { version: '1.0.1' }
      await db.add('CPT', 'abc', 'content')
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
      nock(`http://127.0.0.1:3000`)
        .get('/cpt')
        .reply(200, { CPT: { version: '1.0.5', content: { C0: 'Abcasd' } } })
      const spy = sinon.spy()
      const fetchedSpy = sinon.spy()
      const pi = new PiWorker([
        {
          storeName: 'CPT',
          url: `http://127.0.0.1:3000/cpt`,
          version: '1.0.3',
        },
      ])
      pi.use({ [c.storeEvt.FETCHED_STORE_DATA]: fetchedSpy })
      const db = createMockDb({ addEventListener: spy })
      getDbCache(db).version = { CPT: '1.0.3' }
      getDbCache(db).CPT = {}
      await db.add('CPT', 'abc', 'content')
      await pi.init(db)
      const args = fetchedSpy.firstCall.args[0]
      expect(args).to.have.property('cachedVersion', '1.0.3')
    })
  })
})
