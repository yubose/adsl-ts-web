import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import fs from 'fs-extra'
import path from 'path'
import sinon from 'sinon'
import sample from 'lodash/sample'
import { waitFor } from '@testing-library/dom'
import { isActionChain } from 'noodl-action-chain'
import { expect } from 'chai'
import { createDataKeyReference, nui, ui } from '../utils/test-utils'
import {
  groupedActionTypes,
  nuiEmitType,
  nuiEmitTransaction,
  triggers as nuiTriggers,
} from '../constants'
import Component from '../Component'
import Page from '../Page'
import NUI from '../noodl-ui'
import traverse, { visitHooks } from '../utils/traverse'

let obj: nt.ComponentObject

beforeEach(() => {
  obj = {
    type: 'view',
    children: [
      {
        type: 'list',
        contentType: 'listObject',
        listObject: [
          { key: 'gender', value: 'Female' },
          { key: 'gender', value: 'Male' },
          { key: 'gender', value: 'Other' },
        ],
        style: {
          axis: 'horizontal',
          border: {
            style: '2',
          },
          shadow: 'true',
          textAlign: {
            x: 'center',
            y: 'center',
          },
        },
        children: [
          {
            type: 'listItem',
            style: {
              axis: 'horizontal',
              border: {
                style: '2',
              },
            },
            children: [
              { type: 'label', text: 'Good morning' },
              {
                type: 'textField',
                dataKey: 'formData.password',
                placeholder: 'Enter your password',
              },
              {
                type: 'button',
                onClick: [
                  {
                    emit: {
                      dataKey: { var1: 'formData' },
                      actions: [{}, {}, {}],
                    },
                  },
                  {
                    goto: 'MeetingRoom',
                  },
                  {
                    actionType: 'evalObject',
                    object: () => {},
                  },
                  {
                    actionType: 'popUp',
                    popUpView: 'greyPopUp',
                    wait: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'select',
        options: ['1AM', '2AM'],
      },
    ],
  }
})

describe.skip(u.yellow('traverse'), () => {
  it(`should be called for every key/value and every item in arrays`, () => {
    let expectCallCount = 0
    const spy = sinon.spy()
    ;(function (v) {
      const c = (v) => {
        if (u.isObj(v)) {
          for (const _v of u.values(v)) {
            expectCallCount++
            c(_v)
          }
        }
        if (u.isArr(v))
          v.forEach((_v) => {
            expectCallCount++
            c(_v)
          })
      }

      if (u.isObj(v)) {
        for (const _v of u.values(v)) {
          expectCallCount++
          c(_v)
        }
      }
      if (u.isArr(v))
        v.forEach((_v) => {
          expectCallCount++
          c(_v)
        })
    })(obj)
    traverse(obj, spy)
    expect(spy.callCount).to.eq(expectCallCount)
  })
})
