import { expect } from 'chai'
import { prettyDOM } from '@testing-library/dom'
import { h } from 'snabbdom'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import { ui } from './test-utils'
import nui from '../nui'

describe(nc.coolGold('nui'), () => {
  ;['assetsUrl', 'baseUrl'].forEach((key) => {
    it(`should be able to get and set a custom ${key}`, () => {
      expect(nui[key]).to.eq('')
      nui[key] = 'hello'
      expect(nui[key]).not.to.eq('')
      expect(nui[key]).to.eq('hello')
    })
  })
  ;['pages', 'preload'].forEach((key) => {
    it(`should be able to edit the ${key} list`, () => {
      const arr = nui[key]
      expect(arr).to.be.an('array')
      expect(arr).to.have.lengthOf(0)
      arr.push(1, 2)
      expect(arr).to.have.lengthOf(2)
      expect(arr).to.have.all.members([1, 2])
    })
  })
  ;['plugins', 'registers'].forEach((key) => {
    it(`should be able to edit the ${key} list`, () => {
      const arr = nui[key]
      expect(arr).to.be.an('array')
      expect(arr).to.have.lengthOf(0)
      arr.push(1, 2)
      expect(arr).to.have.lengthOf(2)
      expect(arr).to.have.all.members([1, 2])
    })
  })

  it(`should be able to set the root getter`, () => {
    expect(nui.root).to.deep.eq({})
    nui.use({ root: { hello: 'hi' } })
    expect(nui.root).to.deep.eq({ hello: 'hi' })
    nui.use({ root: () => [] })
    expect(nui.root).to.deep.eq([])
  })
})
