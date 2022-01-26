import JSDOM from 'jsdom-global'

JSDOM('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: `https://127.0.0.1:3001`,
  beforeParse: (win) => {
    localStorage = win.localStorage || global.localStorage
  },
})

import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import fs from 'fs-extra'
import path from 'path'
import { parse, traverse, types as t, transformFromAstAsync } from '@babel/core'
import y from 'yaml'
import has from 'lodash/has'
import get from 'lodash/get'
import set from 'lodash/set'
import { NUI, Transformer } from 'noodl-ui'

function getPathToEventTargetFile() {
  return path.resolve(
    path.join(
      process.cwd(),
      '../../node_modules/jsdom/lib/jsdom/living/generated/EventTarget.js',
    ),
  )
}

async function monkeyPatchAddEventListener(opts?: {
  onPatch?: {
    addEventListener?: () => void
    removeEventListener?: () => void
  }
}) {
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
    function isMethodPatched(node: t.ClassMethod) {
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
     * @type { Record<string, nt.PageObject> }
     */
    const pages = {}

    // App pages
    await Promise.all(
      u.entries(use.pages.json || {}).map(async ([pageName, cadlObject]) => {
        const cadlYAML = use.pages.serialized[pageName]
        try {
          await sdk.initPage({ cadlObject, cadlYAML, pageName }, [], {
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
          console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
        }
      }),
    )

    const transformer = new Transformer()
    const page = nui.getRootPage()

    page.page = sdk.cadlEndpoint.startPage || ''
    page.viewport.width = use?.viewport?.width || 0
    page.viewport.height = use?.viewport?.height || 0

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
