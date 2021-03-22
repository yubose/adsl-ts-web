import merge from 'lodash/merge'
import { setUseProxies, enableES5 } from 'immer'
import { LiteralUnion } from 'type-fest'
import { ActionObject, EmitObject, Identify, IfObject } from 'noodl-types'
import { createEmitDataKey, evalIf } from 'noodl-utils'
import EmitAction from './actions/EmitAction'
import ComponentCache from './cache/ComponentCache'
import ComponentResolver from './Resolver'
import createAction from './utils/createAction'
import createActionChain from './utils/createActionChain'
import createComponent from './utils/createComponent'
import isComponent from './utils/isComponent'
import isPage from './utils/isPage'
import NUIPage from './Page'
import PageCache from './cache/PageCache'
import RegisterCache from './cache/RegisterCache'
import store from './store'
import Viewport from './Viewport'
import resolveAsync from './resolvers/resolveAsync'
import resolveComponents from './resolvers/resolveComponents'
import resolveStyles from './resolvers/resolveStyles'
import resolveDataAttribs from './resolvers/resolveDataAttribs'
import { isPromise, promiseAllSafely, toNumber } from './utils/common'
import {
  findIteratorVar,
  findListDataObject,
  resolveAssetUrl,
} from './utils/noodl'
import * as u from './utils/internal'
import * as T from './types'

enableES5()
setUseProxies(false)

export interface RegisterCallbacks {
  [key: string]: {
    onEvent?: {
      [eventName: string]: {
        component: T.ComponentInstance
        key: string
        id: string
        prop: 'onEvent'
        fn: (emittedArgs: {
          key: string
          id: string
          prop: 'onEvent'
          data: any
        }) => Promise<any>
      }
    }
  }
}

const NOODLUI = (function _NOODLUI() {
  const cache = {
    component: new ComponentCache(),
    page: new PageCache(),
    register: new RegisterCache(),
  }

  function _defineGetter(
    key: string,
    opts: ((...args: any[]) => any) | PropertyDescriptor,
  ) {
    // const descriptor = Object.getOwnPropertyDescriptor(o, key)
    // descriptor && (descriptor.get = u.isFnc(opts) ? () => opts : () => opts.get)
    Object.defineProperty(o, key, {
      get: u.isFnc(opts) ? () => opts : () => opts.get,
    })
  }

  function finalizeActionObjects(actions: T.NOODLUIActionObjectInput[]) {
    return actions?.reduce(
      (
        acc: (ActionObject | T.EmitActionObject | T.GotoActionObject)[],
        obj,
      ) => {
        if (u.isObj(obj) && !('actionType' in obj)) {
          if (Identify.emit(obj)) obj = { ...obj, actionType: 'emit' }
          else if (Identify.goto(obj)) obj = { ...obj, actionType: 'goto' }
        }
        return acc.concat(obj as ActionObject)
      },
      [],
    )
  }

  function _createPage(
    args?: {
      name?: string
      viewport?: Viewport | { width?: number; height?: number }
    },
    never?: never,
  ): NUIPage
  function _createPage(
    args?:
      | string
      | {
          name?: string
          viewport?: Viewport | { width?: number; height?: number }
        },
    opts: { viewport?: Viewport | { width?: number; height?: number } } = {},
  ) {
    let name: string = ''
    let page: NUIPage | undefined
    let viewport: Viewport | undefined
    if (u.isStr(args)) {
      name = args
      if (opts?.viewport) {
        if (opts.viewport instanceof Viewport) viewport = opts.viewport
        else if (u.isObj(opts.viewport)) viewport = new Viewport(opts.viewport)
      }
    } else if (u.isObj(args)) {
      args.name && (name = args.name)
      if (args?.viewport) {
        if (args.viewport instanceof Viewport) viewport = args.viewport
        else if (u.isObj(args.viewport)) viewport = new Viewport(args.viewport)
      }
    }
    page = cache.page.create({ viewport: viewport as Viewport })
    name && (page.page = name)
    return page
  }

  function _createSrc(args: {
    component: T.ComponentInstance
    page: NUIPage
  }): Promise<string>
  function _createSrc(
    path: EmitObject,
    opts?: { component: T.ComponentInstance },
  ): Promise<string>
  function _createSrc(path: IfObject): string
  function _createSrc(path: string): string
  function _createSrc(
    args:
      | EmitObject
      | IfObject
      | { component: T.ComponentInstance; page: NUIPage }
      | string,
    opts?: { component?: T.ComponentInstance },
  ) {
    let component: T.ComponentInstance
    let page: NUIPage = o.getRootPage()

    if (u.isStr(args)) {
      // Components of type "page" can have a path that points directly to a page
      // ex: path: "LeftPage"
      if ([...o.getPages(), ...o.getPreloadPages()].includes(args)) {
        const pageLink = o.getBaseUrl() + args + '_en.yml'
        setTimeout(() => component?.emit('path', pageLink))
        return pageLink
      }
      return resolveAssetUrl(args, o.getAssetsUrl())
    } else if (u.isObj(args)) {
      if (Identify.emit(args)) {
        component = opts?.component as T.ComponentInstance
        // TODO - narrow this query to avoid only using the first encountered obj
        const obj = o.getActions().emit?.find?.((o) => o.trigger === 'path')
        const iteratorVar = findIteratorVar(component)

        if (u.isFnc(obj?.fn)) {
          const emitObj = { ...args, actionType: 'emit' }
          const emitAction = new EmitAction('path', emitObj)
          if ('dataKey' in (emitAction.original?.emit || {})) {
            emitAction.dataKey = createEmitDataKey(
              emitObj.emit.dataKey as any,
              [
                findListDataObject(component),
                () => o.getRoot()[page.page],
                () => o.getRoot(),
              ],
              { iteratorVar },
            )
          }

          emitAction.executor = async (snapshot) => {
            const callbacks = (o.getActions().emit || []).reduce(
              (acc, obj) => (obj?.trigger === 'path' ? acc.concat(obj) : acc),
              [],
            )

            if (!callbacks.length) return ''

            const result = await Promise.race(
              callbacks.map((obj: T.Store.ActionObject) =>
                obj.fn?.(
                  emitAction,
                  this.getConsumerOptions({ component, path: args }),
                ),
              ),
            )

            return (u.isArr(result) ? result[0] : result) || ''
          }

          // Result returned should be a string type
          let result = emitAction.execute(args) as string | Promise<string>
          let finalizedRes = ''

          console.log(`%cResult received from emit action`, `color:#95a5a6;`, {
            action: emitAction,
            result,
          })

          if (isPromise(result)) {
            return result
              .then((res) => {
                if (u.isStr(res) && res.startsWith('http')) {
                  finalizedRes = res
                } else {
                  finalizedRes = resolveAssetUrl(String(res), o.getAssetsUrl())
                }
                component?.emit('path', finalizedRes)
                return finalizedRes
              })
              .catch((err) => Promise.reject(err))
          }
          if (result) {
            if (u.isStr(result) && result.startsWith('http')) {
              finalizedRes = result
              component?.emit('path', finalizedRes)
              return result
            }
            finalizedRes = resolveAssetUrl(result, o.getAssetsUrl())
            component?.emit('path', finalizedRes)
          }
        }
      } else if (Identify.if(args)) {
        return resolveAssetUrl(
          evalIf((val: any) => {
            if (Identify.isBoolean(val)) return Identify.isBooleanTrue(val)
            if (typeof val === 'function') {
              if (component) return val(findListDataObject(component))
              return val()
            }
            return !!val
          }, args as IfObject),
          o.getAssetsUrl(),
        )
      } else {
      }
    }
  }

  function _emit(
    evt: LiteralUnion<'register', string>,
    {
      page = '_global',
      data = null,
      registerEvent = '',
    }: {
      data?: any
      page: T.Register.Page
      registerEvent: string
    } & { [key: string]: any },
  ) {
    if (evt === 'register') {
      if (cache.register.has(page, registerEvent)) {
        const register = cache.register.get(
          page,
          registerEvent,
        ) as T.Register.Object
        register.callback(data)
      } else {
        //
      }
    }
  }

  function _getBaseStyles({
    component,
    page = o.getRootPage(),
  }: {
    component: T.ComponentInstance
    page: any
  }) {
    const originalStyle = component?.blueprint?.style || {}
    const styles = { ...originalStyle } as any

    // if (styles?.top === 'auto') styles.top = '0'
    if (!('top' in originalStyle)) styles.top = '0'
    if (isComponent(component)) {
      const parent = component.parent
      let top

      if (parent) {
        let parentTop = parent?.style?.top
        let parentHeight = parent?.style?.height

        // if (parentTop === 'auto') parentTop = '0'
        if (parentTop !== undefined) {
          top =
            parentTop == 'auto'
              ? 0
              : Viewport.getSize(parentTop, page?.viewport?.height)
        }
        if (parentHeight !== undefined) {
          top = Viewport.getSize(
            top + toNumber(parentHeight === 'auto' ? '0' : parentHeight),
            page?.viewport.height as number,
          )
        }

        if (u.isNum(top)) {
          top =
            page?.viewport.height - Viewport.getSize(top, page.viewport.height)
          styles.top = Viewport.getSize(top, page?.viewport.height, {
            unit: 'px',
          })
          if (!('height' in originalStyle)) {
            styles.height = 'auto'
          }
        }
      }

      if (!('top' in originalStyle) && !('height' in originalStyle)) {
        styles.position = 'relative'
        styles.height = 'auto'
      }

      if (!('height' in styles)) {
        styles.height = 'auto'
      }
    } else if (u.isObj(component)) {
      //
    }

    return merge(
      {
        ...o.getRoot().Style,
        position: 'absolute',
        outline: 'none',
      },
      originalStyle,
      styles,
    )
  }

  function _getResolverChain(
    ...resolvers: ComponentResolver<
      (...args: T.ComponentResolverArgs) => void
    >[]
  ) {
    let index = 0
    let resolver = resolvers[index]

    while (resolver) {
      resolver.next = resolvers[++index]
      resolver = resolver.next
    }

    return function resolve(
      component: T.ComponentInstance,
      options: T.ConsumerOptions,
    ) {
      return resolvers[0].resolve(component, options)
    }
  }

  function _getConsumerOptions({
    component,
    page,
    context,
  }: {
    component?: T.ComponentInstance
    page: ReturnType<PageCache['create']>
    context?: Record<string, any>
  } & { [key: string]: any }) {
    return {
      ...o,
      cache,
      component,
      context, // Internal context during component resolving
      createPage: _createPage,
      createActionChain(
        trigger: T.NOODLUITrigger,
        actions: T.NOODLUIActionObject | T.NOODLUIActionObject[],
        { loadQueue = true }: { loadQueue?: boolean } = {},
      ) {
        return o.createActionChain(trigger, actions, {
          loadQueue,
          component,
          page,
        })
      },
      createSrc: _createSrc,
      getBaseStyles: (c: T.ComponentInstance) =>
        o.getBaseStyles?.({ component: c, page }),
      getQueryObjects: _getQueryObjects,
      page,
      resolveComponents: _resolveComponents,
      viewport: page?.viewport,
    }
  }

  function _getPlugins(location: 'head'): T.Store.PluginObject[]
  function _getPlugins(location: 'body-top'): T.Store.PluginObject[]
  function _getPlugins(location: 'body-bottom'): T.Store.PluginObject[]
  function _getPlugins(location?: T.Store.PluginObject['location']) {
    switch (location) {
      case 'head':
        return store?.plugins?.head
      case 'body-top':
        return store?.plugins?.body.top
      case 'body-bottom':
        return store?.plugins?.body.bottom
      default:
        return store?.plugins
    }
  }

  function _getQueryObjects(
    opts: {
      component?: T.ComponentInstance
      page?: ReturnType<PageCache['create']>
      queries?: () => Record<string, any> | (() => Record<string, any>)[]
    } = {},
  ) {
    const queries = []
    if (opts?.component) {
      queries.push(findListDataObject(opts.component))
    }
    if (opts?.page) {
      queries.push(() => o.getRoot()[opts.page?.page || ''])
    }
    queries.push(() => o.getRoot())
    opts?.queries &&
      (u.isArr(opts.queries) ? opts.queries : [opts.queries]).forEach((q) =>
        queries.unshift(q),
      )
    return queries
  }

  const _transform = _getResolverChain(
    resolveAsync,
    resolveComponents,
    resolveStyles,
    resolveDataAttribs,
  )

  function _resolveComponents(opts: {
    page?: ReturnType<PageCache['create']>
    components: T.ComponentCreationType
    context?: Record<string, any>
  }): T.ComponentInstance
  function _resolveComponents(opts: {
    page: ReturnType<PageCache['create']>
    components: T.ComponentCreationType[]
    context?: Record<string, any>
  }): T.ComponentInstance[]
  function _resolveComponents(
    page: ReturnType<PageCache['create']>,
    component: T.ComponentCreationType,
  ): T.ComponentInstance
  function _resolveComponents(
    page: ReturnType<PageCache['create']>,
    component: T.ComponentCreationType[],
  ): T.ComponentInstance[]
  function _resolveComponents(
    component: T.ComponentCreationType[],
    _?: never,
  ): T.ComponentInstance[]
  function _resolveComponents(
    pageProp:
      | ReturnType<PageCache['create']>
      | T.ComponentCreationType
      | T.ComponentCreationType[]
      | {
          page?: ReturnType<PageCache['create']>
          components: T.ComponentCreationType | T.ComponentCreationType[]
          context?: Record<string, any>
        },
    componentsProp?: T.ComponentCreationType | T.ComponentCreationType[],
  ) {
    let isArr = true
    let resolvedComponents: T.ComponentInstance[] = []
    let components: T.ComponentCreationType[] = []
    let page: ReturnType<PageCache['create']>
    let context: Record<string, any> = {}

    if (isPage(pageProp)) {
      page = pageProp
      components = u.array(componentsProp) as T.ComponentCreationType[]
      isArr = u.isArr(componentsProp)
    } else if (u.isArr(pageProp)) {
      components = pageProp
      // Missing page. Default to root page
      page = o.getRootPage()
    } else if (u.isObj(pageProp)) {
      // Missing page. Default to root page
      if ('type' in pageProp || 'children' in pageProp || 'style' in pageProp) {
        components = [pageProp]
        page = o.getRootPage()
        isArr = false
      } else {
        components = u.array(pageProp.components)
        page = 'page' in pageProp ? pageProp.page : o.getRootPage()
        context = pageProp.context || context
        isArr = u.isArr(pageProp.components)
      }
    }

    function xform(c: T.ComponentInstance) {
      _transform(c, _getConsumerOptions({ component: c, page, context }))
      return c
    }

    components.forEach((c: T.ComponentInstance) =>
      resolvedComponents.push(xform(createComponent(c))),
    )

    return isArr ? resolvedComponents : resolvedComponents[0]
  }

  function _use(
    mod:
      | T.Store.ActionObject
      | T.Store.BuiltInObject
      | T.Store.PluginObject
      | T.Store.RegisterObject
      | T.Store.ObserverObject
      | ComponentResolver<any>
      | {
          getAssetsUrl?(): string
          getBaseUrl?(): string
          getPages?(): string[]
          getPreloadPages?(): string[]
          getRoot?(): Record<string, any>
          getPlugins?: T.PluginCreationType[]
        },
  ) {
    if (mod) {
      if ('funcName' in mod) {
        store.use(mod)
      } else if ('actionType' in mod) {
        store.use(mod)
      } else if ('location' in mod) {
        store.use(mod)
      } else if ('registerEvent' in mod) {
        if (!cache.register.has(mod.page, mod.name)) {
          cache.register.set(mod.page, mod.name, mod)
        }
      } else if ('resolve' in mod) {
        store.use(mod)
      } else if (mod) {
        if ('getAssetsUrl' in mod && mod.getAssetsUrl) {
          _defineGetter('getAssetsUrl', mod.getAssetsUrl)
        }
        if ('getBaseUrl' in mod && mod.getBaseUrl) {
          _defineGetter('getBaseUrl', mod.getBaseUrl)
        }
        if ('getPages' in mod && mod.getPages) {
          _defineGetter('getPages', mod.getPages)
        }
        if ('getPreloadPages' in mod && mod.getPreloadPages) {
          _defineGetter('getPreloadPages', mod.getPreloadPages)
        }
        if ('getRoot' in mod && mod.getRoot) {
          _defineGetter('getRoot', mod.getRoot)
        }
        if ('getPlugins' in mod && mod.getPlugins) {
          // o.getPlugins = mod.getPlugins
        }
      }
    }

    return this
  }

  const o = {
    cache,
    createPage: _createPage,
    createActionChain(
      trigger: T.NOODLUITrigger,
      actions: T.NOODLUIActionObjectInput | T.NOODLUIActionObjectInput[],
      opts?: {
        component?: T.ComponentInstance
        loadQueue?: boolean
        page?: ReturnType<PageCache['create']>
      },
    ) {
      if (!u.isArr(actions)) actions = [actions]

      const actionChain = createActionChain({
        actions: finalizeActionObjects(actions),
        trigger,
        loader(this: T.NOODLUIActionChain, objs) {
          function __createExecutor(
            action: T.NOODLUIAction,
            fns: (T.Store.ActionObject | T.Store.BuiltInObject)[] = [],
            options: T.ConsumerOptions,
          ) {
            return async function executeActionChain<E = any>(event: E) {
              let results = [] as (Error | any)[]
              if (fns.length) {
                const callbacks = fns.map(
                  async function executeActionChainCallback(
                    obj: T.Store.ActionObject | T.Store.BuiltInObject,
                  ) {
                    return obj.fn?.(action, {
                      ...options,
                      component: opts?.component,
                      event,
                      ref: actionChain,
                    })
                  },
                )
                results = await promiseAllSafely(
                  callbacks as any[],
                  (err, result) => err || result,
                )
              }
              return results.length < 2 ? results[0] : results
            }
          }

          return objs.map((obj) => {
            if (Identify.emit(obj)) {
              const action = createAction(
                trigger,
                // Filter out unwanted props (ex: a register component that has an emit)
                'type' in obj ? { emit: obj.emit } : obj,
              )

              if (opts?.component) {
                const iteratorVar = findIteratorVar(opts.component)
                action.dataKey = obj.emit?.dataKey
                  ? iteratorVar && obj.emit?.dataKey === iteratorVar
                    ? findListDataObject(opts.component)
                    : createEmitDataKey(
                        obj.emit.dataKey,
                        _getQueryObjects({
                          component: opts.component,
                          page: opts.page,
                        }),
                        { iteratorVar },
                      )
                  : undefined
              }

              const callbacks =
                store.actions?.emit?.filter?.((o) => o.trigger === trigger) ||
                []

              action.executor = __createExecutor(
                action,
                callbacks,
                _getConsumerOptions({
                  component: opts?.component,
                  page: opts?.page as ReturnType<PageCache['create']>,
                }),
              )

              return action
            }

            const action = createAction(trigger, obj)

            action.executor = __createExecutor(
              action,
              (Identify.action.builtIn(obj)
                ? store.builtIns[obj.funcName]
                : Identify.goto(obj)
                ? store.actions.goto
                : Identify.toast(obj)
                ? store.actions.toast
                : store.actions[obj.actionType]) || [],
              _getConsumerOptions({
                component: opts?.component,
                page: opts?.page as ReturnType<PageCache['create']>,
              }),
            )

            return action
          })
        },
      })

      opts?.loadQueue && actionChain.loadQueue()

      return actionChain
    },
    createSrc: _createSrc,
    emit: _emit,
    getAssetsUrl: () => '',
    getActions: () => store.actions,
    getBuiltIns: () => store.builtIns,
    getBaseUrl: () => '',
    getBaseStyles: _getBaseStyles,
    getConsumerOptions: _getConsumerOptions,
    getPlugins: _getPlugins,
    getPages: () => [] as string[],
    getPreloadPages: () => [] as string[],
    getRoot: () => ({} as Record<string, any>),
    getRootPage() {
      if (!cache.page.has('root')) {
        return cache.page.create({ viewport: new Viewport() })
      }
      return u.array(cache.page.get('root'))[0]?.page as NUIPage
    },
    resolveComponents: _resolveComponents,
    reset(
      filter?:
        | ('actions' | 'builtIns' | 'components' | 'pages' | 'resolvers')
        | ('actions' | 'builtIns' | 'components' | 'pages' | 'resolvers')[],
    ) {
      if (filter) {
        u.array(filter).forEach((f: typeof filter) => {
          if (f === 'actions') {
            u.values(store.actions).forEach((obj) => (obj.length = 0))
          } else if (f === 'builtIns') {
            u.values(store.builtIns).forEach((obj) => (obj.length = 0))
          } else if (f === 'components') {
            cache.component.clear()
          } else if (f === 'pages') {
            cache.page.clear()
          } else if (f === 'resolvers') {
            store.resolvers.length = 0
          }
        })
      } else {
        store.resolvers.length = 0
        u.values(store.actions).forEach((obj) => (obj.length = 0))
        u.values(store.builtIns).forEach((obj) => (obj.length = 0))
        cache.component.clear()
        cache.page.clear()
      }
      _defineGetter('getAssetsUrl', () => '')
      _defineGetter('getActions', () => store.actions)
      _defineGetter('getBuiltIns', () => store.builtIns)
      _defineGetter('getBaseUrl', () => '')
      _defineGetter('getPages', () => [])
      _defineGetter('getPreloadPages', () => [])
      _defineGetter('getRoot', () => '')
    },
    use: _use,
  }

  return o
})()

export default NOODLUI
