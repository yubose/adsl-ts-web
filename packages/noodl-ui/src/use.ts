import get from 'lodash/get'
import set from 'lodash/set'
import invariant from 'invariant'
import Resolver from './Resolver'
import NUI from './noodl-ui'
import { array, entries, isArr, isFnc, isObj, isStr } from './utils/internal'
import {
  NOODLUIActionType,
  NOODLUITrigger,
  Register,
  Store,
  Transaction,
  TransactionId,
  Use,
} from './types'

function use(
  this: typeof NUI,
  args:
    | {
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
        getPlugins?: Use.GetPlugins
      }
    | Use.Action
    | Use.BuiltIn
    | (Use.Action | Use.BuiltIn)[]
    | Use.Plugin
    | Use.Resolver,
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
    actionType: NOODLUIActionType,
    opts: Store.ActionObject | Store.BuiltInObject | Store.ActionObject['fn'],
  ) {
    if (actionType === 'builtIn') {
      invariant('funcName' in opts, `Missing funcName for a builtIn`)
      if (isObj(opts)) {
        opts.actionType = actionType
        getArr(self.getBuiltIns(), opts.funcName).push(
          opts as Store.BuiltInObject,
        )
      }
    } else {
      if (isFnc(opts)) {
        getArr(self.getActions(), actionType).push({ actionType, fn: opts })
      } else if (isObj(opts)) {
        if (actionType === 'emit') {
          if ('trigger' in opts) {
            getArr(self.getActions(), actionType).push({ ...opts, actionType })
          } else {
            entries(opts).forEach(([trigger, o]) => {
              getArr(self.getActions(), actionType).push({
                ...opts,
                actionType,
                fn: isFnc(o) ? o : o.fn,
                trigger: trigger as NOODLUITrigger,
              })
            })
          }
        } else {
          invariant('fn' in opts, `fn is missing for action "${actionType}"`)
          getArr(self.getActions(), actionType).push({ ...opts, actionType })
        }
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
    const location = args.location
    if (location === 'head') {
      this.getPlugins(location).push(args as Use.Plugin)
    } else if (location === 'body-top') {
      this.getPlugins(location).push(args as Use.Plugin)
    } else if (location === 'body-bottom') {
      this.getPlugins(location).push(args as Use.Plugin)
    }
  } else if ('register' in args) {
    array(args.register).forEach((obj: Register.Object) => {
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
    entries(args.transaction).forEach(
      ([tid, fn]: [
        tid: TransactionId,
        fn: Transaction[TransactionId]['fn'],
      ]) => {
        this.getTransactions()[tid] = { ...this.getTransactions()[tid], fn }
      },
    )
  } else {
    if ('actionType' in args) {
      invariant(isFnc(args.fn), 'fn is not a function')
      invariant(isStr(args.actionType), 'Missing actionType')
      useAction(args.actionType as any, args)
    } else if ('funcName' in args) {
      args.actionType = 'builtIn' as any
      invariant(!!args.funcName, `"funcName" is required`)
      invariant(isFnc(args.fn), 'fn is not a function')
      useAction('builtIn', args)
    } else {
      for (const [key, val] of entries(args)) {
        if (key === 'action') {
          entries(val).forEach(([k, v]) => {
            if (isArr(v)) {
              v.forEach((_v) => {
                useAction(
                  k as Store.ActionObject['actionType'],
                  isFnc(_v) ? { actionType: k, fn: _v } : _v,
                )
              })
            }
            useAction(
              k as Store.ActionObject['actionType'],
              isFnc(v) ? { actionType: k, fn: v } : v,
            )
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
          //
        } else {
          if (
            [
              'getAssetsUrl',
              'getActions',
              'getBuiltIns',
              'getBaseUrl',
              'getPages',
              'getPreloadPages',
              'getPlugins',
              'getRoot',
              'getTransactions',
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
