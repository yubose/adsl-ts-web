import * as u from '@jsmanifest/utils'
import sinon from 'sinon'
import sample from 'lodash/sample'
import { waitFor } from '@testing-library/dom'
import { isActionChain } from 'noodl-action-chain'
import { userEvent } from 'noodl-types'
import { expect } from 'chai'
import { createDataKeyReference, nui, ui } from '../utils/test-utils'
import {
  groupedActionTypes,
  nuiEmitType,
  nuiEmitTransaction,
  triggers as nuiTriggers,
} from '../constants'
import Component from '../Component'
import NuiPage from '../Page'
import NUI from '../noodl-ui'
import deref from '../deref'

describe.only(`deref`, () => {
  const listObject = [{ lastUpdated: '..profile.other.lastUpdated' }]
  const getRoot = () => ({
    SignIn: {
      timestamp: 1651849187780,
      formData: { firstName: 'chris', username: 'abc123' },
      profile: {
        username: '..formData.username',
        avatar: { images: [{ url: 'a.png' }, { url: 'logo.png' }] },
        other: { lastUpdated: '__.timestamp' },
      },
      components: [
        ui.label({ text: 'Your logo: ' }),
        ui.label('.Topo.logo'),
        ui.list({
          listObject,
          children: [
            ui.listItem({
              itemObject: '',
              children: [
                ui.label({ text: 'Last updated: ' }),
                ui.label({ text: 'itemObject.lastUpdated' }),
              ],
            }),
          ],
        }),
      ],
    },
    Topo: {
      form: '.SignIn.formData',
      logo: '.SignIn.profile.avatar.images.1.url',
    },
  })

  const tests = {
    '.SignIn.timestamp': 1651849187780,
    '=.SignIn.timestamp': 1651849187780,
    '..timestamp': 1651849187780,
    '..form': undefined,
    '=..components.0.text': 'Your logo: ',
    '.Topo.logo': 'logo.png',
    '..components.2.children.0.children.1.text': 1651849187780,
    '..components.1.dataKey': 'logo.png',
  }

  u.entries(tests).forEach(([ref, expectedResult]) => {
    it(`should deref ${ref}`, () => {
      expect(
        deref({
          dataObject: listObject[0],
          iteratorVar: 'itemObject',
          ref,
          root: getRoot(),
          rootKey: 'SignIn',
        }),
      ).to.eq(expectedResult)
    })
  })
})
