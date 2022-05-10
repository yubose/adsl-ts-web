import { expect } from 'chai'
import * as is from '../utils/is'
import Diagnostics from '../Diagnostics'

let diagnostics: Diagnostics

beforeEach(() => {
  diagnostics = new Diagnostics()
})

describe(`is`, () => {
  it(`[diagnostic] should return true`, () => {
    const diag = diagnostics.createDiagnostic({})
    expect(is.diagnostic(diag)).to.be.true
  })

  it(`[diagnostic] should return false`, () => {
    expect(is.diagnostic({})).to.be.false
  })
})
