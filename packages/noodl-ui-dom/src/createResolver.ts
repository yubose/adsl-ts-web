import { NOODL as NOODLUI } from 'noodl-ui'
import NOODLDOM from './noodl-ui-dom'
import NOODLUIDOMInternal from './Internal'
import { assign, entries, isArr, isFnc, isObj, isStr } from './utils/internal'
import {
  findByElementId,
  findByViewTag,
  findAllByViewTag,
  findWindow,
  findWindowDocument,
  isPageConsumer,
} from './utils/utils'
import * as T from './types'

type UseObject = T.Resolve.Config | NOODLUI | NOODLUIDOMInternal

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
      actionsContext(): T.ActionChainDOMContext {
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
      options(...[node, component]: T.Resolve.BaseArgs) {
        const options = {
          ...util.actionsContext(),
          original: component.original,
          noodlui: _internal.noodlui,
          noodluidom: ndom,
          draw: ndom.draw.bind(ndom),
          redraw: ndom.redraw.bind(ndom),
          state: ndom.state,
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
      if (!_internal.objs.includes(obj)) _internal.objs.push(obj)
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
    use(value: UseObject | UseObject[]) {
      if (isArr(value)) {
        value.forEach((val) => o.use(val))
      } else if (value) {
        if (!!value && isObj(value) && isFnc(value['resolve'])) {
          o.register(value as any)

          if (value.observe) {
            entries(value.observe).forEach(([evt, fn]) => {
              if (
                ndom.observers.page.on[evt] &&
                !ndom.observers.page.on[evt]?.includes(fn)
              ) {
                ndom.on(evt, fn)
              }
            })
          }
        } else if (value instanceof NOODLUI) {
          _internal.noodlui = value
          if (_internal.noodlui.actionsContext) {
            assign(_internal.noodlui.actionsContext, util.actionsContext())
          }
        } else if (value instanceof NOODLUIDOMInternal) {
          ndom = value as any
        } else if (isObj(value)) {
          //
        }
      }
      return o
    },
  }

  return o
}

export default createResolver
