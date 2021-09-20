import * as u from '@jsmanifest/utils'
import chalk from 'chalk'
import sinon from 'sinon'
import sample from 'lodash/sample'
import { waitFor } from '@testing-library/dom'
import { isActionChain } from 'noodl-action-chain'
import { userEvent } from 'noodl-types'
import { expect } from 'chai'
import { getPresetPageObjects, nui, ui } from '../utils/test-utils'
import get, { getValue } from '../get'
import * as c from '../constants'
import * as t from '../types'

beforeEach(() => {
  process.stdout.write('\x1Bc')
  u.assign(nui.getRoot(), {
    Forest: {
      key: '.Cereal.data.thumbnail',
      formData: {
        profile: '..profile',
      },
      Stars: 5,
      profile: {
        usemjnjnjknr: {
          firstName: '..currentFirstName',
          lastName: '..currentLastName',
          email: '..currentEmail',
          otherNames: ['mike', 'luke'],
        },
      },
      currentFirstName: 'henry',
      currentLastName: 'Gonzalez',
      currentEmail: 'henry@gmail.com',
    },
  })
})

describe.only(chalk.keyword('navajowhite')('get'), () => {
  it.only(``, () => {
    const getter = get(nui.getRoot)
    const result = getValue(
      nui.getRoot().Forest,
      '..formData.profile.user.email'.split('.'),
    )
    console.info(result)
  })

  it(`should support double dots ".."`, () => {
    expect(nui.get('..icon', 'Tiger')).to.eq(nui.getRoot().Tiger.icon)
  })

  it(`should fall back to retrieving locally if value starts with "." and first letter is a lowercase `, () => {
    expect(nui.get('.icon', 'Tiger')).to.eq(nui.getRoot().Tiger.icon)
  })

  it(`should retrieve locally if not in reference format and first letter is lowercased`, () => {
    expect(nui.get('icon', 'Tiger')).to.eq(nui.getRoot().Tiger.icon)
  })

  it(`should support single dots "."`, () => {
    expect(nui.get('.Forest.formData.profile.user.email')).to.eq(
      'henry@gmail.com',
    )
  })

  it(`should retrieve by the root object if it is not a reference and it is a root key`, () => {
    console.info(nui.getRoot().Forest)
    expect(nui.get('Forest.formData.profile.user.email')).to.eq(
      nui.getRoot().Forest.currentEmail,
    )
  })

  it(`should be able to deeply retrieve nested references`, () => {
    expect(nui.get('.Forest.key')).to.eq('red.png')
  })

  it(`should fallback to retrieving locally if starts with double dot and first letter is uppercased`, () => {
    expect(nui.get('..Stars', 'Forest')).to.eq(5)
  })
})
