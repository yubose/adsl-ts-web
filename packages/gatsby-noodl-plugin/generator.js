require('jsdom-global')('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: `https://127.0.0.1:3001`,
  beforeParse: (win) => {
    localStorage = win.localStorage || global.localStorage
  },
})

const nt = require('noodl-types')
const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')
const babel = require('@babel/core')
const y = require('yaml')
const has = require('lodash/has')
const get = require('lodash/get')
const set = require('lodash/set')
const { NUI, Transformer } = require('noodl-ui')

const nui = NUI
const { parse, traverse, types: t, transformFromAstAsync } = babel

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
 * @typedef { import('noodl-ui').On } NuiOn
 * @typedef { import('noodl-ui').Page } NuiPage
 * @typedef { import('noodl-ui').Viewport } NuiViewport
 * @typedef { import('@babel/traverse').Node } Node
 * @typedef { import('@babel/traverse').NodePath } NodePath
 * @typedef { object } On
 * @property { NuiOn['createComponent'] } On.createComponent
 * @property { object } On.patch
 * @property { function } On.patch.addEventListener
 * @property { function } On.patch.removeEventListener
 *
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
 * @typedef Use
 * @property { nt.RootConfig } [Use.config]
 * @property { nt.AppConfig } [Use.appConfig]
 * @property { Record<string, any> } [Use.pages.preload]
 * @property { Record<string, nt.PageObject> } [Use.pages.app]
 * @property { { width: number; height: number } } [Use.viewport]
 */

/**
 * @param { object } opts
 * @param { string } [opts.configUrl]
 * @param { string } [opts.configKey]
 * @param { string } [opts.ecosEnv]
 * @param { string } [opts.startPage]
 * @param { Use } [opts.use]
 * @param { On } [opts.on]
 * @param { NuiViewport } [opts.viewport]
 * @returns { Promise<{ components: nt.ComponentObject[]; getGoto: function; nui: typeof NUI; page: NuiPage; sdk: CADL; pages: Record<string, nt.PageObject>; transform: (componentProp: nt.ComponentObject, index?: number) => Promise<NuiComponent.Instance> }> }
 */
async function getGenerator({
  configUrl,
  configKey = 'www',
  ecosEnv = 'test',
  on,
  startPage = 'HomePage',
  use,
  viewport = { width: 1024, height: 768 },
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

    const sdk = new CADL({
      cadlVersion: ecosEnv,
      configUrl:
        configUrl || `https://public.aitmed.com/config/${configKey}.yml`,
    })

    await sdk.init({
      use: {
        ...use?.pages?.preload,
        config: use?.config,
        cadlEndpoint: use?.appConfig,
      },
    })

    // Fixes navbar to stay at the top
    if (u.isObj(sdk.root?.BaseHeader?.style)) {
      sdk.root.BaseHeader.style.top = '0'
    }

    nui.use({
      getRoot: () => sdk.root,
      getAssetsUrl: () => sdk.assetsUrl,
      getBaseUrl: () => sdk.cadlBaseUrl,
      getPreloadPages: () => sdk.cadlEndpoint?.preload || [],
      getPages: () => sdk.cadlEndpoint?.page || [],
    })

    /**
     * @type { Record<string, nt.PageObject> } pages
     */
    const pages = {}

    // App pages
    await Promise.all(
      u.keys(use?.pages?.app || {}).map(async (pageName) => {
        try {
          await sdk.initPage(pageName, [], {
            wrapEvalObjects: false,
          })
          pages[pageName] = sdk.root[pageName]
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          pages[pageName] = {
            name: err.name,
            message: err.message,
            stack: err.stack,
          }
          u.logError(err)
        }
      }),
    )

    const transformer = new Transformer()
    const page = nui.getRootPage()

    page.page = startPage
    page.viewport.width = use?.viewport?.width || 0
    page.viewport.height = use?.viewport?.height || 0

    /**
     * @param { Record<string, any> } obj
     */
    function getGoto(obj) {
      if (u.isObj(obj)) {
        if ('goto' in obj) return obj.goto
        for (const v of u.values(obj)) {
          const goto = getGoto(v)
          if (u.isObj(goto) && 'goto' in goto) return goto
        }
      }
      if (u.isArr(obj)) {
        for (const v of obj) {
          const goto = getGoto(v)
          if (u.isObj(goto) && 'goto' in goto) return goto
        }
      }
      return null
    }

    /**
     * @argument { nt.ComponentObject } componentProp
     * @argument { number } [index]
     */
    async function transform(componentProp, index = 0) {
      if (!componentProp) componentProp = {}
      const component = nui.createComponent(componentProp, page)

      await transformer.transform(
        component,
        nui.getConsumerOptions({
          context: { path: [index] },
          component,
          page,
          on,
        }),
      )

      return component
    }

    return {
      getGoto,
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

// process.stdout.write('\x1Bc')

// getGenerator()
//   .then(async ({ components, getGoto, nui, page, sdk, transform }) => {
//     const result = sdk.processPopulate({
//       source: ,
//       lookFor: ['.', '..', '=', '~'],
//       pageName: 'HomePage',
//       withFns: true,
//     })
//     console.dir(result, { depth: Infinity })
// console.log(await transform(components[1]))
// console.dir(await transform(components[9]), { depth: Infinity })

// console.log(components)
// await fs.writeJson('HomePage.json', nui.getRoot().HomePage, { spaces: 2 })
// await fs.writeJson(
//   'src/resources/data/homepage-components.json',
//   components,
//   {
//     spaces: 2,
//   },
// )
// })
// .catch(console.error)
