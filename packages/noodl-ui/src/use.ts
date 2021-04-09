import get from 'lodash/get'
import set from 'lodash/set'
import invariant from 'invariant'
import Resolver from './Resolver'
import NUI from './noodl-ui'
import { array, entries, isArr, isFnc, isObj } from './utils/internal'
import { actionTypes } from './constants'
import {
  NUIActionType,
  NUITrigger,
  Plugin,
  Register,
  Store,
  Use,
} from './types'

function use(
  this: typeof NUI,
  args:
    | ({
        action?: Use.Action
        builtIn?: Use.BuiltIn
        emit?: Use.Emit
        register?: Use.Register
        transaction?: Use.Transaction
        getAssetsUrl?: Use.GetAssetsUrl
        getBaseUrl?: Use.GetBaseUrl
        getPages?: Use.GetPages
        getPreloadPages?: Use.GetPreloadPages
        getRoot?: Use.GetRoot
      } & Partial<
        Record<
          Exclude<NUIActionType, 'builtIn' | 'emit' | 'register'>,
          Store.ActionObject['fn'] | Store.ActionObject['fn'][]
        >
      >)
    | (
        | Store.ActionObject
        | Store.BuiltInObject
        | Use.Emit
        | (Store.ActionObject | Store.BuiltInObject)[]
        | Plugin.Object
        | Use.Resolver
      ),
): typeof NUI {
  const self = this
  const getArr = <O extends Record<string, any>, K extends keyof O>(
    obj: O,
    path: K,
  ) => {
    if (!isArr(get(obj, path))) set(obj, path, [])
    return get(obj, path)
  }

  function useAction(
    actionType: NUIActionType,
    opts: Store.ActionObject | Store.BuiltInObject | Store.ActionObject['fn'],
  ) {
    if (actionType === 'builtIn') {
      invariant('funcName' in opts, `Missing funcName for a builtIn`)
      if (isObj(opts)) {
        opts.actionType = actionType
        getArr(self.getBuiltIns(), opts.funcName).push(opts)
      }
    } else if (actionType === 'emit') {
      const getEmitArr = () => self.getActions().emit
      array(opts).forEach((opt) => {
        if ('trigger' in opt) {
          invariant(
            isFnc(opt.fn),
            `fn is required for emit trigger "${opt.trigger}"`,
          )
          getEmitArr().push({ ...opt, actionType: 'emit' })
        } else {
          entries(opt).forEach(([trigger, opt]) => {
            array(opt).forEach((fn) => {
              if (isFnc(fn)) {
                getEmitArr().push({
                  actionType: 'emit',
                  fn,
                  trigger: trigger as NUITrigger,
                })
              }
            })
          })
        }
      })
    } else {
      if (isFnc(opts)) {
        getArr(self.getActions(), actionType).push({ actionType, fn: opts })
      } else if (isObj(opts)) {
        getArr(self.getActions(), actionType).push({ ...opts, actionType })
      }
    }
  }

  if (args instanceof Resolver) {
    if (
      args.name &&
      this.getResolvers().every((resolver) => resolver.name !== args.name)
    ) {
      this.getResolvers().push(args)
    }
  } else if ('location' in args) {
    invariant(
      ['head', 'body-top', 'body-bottom'].includes(
        args.location as Plugin.Location,
      ),
      `Invalid plugin location "${args.location}". Available options are: ` +
        `"head", "body-top", and "body-bottom"`,
    )
    if (!this.cache.plugin.has(args.path as string)) {
      this.cache.plugin.add(args.location as Plugin.Location, args)
    }
  } else if ('register' in args) {
    array(args.register as Register.Object).forEach((obj) => {
      let page = obj.page || '_global'
      let name = obj.name || (obj.component && obj.component.onEvent) || ''
      invariant(
        !!name,
        `Could not locate an identifier/name for this register object`,
        obj,
      )
      if (!this.cache.register.has(page, name)) {
        this.cache.register.set(page, name, obj)
      }
    })
  } else if ('transaction' in args) {
    entries(args.transaction).forEach(([tid, fn]) => {
      this.getTransactions()[tid] = { ...this.getTransactions()[tid], fn }
    })
  } else {
    if ('actionType' in args && !('funcName' in args)) {
      invariant(isFnc(args.fn), 'fn is not a function')
      useAction(args.actionType, args)
    } else if ('funcName' in args) {
      invariant(!!args.funcName, `"funcName" is required`)
      invariant(isFnc(args.fn), 'fn is not a function')
      useAction('builtIn', args)
    } else if ('emit' in args) {
      useAction('emit', args.emit as Store.ActionObject)
    } else {
      for (const [key, val] of entries(args)) {
        if (key === 'action') {
          entries(val).forEach(([k, v]) => {
            if (k === 'emit') {
              useAction('emit', v)
            } else {
              if (isArr(v)) {
                v.forEach((_v) => {
                  useAction(
                    k as Store.ActionObject['actionType'],
                    isFnc(_v) ? { actionType: k, fn: _v } : _v,
                  )
                })
              } else {
                useAction(
                  k as Store.ActionObject['actionType'],
                  isFnc(v) ? { actionType: k, fn: v } : v,
                )
              }
            }
          })
        } else if (key === 'builtIn') {
          if ('funcName' in val) {
            useAction(key, val)
          } else {
            entries(val).forEach(([funcName, v]) => {
              if (isArr(v)) {
                v.forEach((o) => {
                  if (isFnc(o)) {
                    useAction(key, { funcName, fn: o } as Store.BuiltInObject)
                  } else if (isObj(o)) {
                    useAction(key, { ...o, funcName } as Store.BuiltInObject)
                  }
                })
              } else if (isFnc(v)) {
                useAction(key, { funcName, fn: v } as Store.BuiltInObject)
              } else if (isObj(v)) {
                useAction(key, { ...v, funcName } as Store.BuiltInObject)
              }
            })
          }
        } else if (key === 'emit') {
          useAction(key, val)
        } else {
          if (actionTypes.includes(key as NUIActionType)) {
            array(val).forEach((v) => useAction(key as NUIActionType, v))
          }

          if (
            [
              'getAssetsUrl',
              'getActions',
              'getBuiltIns',
              'getBaseUrl',
              'getPages',
              'getPreloadPages',
              'getRoot',
            ].includes(key)
          ) {
            this._defineGetter(key, val)
          }
        }
      }
    }
  }

  return this
}

export default use
