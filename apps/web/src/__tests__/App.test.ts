import * as m from 'noodl-test-utils'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import { nuiEmitTransaction, NUI, NDOMPage, Viewport, Store } from 'noodl-ui'
import { initializeApp, ndom } from '../utils/test-utils'
import getMockMeetingChat from './helpers/mockMeetingChat/getMockMeetingChat'
import App from '../App'
import { createInstance } from '../app/noodl'
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

    describe(`noodl plugins`, () => {
      xit(`should register the plugins from the config if available`, () => {
        //
      })
    })

    describe(`noodl registers`, () => {
      const onNewEcosDocObject = m.getRegisterComponent({
        onEvent: 'onNewEcosDoc',
        emit: m.getEmitObject({
          dataKey: { var: 'ecosDocOj' },
          actions: [],
        }),
      })

      describe(`when working with noodl.root.Global.globalRegister`, () => {
        it(``, () => {
          getMockMeetingChat()
        })
      })

      createRegisters({} as any).forEach((obj) => {
        it(`should register the "${obj.name}" object to the register store`, async () => {
          const app = await initializeApp()
          expect(app.ndom.cache.register.has(obj['name']))
        })
      })
    })

    xit(`should initialize the meeting state`, () => {
      //
    })

    describe(`Rehydrating cached pages`, () => {
      describe(`when there are items in the list of cached pages`, () => {
        xit(`should initiate the startPage to the cached page`, () => {
          //
        })

        xit(
          `should set a new key/value in localStorage representing the ` +
            `timestamp the config was last retrieved if the key/value ` +
            `doesn't exist yet`,
          () => {
            //
          },
        )

        describe(
          `when the config timestamp is different than the locally ` +
            `stored timestamp`,
          () => {
            xit(`should reset the CACHED_PAGES state back to an empty list`, () => {
              //
            })

            xit(`should set the pageUrl to the base state`, () => {
              //
            })
          },
        )

        describe(
          `when there is no stored timestamp OR the stored timestamp ` +
            `is the same as the one in the config's timestamp`,
          () => {
            xit(
              `should set the startPage to the most recent page the ` +
                `user has accessed if any`,
              () => {
                //
              },
            )

            xit(
              `should set the startPage to the config's startPage if the ` +
                `user did not last access any pages`,
              () => {
                //
              },
            )
          },
        )
      })
    })

    xit(`should set app.initialized to true`, () => {
      //
    })
  })

  describe(`navigate`, () => {
    it(``, async () => {
      const app = await initializeApp({
        pageName: 'SignIn',
        root: {
          SignIn: { components: [m.getButtonComponent()] },
          Cereal: { components: [m.getLabelComponent()] },
          Paper: { components: [m.getDividerComponent()] },
        },
      })
      await app.navigate('Cereal')
    })
  })
})
