import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import chalk from 'chalk'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import * as i from '../utils/internal'
import { assetsUrl, baseUrl, createOn, nui, ui } from '../utils/test-utils'
import NuiPage from '../Page'
import normalizeProps from '../normalizeProps'

describe.only(chalk.keyword('navajowhite')('normalizeProps'), () => {
  describe(u.italic(`select`), () => {
    let root: Record<string, any>
    let normalize = (comp: nt.SelectComponentObject) =>
      normalizeProps({}, ui.select(comp), { root, pageName: 'SignIn' })

    beforeEach(() => {
      root = {
        SignIn: {
          selectedOption: '2AM',
          profile: { options: ['1AM', '2AM', '3AM'] },
        },
      }
    })

    it(`should parse select options into data-options`, () => {
      expect(
        normalize({ dataKey: '..profile.options', options: '' }),
      ).to.have.property('data-options')
    })
    ;[
      '.SignIn.selectedOption',
      '..selectedOption',
      'SignIn.selectedOption',
    ].forEach((ref) => {
      it(`should set the data-value if dataKey is "${ref}"`, () => {
        expect(normalize({ dataKey: ref }))
          .to.have.property('data-value')
          .deep.eq(root.SignIn.selectedOption)
      })
    })

    xit(`should parse options references`, () => {
      //
    })

    xit(`should format options to arrays if it isnt already an array`, () => {
      //
    })
  })
})
