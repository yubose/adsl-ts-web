import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import CADL from '@aitmed/cadl'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { nuiEmitTransaction, NUI, Viewport, Store } from 'noodl-ui'
import { Page as NOODLDOMPage } from 'noodl-ui-dom'
import { initializeApp, ndom } from '../utils/test-utils'
import App from '../App'
import createActions from '../handlers/actions'
import createBuiltIns from '../handlers/builtIns'
import createRegisters from '../handlers/register'
import createExtendedDOMResolvers from '../handlers/dom'
import * as u from '../utils/common'

describe(coolGold(`App`), () => {
  describe(italic(`Instantiating`), () => {
    it('should initiate the viewport', async () => {
      const app = await initializeApp()
      expect(app.viewport).to.be.instanceOf(Viewport)
      expect(app.viewport.width).not.to.be.undefined
      expect(app.viewport.height).not.to.be.undefined
    })

    it(`should initiate the main NOODLDOM page`, async () => {
      const app = await initializeApp()
      expect(app.mainPage).to.be.instanceOf(NOODLDOMPage)
      expect(app.mainPage.viewport).to.eq(app.viewport)
    })
  })

  describe(italic(`initialize`), () => {
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

    describe(`noodl actions (excluding builtIns)`, () => {
      u.entries(createActions({} as any)).forEach(([actionType, fn]) => {
        it(`should attach at least one handler for the ${magenta(
          actionType,
        )} to the store`, async () => {
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

    describe(`noodl builtIns`, () => {
      u.entries(createBuiltIns({} as any)).forEach(([funcName, fn]) => {
        it(`should attach the builtIn "${magenta(
          funcName,
        )}" to the store`, async () => {
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
        it(`should attach the extended DOM resolver ${magenta(
          obj.name,
        )} to the list of DOM resolvers`, async () => {
          const app = await initializeApp()
          expect(app.ndom.resolvers()).to.satisfy((objs: any) =>
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
      createRegisters({} as any).forEach((obj) => {
        it(`should register the "${magenta(obj.name)}" object`, async () => {
          const app = await initializeApp()
          expect(app.ndom.cache.register.has(obj.name))
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
})
