import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import * as i from '../utils/internal'
import { assetsUrl, baseUrl, createOn, nui, ui } from '../utils/test-utils'
import NuiPage from '../Page'
import normalizeProps from '../normalizeProps'

describe(u.italic('normalizeProps'), () => {
  it(
    `should parse select options into data-options property if dataKey ` +
      `is a data path`,
    () => {
      const root = { SignIn: { profile: { options: ['1AM', '2AM', '3AM'] } } }
      const props = normalizeProps(
        {},
        ui.select({
          dataKey: '..profile.options',
          options: '',
        }),
        { root, pageName: 'SignIn' },
      )
      expect(props)
        .to.have.property('data-options')
        .deep.eq(root.SignIn.profile.options)
    },
  )
})
