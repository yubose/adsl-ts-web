import get from 'lodash/get'
import set from 'lodash/set'
import invariant from 'invariant'
import Resolver from './Resolver'
import NUI from './noodl-ui'
import { array, entries, isArr, isFnc, isObj, isStr } from './utils/internal'
import {
  NOODLUIActionType,
  Plugin,
  Register,
  Store,
  Transaction,
  TransactionId,
} from './types'

interface UseAction {
  actionType: Exclude<NOODLUIActionType, 'builtIn'>
  fn: Store.ActionObject['fn']
  trigger?: Store.ActionObject['trigger']
}

interface UseBuiltIn {
  actionType?: 'builtIn'
  funcName: Store.BuiltInObject['funcName']
  fn: Store.BuiltInObject['fn']
}

function use(
  this: typeof NUI,
  args:
    | {
        action?: Record<
          UseAction['actionType'],
          UseAction['fn'] | UseAction | UseAction[] | UseAction['fn'][]
        >
        builtIn?: Record<
          UseBuiltIn['funcName'],
          UseBuiltIn['fn'] | UseBuiltIn | UseBuiltIn[] | UseBuiltIn['fn'][]
        >
        register?: Register.Object | Register.Object[]
        transaction?: Record<TransactionId, Transaction[TransactionId]['fn']>
        getAssetsUrl?(): string
        getBaseUrl?(): string
        getPages?(): string[]
        getPreloadPages?(): string[]
        getRoot?(): Record<string, any>
        getPlugins?: Plugin.CreateType[]
      }
    | UseAction
    | UseBuiltIn
    | (UseAction | UseBuiltIn)[]
    | Store.PluginObject
    | Resolver,
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
    opts: UseAction | UseBuiltIn | Store.ActionObject['fn'],
  ) {
    if (actionType === 'builtIn') {
      invariant('funcName' in opts, `Missing funcName for a builtIn`)
      if (isObj(opts)) {
        if (opts.actionType !== actionType) opts.actionType = actionType
        getArr(self.getBuiltIns(), opts.funcName).push(
          opts as Store.BuiltInObject,
        )
      }
    } else {
      if (isFnc(opts)) {
        getArr(self.getActions(), actionType).push({ actionType, fn: opts })
      } else if (isObj(opts)) {
        invariant('fn' in opts, `fn is missing for action "${actionType}"`)
        if (actionType === 'emit') {
          invariant(
            'trigger' in opts,
            `An emit trigger is required when registering emit action handlers`,
          )
        }
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
    const location = args.location
    if (location === 'head') {
      this.getPlugins(location).push(args)
    } else if (location === 'body-top') {
      this.getPlugins(location).push(args)
    } else if (location === 'body-bottom') {
      this.getPlugins(location).push(args)
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
      useAction(args.actionType, args)
    } else if ('funcName' in args) {
      if (args.actionType !== 'builtIn') args.actionType = 'builtIn'
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
                  k as UseAction['actionType'],
                  isFnc(_v) ? { actionType: k, fn: _v } : _v,
                )
              })
            }
            useAction(
              k as UseAction['actionType'],
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
                    useAction(key, { funcName, fn: o })
                  } else if (isObj(o)) {
                    useAction(key, { ...o, funcName } as Store.BuiltInObject)
                  }
                })
              } else if (isFnc(v)) {
                useAction(key, { funcName, fn: v })
              } else if (isObj(v)) {
                useAction(key, { ...v, funcName } as Store.BuiltInObject)
              }
            })
          }
        } else {
          if (
            [
              'getAssetsUrl',
              'getBaseUrl',
              'getPages',
              'getPreloadPages',
              'getRoot',
              'getPlugins',
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
