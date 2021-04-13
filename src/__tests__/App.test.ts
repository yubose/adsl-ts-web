import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import CADL from '@aitmed/cadl'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { nuiEmitTransaction, NUI, Viewport } from 'noodl-ui'
import { Page as NOODLDOMPage } from 'noodl-ui-dom'
import { initializeApp, ndom } from '../utils/test-utils'
import createActions from '../handlers/actions'
import createBuiltIns from '../handlers/builtIns'
import createRegisters from '../handlers/register'
import createExtendedDOMResolvers from '../handlers/dom'

beforeEach(() => {
  ndom.reset()
})

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
    xit(`should initialize the noodl SDK`, () => {
      //
    })

    it(
      `should register the ${nuiEmitTransaction.REQUEST_PAGE_OBJECT} ` +
        `transaction callback`,
      async () => {
        const app = await initializeApp()
        expect(app.ndom.transactions).to.have.property(
          nuiEmitTransaction.REQUEST_PAGE_OBJECT,
        )
      },
    )

    // createActions({} as any).action((obj) => {
    //   it(`should attach at least one handler for the ${magenta(
    //     obj.actionType,
    //   )} to the store`, async () => {
    //     let app = await initializeApp()
    //     let exists = false
    //     for (const aObj of Object.values(app.ndom.actions)) {
    //       if (aObj.length) {
    //         exists = true
    //         break
    //       }
    //     }
    //     expect(exists).to.be.true
    //   })
    // })

    createBuiltIns({} as any).forEach((obj) => {
      it(`should attach at least one handler for the builtIn function ${magenta(
        obj.funcName,
      )} to the store`, async () => {
        let app = await initializeApp()
        let exists = false
        for (const aObj of Object.values(app.ndom.builtIns)) {
          if (aObj.length) {
            exists = true
            break
          }
        }
        expect(exists).to.be.true
      })
    })

    createExtendedDOMResolvers({} as any).forEach((obj) => {
      it(`should attach the extended DOM resolver ${magenta(
        obj.name,
      )} to the list of DOM resolvers`, async () => {
        let app = await initializeApp()
        let exists = false
        for (const rObj of Object.values(app.ndom.resolvers())) {
          if (rObj.name === obj.name) {
            exists = true
            break
          }
        }
        expect(exists).to.be.true
      })
    })

    createRegisters({} as any).forEach((obj) => {
      it(`should attach the register object ${magenta(
        obj.name,
      )} to the register cache`, async () => {
        let app = await initializeApp()
        let exists = false
        for (const [page, o] of app.ndom.cache.register.get()) {
          if (
            app.ndom.cache.register.has(page, obj.name) &&
            (obj.name as string) in o
          ) {
            exists = true
            break
          }
        }
        expect(exists).to.be.true
      })
    })

    xit(`should register all of the register events`, () => {
      //
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
