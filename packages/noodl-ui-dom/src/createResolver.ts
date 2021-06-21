import * as u from '@jsmanifest/utils'
import SignaturePad from 'signature_pad'
import { Identify } from 'noodl-types'
import { Component, NUI } from 'noodl-ui'
import { entries, isArr, isFnc, isStr } from './utils/internal'
import { getPageAncestor } from './utils'
import NOODLDOM from './noodl-ui-dom'
import NDOMPage from './Page'
import NUIDOMInternal from './Internal'
import * as T from './types'

const createResolver = function _createResolver(ndom: NOODLDOM) {
  const _internal: {
    objs: T.Resolve.Config[]
    ndom: NOODLDOM
  } = {
    objs: [],
    ndom,
  }

  const util = (function () {
    return {
      actionsContext(...args: T.Resolve.BaseArgs) {
        const otherProps = {} as Record<string, any>
        if (Identify.component.canvas(args[1])) {
          args[1].edit(
            'signaturePad',
            new SignaturePad(args[0] as HTMLCanvasElement, {
              dotSize: 0.2,
            }),
          )
        }
        return otherProps
      },
      options(...args: T.Resolve.BaseArgs) {
        function createStyleEditor(component: Component) {
          function editComponentStyles(
            styles: Record<string, any> | undefined,
            { remove }: { remove?: string | string[] | false } = {},
          ) {
            styles && component?.edit?.(() => ({ style: styles }))
            if (isArr(remove)) {
              remove.forEach(
                (styleKey) => styleKey && delete component.style[styleKey],
              )
            } else if (remove && isStr(remove)) delete component.style[remove]
          }
          return editComponentStyles
        }

        const options = {
          ...util.actionsContext(...args),
          editStyle: createStyleEditor(args[1]),
          original: args[1].original,
          global: ndom.global,
          ndom: ndom,
          nui: NUIDOMInternal._nui,
          page:
            ndom.findPage(getPageAncestor(args[1])?.get?.('page')) || ndom.page,
          draw: ndom.draw.bind(ndom),
          redraw: ndom.redraw.bind(ndom),
        }

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

  function _get() {
    return _internal.objs
  }

  const o = {
    get utils() {
      return util
    },
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
    use(value: T.Resolve.Config | typeof NUI | NUIDOMInternal) {
      if (value instanceof NUIDOMInternal) {
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
