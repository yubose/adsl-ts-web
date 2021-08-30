import invariant from 'invariant'
import attributesModule from 'snabbdom/modules/attributes'
import classModule from 'snabbdom/modules/class'
import eventListenersModule from 'snabbdom/modules/eventlisteners'
import propsModule from 'snabbdom/es/modules/props'
import styleModule from 'snabbdom/es/modules/style'
import toVNode from 'snabbdom/es/tovnode'
import { h, init } from 'snabbdom'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import cache from './cache'
import * as c from './constants'
import * as t from './types'

const nui = (function () {
  const o = {
    use(args: t.UseArg) {
      // Actions (not including builtIns)
      u.forEach((type) => {
        if (!(type in args)) return
        const add = (fn) => cache.actions[type]?.push({ actionType: type, fn })
        u.forEach(add, u.values(args[type] as any))
      }, c.groupedActionTypes)
      // Builtin actions
      if ('builtIn' in args) {
        const builtIns = cache.actions.builtIn
        u.forEach(
          ([funcName, fn]) =>
            u.forEach((f) => {
              !builtIns.has(funcName) && builtIns.set(funcName, [])
              builtIns
                .get(funcName)
                ?.push?.({ actionType: 'builtIn', funcName, fn: f })
            }, u.array(fn)),
          u.entries(
            args.builtIn as Record<string, t.Store.BuiltInObject['fn']>,
          ),
        )
      }
      // Emit actions
      if ('emit' in args) {
        const emits = cache.actions.emit
        u.forEach(
          ([trigger, func]) =>
            u.forEach(
              (fn) =>
                emits.get(trigger)?.push({ actionType: 'emit', fn, trigger }),
              u.array(func),
            ),
          u.entries(
            args.emit as Record<t.NuiTrigger, t.Store.ActionObject['fn']>,
          ),
        )
      }

      return o
    },
  }

  return o
})()

export default nui
