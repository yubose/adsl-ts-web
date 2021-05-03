import * as mock from 'noodl-ui-test-utils'
import { prettyDOM, waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import CADL from '@aitmed/cadl'
import { expect } from 'chai'
import { coolGold, italic, blue, magenta } from 'noodl-common'
import {
  actionTypes as nuiActionTypes,
  nuiEmitTransaction,
  NUI,
  Viewport,
  Store,
  triggers,
  NUIActionType,
} from 'noodl-ui'
import { ComponentObject } from 'noodl-types'
import { getFirstByViewTag } from 'noodl-ui-dom'
import { getApp, ndom } from '../utils/test-utils'
import App from '../App'
import createActions from '../handlers/actions'
import createBuiltIns from '../handlers/builtIns'
import createRegisters from '../handlers/register'
import createExtendedDOMResolvers from '../handlers/dom'
import * as u from '../utils/common'
import getVideoChatPageObject from './helpers/getVideoChatPage'

const nonEmitBuiltInActionTypes = nuiActionTypes.filter(
  (t) => !/(builtIn|emit|register)/.test(t),
) as Exclude<NUIActionType, 'builtIn' | 'emit' | 'register'>[]

describe(coolGold(`Noodl actions`), () => {
  describe(italic(`builtIns`), () => {
    describe(`toggleMicrophoneOnOff`, () => {
      const getPageObject = () => {
        return { pageName: 'VideoChat', pageObject: getVideoChatPageObject() }
      }

      it(`should change the value on the sdk to off`, async () => {
        const { pageName, pageObject } = getPageObject()
        pageObject.micOn = true
        await getApp({
          emit: { onClick: async () => void (pageObject.micOn = false) },
          navigate: true,
          pageName,
          pageObject,
        })
        const node = getFirstByViewTag('microphone')
        expect(pageObject.micOn).to.be.true
        node.click()
        await waitFor(() => {
          expect(pageObject.micOn).to.be.false
        })
      })

      it(`should change the value on the sdk to on`, async () => {
        const { pageName, pageObject } = getPageObject()
        pageObject.micOn = false
        await getApp({
          emit: { onClick: async () => void (pageObject.micOn = true) },
          navigate: true,
          pageName,
          pageObject,
        })
        const node = getFirstByViewTag('microphone')
        expect(pageObject.micOn).to.be.false
        node.click()
        await waitFor(() => {
          expect(pageObject.micOn).to.be.true
        })
      })

      xit(`should turn the local audio tracks off`, () => {
        //
      })

      xit(`should return the local audio tracks on`, () => {
        //
      })
    })

    describe(`toggleCameraOnOff`, () => {
      xit(`should change the value on the sdk to off`, () => {
        //
      })

      xit(`should change the value on the sdk to on`, () => {
        //
      })

      xit(`should turn the local video tracks off`, () => {
        //
      })

      xit(`should return the local video tracks on`, () => {
        //
      })
    })

    u.entries(createBuiltIns({} as any)).forEach((obj) => {
      const [funcName, fn] = obj as [
        keyof ReturnType<typeof createBuiltIns>,
        Store.BuiltInObject['fn'],
      ]
      //
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

      if (actionType === 'evalObject') {
        const component = Array.from(app.nui.cache.component.get())[0][1]
        const spy2 = sinon.spy(component.get('onClick'), 'execute')
        const node = document.querySelector('button')
        node?.click()
        await waitFor(() => {
          expect(spy).to.be.calledOnce
          expect(spy2).to.be.calledOnce
        })
      }
    })
  })

  triggers.forEach((trigger) => {
    xit(`should only call the ${magenta(trigger)} emit callback once`, () => {
      if (trigger === 'onClick') {
        //
      }
    })
  })
})
