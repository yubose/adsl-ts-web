import invariant from 'invariant'
import get from 'lodash/get'
import set from 'lodash/set'
import merge from 'lodash/merge'
import { setUseProxies, enableES5 } from 'immer'
import { EmitObject, Identify, IfObject } from 'noodl-types'
import { createEmitDataKey, evalIf } from 'noodl-utils'
import EmitAction from './actions/EmitAction'
import ComponentCache from './cache/ComponentCache'
import createAction from './utils/createAction'
import createActionChain from './utils/createActionChain'
import createComponent from './utils/createComponent'
import getActionObjectErrors from './utils/getActionObjectErrors'
import isComponent from './utils/isComponent'
import isPage from './utils/isPage'
import NUIPage from './Page'
import ActionsCache from './cache/ActionsCache'
import PageCache from './cache/PageCache'
import PluginCache from './cache/PluginCache'
import RegisterCache from './cache/RegisterCache'
import Resolver from './Resolver'
import store from './store'
import VP from './Viewport'
import resolveAsync from './resolvers/resolveAsync'
import resolveComponents from './resolvers/resolveComponents'
import resolveStyles from './resolvers/resolveStyles'
import resolveDataAttribs from './resolvers/resolveDataAttribs'
import { isPromise, promiseAllSafely } from './utils/common'
import {
  findIteratorVar,
  findListDataObject,
  isListConsumer,
  resolveAssetUrl,
} from './utils/noodl'
import { actionTypes as nuiActionTypes, nuiEmitType } from './constants'
import * as u from './utils/internal'
import * as T from './types'

enableES5()
setUseProxies(false)

const NUI = (function _NUI() {
  const cache = {
    actions: new ActionsCache(),
    component: new ComponentCache(),
    page: new PageCache(),
    plugin: new PluginCache(),
    register: new RegisterCache(),
  }

  function _createSrc(args: {
    component: T.NUIComponent.Instance
    page: NUIPage
  }): Promise<string>
  function _createSrc(
    path: EmitObject,
    opts?: {
      component: T.NUIComponent.Instance
      context?: Record<string, any>
    },
  ): Promise<string>
  function _createSrc(path: IfObject): string
  function _createSrc(path: string): string
  function _createSrc(
    args:
      | EmitObject
      | IfObject
      | {
          context?: Record<string, any>
          component: T.NUIComponent.Instance
          page: NUIPage
        }
      | string,
    opts?: {
      component?: T.NUIComponent.Instance
      context?: Record<string, any>
    },
  ) {
    let component: T.NUIComponent.Instance
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
        component = opts?.component as T.NUIComponent.Instance
        // TODO - narrow this query to avoid only using the first encountered obj
        const obj = o.getActions()?.emit?.find?.((o) => o.trigger === 'path')
        const iteratorVar =
          opts?.context?.iteratorVar || findIteratorVar(component)
        if (u.isFnc(obj?.fn)) {
          const emitObj = { ...args, actionType: 'emit' }
          const emitAction = new EmitAction('path', emitObj)
          if ('dataKey' in (emitAction.original?.emit || {})) {
            emitAction.dataKey = createEmitDataKey(
              emitObj.emit.dataKey as any,
              _getQueryObjects({
                component,
                page,
                listDataObject: opts?.context?.dataObject,
              }),
              { iteratorVar },
            )
          }
          emitAction.executor = async () => {
            const callbacks = (o.getActions().emit || []).reduce(
              (acc, obj) =>
                obj?.trigger === 'path' ? acc.concat(obj as any) : acc,
              [],
            )
            if (!callbacks.length) return ''
            const result = await Promise.race(
              callbacks.map((obj: T.Store.ActionObject) =>
                obj.fn?.(
                  emitAction,
                  o.getConsumerOptions({ component, page, path: args }),
                ),
              ),
            )
            return (u.isArr(result) ? result[0] : result) || ''
          }
          // Result returned should be a string type
          let result = emitAction.execute(args) as string | Promise<string>
          let finalizedRes = ''

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
            if (u.isFnc(val)) {
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

  async function _emit<TType extends T.TransactionId = T.TransactionId>(
    obj: T.NUIEmit.TransactionObject<TType>,
  ): Promise<Parameters<T.Transaction[TType]['callback']>[0]>
  async function _emit(opts: T.NUIEmit.RegisterObject): Promise<never>
  async function _emit<TType extends T.TransactionId = T.TransactionId>(
    opts: T.NUIEmit.TransactionObject<TType> | T.NUIEmit.RegisterObject,
  ) {
    try {
      if (opts.type === nuiEmitType.REGISTER) {
        const { args } = opts
        if (cache.register.has('_global', args.name)) {
          const obj = cache.register.get('_global', args.name)
          // TODO - Refactor this awkward code
          return obj.fn?.(obj, args.params)
        } else {
          console.log(
            `%cWarning: Emitted a register object that was not in the store`,
            `color:#FF5722;`,
            args,
          )
        }
      } else if (opts.type === nuiEmitType.TRANSACTION) {
        const fn = store.transactions[opts.transaction]?.fn
        invariant(
          u.isFnc(fn),
          `Missing a callback handler for transaction "${
            opts.transaction
          }" but received ${typeof fn}`,
          opts,
        )

        return fn?.(opts.params as string | NUIPage)
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  function _getQueryObjects(
    opts: {
      component?: T.NUIComponent.Instance
      page?: NUIPage
      queries?: () => Record<string, any> | (() => Record<string, any>)[]
      listDataObject?: any
    } = {},
  ) {
    const queries = [] as any[]
    // Query for a list data object
    if (opts?.component) {
      if (isListConsumer(opts.component)) {
        const dataObject =
          opts?.listDataObject || findListDataObject(opts.component)
        if (dataObject) {
          queries.push(dataObject)
        } else {
          console.log(
            `%cCould not find a data object for a list consumer "${opts.component.type}" component`,
            `color:#ec0000;`,
            opts.component,
          )
        }
      }
    }
    // Page object
    opts?.page && queries.push(() => o.getRoot()[opts.page?.page || ''])
    // Root object
    queries.push(() => o.getRoot())
    opts?.queries && u.array(opts.queries).forEach((q) => queries.unshift(q))
    return queries
  }

  const _transformers = [
    resolveAsync,
    resolveComponents,
    resolveStyles,
    resolveDataAttribs,
  ]

  let index = 0
  let resolver = _transformers[index]

  while (resolver) {
    resolver.next = _transformers[++index]
    resolver = resolver.next
  }

  const _transform = _transformers[0].resolve.bind(_transformers[0])

  function _resolveComponents(opts: {
    page?: NUIPage
    components: T.NUIComponent.CreateType
    context?: Record<string, any>
  }): T.NUIComponent.Instance
  function _resolveComponents(opts: {
    page: NUIPage
    components: T.NUIComponent.CreateType[]
    context?: Record<string, any>
  }): T.NUIComponent.Instance[]
  function _resolveComponents(
    page: NUIPage,
    component: T.NUIComponent.CreateType,
  ): T.NUIComponent.Instance
  function _resolveComponents(
    page: NUIPage,
    components: T.NUIComponent.CreateType[],
  ): T.NUIComponent.Instance[]
  function _resolveComponents(
    component: T.NUIComponent.CreateType,
  ): T.NUIComponent.Instance
  function _resolveComponents(
    components: T.NUIComponent.CreateType[],
  ): T.NUIComponent.Instance[]
  function _resolveComponents(
    pageProp:
      | NUIPage
      | T.NUIComponent.CreateType
      | T.NUIComponent.CreateType[]
      | {
          page?: NUIPage
          components: T.NUIComponent.CreateType | T.NUIComponent.CreateType[]
          context?: Record<string, any>
        },
    componentsProp?: T.NUIComponent.CreateType | T.NUIComponent.CreateType[],
  ) {
    let isArr = true
    let resolvedComponents: T.NUIComponent.Instance[] = []
    let components: T.NUIComponent.CreateType[] = []
    let page: NUIPage
    let context: Record<string, any> = {}

    if (isPage(pageProp)) {
      page = pageProp
      components = u.array(componentsProp) as T.NUIComponent.CreateType[]
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

    function xform(c: T.NUIComponent.Instance) {
      _transform(c, o.getConsumerOptions({ component: c, page, context }))
      return c
    }

    components.forEach((c, i) => {
      const component = createComponent(c as T.NUIComponent.Instance)
      component.ppath = `[${i}]`
      resolvedComponents.push(xform(component))
    })

    return isArr ? resolvedComponents : resolvedComponents[0]
  }

  const o = {
    _defineGetter(
      key: string,
      opts: ((...args: any[]) => any) | PropertyDescriptor,
    ) {
      Object.defineProperty(this, key, {
        get: u.isFnc(opts) ? () => opts : () => opts.get,
      })
    },
    cache,
    createPage(
      args?:
        | string
        | {
            name?: string
            id?: string
            viewport?: VP | { width?: number; height?: number }
          },
      opts:
        | { viewport?: VP | { width?: number; height?: number } }
        | never = {},
    ) {
      let name: string = ''
      let id: string | undefined = undefined
      let page: NUIPage | undefined
      let viewport: VP | undefined

      if (u.isStr(args)) {
        name = args
        if (opts?.viewport) {
          if (opts.viewport instanceof VP) viewport = opts.viewport
          else if (u.isObj(opts.viewport)) viewport = new VP(opts.viewport)
        }
      } else if (u.isObj(args)) {
        args.name && (name = args.name)
        args.id && (id = args.id)
        if (args?.viewport) {
          if (args.viewport instanceof VP) viewport = args.viewport
          else if (u.isObj(args.viewport)) viewport = new VP(args.viewport)
        }
      }

      page = cache.page.create({ id, viewport: viewport as VP })
      name && (page.page = name)
      page.use(() =>
        page?.page ? NUI.getRoot()[page.page] : { components: [] },
      )

      return page
    },
    createPlugin(
      location:
        | T.Plugin.Location
        | T.Plugin.ComponentObject
        | T.NUIComponent.Instance = 'head',
      obj?: T.NUIComponent.Instance | T.Plugin.ComponentObject,
    ) {
      let _location = '' as T.Plugin.Location
      let _path = ''

      if (u.isStr(location)) {
        _location = location
      } else {
        _location = location?.type === 'pluginBodyTail' ? 'body-bottom' : 'head'
        obj = location
      }
      _path = isComponent(obj) ? obj.blueprint?.path : obj?.path

      invariant(!!_path, `Path is required`)
      invariant(u.isStr(_path), `Path is not a string`)

      const id = _path
      const plugin = {
        id,
        content: '',
        initiated: false,
        location: _location,
        path: _path,
      } as T.Plugin.Object

      !cache.plugin.has(id) && cache.plugin.add(_location, plugin)
      return plugin
    },
    createActionChain(
      trigger: T.NUITrigger,
      actions: T.NUIActionObjectInput | T.NUIActionObjectInput[],
      opts?: {
        component?: T.NUIComponent.Instance
        context?: Record<string, any>
        loadQueue?: boolean
        page?: NUIPage
      },
    ) {
      if (!u.isArr(actions)) actions = [actions]

      const actionChain = createActionChain({
        actions: actions?.reduce((acc: T.NUIActionObject[], obj) => {
          const errors = getActionObjectErrors(obj)
          if (errors.length) {
            errors.forEach((errMsg) => {
              console.log(`%c${errMsg}`, `color:#ec0000;`, obj)
            })
          }

          if (u.isObj(obj) && !('actionType' in obj)) {
            if (Identify.emit(obj)) obj = { ...obj, actionType: 'emit' }
            else if (Identify.goto(obj)) obj = { ...obj, actionType: 'goto' }
            else if (Identify.toast(obj)) obj = { ...obj, actionType: 'toast' }
          } else if (u.isFnc(obj)) {
            obj = { actionType: 'anonymous', fn: obj }
          }
          return acc.concat(obj as T.NUIActionObject[])
        }, []),
        trigger,
        loader: (objs) => {
          function __createExecutor(
            action: T.NUIAction,
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
                    return obj.fn?.(action as any, {
                      ...options,
                      component: opts?.component,
                      event: event as any,
                      ref: actionChain,
                    })
                  },
                )
                results = await promiseAllSafely(
                  callbacks,
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
                const iteratorVar =
                  opts?.context?.iteratorVar || findIteratorVar(opts.component)
                const dataObject = opts?.context?.dataObject

                if (obj.emit?.dataKey) {
                  action.dataKey = createEmitDataKey(
                    obj.emit.dataKey as any,
                    _getQueryObjects({
                      component: opts.component,
                      page: opts.page,
                      listDataObject: dataObject,
                    }),
                    { iteratorVar },
                  )
                }
              }

              const callbacks =
                o.getActions()?.emit?.filter?.((o) => o.trigger === trigger) ||
                []

              action.executor = __createExecutor(
                action,
                callbacks,
                o.getConsumerOptions({
                  component: opts?.component,
                  page: opts?.page as NUIPage,
                }),
              )

              return action
            }

            const action = createAction(trigger, obj)

            action.executor = __createExecutor(
              action,
              (Identify.action.builtIn(obj)
                ? o.getBuiltIns()[obj.funcName]
                : Identify.goto(obj)
                ? o.getActions().goto
                : Identify.toast(obj)
                ? o.getActions().toast
                : o.getActions()[obj.actionType]) || [],
              o.getConsumerOptions({
                component: opts?.component,
                page: opts?.page as NUIPage,
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
    getBaseStyles({
      component,
      page = o.getRootPage(),
    }: {
      component: T.NUIComponent.Instance
      page: any
    }) {
      const originalStyle = component?.blueprint?.style || {}
      const styles = { ...originalStyle } as any

      if (VP.isNil(originalStyle?.top) || originalStyle?.top === 'auto') {
        styles.position = 'relative'
      } else {
        styles.position = 'absolute'
      }

      if (u.isNil(originalStyle.height)) styles.height = 'auto'

      return merge(
        {
          ...o.getRoot().Style,
          position: 'absolute',
          outline: 'none',
        },
        originalStyle,
        styles,
      )
    },
    getConsumerOptions({
      component,
      page,
      context,
    }: {
      component?: T.NUIComponent.Instance
      page: NUIPage
      context?: Record<string, any>
    } & { [key: string]: any }) {
      return {
        ...o,
        cache,
        component,
        context, // Internal context during component resolving
        get createPage() {
          return o.createPage
        },
        createActionChain(
          trigger: T.NUITrigger,
          actions: T.NUIActionObject | T.NUIActionObject[],
          {
            context: contextProp,
            loadQueue = true,
          }: { context?: Record<string, any>; loadQueue?: boolean } = {},
        ) {
          return o.createActionChain(trigger, actions, {
            loadQueue,
            context: { ...context, ...contextProp },
            component,
            page,
          })
        },
        get createPlugin() {
          return o.createPlugin
        },
        createSrc: _createSrc,
        emit: _emit,
        getBaseStyles(c: T.NUIComponent.Instance) {
          return o.getBaseStyles?.({ component: c, page })
        },
        get getQueryObjects() {
          return _getQueryObjects
        },
        page,
        get resolveComponents() {
          return _resolveComponents
        },
        get viewport() {
          return page?.viewport
        },
      }
    },
    getPlugins: (location?: T.Plugin.Location) => cache.plugin.get(location),
    getPages: () => [] as string[],
    getPreloadPages: () => [] as string[],
    getRoot: () => ({} as Record<string, any>),
    getRootPage() {
      if (!cache.page.has('root')) {
        return cache.page.create({ viewport: new VP() })
      }
      return u.array(cache.page.get('root'))[0]?.page as NUIPage
    },
    getResolvers: () => _transformers,
    getTransactions: () => store.transactions,
    resolveComponents: _resolveComponents,
    reset(
      filter?:
        | (
            | 'actions'
            | 'builtIns'
            | 'components'
            | 'pages'
            | 'plugins'
            | 'resolvers'
            | 'transactions'
          )
        | (
            | 'actions'
            | 'builtIns'
            | 'components'
            | 'pages'
            | 'plugins'
            | 'resolvers'
            | 'transactions'
          )[],
    ) {
      if (filter) {
        u.array(filter).forEach((f: typeof filter) => {
          if (f === 'actions') {
            u.values(o.getActions()).forEach((obj) => (obj.length = 0))
          } else if (f === 'builtIns') {
            u.values(o.getBuiltIns()).forEach((obj) => (obj.length = 0))
          } else if (f === 'components') {
            cache.component.clear()
          } else if (f === 'pages') {
            cache.page.clear()
          } else if (f === 'plugins') {
            cache.plugin.clear()
          } else if (f === 'resolvers') {
            o.getResolvers().length = 0
          } else if (f === 'transactions') {
            u.keys(o.getTransactions()).forEach(
              (k) => delete o.getTransactions()[k],
            )
          }
        })
      } else {
        o.getResolvers().length = 0
        u.values(o.getActions()).forEach((obj) => (obj.length = 0))
        u.values(o.getBuiltIns()).forEach((obj) => (obj.length = 0))
        u.keys(o.getTransactions()).forEach(
          (k) => delete o.getTransactions()[k],
        )
        cache.component.clear()
        cache.page.clear()
        cache.plugin.clear()
        cache.register.clear()
      }
      o._defineGetter('getAssetsUrl', () => '')
      o._defineGetter('getBaseUrl', () => '')
      o._defineGetter('getPages', () => [])
      o._defineGetter('getPreloadPages', () => [])
      o._defineGetter('getRoot', () => '')
    },
    use(
      args:
        | ({
            action?: T.Use.Action
            builtIn?: T.Use.BuiltIn
            emit?: T.Use.Emit
            register?: T.Use.Register
            transaction?: T.Use.Transaction
            getAssetsUrl?: T.Use.GetAssetsUrl
            getBaseUrl?: T.Use.GetBaseUrl
            getPages?: T.Use.GetPages
            getPreloadPages?: T.Use.GetPreloadPages
            getRoot?: T.Use.GetRoot
          } & Partial<
            Record<
              Exclude<T.NUIActionType, 'builtIn' | 'emit' | 'register'>,
              T.Store.ActionObject['fn'] | T.Store.ActionObject['fn'][]
            >
          >)
        | (
            | T.Store.ActionObject
            | T.Store.BuiltInObject
            | T.Use.Emit
            | (T.Store.ActionObject | T.Store.BuiltInObject)[]
            | T.Plugin.Object
            | T.Use.Resolver
          ),
    ) {
      const getArr = <O extends Record<string, any>, K extends keyof O>(
        obj: O,
        path: K,
      ) => {
        if (!u.isArr(get(obj, path))) set(obj, path, [])
        return get(obj, path)
      }

      const useAction = (
        actionType: T.NUIActionType,
        opts:
          | T.Store.ActionObject
          | T.Store.BuiltInObject
          | T.Store.ActionObject['fn'],
      ) => {
        if (actionType === 'builtIn') {
          invariant('funcName' in opts, `Missing funcName for a builtIn`)
          if (u.isObj(opts)) {
            opts.actionType = actionType
            getArr(o.getBuiltIns(), opts.funcName).push(opts)
          }
        } else if (actionType === 'emit') {
          const getEmitArr = () => o.getActions().emit
          u.array(opts).forEach((opt) => {
            if ('trigger' in opt) {
              invariant(
                u.isFnc(opt.fn),
                `fn is required for emit trigger "${opt.trigger}"`,
              )
              getEmitArr().push({ ...opt, actionType: 'emit' })
            } else {
              u.entries(opt).forEach(([trigger, opt]) => {
                u.array(opt).forEach((fn) => {
                  if (u.isFnc(fn)) {
                    getEmitArr().push({
                      actionType: 'emit',
                      fn,
                      trigger: trigger as T.NUITrigger,
                    })
                  }
                })
              })
            }
          })
        } else {
          if (u.isFnc(opts)) {
            getArr(o.getActions(), actionType).push({ actionType, fn: opts })
          } else if (u.isObj(opts)) {
            getArr(o.getActions(), actionType).push({ ...opts, actionType })
          }
        }
      }

      if (args instanceof Resolver) {
        if (
          args.name &&
          o.getResolvers().every((resolver) => resolver.name !== args.name)
        ) {
          o.getResolvers().push(args)
        }
      } else if ('location' in args) {
        invariant(
          ['head', 'body-top', 'body-bottom'].includes(
            args.location as T.Plugin.Location,
          ),
          `Invalid plugin location "${args.location}". Available options are: ` +
            `"head", "body-top", and "body-bottom"`,
        )
        if (!o.cache.plugin.has(args.path as string)) {
          o.cache.plugin.add(args.location as T.Plugin.Location, args)
        }
      } else if ('register' in args) {
        u.array(args.register as T.Register.Object).forEach((obj) => {
          let page = obj.page || '_global'
          let name = obj.name || (obj.component && obj.component.onEvent) || ''
          invariant(
            !!name,
            `Could not locate an identifier/name for this register object`,
            obj,
          )
          if (!o.cache.register.has(page, name)) {
            o.cache.register.set(page, name, obj)
          }
        })
      } else if ('transaction' in args) {
        u.entries(args.transaction).forEach(([tid, fn]) => {
          o.getTransactions()[tid] = { ...o.getTransactions()[tid], fn }
        })
      } else {
        if ('actionType' in args && !('funcName' in args)) {
          invariant(u.isFnc(args.fn), 'fn is not a function')
          useAction(args.actionType, args)
        } else if ('funcName' in args) {
          invariant(!!args.funcName, `"funcName" is required`)
          invariant(u.isFnc(args.fn), 'fn is not a function')
          useAction('builtIn', args)
        } else if ('emit' in args) {
          useAction('emit', args.emit as T.Store.ActionObject)
        } else {
          for (const [key, val] of u.entries(args)) {
            if (key === 'action') {
              u.entries(val).forEach(([k, v]) => {
                if (k === 'emit') {
                  useAction('emit', v)
                } else {
                  if (u.isArr(v)) {
                    v.forEach((_v) => {
                      useAction(
                        k as T.Store.ActionObject['actionType'],
                        u.isFnc(_v) ? { actionType: k, fn: _v } : _v,
                      )
                    })
                  } else {
                    useAction(
                      k as T.Store.ActionObject['actionType'],
                      u.isFnc(v) ? { actionType: k, fn: v } : v,
                    )
                  }
                }
              })
            } else if (key === 'builtIn') {
              if ('funcName' in val) {
                useAction(key, val)
              } else {
                u.entries(val).forEach(([funcName, v]) => {
                  if (u.isArr(v)) {
                    v.forEach((o) => {
                      if (u.isFnc(o)) {
                        useAction(key, {
                          funcName,
                          fn: o,
                        } as T.Store.BuiltInObject)
                      } else if (u.isObj(o)) {
                        useAction(key, {
                          ...o,
                          funcName,
                        } as T.Store.BuiltInObject)
                      }
                    })
                  } else if (u.isFnc(v)) {
                    useAction(key, { funcName, fn: v } as T.Store.BuiltInObject)
                  } else if (u.isObj(v)) {
                    useAction(key, { ...v, funcName } as T.Store.BuiltInObject)
                  }
                })
              }
            } else if (key === 'emit') {
              useAction(key, val)
            } else {
              if (nuiActionTypes.includes(key as T.NUIActionType)) {
                u.array(val).forEach((v) =>
                  useAction(key as T.NUIActionType, v),
                )
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
                o._defineGetter(key, val)
              }
            }
          }
        }
      }

      return o
    },
  }

  return o
})()

export default NUI
