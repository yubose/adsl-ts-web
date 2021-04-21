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
import { initializeApp, ndom } from '../utils/test-utils'
import App from '../App'
import createActions from '../handlers/actions'
import createBuiltIns from '../handlers/builtIns'
import createRegisters from '../handlers/register'
import createExtendedDOMResolvers from '../handlers/dom'
import * as u from '../utils/common'

const nonEmitBuiltInActionTypes = nuiActionTypes.filter(
  (t) => !/(builtIn|emit|register)/.test(t),
) as Exclude<NUIActionType, 'builtIn' | 'emit' | 'register'>[]

const getApp = async ({
  navigate,
  pageName = 'Hello',
  ...opts
}: Partial<Parameters<typeof initializeApp>[0]> & {
  navigate?: boolean
  pageName?: string
} = {}) => {
  const app = await initializeApp({
    pageName,
    room: { state: 'connected' },
    ...opts,
  })
  if (navigate) await app.navigate(pageName)
  return app
}

describe(coolGold(`Noodl actions`), () => {
  describe(italic(`builtIns`), () => {
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
