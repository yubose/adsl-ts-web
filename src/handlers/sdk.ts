import * as u from '@jsmanifest/utils'
import axios from 'axios'
import * as nu from 'noodl-utils'
import y from 'yaml'
import App from '../App'
import { extendedSdkBuiltIns } from './builtIns'

export function getSdkHelpers(app: App) {
  const initPageBuiltIns = {
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

        try {
          rootConfigYml = (
            await axios.get(`https://public.aitmed.com/config/${configKey}.yml`)
          ).data
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          console.error(err)
        }

        const { consts, is: coreIs } = await import('@noodl/core')
        const { DocDiagnostics, DocRoot, DocVisitor, deref, is, unwrap } =
          await import('@noodl/yaml')

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

        const baseUrl = replaceNoodlPlaceholders(
          rootDoc?.get?.('cadlBaseUrl', false),
        )

        const fetchYml = createFetcherWithBaseUrl(baseUrl)

        const appDoc = docRoot.toDocument(
          await fetchYml(rootDoc?.get?.('cadlMain', false) as string),
        )

        // const assetsUrl = replaceNoodlPlaceholders(appConfig?.assetsUrl)

        const { preload = [], page: pages = [] } = appDoc.toJSON?.() || {}

        await Promise.all(
          preload.map(async (page) => {
            try {
              page = unwrap(page)
              const pathname = `${page}_en.yml`
              const yml = await fetchYml(pathname)
              const doc = docRoot.toDocument(yml)
              if (doc.contents?.has(page)) {
                doc.contents = doc.contents.get(page)
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
