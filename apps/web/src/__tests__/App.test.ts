import m from 'noodl-test-utils'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import { nuiEmitTransaction, NDOMPage, Viewport } from 'noodl-ui'
import { initializeApp } from './test-utils'
import { createInstance } from '../app/noodl'
import App from '../App'
import createActions from '../handlers/actions'
import createBuiltIns from '../handlers/builtIns'
import createRegisters from '../handlers/register'
import createExtendedDOMResolvers from '../handlers/dom'

describe.only(`App`, () => {
  describe(`use`, () => {
    it(`should set lvl 3 sdk`, () => {
      const app = new App()
      const lvl3 = createInstance({
        env: 'stable',
        configUrl: `https://public.aitmed.com/config/patient.yml`,
        overwrite: true,
      })
      expect(app.noodl).to.be.null
      app.use(lvl3)
      expect(app.noodl).to.eq(lvl3)
    })
  })

  it(`should be able to create the instance without args`, () => {
    expect(() => new App()).to.not.throw()
  })

  it(`should be able to initialize without failing`, () => {
    expect(new App().initialize())
  })

  describe(`Instantiating`, () => {
    it('should initiate the viewport', async () => {
      const app = await initializeApp()
      expect(app.viewport).to.be.instanceOf(Viewport)
      expect(app.viewport.width).not.to.be.undefined
      expect(app.viewport.height).not.to.be.undefined
    })

    it(`should initiate the main NOODLDOM page`, async () => {
      const app = await initializeApp()
      expect(app.mainPage).to.be.instanceOf(NDOMPage)
      expect(app.mainPage.viewport).to.eq(app.viewport)
    })
  })

  describe(`initialize`, () => {
    it(
      `should register the ${nuiEmitTransaction.REQUEST_PAGE_OBJECT} ` +
        `transaction callback`,
      async () => {
        const spy = sinon.spy()
        const app = await initializeApp()
        app.ndom.use({
          transaction: {
            [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: spy,
          },
        })
        expect(
          app.ndom.transactions.has(nuiEmitTransaction.REQUEST_PAGE_OBJECT),
        ).to.be.true
      },
    )

    xdescribe(`noodl actions (excluding builtIns)`, () => {
      u.entries(createActions({} as any)).forEach(([actionType, fn]) => {
        it(`should attach at least one handler for the actionType to the store`, async () => {
          const app = await initializeApp()
          if (actionType === 'emit') {
            u.entries(fn).forEach(([trigger, f]) => {
              expect(app.nui.cache.actions.emit.has(trigger as any)).to.be.true
              expect(
                app.nui.cache.actions.emit.get(trigger as any),
              ).to.have.lengthOf(1)
            })
          }
        })
      })
    })

    xdescribe(`noodl builtIns`, () => {
      u.entries(
        createBuiltIns({
          actionFactory: { createBuiltInHandler: () => {} },
        } as any),
      ).forEach(([funcName, fn]) => {
        it(`should attach the builtIn "funcName" to the store`, async () => {
          const app = await initializeApp()
          expect(app.nui.cache.actions.builtIn.has(funcName)).to.be.true
          expect(app.nui.cache.actions.builtIn.get(funcName)).to.have.lengthOf(
            1,
          )
        })
      })
    })

    describe(`extended DOM resolvers`, () => {
      createExtendedDOMResolvers({} as any).forEach((obj) => {
        it(`should attach the extended DOM resolver ${obj.name} to the list of DOM resolvers`, async () => {
          const app = await initializeApp()
          expect(app.ndom.consumerResolvers).to.satisfy((objs: any) =>
            objs.some((r: any) => r.name === obj.name),
          )
        })
      })
    })

    describe(`noodl registers`, () => {
      u.entries(new createRegisters({} as any).registrees).forEach(
        ([fnName, obj]) => {
          it(`should register the "${obj.name}" object to the register store`, async () => {
            const app = await initializeApp()
            expect(app.ndom.cache.register.has(obj['name']))
          })
        },
      )
    })
  })

  describe(`navigate`, () => {
    xit(``, async () => {
      const app = await initializeApp({
        pageName: 'SignIn',
        root: {
          SignIn: { components: [m.button()] },
          Cereal: { components: [m.label()] },
          Paper: { components: [m.divider()] },
        },
      })
      await app.navigate('Cereal')
    })
  })
})
