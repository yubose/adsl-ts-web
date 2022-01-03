require('jsdom-global')('', {
  resources: 'usable',
  runScripts: 'dangerously',
  url: `https://127.0.0.1:3001`,
  beforeParse: (win) => {
    localStorage = win.localStorage || global.localStorage
  },
})
const axios = require('axios')
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
 * @typedef { import('@babel/traverse').Node } Node
 * @typedef { import('@babel/traverse').NodePath } NodePath
 */

/**
 *
 * @param { Parameters<typeof generate>[0]['patches'] } options
 * @returns { Promise<{ components: NuiComponent.Instance[]; nui: typeof NUI }> }
 */
async function monkeyPatchAddEventListener(options) {
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
              options?.[evtName]?.({ wasPatched: true })
            } else {
              eventListenersWerePatched = false
              options?.[evtName]?.({ wasPatched: false })
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
 * @param { object } opts.patches
 * @param { function } opts.patches.addEventListener
 * @param { function } opts.patches.removeEventListener
 * @returns { Promise<{ components: NuiComponent[]; nui: typeof NUI }> }
 */
async function generate({ patches } = {}) {
  try {
    await monkeyPatchAddEventListener(patches)

    const { CADL } = require('@aitmed/cadl')
    const sdk = new CADL({
      cadlVersion: 'test',
      configUrl: `https://public.aitmed.com/config/www.yml`,
    })

    await sdk.init()
    // Fixes navbar to stay at the top
    if (u.isObj(sdk.root?.BaseHeader?.style)) {
      sdk.root.BaseHeader.style.top = '0'
    }
    await sdk.initPage('HomePage')
    // const { data: HomePageYml } = await axios.get(
    //   sdk.baseUrl + 'HomePage_en.yml',
    // )
    // const HomePageJson = y.parse(HomePageYml)?.HomePage
    // console.log(HomePageJson)

    const components = sdk.root.HomePage.components

    NUI.use({
      getRoot: () => sdk.root,
      getAssetsUrl: () => sdk.assetsUrl,
      getBaseUrl: () => sdk.cadlBaseUrl,
      getPreloadPages: () => sdk.cadlEndpoint.preload,
      getPages: () => sdk.cadlEndpoint.page,
    })

    const transformer = new Transformer()
    const page = NUI.getRootPage()
    page.page = 'HomePage'
    page.viewport.width = 1024
    page.viewport.height = 768

    const getGoto = (obj) => {
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
     * @param { nt.ComponentObject } component
     */
    const parseComponent = async (componentProp, index = 0) => {
      if (!componentProp) componentProp = {}
      const component = NUI.createComponent(componentProp, page)
      await transformer.transform(
        component,
        NUI.getConsumerOptions({
          context: { path: [index] },
          component,
          page,
          on: {
            createComponent(comp, opts) {
              const componentLabel = `[${comp.type}]`
              const path = opts.path || []
              const pathStr = path.join('.') || ''
              // const logArgs = [
              //   comp.type,
              //   opts.parent?.type || '',
              //   u.isNum(opts?.index) ? opts.index : null,
              // ]
              // if (u.isStr(comp.blueprint.path))
              //   logArgs.push(comp.blueprint.path)
              // else if (comp.blueprint.viewTag)
              //   logArgs.push(comp.blueprint.viewTag)
              // console.log(logArgs)
              if (comp.blueprint.onClick) {
                let goto = getGoto(comp.blueprint.onClick)
                if (goto) {
                  if ('goto' in goto) {
                    comp.set('onClick', { actions: [goto], trigger: 'onClick' })
                  }
                }
                // console.log(comp.blueprint.onClick)
              }
              // console.log(
              //   componentLabel,
              //   pathStr,
              //   has(sdk.root.HomePage.components, path),
              // )
            },
          },
        }),
      )

      // const props = component.props

      return component
    }

    /**
     *
     * @param { nt.ComponentObject | nt.ComponentObject[] } component
     * @returns { Promise<import('noodl-ui').NuiComponent.Instance[]> }
     */
    const parseAll = async (value) => {
      const components = []
      const componentsList = u.array(value)
      const numComponents = componentsList.length
      for (let index = 0; index < numComponents; index++) {
        const component = componentsList[index]
        components.push(await parseComponent(component, index))
      }
      return components
    }

    const parsedComponents = await parseAll(components)

    return {
      components: parsedComponents,
      nui: NUI,
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

module.exports = {
  generate,
  monkeyPatchAddEventListener,
}

// process.stdout.write('\x1Bc')

// generate()
//   .then(async ({ components, nui }) => {
//     // console.log(components)
//     await fs.writeJson('HomePage.json', nui.getRoot().HomePage, { spaces: 2 })
//     await fs.writeJson(
//       'src/resources/data/homepage-components.json',
//       components,
//       {
//         spaces: 2,
//       },
//     )
//   })
//   .catch(console.error)
