import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import invariant from 'invariant'
import { htmlDomApi as dom, init, h, toVNode } from 'snabbdom'
import cache from './cache'
import translators from './translators'
import resolvers, { NuiResolver } from './Resolver'
import NuiPage, { ConstructorOptions as PageConstructorOptions } from './Page'
import NuiViewport from './Viewport'
import * as c from './constants'
import * as t from './types'

const nui = (function () {
  let _assetsUrl = ''
  let _baseUrl = ''
  let _pages = [] as string[]
  let _preload = [] as string[]
  let _getRoot = () => ({})
  let _plugins = []
  let _registers = []

  let _translators = new Map<string, t.Resolve.TranslateConfig[]>()

  function createPage(opts: PageConstructorOptions) {
    const page = new NuiPage(opts)
  }

  function _createResolver(opts) {
    const resolver = new NuiResolver()
  }

  function draw({ component, vprops }: t.Resolve.ResolverFnOptions) {
    for (const [key, value] of u.entries(component)) {
      translators.execute(key)
    }
  }

  const o = {
    get assetsUrl() {
      return _assetsUrl
    },
    set assetsUrl(assetsUrl) {
      _assetsUrl = assetsUrl
    },
    get baseUrl() {
      return _baseUrl
    },
    set baseUrl(baseUrl) {
      _baseUrl = baseUrl
    },
    get pages() {
      return _pages
    },
    get preload() {
      return _preload
    },
    get plugins() {
      return _plugins
    },
    get registers() {
      return _registers
    },
    get root() {
      return _getRoot?.() || {}
    },
    createPage,
    draw,
    use(args: t.UseOptions) {
      if (u.isArr(args)) {
        //
      } else {
        for (let [key, value] of u.entries(args)) {
          if (key === 'root') {
            !value && (value = {})
            _getRoot = u.isFnc(value) ? value : () => value
          } else if (key === 'builtIn') {
            const builtIns = cache.actions.builtIn
            u.forEach(
              ([funcName, fn]) =>
                u.forEach((f) => {
                  !builtIns.has(funcName) && builtIns.set(funcName, [])
                  builtIns
                    .get(funcName)
                    ?.push?.({ actionType: 'builtIn', funcName, fn: f })
                }, u.array(fn)),
              u.entries(value as Record<string, t.Store.BuiltInObject['fn']>),
            )
          } else if (key === 'emit') {
            const emits = cache.actions.emit
            u.forEach(
              ([trigger, func]) =>
                u.forEach(
                  (fn) =>
                    emits
                      .get(trigger)
                      ?.push({ actionType: 'emit', fn, trigger }),
                  u.array(func),
                ),
              u.entries(
                value as Record<t.NuiTrigger, t.Store.ActionObject['fn']>,
              ),
            )
          } else if (c.actionTypes.includes(key as t.NuiActionType)) {
            u.forEach((type) => {
              if (!(type in args)) return
              const add = (fn) =>
                cache.actions[type]?.push({ actionType: type, fn })
              u.forEach(add, u.values(args[type] as any))
            }, c.groupedActionTypes)
          }
        }
      }
    },
  }

  return o
})()

export default nui
