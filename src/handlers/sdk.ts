import * as u from '@jsmanifest/utils'
import axios from 'axios'
import * as nu from 'noodl-utils'
import y from 'yaml'
import App from '../App'
import { extendedSdkBuiltIns } from './builtIns'

export function getSdkHelpers(app: App) {
  const initPageBuiltIns = {
    async fetch(dataIn: string) {
      try {
        const response = await axios.get(dataIn)
        console.log(`=.builtIn.fetch response data`, response.data)
        return response.data
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error(err)
        return err
      }
    },
    toString(str: string) {
      console.log({ args: arguments })

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
    get redraw() {
      return app.builtIns.get('redraw')?.find(Boolean)?.fn
    },
    get videoChat() {
      return extendedSdkBuiltIns.videoChat.bind(app)
    },
    get initExtend() {
      return extendedSdkBuiltIns.initExtend.bind(app)
    },
    get extendMeeting() {
      return app.builtIns.get('extendMeeting')?.find(Boolean)?.fn
    },
    async diagnostics(dataIn: string) {
      try {
        console.log(`[request] dataIn`, dataIn)

        const configKey = dataIn
        const data = {}

        const createFetcherWithBaseUrl =
          (baseUrl: string) => async (pathname: string) =>
            (
              await axios.get(pathname, {
                baseURL: baseUrl,
              })
            ).data

        let rootConfigYml = ''
        let configUrl = `https://public.aitmed.com/config/${configKey}.yml`

        try {
          rootConfigYml = (await axios.get(configUrl)).data
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          const is404 = axios.isAxiosError(err) && err.response?.status === 404
          if (is404) {
            // Fallback to loading locally
            console.error(
              `The endpoint using config "${configKey}" at ${configUrl} returned a 404. ` +
                `Falling back to look locally now`,
              err,
            )
            rootConfigYml = (await axios.get(`/${configKey}.yml`)).data
            // rootConfigYml = (await axios.get(`/${configKey}.yml`)).data
          } else {
            console.error(err)
          }
        }

        const {
          assertRef,
          DocDiagnostics,
          DocRoot,
          DocVisitor,
          is,
          toDoc,
          unwrap,
        } = await import('@noodl/yaml')

        const docDiagnostics = new DocDiagnostics()
        const docRoot = new DocRoot()
        const docVisitor = new DocVisitor()

        docRoot.set('Config', docRoot.toDocument(rootConfigYml))

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
        const { preload = [], page: pages = [] } = appDoc.toJSON?.() || {}

        const loadYmls = async (type: 'page' | 'preload') => {
          let arr = type === 'page' ? pages : preload

        const { preload = [], page: pages = [] } = appDoc.toJSON?.() || {}

          await Promise.all(
            arr.map(async (page: string) => {
              try {
                docDiagnostics.mark(type, page)
                page = unwrap(page)
                const pathname = `${page}_en.yml`
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
                console.error(
                  error instanceof Error ? error : new Error(String(error)),
                )
              }
              if (y.isMap(doc.contents)) {
                doc.contents?.items.forEach((pair) => {
                  docRoot.set(unwrap(pair.key), pair.value)
                })
              }
            } catch (error) {
              const err =
                error instanceof Error ? error : new Error(String(error))
              console.error(err)
            }
          }),
        )

        await Promise.all(
          pages.map(async (page) => {
            try {
              page = unwrap(page)
              const pathname = `${page}_en.yml`
              const yml = await fetchYml(pathname)
              const doc = docRoot.toDocument(yml)
              if (doc.has(page)) doc.contents = doc.contents?.get(page)
              docRoot.set(page, doc)
            } catch (error) {
              const err =
                error instanceof Error ? error : new Error(String(error))
              console.error(err)
            }
          }),
        )

        docDiagnostics.use(docRoot)
        docDiagnostics.use(docVisitor)

        const assertRef = ({ add, node, page, root }) => {
          const derefed = deref({ node: node, root, rootKey: page })
          const isLocal = coreIs.localReference(derefed.reference)

          if (typeof derefed.value === 'undefined') {
            const locLabel = isLocal ? 'Local' : 'Root'
            const using = isLocal ? ` using root key '${page}'` : ''

            add({
              node,
              messages: [
                {
                  type: consts.ValidatorType.ERROR,
                  message: `${locLabel} reference '${derefed.reference}' was not resolvable${using}`,
                },
              ],
              page,
              ...derefed,
            })
          } else {
            node.value = derefed.value
            return node
          }
        }

        const visitedPages = [] as string[]
        const diagnostics = (
          await docDiagnostics.run({
            enter: ({
              add,
              data,
              key,
              name: page,
              value: node,
              root,
              path,
            }) => {
              if (page && !visitedPages.includes(page)) visitedPages.push(page)
              if (is.scalarNode(node)) {
                if (is.reference(node)) {
                  return assertRef({ add, node, page, root })
                }
              }
            },
          })
        ).map((diagnostic) => diagnostic.toJSON())

        console.log(diagnostics)

        return diagnostics
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        throw err
      }
    },
  }

  return {
    initPageBuiltIns,
  }
}
