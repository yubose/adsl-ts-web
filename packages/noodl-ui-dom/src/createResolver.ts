import * as u from '@jsmanifest/utils'
import SignaturePad from 'signature_pad'
import { OrArray } from '@jsmanifest/typefest'
import { Identify } from 'noodl-types'
import { Component } from 'noodl-ui'
import { getPageAncestor } from './utils'
import { nui } from './nui'
import NDOM from './noodl-ui-dom'
import NDOMInternal from './Internal'
import renderResource from './utils/renderResource'
import * as t from './types'

const createResolver = function _createResolver(ndom: NDOM) {
  const _internal: {
    objs: t.Resolve.Config[]
    ndom: NDOM
  } = {
    objs: [],
    ndom,
  }

  const util = (function () {
    return {
      options(...args: t.Resolve.BaseArgs) {
        function createStyleEditor(component: Component) {
          function editComponentStyles(
            styles: Record<string, any> | undefined,
            { remove }: { remove?: string | string[] | false } = {},
          ) {
            styles && component?.edit?.(() => ({ style: styles }))
            if (u.isArr(remove)) {
              remove.forEach(
                (styleKey) => styleKey && delete component.style[styleKey],
              )
            } else if (remove && u.isStr(remove)) delete component.style[remove]
          }
          return editComponentStyles
        }

        if (Identify.component.canvas(args[1])) {
          args[1].edit(
            'signaturePad',
            new SignaturePad(args[0] as HTMLCanvasElement, {
              dotSize: 0.2,
            }),
          )
        }

        const options = {
          editStyle: createStyleEditor(args[1]),
          original: args[1].blueprint,
          global: ndom.global,
          ndom: ndom,
          nui,
          page:
            ndom.findPage(getPageAncestor(args[1])?.get?.('page')) || ndom.page,
          draw: ndom.draw.bind(ndom),
          redraw: ndom.redraw.bind(ndom),
        }

        return options
      },
    }
  })()

  function _onPassingCond(
    cond: t.Resolve.Config['cond'],
    args: t.Resolve.BaseArgs,
    callback: () => void,
  ) {
    if (u.isStr(cond)) {
      // If they passed in a resolver strictly for this node/component
      cond === args[1]?.type && callback()
    } else if (u.isFnc(cond)) {
      // If they only want this resolver depending on a certain condition
      if (cond(...args, util.options(...args))) callback()
    } else {
      callback()
    }
  }

  function _getRunners(
    ...[node, component, resolvers]: [
      t.Resolve.BaseArgs[0],
      t.Resolve.BaseArgs[1],
      OrArray<t.Resolve.Config>,
    ]
  ) {
    const attach = (
      lifeCycleEvent: t.Resolve.LifeCycleEvent,
      acc: t.Resolve.LifeCycle,
      obj: t.Resolve.Config,
    ) => {
      _onPassingCond(obj.cond, [node, component], () => {
        if (lifeCycleEvent === 'resolve') {
          if (u.isFnc(obj.resolve)) {
            acc[lifeCycleEvent]?.push(obj[lifeCycleEvent] as t.Resolve.Func)
          } else if (u.isObj(obj.resolve)) {
            acc[lifeCycleEvent]?.push(obj[lifeCycleEvent] as t.Resolve.Hooks)
          }
        } else {
          acc[lifeCycleEvent]?.push(obj[lifeCycleEvent] as t.Resolve.Func)
        }
      })
    }
    return u.array(resolvers).reduce(
      (acc, obj) => {
        if (!obj) return acc
        if (obj.before) attach('before', acc, obj)
        if (obj.resolve) attach('resolve', acc, obj)
        if (obj.after) attach('after', acc, obj)
        if (obj.resource) ndom.use({ resource: obj.resource })
        return acc
      },
      { before: [], resolve: [], after: [] } as t.Resolve.LifeCycle,
    )
  }

  function _get() {
    return _internal.objs
  }

  function _run<
    T extends string = string,
    N extends t.NDOMElement<T> = t.NDOMElement<T>,
  >({ node, component, resolvers }: t.Resolve.Args<T, N>) {
    resolvers = u.array(resolvers || _internal.objs)

    const { before, resolve, after } = _getRunners(node, component, resolvers)
    const runners = [...before, ...resolve, ...after] as (
      | t.Resolve.Func
      | t.Resolve.Hooks
    )[]
    const total = runners.length
    // TODO - feat. consumer return value
    for (let index = 0; index < total; index++) {
      const resolveFn = runners[index]
      if (u.isFnc(resolveFn)) {
        resolveFn(node, component, util.options(node, component))
      } else if (u.isObj(resolveFn)) {
        if (u.isObj(resolveFn.onResource)) {
          for (const [resourceKey, resourceResolveFn] of u.entries(
            resolveFn.onResource,
          )) {
            const regexp = new RegExp(resourceKey.trim(), 'i')
            for (const resourceObjects of u.values(ndom.global.resources)) {
              for (const [key, obj] of u.entries(resourceObjects)) {
                if (regexp.test(key)) {
                  const record = ndom.createResource(obj)
                  if (obj && !obj.isActive()) {
                    renderResource(record, ({ node: resourceNode }) => {
                      resourceResolveFn({
                        node,
                        component,
                        options: util.options(node, component),
                        resource: {
                          node: resourceNode,
                          record,
                        },
                      })
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const o = {
    get utils() {
      return util
    },
    register(obj: t.Resolve.Config) {
      if (!_internal.objs.includes(obj)) {
        _internal.objs.push(obj)
      }
      return o
    },
    /**
     * Runs the DOM resolvers on the node (args[0]) and component (args[1])
     */
    run: _run,
    clear() {
      _internal.objs.length = 0
      return o
    },
    get: _get,
    use(value: t.Resolve.Config | NDOMInternal) {
      if (value instanceof NDOMInternal) {
        ndom = value as NDOM
      } else if (value) {
        o.register(value)
      }
      return o
    },
  }

  return o
}

export default createResolver
