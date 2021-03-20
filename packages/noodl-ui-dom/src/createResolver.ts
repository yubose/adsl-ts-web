import { ComponentInstance, NOODL as NOODLUI } from 'noodl-ui'
import NOODLDOM from './noodl-ui-dom'
import NOODLUIDOMInternal from './Internal'
import { assign, entries, isArr, isFnc, isStr } from './utils/internal'
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
    noodlui: NOODLUI
    ndom: NOODLDOM
  } = {
    objs: [],
    noodlui: undefined as any,
    ndom,
  }

  const util = (function () {
    return {
      actionsContext() {
        return {
          ..._internal.noodlui?.actionsContext,
          findByElementId,
          findByViewTag,
          findAllByViewTag,
          findWindow,
          findWindowDocument,
          isPageConsumer,
        }
      },
      options(...args: T.Resolve.BaseArgs) {
        function createStyleEditor(component: ComponentInstance) {
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
          noodlui: _internal.noodlui,
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
        if (obj.cond === args[1]?.noodlType || obj.cond === args[1]?.type) {
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

  function _get(key: 'noodlui'): NOODLUI
  function _get(key?: undefined): typeof _internal.objs
  function _get(key?: 'noodlui' | undefined) {
    if (key === 'noodlui') return _internal.noodlui
    return _internal.objs
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
    get: _get,
    use(value: T.Resolve.Config | NOODLUI | NOODLUIDOMInternal) {
      if (value instanceof NOODLUI) {
        _internal.noodlui = value
        if (_internal.noodlui.actionsContext) {
          assign(_internal.noodlui.actionsContext, util.actionsContext())
        }
      } else if (value instanceof NOODLUIDOMInternal) {
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
