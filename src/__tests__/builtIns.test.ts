import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import { createAction } from 'noodl-action-chain'
import {
  prettyDOM,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/dom'
import * as mock from 'noodl-ui-test-utils'
import createBuiltIns from '../handlers/builtIns'
import { getApp } from '../utils/test-utils'
import { findByViewTag, getFirstByViewTag } from 'noodl-ui-dom'
import { NUIComponent, Store } from 'noodl-ui'

describe(coolGold(`builtIn`), () => {
  describe(`goto`, () => {
    xit(`should still navigate normally when given plain objects`, () => {
      //
    })
  })

  describe(`hide`, () => {
    xit(`should still hide when given plain objects`, () => {
      //
    })
  })

  describe(`show`, () => {
    xit(`should still show when given plain objects`, () => {
      //
    })
  })

  describe(`redraw`, () => {
    it.only(`should still redraw when given a plain object as the first arg`, async () => {
      const viewTag = 'helloTag'
      let view: NUIComponent.Instance | undefined
      let button: NUIComponent.Instance | undefined
      let redrawObject = mock.getBuiltInAction({
        funcName: 'redraw',
        viewTag,
      })
      const app = await getApp({
        navigate: true,
        components: [
          mock.getViewComponent({ viewTag }),
          mock.getButtonComponent({
            onClick: [redrawObject],
          }),
        ],
      })
      for (const component of app.cache.component) {
        if (component?.type === 'button') button = component
        else if (component?.type === 'view') view = component
      }
      const redraw = app.builtIns.get('redraw')?.[0]
        .fn as Store.BuiltInObject['fn']
      let node = getFirstByViewTag(viewTag)
      await waitFor(() => {
        expect(node).to.exist
        expect(document.body.contains(node)).to.be.true
        expect(node.dataset).to.have.property('viewtag', viewTag)
      })
      expect(node).to.exist
      expect(document.getElementById(node.id)).to.exist
      await redraw(
        app.nui.createActionChain('onClick', [redrawObject], {
          component: button,
          page: app.mainPage,
          loadQueue: true,
        }).queue[0],
        app.nui.getConsumerOptions({
          component: button,
          page: app.mainPage.getNuiPage(),
        }),
      )
      node = document.getElementById(node.id) as any
      let nextNode = getFirstByViewTag(viewTag)
      expect(nextNode).to.exist
      expect(nextNode).not.to.eq(node)
      expect(document.getElementById(nextNode.id)).to.exist
      await redraw({ viewTag })
      expect(document.getElementById(nextNode.id)).not.to.exist
    })
  })
})
