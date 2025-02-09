import * as u from '@jsmanifest/utils'
import axios from 'axios'
import * as nu from 'noodl-utils'
import type { BuiltIns } from 'noodl-core'
import y from 'yaml'
import App from '../App'
import { extendedSdkBuiltIns } from './builtIns'
import log from '../log'

export function getSdkHelpers(app: App) {
  const initPageBuiltIns = {
    async fetch(dataIn: string) {
      try {
        const response = await axios.get(dataIn)
        log.log(`=.builtIn.fetch response data`, response.data)
        return response.data
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        log.error(err)
        return err
      }
    },
    toString(str: string) {
      log.log({ args: arguments })

      return String(str).toLowerCase()
    },
    EcosObj: {
      get download() {
        return extendedSdkBuiltIns.download
      },
      get exportCSV() {
        return app.builtIns.get('exportCSV')?.find(Boolean)?.fn
      },
      get exportPDF() {
        return app.builtIns.get('exportPDF')?.find(Boolean)?.fn
      },
    },
    thirdPartyRequest: {
      get signInWithGoogle() {
        return extendedSdkBuiltIns.signInWithGoogle
      },
      get signInWithApple() {
        return extendedSdkBuiltIns.signInWithApple
      },
    },
    get downloadQRCode() {
      return extendedSdkBuiltIns.downloadQRCode
    },
    async FCMOnTokenReceive(params?: any) {
      // Returns the token
      return app.nui.emit({
        type: 'register',
        event: 'FCMOnTokenReceive',
        params,
      })
    },
    get FCMOnTokenRefresh() {
      return app.notification?.supported
        ? app.notification.messaging?.onTokenRefresh.bind(
            app.notification.messaging,
          )
        : undefined
    },
    get checkField() {
      return app.builtIns.get('checkField')?.find(Boolean)?.fn
    },
    get goto() {
      return app.builtIns.get('goto')?.find(Boolean)?.fn
    },
    get hide() {
      return app.builtIns.get('hide')?.find(Boolean)?.fn
    },
    get show() {
      return app.builtIns.get('show')?.find(Boolean)?.fn
    },
    get toast() {
      return app.builtIns.get('toast')?.find(Boolean)?.fn
    },
    get redraw() {
      return app.builtIns.get('redraw')?.find(Boolean)?.fn
    },
    get switchCamera() {
      return app.builtIns.get('switchCamera')?.find(Boolean)?.fn
    },
    get redrawCurrent() {
      return app.builtIns.get('redrawCurrent')?.find(Boolean)?.fn
    },
    get videoChat() {
      return extendedSdkBuiltIns.videoChat.bind(app)
    },
    get callPhone() {
      return extendedSdkBuiltIns.callPhone.bind(app)
    },
    get initExtend() {
      return extendedSdkBuiltIns.initExtend.bind(app)
    },
    get routeRediredct() {
      return app.builtIns.get('routeRediredct')?.find(Boolean)?.fn
    },
    get initAutoDC() {
      return extendedSdkBuiltIns.initAutoDC.bind(app)
    },
    get extendMeeting() {
      return app.builtIns.get('extendMeeting')?.find(Boolean)?.fn
    },
    get delayTask() {
      return app.builtIns.get('delayTask')?.find(Boolean)?.fn
    },
    get countDown() {
      return app.builtIns.get('countDown')?.find(Boolean)?.fn
    },
    get getViewTagValue() {
      return app.builtIns.get('getViewTagValue')?.find(Boolean)?.fn
    },
    async diagnostics(
      dataIn:
        | string
        | {
            config: string
            filter?: string[] | string
          },
    ) {
      try {
        let configKey = dataIn
        let filter: RegExp | undefined

        if (u.isStr(dataIn)) {
          configKey = dataIn
        } else if (u.isObj(dataIn)) {
          configKey = dataIn.config
          if (dataIn.filter) {
            filter = new RegExp(
              u.isArr(dataIn.filter) ? dataIn.filter.join('|') : dataIn.filter,
              'i',
            )
          }
        }

        const createFetcherWithBaseUrl =
          (baseUrl: string) => async (pathname: string) =>
            (
              await axios.get(pathname, {
                baseURL: baseUrl,
              })
            ).data

        let configUrl = `http://127.0.0.1:3000/analysis/${configKey}/${configKey}.yml`
        let rootConfigYml = ''
        // let configUrl = `https://public.aitmed.com/config/${configKey}.yml`

        try {
          rootConfigYml = (await axios.get(configUrl)).data
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          const is404 = axios.isAxiosError(err) && err.response?.status === 404
          if (is404) {
            log.error(
              `The endpoint using config "${configKey}" at ${configUrl} returned a 404. Falling back to look locally now`,
              err,
            )
            rootConfigYml = (
              await axios.get(`/analysis/${configKey}/${configKey}.yml`)
            ).data
          } else {
            log.error(err)
          }
        }

        const {
          assertBuiltIn,
          assertRef,
          assertGoto,
          assertPopUpView,
          assertViewTag,
          DocDiagnostics,
          DocRoot,
          DocVisitor,
          getYamlNodeKind,
          toDoc,
          toYml,
          unwrap,
        } = await import('noodl-yaml')
        const { getInstance } = await import('../app/noodl')

        const docDiagnostics = new DocDiagnostics()
        const docRoot = new DocRoot()
        const docVisitor = new DocVisitor()
        const sdk = getInstance({
          configUrl,
        })

        window['docDiagnostics'] = docDiagnostics
        window['docRoot'] = docRoot
        window['sdk2'] = sdk

        docRoot.set('Config', toDoc(rootConfigYml))
        docDiagnostics.mark('rootConfig', configKey)
        docDiagnostics.mark('appConfig', 'cadlEndpoint')

        const rootDoc = docRoot.get('Config') as y.Document
        const buildInfo = window['build'] || {}

        const replaceNoodlPlaceholders = nu.createNoodlPlaceholderReplacer({
          cadlBaseUrl: rootDoc?.get('cadlBaseUrl', false),
          cadlVersion: rootDoc?.getIn?.(
            ['web', 'cadlVersion', buildInfo?.ecosEnv || ''],
            false,
          ),
          designSuffix: '',
        })

        const baseUrl = replaceNoodlPlaceholders(rootDoc?.get?.('cadlBaseUrl'))
        const fetchYml = createFetcherWithBaseUrl(baseUrl)
        const appDoc = toDoc(await fetchYml(rootDoc?.get?.('cadlMain') as any))

        const loadYmlsBySdk = async (type: 'page' | 'preload') => {
          await sdk.init({ pageSuffix: '' })
          let { preload = [], page: pages = [] } = sdk.cadlEndpoint || {}
          let arr = type === 'page' ? pages : preload
          await Promise.all(
            arr.map(async (page: string) => {
              try {
                page = unwrap(page)
                docDiagnostics.mark(type, page)
                await sdk.initPage(page, [], {
                  builtIn: {
                    ...initPageBuiltIns,
                    goto: () => {},
                    videoChat: () => {},
                  },
                  pageSuffix: '',
                })
                const doc = new y.Document(
                  sdk.root[page],
                ) as y.Document<y.YAMLMap>
                if (type === 'preload') {
                  if (y.isMap(doc.contents)) {
                    doc.contents?.items.forEach((pair) => {
                      docRoot.set(pair.key as y.Scalar, pair.value)
                    })
                  }
                } else {
                  docRoot.set(page, doc)
                }
              } catch (error) {
                log.error(
                  error instanceof Error ? error : new Error(String(error)),
                )
              }
            }),
          )
        }

        const loadYmls = async (type: 'page' | 'preload') => {
          const { preload = [], page: pages = [] } = appDoc?.toJSON?.() || {}
          let arr = type === 'page' ? pages : preload

          await Promise.all(
            arr.map(async (page: string) => {
              try {
                page = unwrap(page)
                docDiagnostics.mark(type, page)
                const pathname = `/${page}_en.yml`
                const yml = await fetchYml(pathname)
                const doc = toDoc(yml) as y.Document<y.YAMLMap>
                if (doc.has(page)) doc.contents = doc.contents?.get(page) as any
                if (type === 'preload') {
                  if (y.isMap(doc.contents)) {
                    doc.contents?.items.forEach((pair) => {
                      docRoot.set(pair.key as y.Scalar, pair.value)
                    })
                  }
                } else {
                  docRoot.set(page, doc)
                }
              } catch (error) {
                log.error(
                  error instanceof Error ? error : new Error(String(error)),
                )
              }
            }),
          )
        }

        await Promise.all([loadYmlsBySdk('preload'), loadYmlsBySdk('page')])
        // await Promise.all([loadYmls('preload'), loadYmls('page')])

        docDiagnostics.use(docRoot)
        docDiagnostics.use(docVisitor)

        const diagnostics = docDiagnostics
          .run({
            asserters: [
              assertBuiltIn,
              assertRef,
              assertGoto,
              assertPopUpView,
              assertViewTag,
            ],
            // @ts-expect-error
            builtIn: {
              normalize: (dataIn, args) => {
                if (
                  y.isNode(dataIn) ||
                  y.isPair(dataIn) ||
                  y.isDocument(dataIn)
                ) {
                  y.visit(dataIn, (k, n) => {
                    return [
                      assertBuiltIn,
                      assertRef,
                      assertGoto,
                      assertPopUpView,
                      assertViewTag,
                    ]
                      .find((f) => f.cond(getYamlNodeKind(n), n))
                      ?.fn?.({
                        ...args,
                        key: k,
                        node: n,
                      })
                  })
                }
                return dataIn.toJSON()
              },
              ...app.noodl.root.builtIn,
            } as BuiltIns,
          })
          .map((diagnostic) => diagnostic.toJSON())

        log.log(diagnostics)

        return diagnostics
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    },
    get handlePaymentMethodSubmission() {
      return extendedSdkBuiltIns.handlePaymentMethodSubmission.bind(app)
    },
    get popUp() {
      return extendedSdkBuiltIns.popUp.bind(app)
    },
    get popUpDismiss() {
      return extendedSdkBuiltIns.popUpDismiss.bind(app)
    },
    get continueGoto() {
      return extendedSdkBuiltIns.continueGoto.bind(app)
    },
  }

  return {
    initPageBuiltIns,
  }
}
