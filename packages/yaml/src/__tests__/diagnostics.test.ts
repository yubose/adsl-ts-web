import { expect } from 'chai'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import y from 'yaml'
import * as yu from 'yaml/util'
import DocRoot from '../DocRoot'
import is from '../utils/is'
import DocDiagnostics from '../DocDiagnostics'

let diagnostics: DocDiagnostics

beforeEach(() => {
  diagnostics = new DocDiagnostics()
})

describe(`diagnostics`, () => {
  it(``, () => {
    console.log(diagnostics)
  })
})
