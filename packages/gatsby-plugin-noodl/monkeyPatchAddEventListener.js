const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')
const babel = require('@babel/core')

const { parse, traverse, types: t, transformFromAstSync } = babel

/**
 * @typedef OnPatch}
 * @property { function } OnPatch.addEventListener
 * @property { function } OnPatch.removeEventListener
 */

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
 * addEventListener is preving sdk from sandboxing.
 * We must monkey patch the EventTarget
 * @argument { object } opts
 * @param { OnPatch } opts.onPatch
 * @returns { Promise<{ components: NuiComponent.Instance[]; nui: typeof NUI }> }
 */
function monkeyPatchAddEventListener(opts) {
  try {
    const code = fs.readFileSync(getPathToEventTargetFile(), 'utf8')
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
      const result = transformFromAstSync(ast)
      fs.writeFileSync(getPathToEventTargetFile(), result.code, 'utf8')
      return result
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  }
}

exports.getPathToEventTargetFile = getPathToEventTargetFile
module.exports = monkeyPatchAddEventListener
