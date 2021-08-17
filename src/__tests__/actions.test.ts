import * as mock from 'noodl-ui-test-utils'
import * as u from '@jsmanifest/utils'
import { prettyDOM, waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import { expect } from 'chai'
import { coolGold, italic, blue, magenta } from 'noodl-common'
import {
  actionTypes as nuiActionTypes,
  Store,
  triggers,
  NUIActionType,
} from 'noodl-ui'
import { ComponentObject } from 'noodl-types'
import {
  getFirstByElementId,
  getFirstByGlobalId,
  getFirstByViewTag,
} from 'noodl-ui-dom'
import { getApp, ndom } from '../utils/test-utils'
import App from '../App'
import createActions from '../handlers/actions'
import createBuiltIns from '../handlers/builtIns'
import createRegisters from '../handlers/register'
import createExtendedDOMResolvers from '../handlers/dom'
import getVideoChatPageObject from './helpers/getVideoChatPage'
import * as dom from '../utils/dom'

const nonEmitBuiltInActionTypes = nuiActionTypes.filter(
  (t) => !/(builtIn|emit|register)/.test(t),
) as Exclude<NUIActionType, 'builtIn' | 'emit' | 'register'>[]

describe(coolGold(`actions`), () => {
  describe(italic(`evalObject`), () => {
    describe(`when dynamically receiving actions in the middle of the call`, () => {
      it(
        `should still invoke global popUp actions if there are any ` +
          `remaining when receiving { abort: true }`,
        async () => {
          const popUpView = `minimizeVideoChat`
          const app = await getApp({
            navigate: true,
            pageName: 'Cereal',
            components: [
              mock.getPopUpComponent({ global: true, popUpView }),
              mock.getButtonComponent({
                id: 'button',
                onClick: [
                  mock.getEvalObjectAction({
                    object: async () => ({ abort: true }),
                  }),
                  mock.getPopUpAction(popUpView),
                ],
              }),
            ],
          })
          const button = app.cache.component.get('button')
          const buttonElem = getFirstByElementId(button)
          const globalElem = getFirstByGlobalId(popUpView)
          const popUpSpy = sinon.spy(app.actions.popUp[0], 'fn')
          expect(buttonElem).to.exist
          expect(globalElem).to.exist
          expect(dom.isVisible(globalElem)).to.be.false
          buttonElem.click()
          await waitFor(() => {
            expect(popUpSpy).to.be.calledOnce
            expect(dom.isVisible(getFirstByGlobalId(popUpView))).to.be.true
          })
        },
      )
    })
  })

  nonEmitBuiltInActionTypes.forEach((actionType) => {
    it(`should only call the ${magenta(
      actionType,
    )} callback once`, async () => {
      const spy = sinon.spy()
      const opts = { pageObject: { components: [] as ComponentObject[] } }
      const {
        pageObject: { components },
      } = opts

      if (actionType === 'evalObject') {
        components.push(
          mock.getButtonComponent({
            onClick: [mock.getEvalObjectAction()],
          }),
        )
      }

      // @ts-expect-error
      opts[actionType] = spy

      const app = await getApp({ ...opts, navigate: true })

      // if (actionType === 'evalObject') {
      //   const component = Array.from(app.nui.cache.component.get())[0][1]
      //   const spy2 = sinon.spy(component.get('onClick'), 'execute')
      //   const node = document.querySelector('button')
      //   node?.click()
      //   await waitFor(() => {
      //     expect(spy).to.be.calledOnce
      //     expect(spy2).to.be.calledOnce
      //   })
      // }
    })
  })

  triggers.forEach((trigger) => {
    xit(`should only call the ${magenta(trigger)} emit callback once`, () => {
      if (trigger === 'onClick') {
        //
      }
    })
  })

  xdescribe(`removeSignature`, () => {
    it(`should remove the blob from the local root`, async () => {
      const app = await getApp({
        navigate: true,
        components: [
          mock.getCanvasComponent({
            id: 'hello',
            onClick: [mock.getSaveSignatureAction()],
          }),
        ],
      })
      const node = getFirstByElementId('hello')
      const component = app.cache.component.get(node.id)
    })

    xit(`should clear the canvas`, () => {
      //
    })
  })

  describe(`register`, () => {
    it(``, async () => {
      const app = await getApp()
    })
  })
})
