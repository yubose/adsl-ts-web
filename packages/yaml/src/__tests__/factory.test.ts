import { expect } from 'chai'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import y from 'yaml'
import * as yu from 'yaml/util'
import DocRoot from '../DocRoot'
import is from '../utils/is'
import * as factory from '../factory'

describe(`factory`, () => {
  it(`should create a comment token`, () => {
    const token = factory.comment({ indent: 0 })
    expect(token).to.have.property('type', 'comment')
  })

  it(`should create a space token`, () => {
    const token = factory.space({ indent: 0 })
    expect(token).to.have.property('type', 'space')
  })

  it(`should create a blockScalar token`, () => {
    const token = factory.blockScalar('hello')
    expect(token).to.have.property('type', 'block-scalar')
    expect(token).to.have.property('source', 'hello')
  })

  it(`should create a blockMap token`, () => {
    const token = factory.blockMap()
    expect(token).to.have.property('type', 'block-map')
  })

  it(`should create a blockSeq token`, () => {
    const token = factory.blockSeq()
    expect(token).to.have.property('type', 'block-seq')
  })

  it(`should create a document token`, () => {
    const token = factory.document()
    expect(token).to.have.property('type', 'document')
  })

  it(`should create a tag token`, () => {
    const token = factory.tag()
    expect(token).to.have.property('type', 'tag')
  })
})
