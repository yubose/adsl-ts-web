import get from 'lodash/get'
import set from 'lodash/set'
import invariant from 'invariant'
import { Identify } from 'noodl-types'
import Resolver from './Resolver'
import NUI from './noodl-ui'
import { entries, isArr, isFnc, isObj } from './utils/internal'
import { NOODLUIActionType, Store } from './types'
import { actionTypes as nuiActionTypes } from './constants'

interface UseAction {
  actionType: NOODLUIActionType
  fn: Store.ActionObject['fn']
  trigger?: Store.ActionObject['trigger']
}

interface UseBuiltIn {
  actionType?: 'builtIn'
  funcName: Store.BuiltInObject['funcName']
  fn: Store.BuiltInObject['fn']
}

function use(action: UseAction): typeof NUI
function use(action: UseBuiltIn): typeof NUI
function use(plugin: Store.PluginObject): typeof NUI
function use(resolver: Resolver): typeof NUI
function use(
  this: typeof NUI,
  obj: UseAction | UseBuiltIn | Store.PluginObject | Resolver,
) {
  const getArr = <O extends Record<string, any>, K extends keyof O>(
    obj: O,
    path: K,
  ) => {
    if (!isArr(get(obj, path))) set(obj, path, [])
    return get(obj, path)
  }

  if (isObj(obj)) {
    if ('actionType' in obj) {
      if ('funcName' in obj) {
        if (obj.actionType !== 'builtIn') obj.actionType = 'builtIn'
        invariant(isFnc(obj.fn), 'fn is required')
        getArr(this.getBuiltIns(), obj.funcName).push(obj)
      } else {
        if (obj.actionType === 'builtIn') {
          invariant(
            obj.actionType === 'builtIn' && !!obj['funcName'],
            `"funcName" is required`,
          )
        } else {
          invariant(isFnc(obj.fn), 'fn is required')
          getArr(this.getActions(), obj.actionType).push(obj)
        }
      }
    } else if ('funcName' in obj) {
      if (obj.actionType !== 'builtIn') obj.actionType = 'builtIn'
      invariant(
        obj.actionType === 'builtIn' && !!obj['funcName'],
        `"funcName" is required`,
      )
      invariant(isFnc(obj.fn), 'fn is required')
      getArr(this.getBuiltIns(), obj.funcName).push(obj)
    } else if ('location' in obj) {
      // this.getPlugins(obj.location)
    } else if (obj instanceof Resolver) {
      if (
        obj.name &&
        this.getResolvers().every((resolver) => resolver.name !== obj.name)
      ) {
        this.getResolvers().push(obj)
      }
    } else {
      const useAction = (actionType: NOODLUIActionType, v: any) => {
        if (isFnc(v)) {
          getArr(this.getActions(), actionType)?.push({ actionType, fn: v })
        } else if (isObj(v)) {
          invariant(
            isFnc(v.fn),
            `fn is required for actionType "${actionType}"`,
          )
          getArr(this.getActions(), actionType)?.push({ actionType, ...v })
        }
      }

      for (const [key, val] of entries(obj)) {
        if (key === 'action') {
          if (isArr(val)) {
            //
          } else if (isObj(val)) {
            //
          }
        } else if (key === 'builtIn') {
          if (isArr(val)) {
            //
          } else if (isObj(val)) {
            //
          }
        } else if (nuiActionTypes.includes(key as NOODLUIActionType)) {
          if (isArr(val)) {
            val.forEach((v) => useAction(key, v))
          } else {
            useAction(key, val)
          }
        }
      }
    }
  }
  // const mods = ((isArr(mod) ? mod : [mod]) as any[]).concat(rest)
  // const handleMod = (m: any) => {
  //   if (m) {
  //     if (m instanceof Resolver) {
  //       if (m.name && resolvers.every((resolver) => resolver.name !== m.name)) {
  //         resolvers.push(m)
  //       }
  //     } else if (isObj(m)) {
  //       if ('funcName' in m) {
  //         const obj = { funcName: m.funcName }
  //         if (!('actionType' in m)) m.actionType = 'builtIn'
  //         if (!isArr(store.builtIns[m.funcName])) {
  //           store.builtIns[m.funcName] = []
  //         }
  //         store.builtIns[m.funcName] = store.builtIns[m.funcName].concat(
  //           isArr(m) ? m : [m],
  //         )
  //       } else if ('actionType' in m) {
  //         if (!isArr(store.actions[m.actionType])) {
  //           store.actions[m.actionType] = []
  //         }
  //         store.actions[m.actionType]?.push(m)
  //       } else if ('location' in m) {
  //         store.plugins[m.location].push(m)
  //       }
  //     }
  //   }
  // }
  // mods.forEach((m) =>
  //   isArr(m) ? m.concat(rest).forEach(handleMod) : handleMod(m),
  // )
  return this
}

export default use
