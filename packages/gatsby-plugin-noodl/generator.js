// eslint-disable-next-line
require('jsdom-global')('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: `https://127.0.0.1:3001`,
  beforeParse: (win) => {
    // eslint-disable-next-line
    localStorage = win.localStorage || global.localStorage
  },
})

const u = require('@jsmanifest/utils')
const { NUI, Transformer } = require('noodl-ui')
const monkeyPatchAddEventListener = require('./monkeyPatchAddEventListener')

const nui = NUI

/**
 * @typedef { import('noodl-ui').NuiComponent.Instance } NuiComponent
 * @typedef { import('noodl-ui').Page } NuiPage
 * @typedef { import('@babel/traverse').NodePath } NodePath
 *
 * @typedef { object } On
 * @property { import('./monkeyPatchAddEventListener').OnPatch } On.patch
 * @property { (args: { nui: import('noodl-ui').NUI, pageName: string, pageObject: nt.PageObject; sdk: import('@aitmed/cadl').CADL  }) => void } On.initPage

 *
 * @typedef Use
 * @property { nt.RootConfig } [Use.config]
 * @property { nt.AppConfig } [Use.appConfig]
 * @property { Record<string, Record<string, nt.PageObject>> } [Use.pages]
 * @property { { width: number; height: number } } [Use.viewport]
 */

/**
 * @param { object } opts
 * @param { string } [opts.configUrl]
 * @param { string } [opts.configKey]
 * @param { string } [opts.ecosEnv]
 * @param { Use } [opts.use]
 * @param { On } [opts.on]
 * @returns { Promise<{ cache: import('@aitmed/cadl')['cache']; components: nt.ComponentObject[]; nui: typeof NUI; page: NuiPage; sdk: CADL; pages: Record<string, nt.PageObject>; transform: (componentProp: nt.ComponentObject, options: import('noodl-ui').ConsumerOptions) => Promise<NuiComponent.Instance> }> }
 */
async function getGenerator({
  configKey = 'www',
  configUrl = `https://public.aitmed.com/config/${configKey}.yml`,
  ecosEnv = 'test',
  on,
  use = {},
} = {}) {
  try {
    // Patches the EventTarget so we can sandbox the sdk
    await monkeyPatchAddEventListener({
      onPatch: {
        addEventListener: on?.patch?.addEventListener,
        removeEventListener: on?.patch?.removeEventListener,
      },
    })

    // Intentionally using require
    const { cache, CADL } = require('@aitmed/cadl')

    const sdk = new CADL({ cadlVersion: ecosEnv, configUrl })
    await sdk.init()

    nui.use({
      getRoot: () => sdk.root,
      getAssetsUrl: () => sdk.assetsUrl,
      getBaseUrl: () => sdk.cadlBaseUrl,
      getPreloadPages: () => sdk.cadlEndpoint?.preload || [],
      getPages: () => sdk.cadlEndpoint?.page || [],
    })

    /**
     * @type { Record<string, nt.PageObject> }
     */
    const pages = {}

    // App pages
    await Promise.all(
      sdk.cadlEndpoint.page.map(async (pageName) => {
        try {
          if (sdk.cadlEndpoint.preload.includes(pageName)) {
            if (/^(Base[a-zA-Z0-9]+)/.test(pageName)) return
          }
          await sdk.initPage(pageName, ['listObject'], {
            wrapEvalObjects: false,
          })
          on?.initPage?.({ nui, pageName, pageObject: sdk.root[pageName], sdk })
          use.pages.json[pageName] = sdk.root[pageName]
          pages[pageName] = sdk.root[pageName]
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          pages[pageName] = {
            name: err.name,
            message: err.message,
            stack: err.stack,
          }
          console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
        }
      }),
    )

    // Fixes navbar to stay at the top
    if (u.isObj(sdk.root?.BaseHeader?.style)) {
      sdk.root.BaseHeader.style.top = '0'
    }

    const transformer = new Transformer()
    const page = nui.getRootPage()

    page.page = sdk.cadlEndpoint.startPage || ''
    page.viewport.width = use?.viewport?.width || 0
    page.viewport.height = use?.viewport?.height || 0

    /**
     * @argument { nt.ComponentObject } componentProp
     * @argument { import('noodl-ui').ConsumerOptions } [options]
     */
    async function transform(componentProp, options) {
      if (!componentProp) componentProp = {}
      const component = nui.createComponent(componentProp, page)

      await transformer.transform(
        component,
        nui.getConsumerOptions({ component, page, on, ...options }),
      )

      return component
    }

    return { cache, nui: NUI, page, pages, sdk, transform }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

module.exports = getGenerator
