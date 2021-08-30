import { expect } from 'chai'
import { prettyDOM, waitFor } from '@testing-library/dom'
import {
  ComponentObject,
  PageComponentObject,
  PageObject,
  ViewComponentObject,
} from 'noodl-types'
import { flatten as flattenComponents, Page as NUIPage } from 'noodl-ui'
import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import h from 'virtual-dom/h'
import diff from 'virtual-dom/diff'
import createElement from 'virtual-dom/create-element'
import patch from 'virtual-dom/patch'
import VNode from 'virtual-dom/vnode/vnode'
import VText from 'virtual-dom/vnode/vtext'
import Delegator from 'dom-delegator'
import { event as nuiEvent, NUI, NUIComponent } from 'noodl-ui'
import {
  _defaults,
  createRender as _createRender,
  ui,
  ndom,
  waitForPageChildren,
} from '../test-utils'
import type NDOMPage from '../Page'
import { findByElementId, findBySelector, getFirstByElementId } from '../utils'
import { cache } from '../nui'
import * as i from '../utils/internal'
import ComponentPage from '../factory/componentFactory/ComponentPage'

describe(nc.coolGold('VirtualDOM Resolvers'), () => {
  it(`should attach an id`, async () => {
    console.info(ndom)
    ndom.draw(_defaults.nui.resolveComponents(ui.button()))
    expect(())
  })
})
