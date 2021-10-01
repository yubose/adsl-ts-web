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

describe.only(u.italic('normalizeProps'), () => {
  describe(chalk.keyword('navajowhite')(`select`), () => {
    let root: Record<string, any>
    const normalize = (comp: nt.SelectComponentObject) =>
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

    it(`should set the data-value if dataKey is a path`, () => {
      expect(normalize({ dataKey: '.SignIn.selectedOption' }))
        .to.have.property('data-value')
        .deep.eq(root.selectedOption)
    })

    xit(`should parse options references`, () => {
      //
    })

    xit(`should format options to arrays if it isnt already an array`, () => {
      //
    })
  })
})
