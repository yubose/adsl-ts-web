import m from 'noodl-test-utils'
import sinon from 'sinon'
import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import {
  findFirstByElementId,
  findFirstByViewTag,
  NuiComponent,
  createAction,
} from 'noodl-ui'
import { getApp } from './test-utils'
import { isVisible } from '../utils/dom'
import is from '../utils/is'
import getVideoChatPageObject, { cameraOnSrc } from './helpers/getVideoChatPage'

const hideShowKey = ['hide', 'show'] as const

describe(`builtIn`, () => {
  describe('goBack', () => {
    it(`should set the requesting page to the previous page`, async () => {
      const pageName = 'Oreo'
      const app = await getApp({
        pageName,
        components: [
          m.button({
            onClick: [m.builtIn({ funcName: 'goBack', reload: true })],
          }),
        ],
      })
    })

    xit(
      `should set the reload property on the page modifier object if it is ` +
        `going to be used`,
      () => {
        //
      },
    )

    xit(`should set the "reload" modifier on the page when reload is a boolean`, () => {
      //
    })

    xit(`should set the `, () => {
      //
    })

    describe(`when multiple goBack builtIns are chained together`, () => {
      xit(``, () => {
        //
      })
    })
  })

  describe('goto', () => {
    const getActionObject = (destination: string) =>
      m.builtIn({ funcName: 'goto', dataIn: { destination } })
    const getRoot = (other?: Record<string, any>) => ({
      Abc: {
        components: [
          m.button({
            id: 'hello',
            viewTag: 'helloTag',
            onClick: [getActionObject('Hello')],
          }),
        ],
      },
      Hello: { components: [m.label({ id: 'block' })] },
      ...other,
    })

    it(`should navigate to the destination`, async () => {
      const app = await getApp({ pageName: 'Abc', root: getRoot() })
      await app.navigate()
      await waitFor(() => expect(findFirstByElementId('hello')).to.exist)
      await waitFor(() => expect(findFirstByElementId('block')).not.to.exist)
      await app.navigate('Abc')
      expect(findFirstByElementId('block')).not.to.exist
      expect(findFirstByElementId('hello')).to.exist
    })

    it(
      `should be able to navigate to the destination when being using the ` +
        `{ goto } or { destination } syntax`,
      async () => {
        const thirdPageObject = {
          components: [m.divider({ viewTag: 'dividerTag' })],
        }
        // prettier-ignore
        const app = await getApp({ navigate: true, pageName: 'Abc', root: getRoot({Cereal:thirdPageObject}) })
        expect(app.mainPage.page).to.eq('Abc')
        expect(findFirstByViewTag('helloTag')).to.exist
        await app.actions.builtIn.get('goto')?.[0].fn({ destination: 'Hello' })
        expect(findFirstByElementId('block')).to.exist
        await app.actions.builtIn.get('goto')?.[0].fn({ goto: 'Cereal' })
        expect(findFirstByViewTag('dividerTag')).to.exist
      },
    )

    it(`should be able to navigate to the destination using a plain string`, async () => {
      // prettier-ignore
      const app = await getApp({ navigate: true, pageName: 'Abc', root: getRoot() })
      expect(app.mainPage.page).to.eq('Abc')
      expect(findFirstByViewTag('helloTag')).to.exist
      await app.actions.builtIn.get('goto')?.[0].fn('Hello', {})
      expect(findFirstByElementId('block')).to.exist
    })

    it(
      `should be able to navigate to the destination by injecting a ` +
        `random action goto instance`,
      async () => {
        // prettier-ignore
        const app = await getApp({ navigate: true, pageName: 'Abc', root: getRoot() })
        expect(app.mainPage.page).to.eq('Abc')
        expect(findFirstByViewTag('helloTag')).to.exist
        const action = createAction('onClick', { goto: 'Hello' })
        await app.actions.builtIn.get('goto')?.[0].fn(action, {})
        await waitFor(() => expect(findFirstByElementId('block')).to.exist)
      },
    )
  })

  hideShowKey.forEach((funcName) => {
    describe(funcName, () => {
      it(`should ${funcName} the DOM node`, async () => {
        const viewTag = 'helloTag'
        const actionObject = m.builtIn({ funcName, viewTag })
        await getApp({
          navigate: true,
          components: [
            m.view({ viewTag }),
            m.button({ id: 'hello', onClick: [actionObject] }),
          ],
        })
        const node = findFirstByViewTag(viewTag)
        const btn = findFirstByElementId('hello')
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
        const actionObject = m.builtIn({ funcName, viewTag })
        const app = await getApp({
          navigate: true,
          components: [
            m.view({ id: 'hello', viewTag }),
            m.button({ id: 'abc', onClick: [actionObject] }),
          ],
        })
        const node = findFirstByViewTag(viewTag)
        const button = app._test.getComponent('abc')
        expect(isVisible(node)).to.be.true
        await app._test.triggerAction({
          action: actionObject,
          component: button as any,
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
    it(`should be called`, async () => {
      const viewTag = 'helloTag'
      const app = await getApp({
        navigate: true,
        components: [
          m.view({ viewTag }),
          m.button({
            id: 'hello',
            onClick: [m.builtIn('redraw')],
          }),
        ],
      })
      const node = findFirstByElementId('hello')
      const redraws = app.cache.actions.builtIn.get('redraw')
      let spy: sinon.SinonSpy | undefined
      if (redraws) {
        redraws.length > 1 && (redraws.length = 1)
        const redraw = redraws[0]
        spy = sinon.spy(redraw, 'fn')
      }
      node.click()
      await waitFor(() => {
        expect(spy).to.be.calledOnce
        expect(spy).not.to.be.calledTwice
        expect(spy).not.to.be.calledThrice
      })
    })

    it(`should rerender the DOM nodes`, async () => {
      let viewTag = 'helloTag'
      let redrawObject = m.builtIn({ funcName: 'redraw', viewTag })
      await getApp({
        navigate: true,
        components: [
          m.view({ viewTag }),
          m.button({ id: 'hello', onClick: [redrawObject] }),
        ],
      })
      let node = findFirstByViewTag(viewTag)
      let btn = findFirstByElementId('hello')
      await waitFor(() => {
        expect(node).to.exist
        expect(document.body.contains(node)).to.be.true
        expect(node.dataset).to.have.property('viewtag', viewTag)
      })
      btn.click()
      await waitFor(() => {
        node = findFirstByElementId(node.id) as any
        expect(findFirstByViewTag(viewTag)).to.exist
        expect(findFirstByViewTag(viewTag)).not.to.eq(node)
        // expect(document.getElementById(nextNode.id)).to.exist
      })
      // const id = nextNode?.id || ''
      // expect(id).to.exist
      // expect(document.getElementById(id)).to.exist
      // findFirstByElementId('hello').click()
      // await waitFor(() => {
      //   expect(document.getElementById(id)).not.to.exist
      // })
    })

    it(`should still rerender normally when given a plain object as the first arg`, async () => {
      let button: NuiComponent.Instance | undefined
      let viewTag = 'helloTag'
      let redrawObject = m.builtIn({
        funcName: 'redraw',
        viewTag,
      })
      let app = await getApp({
        navigate: true,
        components: [
          m.view({ viewTag }),
          m.button({ onClick: [redrawObject] }),
        ],
      })
      for (const component of app.cache.component) {
        is.component.button(component) && (button = component as any)
      }
      let node = findFirstByViewTag(viewTag)
      await waitFor(() => {
        expect(node).to.exist
        // expect(document.body.contains(node)).to.be.true
        // expect(node.dataset).to.have.property('viewtag', viewTag)
      })
      // expect(node).to.exist
      // expect(document.getElementById(node.id)).to.exist
      // await app._test.triggerAction({ action: redrawObject, component: button })
      // node = document.getElementById(node.id) as any
      // let nextNode = findFirstByViewTag(viewTag)
      // let id = nextNode.id
      // expect(nextNode).to.exist
      // expect(nextNode).not.to.eq(node)
      // expect(document.getElementById(id)).to.exist
      // await app._test.triggerAction({ action: redrawObject, component: button })
      // expect(document.getElementById(id)).not.to.exist
    })
  })

  describe(`toggleMicrophoneOnOff`, () => {
    xit(`should change the value on the sdk to off`, async () => {
      const pageName = 'VideoChat'
      const pageObject = getVideoChatPageObject()
      pageObject.micOn = true as any
      await getApp({
        emit: {
          onClick: async () =>
            void (pageObject.micOn = !pageObject.micOn as any),
        },
        navigate: true,
        pageName,
        pageObject,
      })
      const node = findFirstByViewTag('microphone')
      expect(pageObject.micOn).to.be.true
      node.click()
      await waitFor(() => {
        expect(pageObject.micOn).to.be.false
        node.click()
      })
      await waitFor(() => {
        expect(pageObject.micOn).to.be.true
      })
    })

    it(`should show the on/off microphone icons correctly`, () => {
      //
    })

    xit(`should turn the local audio tracks off`, () => {
      //
    })

    xit(`should return the local audio tracks on`, () => {
      //
    })
  })

  describe(`toggleCameraOnOff`, () => {
    it(`should change the value on the sdk to on/off expectedly`, async () => {
      const pageName = 'VideoChat'
      const pageObject = getVideoChatPageObject()
      pageObject.cameraOn = true as any
      await getApp({
        emit: {
          onClick: async () =>
            void (pageObject.cameraOn = !pageObject.cameraOn as any),
        },
        navigate: true,
        pageName,
        pageObject,
      })
      const node = findFirstByViewTag('camera')
      expect(pageObject.cameraOn).to.be.true
      node.click()
      await waitFor(() => {
        expect(pageObject.cameraOn).to.be.false
        node.click()
      })
      await waitFor(() => {
        expect(pageObject.cameraOn).to.be.true
      })
    })

    xit(`should switch the camera on/off icons expectedly`, async () => {
      const pageName = 'VideoChat'
      const pageObject = getVideoChatPageObject()
      pageObject.cameraOn = true as any
      await getApp({
        emit: {
          onClick: async () =>
            void (pageObject.cameraOn = !pageObject.cameraOn as any),
        },
        navigate: true,
        pageName,
        pageObject,
      })
      const node = findFirstByViewTag('camera') as HTMLImageElement
      // node.click()
      await waitFor(() => {
        expect(node.src).to.eq(cameraOnSrc)
      })
      // await waitFor(() => {
      //   expect(pageObject.cameraOn).to.be.false
      //   node.click()
      // })
      // await waitFor(() => {
      //   expect(pageObject.cameraOn).to.be.true
      // })
    })

    xit(`should turn the local video tracks off`, () => {
      //
    })

    xit(`should return the local video tracks on`, () => {
      //
    })
  })
})
