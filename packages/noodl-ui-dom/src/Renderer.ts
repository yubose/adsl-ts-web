// PAUSE FOR NOW
// @ts-nocheck
import invariant from 'invariant'
import { Identify, PageObject } from 'noodl-types'
import * as u from '@jsmanifest/utils'
import {
  Component,
  createComponent,
  findIteratorVar,
  isPage as isNUIPage,
  NUI,
  Page as NUIPage,
  NUIComponent,
  publish,
  Store,
  nuiEmitTransaction,
  Viewport,
} from 'noodl-ui'
import { getFirstByGlobalId, getElementTag, openOutboundURL } from './utils'
import { GlobalComponentRecord } from './global'
import createAsyncImageElement from './utils/createAsyncImageElement'
import createResolver from './createResolver'
import isNDOMPage from './utils/isPage'
import NDOMInternal from './Internal'
import NDOMPage from './Page'
import Timers from './global/Timers'
import * as defaultResolvers from './resolvers'
import * as c from './constants'
import * as t from './types'

class NDOMRenderer {
  /**
   * Takes a list of raw NOODL components, converts to DOM nodes and appends to the DOM
   * @param { ComponentObject | ComponentObject[] } components
   */
  render(page: NDOMPage) {
    page.reset('render')
    // Create the root node where we will be placing DOM nodes inside.
    // The root node is a direct child of document.body
    page.setStatus(c.eventId.page.status.RESOLVING_COMPONENTS)

    // this.reset('componentCache', page)

    const nuiPage = page.getNuiPage()
    const components = u.array(
      NDOM._nui.resolveComponents.call(NDOM._nui, {
        components: page.components,
        page: nuiPage,
      }),
    ) as NUIComponent.Instance[]

    page.setStatus(c.eventId.page.status.COMPONENTS_RECEIVED)

    page.emitSync(c.eventId.page.on.ON_DOM_CLEANUP, {
      global: this.global,
      rootNode: page.rootNode,
    })

    if (page.rootNode.tagName !== 'IFRAME') {
      page.clearRootNode()
    }

    page.setStatus(c.eventId.page.status.RENDERING_COMPONENTS)

    page.emitSync(
      pageEvt.on.ON_BEFORE_RENDER_COMPONENTS,
      page.snapshot({ components }),
    )

    components.forEach((component) =>
      this.draw(
        component,
        page.rootNode?.tagName === 'IFRAME'
          ? (page.rootNode as HTMLIFrameElement).contentDocument?.body
          : page.rootNode,
        page,
      ),
    )

    page.emitSync(c.eventId.page.on.ON_COMPONENTS_RENDERED, page)

    page.setStatus(c.eventId.page.status.COMPONENTS_RENDERED)

    return components as NUIComponent.Instance[]
  }
}

export default NDOMRenderer
