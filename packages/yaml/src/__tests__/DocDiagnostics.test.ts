import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
import { consts } from '@noodl/core'
import assertAppConfig from '../asserters/init/assertAppConfig'
import { createAssert, createAsyncAssert } from '../assert'
import createNode from '../utils/createNode'
import deref from '../utils/deref'
import is from '../utils/is'
import DocDiagnostics from '../DocDiagnostics'
import DocVisitor from '../DocVisitor'
import Root from '../DocRoot'

let root: Root

beforeEach(() => {
  root = new Root()
})

describe(`DocDiagnostics`, () => {
  let diagnostics: DocDiagnostics
  let docVisitor: DocVisitor

  beforeEach(() => {
    docVisitor = new DocVisitor()
    diagnostics = new DocDiagnostics()
    diagnostics.use(docVisitor)
    diagnostics.use(root)

    root.set('BaseHeader', {
      type: 'header',
      style: { width: '1', height: 'auto', top: '0.1', left: '0.125' },
    })

    root.set('Cereal', {
      icon: '..realIcon',
      realIcon: 'you-found-me.png',
      components: [
        '.BaseHeader',
        { type: 'button', text: '..icon' },
        { type: 'label', text: '..iconName' },
      ],
    })
  })

  describe(`Asserters`, () => {
    describe(`init asserts`, () => {
      it.only(`[assertAppConfig]`, () => {
        const results = diagnostics.run({
          init: (args) => {
            args.add({
              messages: [
                {
                  type: 'ERROR',
                  message: `cadlEndpoint includes page "SignIn" in the pages list but does not exist in Root`,
                },
              ],
            })
            assertAppConfig(args)
          },
        })
        it(``, () => {
          //
        })
      })
    })
  })
})
