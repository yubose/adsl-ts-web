import { Component, NOODLUI as NUI } from 'noodl-ui'
import NOODLDOM from './noodl-ui-dom'
import NOODLUIDOMInternal from './Internal'
import { entries, isArr, isFnc, isStr } from './utils/internal'
import {
  findByElementId,
  findByViewTag,
  findAllByViewTag,
  findWindow,
  findWindowDocument,
  isPageConsumer,
} from './utils'
import * as T from './types'

const createResolver = function createResolver(ndom: NOODLDOM) {
  const _internal: {
    objs: T.Resolve.Config[]
    ndom: NOODLDOM
  } = {
    objs: [],
    ndom,
  }

  const util = (function () {
    return {
      actionsContext() {
        return {
          findByElementId,
          findByViewTag,
          findAllByViewTag,
          findWindow,
          findWindowDocument,
          isPageConsumer,
        }
      },
      options(...args: T.Resolve.BaseArgs) {
        function createStyleEditor(component: Component) {
          function editComponentStyles(
            styles: Record<string, any> | undefined,
            { remove }: { remove?: string | string[] | false } = {},
          ) {
            if (styles) {
              component?.edit?.(() => ({ style: styles }))
            }
            if (isArr(remove)) {
              remove.forEach(
                (styleKey) => styleKey && delete component.style[styleKey],
              )
            } else if (remove && isStr(remove)) delete component.style[remove]
          }
          return editComponentStyles
        }

        const options = {
          ...util.actionsContext(),
          editStyle: createStyleEditor(args[1]),
          original: args[1].original,
          ndom: ndom,
          page: ndom.page,
          draw: ndom.draw.bind(ndom),
          redraw: ndom.redraw.bind(ndom),
        } as T.Resolve.Options

        return options
      },
    }
  })()

  function _getRunners(...args: T.Resolve.BaseArgs) {
    const attach = (
      lifeCycleEvent: T.Resolve.LifeCycleEvent,
      acc: T.Resolve.LifeCycle,
      obj: T.Resolve.Config,
    ) => {
      if (isStr(obj.cond)) {
        // If they passed in a resolver strictly for this node/component
        if (obj.cond === args[1]?.type) {
          acc[lifeCycleEvent]?.push(obj[lifeCycleEvent] as T.Resolve.Func)
        }
      } else if (isFnc(obj.cond)) {
        // If they only want this resolver depending on a certain condition
        if (obj.cond(...args, util.options(...args))) {
          acc[lifeCycleEvent]?.push(obj[lifeCycleEvent] as T.Resolve.Func)
        }
      }
    }
    return _internal.objs.reduce(
      (acc, obj) => {
        if (obj.before) attach('before', acc, obj)
        if (obj.resolve) attach('resolve', acc, obj)
        if (obj.after) attach('after', acc, obj)
        return acc
      },
      {
        before: [],
        resolve: [],
        after: [],
      } as T.Resolve.LifeCycle,
    )
  }

  const o = {
    register(obj: T.Resolve.Config) {
      !_internal.objs.includes(obj) && _internal.objs.push(obj)
      return o
    },
    run: (...args: T.Resolve.BaseArgs) => {
      const { before, resolve, after } = _getRunners(...args)
      const runners = [...before, ...resolve, ...after]
      const total = runners.length
      // TODO - feat. consumer return value
      for (let index = 0; index < total; index++) {
        runners[index](...args, util.options(...args))
      }
      return this
    },
    clear() {
      _internal.objs.length = 0
      return o
    },
    get() {
      return _internal.objs
    },
    use(value: T.Resolve.Config | typeof NUI | NOODLUIDOMInternal) {
      if (value instanceof NOODLUIDOMInternal) {
        ndom = value as NOODLDOM
      } else if (value) {
        o.register(value)
        if (value.observe) {
          entries(value.observe).forEach(([evt, fn]) => {
            if (ndom.page.hooks[evt] && !ndom.page.hooks[evt]?.includes(fn)) {
              ndom.page.on(evt as T.Page.HookEvent, fn)
            }
          })
        }
      }
      return o
    },
  }

  return o
}

export default createResolver
