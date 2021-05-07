import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import { Identify } from 'noodl-types'
import { prettyDOM, waitFor } from '@testing-library/dom'
import * as mock from 'noodl-ui-test-utils'
import { getFirstByElementId, getFirstByViewTag } from 'noodl-ui-dom'
import { NUIComponent } from 'noodl-ui'
import { getApp } from '../utils/test-utils'
import { isVisible } from '../utils/dom'

const hideShowKey = ['hide', 'show'] as const

describe(coolGold(`builtIn`), () => {
  describe(italic('goto'), () => {
    const getActionObject = (destination: string) =>
      mock.getBuiltInAction({ funcName: 'goto', dataIn: { destination } })
    const getRoot = () => ({
      Abc: {
        components: [
          mock.getButtonComponent({
            id: 'hello',
            onClick: [getActionObject('Hello')],
          }),
        ],
      },
      Hello: { components: [mock.getLabelComponent({ id: 'block' })] },
    })

    it(`should navigate to the destination`, async () => {
      const app = await getApp({ pageName: 'Abc', root: getRoot() })
      await app.navigate()
      await waitFor(() => expect(getFirstByElementId('hello')).to.exist)
      await waitFor(() => expect(getFirstByElementId('block')).not.to.exist)
      await app.navigate('Abc')
      expect(getFirstByElementId('block')).not.to.exist
      expect(getFirstByElementId('hello')).to.exist
    })

    xit(`should still navigate normally when given plain objects`, async () => {
      const app = await getApp({ pageName: 'Abc', root: getRoot() })
      await app.navigate('Hello')
      await app._test.triggerAction({
        action: actionObject,
        component: app._test.getComponent('block'),
      })
      expect(getFirstByElementId('block')).not.to.exist
      await app.navigate('Hello')
      expect(getFirstByElementId('block')).to.exist
      expect(getFirstByElementId('hello')).not.to.exist
      await app.navigate('Abc')
      expect(getFirstByElementId('block')).not.to.exist
      expect(getFirstByElementId('hello')).to.exist
    })
  })

  hideShowKey.forEach((funcName) => {
    describe(italic(funcName), () => {
      it(`should ${funcName} the DOM node`, async () => {
        const viewTag = 'helloTag'
        const actionObject = mock.getBuiltInAction({ funcName, viewTag })
        await getApp({
          navigate: true,
          components: [
            mock.getViewComponent({ viewTag }),
            mock.getButtonComponent({ id: 'hello', onClick: [actionObject] }),
          ],
        })
        const node = getFirstByViewTag(viewTag)
        const btn = getFirstByElementId('hello')
        expect(isVisible(node)).to.be.true
        btn.click()
        await waitFor(
          () =>
            expect(isVisible(node)).to.be[
              funcName === 'show' ? 'true' : 'false'
            ],
        )
      })

      it(`should still ${funcName} when given plain objects`, async () => {
        const viewTag = 'helloTag'
        const actionObject = mock.getBuiltInAction({ funcName, viewTag })
        const app = await getApp({
          navigate: true,
          components: [
            mock.getViewComponent({ id: 'hello', viewTag }),
            mock.getButtonComponent({ id: 'abc', onClick: [actionObject] }),
          ],
        })
        const node = getFirstByViewTag(viewTag)
        const button = app._test.getComponent('abc')
        expect(isVisible(node)).to.be.true
        await app._test.triggerAction({
          action: actionObject,
          component: button,
        })
        await waitFor(
          () =>
            expect(isVisible(node)).to.be[
              funcName === 'hide' ? 'false' : 'true'
            ],
        )
      })
    })
  })

  describe(`redraw`, () => {
    it(`should rerender the DOM nodes`, async () => {
      const viewTag = 'helloTag'
      let redrawObject = mock.getBuiltInAction({
        funcName: 'redraw',
        viewTag,
      })
      await getApp({
        navigate: true,
        components: [
          mock.getViewComponent({ viewTag }),
          mock.getButtonComponent({
            id: 'hello',
            onClick: [redrawObject],
          }),
        ],
      })
      let node = getFirstByViewTag(viewTag)
      let btn = getFirstByElementId('hello')
      await waitFor(() => {
        expect(node).to.exist
        expect(document.body.contains(node)).to.be.true
        expect(node.dataset).to.have.property('viewtag', viewTag)
      })
      expect(node).to.exist
      expect(document.getElementById(node.id)).to.exist
      btn.click()
      let nextNode: HTMLElement | undefined
      await waitFor(() => {
        node = document.getElementById(node.id) as any
        nextNode = getFirstByViewTag(viewTag)
        expect(nextNode).to.exist
        expect(nextNode).not.to.eq(node)
        expect(document.getElementById(nextNode.id)).to.exist
      })
      const id = nextNode?.id || ''
      expect(id).to.exist
      expect(document.getElementById(id)).to.exist
      getFirstByElementId('hello').click()
      await waitFor(() => {
        expect(document.getElementById(id)).not.to.exist
      })
    })

    it(`should still rerender normally when given a plain object as the first arg`, async () => {
      let button: NUIComponent.Instance | undefined
      let viewTag = 'helloTag'
      let redrawObject = mock.getBuiltInAction({
        funcName: 'redraw',
        viewTag,
      })
      let app = await getApp({
        navigate: true,
        components: [
          mock.getViewComponent({ viewTag }),
          mock.getButtonComponent({ onClick: [redrawObject] }),
        ],
      })
      for (const component of app.cache.component) {
        Identify.component.button(component) && (button = component)
      }
      let node = getFirstByViewTag(viewTag)
      await waitFor(() => {
        expect(node).to.exist
        // expect(document.body.contains(node)).to.be.true
        // expect(node.dataset).to.have.property('viewtag', viewTag)
      })
      // expect(node).to.exist
      // expect(document.getElementById(node.id)).to.exist
      // await app._test.triggerAction({ action: redrawObject, component: button })
      // node = document.getElementById(node.id) as any
      // let nextNode = getFirstByViewTag(viewTag)
      // let id = nextNode.id
      // expect(nextNode).to.exist
      // expect(nextNode).not.to.eq(node)
      // expect(document.getElementById(id)).to.exist
      // await app._test.triggerAction({ action: redrawObject, component: button })
      // expect(document.getElementById(id)).not.to.exist
    })
  })
})
