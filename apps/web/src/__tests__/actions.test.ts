import * as u from '@jsmanifest/utils'
import m from 'noodl-test-utils'
import { prettyDOM, waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import { expect } from 'chai'
import {
  actionTypes as nuiActionTypes,
  findFirstByElementId,
  findFirstBySelector,
  triggers,
  NUIActionType,
} from 'noodl-ui'
import { ComponentObject } from 'noodl-types'
import { getApp, ndom } from './test-utils'
import createActions from '../handlers/actions'
import * as dom from '../utils/dom'

const nonEmitBuiltInActionTypes = nuiActionTypes.filter(
  (t) => !/(builtIn|emit|register)/.test(t),
) as Exclude<NUIActionType, 'builtIn' | 'emit' | 'register'>[]

describe(`actions`, () => {
  describe(`evalObject`, () => {
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
              m.popUpComponent({ global: true, popUpView }),
              m.button({
                id: 'button',
                onClick: [
                  m.evalObject({
                    object: async () => ({ abort: true }),
                  } as any),
                  m.popUp(popUpView),
                ],
              }),
            ],
          })
          const button = app.cache.component.get('button').component
          const buttonElem = findFirstByElementId(button)
          const globalElem = findFirstBySelector(`[data-globalid=${popUpView}]`)
          const popUpSpy = sinon.spy(app.actions.popUp[0], 'fn')
          expect(buttonElem).to.exist
          expect(globalElem).to.exist
          expect(dom.isVisible(globalElem)).to.be.false
          buttonElem.click()
          await waitFor(() => {
            expect(popUpSpy).to.be.calledOnce
            expect(
              dom.isVisible(
                findFirstBySelector(`[data-globalid=${popUpView}]`),
              ),
            ).to.be.true
          })
        },
      )
    })
  })

  nonEmitBuiltInActionTypes.forEach((actionType) => {
    it(`should only call the ${actionType} callback once`, async () => {
      const spy = sinon.spy()
      const opts = { pageObject: { components: [] as ComponentObject[] } }
      const {
        pageObject: { components },
      } = opts

      if (actionType === 'evalObject') {
        components.push(
          m.button({
            onClick: [m.evalObject()],
          }),
        )
      }

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
    xit(`should only call the ${trigger} emit callback once`, () => {
      if (trigger === 'onClick') {
        //
      }
    })
  })

  describe(`goto`, () => {
    const getGotoFn = () => createActions({} as any).goto

    it(`should go to new page`, () => {
      // @ts-expect-error
      const goto = getGotoFn({}, {})
      console.log(goto)
    })
  })

  xdescribe(`removeSignature`, () => {
    it(`should remove the blob from the local root`, async () => {
      const app = await getApp({
        navigate: true,
        components: [
          m.canvas({
            type: 'canvas',
            id: 'hello',
            onClick: [m.saveSignature()],
          }),
        ],
      })
      const node = findFirstByElementId('hello')
      const component = app.cache.component.get(node.id)
    })

    xit(`should clear the canvas`, () => {
      //
    })
  })

  describe(`register`, () => {})
})
