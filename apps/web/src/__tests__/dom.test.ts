import m from 'noodl-test-utils'
import y from 'yaml'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import { cache as sdkCache, CADL, Account } from '@aitmed/cadl'
import userEvent from '@testing-library/user-event'
import nock from 'nock'
import sinon from 'sinon'
import { prettyDOM, screen, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { findByViewTag, findFirstByViewTag } from 'noodl-ui'
import {
  assetsUrl,
  baseUrl,
  getMostRecentApp,
  initializeApp,
  loadFixture,
  nui,
  ndom,
} from './test-utils'
import App from '../App'
import { createInstance, clearInstance } from '../app/noodl'
import * as c from '../constants'
import * as d from '../utils/dom'

let configKey = 'www'
let configUrl = `https://public.aitmed.com/config/${configKey}.yml`
let app: App
let lvl3: CADL
let iteratorVar = 'itemObject'
const mockProfiles = loadFixture('profiles.json') as {
  first_name: string
  last_name: string
  email: string
  id: string
  gender: string
  thumbnail: string
}[]

beforeEach(() => {
  clearInstance()
  lvl3 = createInstance({ configUrl, cadlVersion: 'test' })
  app = new App({
    noodl: lvl3,
    getStatus: Account.getStatus.bind(Account),
  })
})

describe.only(`DOM`, () => {
  let components: nt.ComponentObject[]
  let SignIn: nt.PageObject

  beforeEach(async () => {
    components = [
      m.view({
        children: [
          m.scrollView({
            children: [
              m.list({
                contentType: 'listObject',
                iteratorVar,
                listObject: mockProfiles,
                children: [
                  m.listItem({
                    [iteratorVar]: '',
                    children: [
                      m.image({
                        // path: 'fish.gif',
                        emit: m.emitObject({
                          dataKey: { var: iteratorVar },
                          actions: [
                            m.ifObject([
                              {
                                '=.builtIn.string.equal': {
                                  dataIn: {
                                    string1: '=..formData.profilePhoto',
                                    string2: 'fish.gif',
                                  },
                                },
                              },
                              'sugar.png',
                              'noimage.svg',
                            ]),
                          ],
                        }).emit,
                      }),
                      m.label({ dataKey: `${iteratorVar}.name` }),
                      m.view({
                        children: [
                          m.textField({ dataKey: `${iteratorVar}.name` }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ]
    SignIn = {
      init: [
        {
          '=.builtIn.fetch': {
            dataIn: 'http://127.0.0.1:3000/profiles.json',
            dataOut: '.SignIn.formData.profiles',
          },
        },
      ],
      formData: {
        profiles: mockProfiles,
        profilePhoto: 'fish.gif',
      },
      components,
    }

    nui.cache.actions.emit.set('path', [
      {
        actionType: 'emit',
        fn: async (action, options) => {
          return ['noimage.svg']
        },
        trigger: 'path',
      },
    ])

    nock(`https://public.aitmed.com/config`)
      .get(`/${configKey}.yml`)
      .reply(
        200,
        'apiHost: albh2.aitmed.io\napiPort: 443\ncadlMain: cadlEndpoint.yml\ncadlBaseUrl: http://127.0.0.1:3000/',
      )

    nock(`http://127.0.0.1:3000`)
      .get(`/cadlEndpoint.yml`)
      .reply(
        200,
        'assetsUrl: ${cadlBaseUrl}assets/\nbaseUrl: ${cadlBaseUrl}\npreload:\n  - BaseCSS\npage:\n  - SignIn\n  - Dashboard\nstartPage: SignIn',
      )

    nock(`http://127.0.0.1:3000`)
      .get(/BaseCSS/)
      .reply(200, 'Style:')

    nock(`http://127.0.0.1:3000`)
      .get(/SignIn/)
      .reply(200, y.stringify(SignIn))

    nock(`http://127.0.0.1:3000`)
      .get(/Dashboard/)
      .reply(200, 'Dashboard:\n  - components:')

    nock(`http://127.0.0.1:3000`).get('/profiles.json').reply(200, mockProfiles)
  })

  it(``, function (done) {
    try {
      this.timeout(25000)
      app.initialize().then(() => {
        console.dir(
          {
            componentCacheSize: app.cache.component.length,
            actionCacheSize: app.cache.actions.length,
            actionsStateSize: app.actions.state,
            builtInCacheSize: app.builtIns.size,
            registerCacheSize: app.cache.register.get().size,
            transactionCacheSize: app.cache.transactions.get().size,
            pluginCacheSize: app.cache.plugin.length,
            pageCacheSize: app.cache.page.length,
            globalCache: {
              pageIdsSize: app.ndom.global.pageIds.length,
              pagesSize: u.keys(app.ndom.global.pages).length,
              globalComponentsSize: app.ndom.global.components.size,
              globalRegistersSize: app.ndom.global.register.size,
              globalTImersSize: app.ndom.global.timers.get().size,
            },
            renderStateSize: ndom.renderState,
            appState: app.getState(),
            lvl3StateQueue: lvl3.getState().queue,
            componentCache: app.cache.component.get(),
          },
          { depth: Infinity },
        )
        done()
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  })
})
