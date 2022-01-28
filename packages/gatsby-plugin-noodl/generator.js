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
const fs = require('fs-extra')
const path = require('path')
const babel = require('@babel/core')
const { NUI, Transformer } = require('noodl-ui')

const nui = NUI
const { parse, traverse, types: t, transformFromAstAsync } = babel

/**
 * Returns the path to the EventTarget file so it can be patched
 * @returns { string }
 */
function getPathToEventTargetFile() {
  return path.resolve(
    path.join(
      process.cwd(),
      '../../node_modules/jsdom/lib/jsdom/living/generated/EventTarget.js',
    ),
  )
}

/**
 * @typedef { import('noodl-ui').NuiComponent.Instance } NuiComponent
 * @typedef { import('noodl-ui').Page } NuiPage
 * @typedef { import('@babel/traverse').NodePath } NodePath
 *
 * @typedef { object } On
 * @property { (args: { nui: import('noodl-ui').NUI, pageName: string, pageObject: nt.PageObject; sdk: import('@aitmed/cadl').CADL  }) => void } On.initPage
 * @property { object } On.patch
 * @property { function } On.patch.addEventListener
 * @property { function } On.patch.removeEventListener
 *
 * @typedef Use
 * @property { nt.RootConfig } [Use.config]
 * @property { nt.AppConfig } [Use.appConfig]
 * @property { Record<string, Record<string, nt.PageObject>> } [Use.pages]
 * @property { { width: number; height: number } } [Use.viewport]
 */

/**
 * addEventListener is preving sdk from sandboxing.
 * We must monkey patch the EventTarget
 * @argument { object } opts
 * @param { On['patch'] } opts.onPatch
 * @returns { Promise<{ components: NuiComponent.Instance[]; nui: typeof NUI }> }
 */
async function monkeyPatchAddEventListener(opts) {
  try {
    const code = await fs.readFile(getPathToEventTargetFile(), 'utf8')
    const ast = parse(code)

    /**
     * Returns true if this node is the wrapper that encapsulates the declaration of class EventTarget
     * @argument { NodePath } p
     */
    function isExportsStatementWrappingEventTarget(p) {
      if (t.isAssignmentExpression(p.node.expression)) {
        /** @type { t.AssignmentExpression } */
        const { left, right, operator } = p.node.expression
        return (
          operator === '=' &&
          t.isMemberExpression(left) &&
          t.isIdentifier(left.object) &&
          t.isIdentifier(left.property) &&
          left.object.name === 'exports' &&
          left.property.name === 'install' &&
          t.isArrowFunctionExpression(right)
        )
      }
    }

    /**
     * @argument { t.ArrowFunctionExpression } expr
     * @returns { t.ClassDeclaration  }
     */
    function getEventTargetClassStatement(expr) {
      if (t.isBlockStatement(expr.body)) {
        return expr.body.body.find((statement) =>
          t.isClassDeclaration(statement),
        )
      }
      return null
    }

    /**
     * @argument { t.ClassDeclaration } node
     * @argument { string } name
     */
    function getClassMethod(node, name) {
      if (t.isClassBody(node.body)) {
        return node.body.body.find(
          (o) => t.isClassMethod(o) && o.key.name === name,
        )
      }
      return null
    }

    /**
     * @argument { t.ClassMethod } node
     */
    function isMethodPatched(node) {
      return (
        t.isBlockStatement(node.body) && t.isReturnStatement(node.body.body[0])
      )
    }

    let eventListenersWerePatched = true

    traverse(ast, {
      ExpressionStatement(p) {
        if (isExportsStatementWrappingEventTarget(p)) {
          const eventTargetClass = getEventTargetClassStatement(
            p.node.expression.right,
          )

          const addEventListenerMethod = getClassMethod(
            eventTargetClass,
            'addEventListener',
          )
          const removeEventListenerMethod = getClassMethod(
            eventTargetClass,
            'removeEventListener',
          )

          for (const [evtName, method] of [
            ['addEventListener', addEventListenerMethod],
            ['removeEventListener', removeEventListenerMethod],
          ]) {
            if (isMethodPatched(method)) {
              opts?.onPatch?.[evtName]?.({ wasPatched: true })
            } else {
              eventListenersWerePatched = false
              opts?.onPatch?.[evtName]?.({ wasPatched: false })
              if (t.isBlockStatement(method.body)) {
                method.body.body.unshift(t.returnStatement())
              }
            }
          }

          return p.stop()
        }
      },
    })

    if (!eventListenersWerePatched) {
      const result = await transformFromAstAsync(ast)
      await fs.writeFile(getPathToEventTargetFile(), result.code, 'utf8')
      return result
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

/**
 * @param { object } opts
 * @param { string } [opts.configUrl]
 * @param { string } [opts.configKey]
 * @param { string } [opts.ecosEnv]
 * @param { Use } [opts.use]
 * @param { On } [opts.on]
 * @returns { Promise<{ components: nt.ComponentObject[]; nui: typeof NUI; page: NuiPage; sdk: CADL; pages: Record<string, nt.PageObject>; transform: (componentProp: nt.ComponentObject, options: import('noodl-ui').ConsumerOptions) => Promise<NuiComponent.Instance> }> }
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
    const { CADL } = require('@aitmed/cadl')

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
          await sdk.initPage(pageName, [], { wrapEvalObjects: false })
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

    return {
      nui: NUI,
      page,
      pages,
      sdk,
      transform,
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

module.exports = {
  getGenerator,
  monkeyPatchAddEventListener,
}
