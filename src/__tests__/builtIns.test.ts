import _ from 'lodash'
import sinon from 'sinon'
import { expect } from 'chai'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { Component, ComponentObject, List, ListItem } from 'noodl-ui'
import {
  assetsUrl,
  createComponent,
  createNOODLComponent,
  noodlui,
  noodluidom,
  page,
} from '../utils/test-utils'
import createBuiltIns from '../handlers/builtIns'
import { saveOutput } from './helpers'

before(() => {})

describe('builtIns', () => {
  describe('redraw', async () => {
    xit('label DOM nodes should still be there', () => {
      //
    })

    xit('image DOM nodes should still be there', () => {
      //
    })

    xit('should all display their own data from their own data object', () => {
      //
    })

    xit('should redraw all nodes with the same viewTag if there are more than 1 of them', () => {
      //
    })

    xit('should fallback to redraw the node that called redraw if a viewTag isnt available', () => {
      //
    })
  })
})
