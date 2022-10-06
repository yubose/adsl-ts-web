import { expect } from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import * as idb from 'idb-keyval'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import * as w from '../../worker/dedicatedWorker/utils'

describe(nc.coolGold(`worker/utils`), () => {
  it(`should return the config object when successful`, async () => {
    const config = {
      web: { cadlVersion: { test: '0.78d' } },
    }
    const spy = sinon.spy(() => Promise.resolve(config)) as any
    const result = await w.getOrFetch('config:meetd2', { db: { get: spy } })
    console.log(result)
  })
})
