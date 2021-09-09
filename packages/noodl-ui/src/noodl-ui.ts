import * as u from '@jsmanifest/utils'
import { OrArray } from '@jsmanifest/typefest'
import invariant from 'invariant'
import merge from 'lodash/merge'
import get from 'lodash/get'
import set from 'lodash/set'
import { isActionChain } from 'noodl-action-chain'
import type {
  ComponentObject,
  EmitObjectFold,
  IfObject,
  PageObject,
  RegisterComponentObject,
} from 'noodl-types'
import { Identify } from 'noodl-types'
import {
  createEmitDataKey,
  evalIf,
  excludeIteratorVar,
  trimReference,
} from 'noodl-utils'
import EmitAction from './actions/EmitAction'
import createAction from './utils/createAction'
import createActionChain from './utils/createActionChain'
import createComponent from './utils/createComponent'
import getActionType from './utils/getActionType'
import getActionObjectErrors from './utils/getActionObjectErrors'
import isComponent from './utils/isComponent'
import isPage from './utils/isPage'
import isViewport from './utils/isViewport'
import NUIPage from './Page'
import ActionsCache from './cache/ActionsCache'
import resolveAsync from './resolvers/resolveAsync'
import resolveComponents from './resolvers/resolveComponents'
import resolveStyles from './resolvers/resolveStyles'
import resolveSetup from './resolvers/resolveSetup'
import resolveDataAttribs from './resolvers/resolveDataAttribs'
import VP from './Viewport'
import { promiseAllSafely } from './utils/common'
import {
  findIteratorVar,
  findListDataObject,
  getPluginLocation,
  isListConsumer,
  resolveAssetUrl,
} from './utils/noodl'
import { groupedActionTypes, nuiEmitType } from './constants'
import isNUIPage from './utils/isPage'
import cache from './_cache'
import * as c from './constants'
import * as t from './types'

const NUI = (function () {
  /**
   * Determining on the type of value, this performs necessary clean operations to ensure its resources that are bound to it are removed from memory
   * @param value
   */
  function _clean(
    page: NUIPage,
    onClean?: (stats?: { componentsRemoved: number }) => void,
  ): void
  function _clean(
    value: NUIPage,
    onClean?: (stats?: { componentsRemoved: number }) => void,
  ) {
    if (isPage(value)) {
      const currentPage = value.page
      if (currentPage) {
        let componentsRemoved = 0
        for (const obj of cache.component) {
          if (obj) {
            if (obj.page === currentPage) {
              cache.component.remove(obj.component)
              componentsRemoved++
            }
          }
        }
        onClean?.({ componentsRemoved })
      }
      cache.page.remove(value)
    }
  }

  function _createComponent(
    componentObject:
      | t.NUIComponentType
      | t.NUIComponent.Instance
      | ComponentObject
      | null
      | undefined,
    page: NUIPage,
  ) {
    let component: t.NUIComponent.Instance
    if (isComponent(componentObject)) {
      component = componentObject
    } else {
      component = createComponent(componentObject as ComponentObject)
    }
    !cache.component.has(component) &&
      cache.component.add(component, page || o.getRootPage())
    return component
  }

  /**
   *  Create a url
   * @param { function } createSrc
   */
  async function _createSrc(args: {
    component: t.NUIComponent.Instance
    page: NUIPage
  }): Promise<string>
  async function _createSrc(
    path: EmitObjectFold,
    opts?: {
      component: t.NUIComponent.Instance
      context?: Record<string, any>
    },
  ): Promise<string>
  async function _createSrc(path: IfObject): Promise<string>
  async function _createSrc(path: string): Promise<string>
  async function _createSrc(
    args:
      | EmitObjectFold
      | IfObject
      | {
          context?: Record<string, any>
          component: t.NUIComponent.Instance
          page: NUIPage
        }
      | string,
    opts?: {
      component?: t.NUIComponent.Instance
      context?: Record<string, any>
    },
  ) {
    let component: t.NUIComponent.Instance | undefined
    let page: NUIPage = o.getRootPage()

    if (u.isStr(args)) {
      // Components of type "page" can have a path that points directly to a page
      // ex: path: "LeftPage"
      if ([...o.getPages(), ...o.getPreloadPages()].includes(args)) {
        const pageLink = o.getBaseUrl() + args + '_en.yml'
        component?.emit?.('path', pageLink)
        return pageLink
      }
      return resolveAssetUrl(args, o.getAssetsUrl())
    } else if (u.isObj(args)) {
      if (Identify.folds.emit(args)) {
        component = opts?.component as t.NUIComponent.Instance
        // TODO - narrow this query to avoid only using the first encountered obj
        const obj = o.cache.actions.emit.get('path')?.[0]
        const iteratorVar =
          opts?.context?.iteratorVar || findIteratorVar(component)
        if (u.isFnc(obj?.fn)) {
          const emitAction = new EmitAction('path', args)
          if ('dataKey' in args.emit) {
            emitAction.dataKey = createEmitDataKey(
              args.emit.dataKey as string,
              _getQueryObjects({
                component,
                page,
                listDataObject: opts?.context?.dataObject,
              }),
              { iteratorVar },
            )
          }
          emitAction.executor = async () => {
            const callbacks = (o.cache.actions.emit.get('path') || []).reduce(
              (acc, obj) =>
                obj?.trigger === 'path' ? acc.concat(obj as any) : acc,
              [],
            )
            if (!callbacks.length) return ''
            const result = await Promise.race(
              callbacks.map(async (obj: t.Store.ActionObject) =>
                obj.fn?.(
                  emitAction,
                  o.getConsumerOptions({ component, page, path: args }),
                ),
              ),
            )
            return (u.isArr(result) ? result[0] : result) || ''
          }
          // Result returned should be a string type
          let result = (await emitAction.execute(args)) as
            | string
            | Promise<string>

          if (u.isStr(result)) {
            if (!result.startsWith('http')) {
              result = resolveAssetUrl(result, o.getAssetsUrl())
            }
            component?.emit?.('path', result)
            return result
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

  // @ts-expect-error
  async function _emit<Evt extends string = string>(
    opts?: t.NUIEmit.EmitRegister<Evt>,
  ): Promise<any[]>

  async function _emit<Tid extends t.TransactionId = t.TransactionId>(
    obj?: t.NUIEmit.EmitTransaction<Tid>,
  ): Promise<Parameters<t.Transaction[Tid]['callback']>[0]>

  async function _emit<
    Evt extends string = string,
    Tid extends t.TransactionId = t.TransactionId,
  >(opts: t.NUIEmit.EmitRegister<Evt> | t.NUIEmit.EmitTransaction<Tid>) {
    try {
      if (opts.type === nuiEmitType.REGISTER) {
        const { event, params } = opts
        if (cache.register.has(event)) {
          const results = [] as any[]
          const obj = cache.register.get(event)
          if (obj.handler) {
            const callback = obj.handler.fn
            if (u.isFnc(callback)) {
              console.log(
                `%cThe callback exists in the handler object. It will be invoked`,
                `color:#95a5a6;`,
              )
              const result = await callback?.(obj, opts.params)
              results.push(result)
              const transactionHandler = o.cache.transactions.getHandler(
                'register',
                event,
              )
              u.isFnc(transactionHandler) && (await transactionHandler(result))
            }
            return results
          } else {
            console.log(
              `%cA handler object did not exist. A default function will be used that calls the functions in the callbacks list by default`,
              `color:#95a5a6;`,
            )
            // TODO - Refactor this awkward code
            return obj.fn?.(obj, params as t.Register.ParamsObject)
          }
        } else {
          console.log(
            `%cWarning: Emitted a register object that was not in the store`,
            `color:#FF5722;`,
            opts,
          )
        }
      } else if (opts.type === nuiEmitType.TRANSACTION) {
        return cache.transactions.get(opts.transaction)?.fn?.(opts.params)
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  function _createGetter(page?: NUIPage) {
    return function _get(
      key = '',
      {
        dataObject,
        iteratorVar = '',
        // They can optionally provide another page instance to override the page given above when determining the page name
        page: priorityPage,
        pageObject,
      }: {
        dataObject?: any
        iteratorVar?: string
        page?: NUIPage
        pageObject?: PageObject
      } = {},
    ) {
      let _path = key
      const pageName = priorityPage?.page || page?.page || ''

      if (u.isStr(_path)) {
        if (Identify.reference(_path)) {
          _path = trimReference(_path)
          if (Identify.localKey(_path)) {
            return get(pageObject || o.getRoot()?.[pageName], _path)
          } else if (Identify.rootKey(_path)) {
            return get(o.getRoot(), _path)
          }
        }

        if (iteratorVar) {
          if (_path.startsWith(iteratorVar)) {
            _path = excludeIteratorVar(_path, iteratorVar) || ''
            if (!dataObject) {
              console.log(
                `%cAttempting to retrieve a value from a list data object but a data object was not provided. This may result in an unexpected value being returned`,
                `color:#ec0000;`,
              )
            }
            return get(
              dataObject ||
                pageObject ||
                o.getRoot()?.[pageName] ||
                o.getRoot(),
              _path,
            )
          }
        }

        if (_path[0].toLowerCase() === _path[0]) {
          const value = get(dataObject, _path)
          return !u.isUnd(value) ? value : get(o.getRoot()?.[pageName], _path)
        }

        const value = get(dataObject, _path)
        if (!u.isUnd(value)) return value
        return get(o.getRoot(), _path)
      }
    }
  }

  function _getQueryObjects(
    opts: {
      component?: t.NUIComponent.Instance
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
    resolveSetup,
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

  async function _resolveComponents<
    C extends OrArray<t.NUIComponent.CreateType>,
    Context extends Record<string, any>,
  >(opts: {
    page?: NUIPage
    components: C
    context?: Context
    callback?: (
      component: t.NUIComponent.Instance,
    ) => t.NUIComponent.Instance | void
  }): Promise<
    C extends any[] ? t.NUIComponent.Instance[] : t.NUIComponent.Instance
  >

  async function _resolveComponents<
    C extends OrArray<t.NUIComponent.CreateType>,
  >(
    page: NUIPage,
    component: C,
    callback?: (
      component: t.NUIComponent.Instance,
    ) => t.NUIComponent.Instance | void,
  ): Promise<
    C extends any[] ? t.NUIComponent.Instance[] : t.NUIComponent.Instance
  >

  async function _resolveComponents<
    C extends OrArray<t.NUIComponent.CreateType>,
  >(
    component: C,
    callback?: (
      component: t.NUIComponent.Instance,
    ) => t.NUIComponent.Instance | void,
  ): Promise<
    C extends any[] ? t.NUIComponent.Instance[] : t.NUIComponent.Instance
  >

  async function _resolveComponents<
    C extends OrArray<t.NUIComponent.CreateType>,
  >(
    pageProp:
      | NUIPage
      | C
      | {
          page?: NUIPage
          components: C
          context?: Record<string, any>
          callback?: (
            component: t.NUIComponent.Instance,
          ) => t.NUIComponent.Instance | void
        },
    componentsProp?:
      | C
      | ((
          component: t.NUIComponent.Instance,
        ) => t.NUIComponent.Instance | void),
    callbackProp?: (component: C) => C | void,
  ) {
    let isArr = true
    let resolvedComponents: t.NUIComponent.Instance[] = []
    let components: t.NUIComponent.CreateType[] = []
    let page: NUIPage | undefined
    let context: Record<string, any> = {}
    let callback: ((component: C) => C | void) | undefined

    if (isPage(pageProp)) {
      page = pageProp
      if (!u.isFnc(componentsProp)) {
        components = u.array(componentsProp) as t.NUIComponent.CreateType[]
      }
      isArr = u.isArr(componentsProp)
    } else if (u.isArr(pageProp)) {
      components = pageProp
      u.isFnc(callbackProp) && (callback = callbackProp)
      if (isNUIPage(componentsProp)) page = componentsProp
      else page = o.getRootPage()
    } else if (u.isObj(pageProp)) {
      // Missing page. Default to root page
      if ('type' in pageProp || 'children' in pageProp || 'style' in pageProp) {
        components = [pageProp]
        u.isFnc(callbackProp) && (callback = callbackProp)
        page = isNUIPage(componentsProp) ? componentsProp : o.getRootPage()
        isArr = false
      } else {
        callback = pageProp.callback
        components = u.array(pageProp.components)
        page = 'page' in pageProp ? pageProp.page : o.getRootPage()
        context = pageProp.context || context
        isArr = u.isArr(pageProp.components)
      }
    }

    async function xform(
      c: t.NUIComponent.Instance,
      cb?: (
        component: t.NUIComponent.Instance,
      ) => t.NUIComponent.Instance | void,
    ) {
      const options = o.getConsumerOptions({
        callback: cb,
        component: c,
        page: page as NUIPage,
        context,
      })
      await _transform(c, options)
      const iteratorVar = options?.context?.iteratorVar || ''
      const isListConsumer =
        iteratorVar && u.isObj(options?.context?.dataObject)

      for (const [key, value] of u.entries(c.props)) {
        if (key === 'style') {
          // TODO - Put these finalizers into a curry utility func. This is temp. hardcoded for now
          if (isListConsumer) {
            if (u.isObj(value)) {
              for (let [styleKey, styleValue] of u.entries(value)) {
                // if (u.isStr(value) && vpHeightKeys.includes(key as any)) {
                if (u.isStr(styleValue)) {
                  if (styleValue.startsWith(iteratorVar)) {
                    const dataKey = excludeIteratorVar(
                      styleValue,
                      iteratorVar,
                    ) as string
                    const cachedValue = styleValue
                    styleValue = get(options.context?.dataObject, dataKey)
                    if (styleValue) {
                      c.edit({ style: { [styleKey]: styleValue } })
                    } else {
                      console.log(
                        `%cEncountered an unparsed style value "${cachedValue}" for style key "${styleKey}"`,
                        `color:#ec0000;`,
                        { component: c, possibleValue: styleValue },
                      )
                    }
                  } else if (Identify.reference(value)) {
                    console.log(
                      `%cEncountered an unparsed style value "${value}" for style key "${key}"`,
                      `color:#ec0000;`,
                      c,
                    )
                  }
                }
                // }
              }
            }
          }
        } else {
          if (Identify.reference(value)) {
            console.log(
              `%cEncountered an unparsed style value "${value}" for style key "${key}"`,
              `color:#ec0000;`,
              c,
            )
          }
        }
      }

      return c
    }

    resolvedComponents = await Promise.all(
      u.array(components).map(async (c) => xform(o.createComponent(c, page))),
    )

    return (
      isArr ? resolvedComponents : resolvedComponents[0]
    ) as C extends any[] ? t.NUIComponent.Instance[] : t.NUIComponent.Instance
  }

  function _getActions(): ActionsCache
  function _getActions(
    actionType: 'emit',
  ): Map<t.NUITrigger, t.Store.ActionObject<'emit'>[]>
  function _getActions(
    actionType: 'builtIn',
  ): Map<string, t.Store.BuiltInObject[]>
  function _getActions<AType extends typeof groupedActionTypes[number]>(
    actionType: AType,
  ): t.Store.ActionObject<AType>[]
  function _getActions<GAType extends typeof groupedActionTypes[number]>(
    actionType?: GAType | 'builtIn' | 'emit' | never,
  ) {
    if (actionType === undefined) return cache.actions
    switch (actionType) {
      case 'builtIn':
        return cache.actions.builtIn
      case 'emit':
        return cache.actions.emit
      default:
        return cache.actions[actionType]
    }
  }

  /**
   * Handle register objects that have an "onEvent" by default for them
   * TODO - Enable them to have the option to disable or override this with their own function
   * TODO - Turn this into a transaction
   */

  function _experimental_Register(
    name: string,
    fn: t.Register.Object['fn'] | Partial<t.Register.Object>,
    options?: Partial<t.Register.Object>,
  ): t.Register.Object

  function _experimental_Register(
    registerComponent: RegisterComponentObject,
    options?: Partial<t.Register.Object> | t.Register.Object['fn'],
  ): t.Register.Object

  function _experimental_Register(
    obj: RegisterComponentObject | string,
    options: Partial<t.Register.Object> | t.Register.Object['fn'] = {},
    options2: Partial<t.Register.Object> = {},
  ) {
    try {
      let event = ''
      let register: t.Register.Object | undefined

      if (u.isStr(obj)) {
        event = obj
        register = (o.cache.register.get(event) || {}) as t.Register.Object
        if (u.isFnc(options)) {
          set(register, 'handler.fn', options)
          if (u.isObj(options2)) {
            if (options2.handler) {
              u.assign(register, options2)
              register.handler = { ...register.handler, ...options2.handler }
            } else {
              u.assign(register, options2)
            }
          }
        } else if (u.isObj(options)) {
          u.eachEntries(options, (key, val) => {
            if (register) {
              if (key === 'handler') {
                register.handler = { ...register.handler, ...options.handler }
              } else register[key] = val
            }
          })
        }
        if (u.isFnc(register.handler?.fn) && u.isFnc(register.fn)) {
          console.log(
            `%cSetting register.fn to undefined because a custom handler fn was provided`,
            `color:#95a5a6;`,
            register,
          )
          register.fn = undefined
        }
        !register.page && (register.page = '_global')
        !register.callbacks && (register.callbacks = [])
        !(register.name === event) && (register.name = event)
      } else if (u.isObj(obj)) {
        event = obj.onEvent as string
        register = (o.cache.register.get(event) || {}) as t.Register.Object

        options && u.assign(register, options)

        !register.callbacks && (register.callbacks = [])
        register.name !== event && (register.name = event)
        !register.page && (register.page = '_global')

        if (!o.cache.register.has(event)) {
          if (register.handler) {
            if (u.isFnc(register.handler.fn) && u.isFnc(register.fn)) {
              // Setting register.fn to undefined because a custom handler fn
              // was provided (which takes higher priority)
              register.fn = undefined
            }
          } else {
            if (!u.isFnc(register.fn)) {
              register.fn = async function onRegisterFn(obj, params) {
                return Promise.all(
                  o.cache.register.get(event)?.callbacks?.map(async (cb) => {
                    if (isActionChain(cb)) {
                      return cb?.execute?.call(cb, obj, params)
                    }
                    return u.isFnc(cb) ? await cb(obj, params) : cb
                  }) || [],
                )
              }
            }
          }
          if (Identify.folds.emit(obj)) {
            const ac = o.createActionChain(
              'register',
              { emit: obj.emit, actionType: 'emit' },
              { loadQueue: true },
            )
            // REMINDER - This should call hard coded observers registered from the web app
            register.callbacks.push(ac)
          }
        }
      }

      return cache.register.set(event, register as t.Register.Object)
    } catch (error) {
      console.error(`[${error.name}] ${error.message}`)
    }
  }

  const _experimental = {
    get register() {
      return _experimental_Register
    },
  }

  const o = {
    _experimental,
    _defineGetter(
      key: string,
      opts: ((...args: any[]) => any) | PropertyDescriptor,
    ) {
      Object.defineProperty(this, key, {
        get: u.isFnc(opts) ? () => opts : () => opts.get,
      })
    },
    get cache() {
      return cache
    },
    get clean() {
      return _clean
    },
    get createGetter() {
      return _createGetter
    },
    get createComponent() {
      return _createComponent
    },
    createPage(
      args?:
        | string
        /**
         * If a component instance is given, we must set its page id to the component id, emit the PAGE_CREATED component event and set the "page" prop using the page instance
         */
        | t.NUIComponent.Instance
        | {
            name?: string
            component?: t.NUIComponent.Instance
            id?: string
            onChange?(prev: string, next: string): void
            viewport?: VP | { width?: number; height?: number }
          },
      opts:
        | {
            onChange?(prev: string, next: string): void
            viewport?: VP | { width?: number; height?: number }
          }
        | never = {},
    ) {
      let name: string = ''
      let id: string | undefined = undefined
      let onChange: ((prev: string, next: string) => void) | undefined
      let page: NUIPage | undefined
      let viewport: VP | undefined

      if (u.isStr(args)) {
        name = args
        if (opts?.viewport) {
          if (opts.viewport instanceof VP) viewport = opts.viewport
          else if (u.isObj(opts.viewport)) viewport = new VP(opts.viewport)
        }
      } else if (isComponent(args)) {
        id = args.id
        page = args.get('page') || cache.page.get(args.id)?.page
        name = String(args.get('path') || '')
        page && args.get('page') !== page && args.edit('page', page)
      } else if (u.isObj(args)) {
        args.name && (name = args.name)
        args.onChange && (onChange = args.onChange)
        if (isComponent(args.component)) args.id = args.component.id
        else id = args.id || id || ''
        if (args?.viewport) {
          if (isViewport(args.viewport)) viewport = args.viewport
          else if (u.isObj(args.viewport)) viewport = new VP(args.viewport)
        }
      }

      let isPreexistent = false

      if (name) {
        for (const obj of o.cache.page) {
          if (obj) {
            const [_, { page: _prevPage }] = obj
            if (_prevPage.page === name) {
              page = _prevPage
              isPreexistent = true

              // Delete the cached components from the page since it will be
              // re-rerendered
              for (const obj of o.cache.component) {
                if (obj && obj.page === page?.page) {
                  if (Identify.component.page(obj.component)) continue
                  o.cache.component.remove(obj.component)
                }
              }
            }
          }
        }
      }

      if (!isPreexistent) {
        page = cache.page.create({
          id,
          onChange,
          viewport,
        }) as NUIPage
        if (isComponent(args)) {
          page.page = name
          args.edit('page', page)
          args.emit(c.nuiEvent.component.page.PAGE_CREATED, page)
        } else if (!u.isStr(args) && isComponent(args?.component)) {
          /**
           * Transfer the page from page component to be stored in the WeakMap
           * Page components being stored in Map are @deprecated because of
           * caching issues, whereas WeakMap will garbage collect by itself
           * in a more aggressive way
           */
          cache.page.remove(page)
          const component = args?.component as t.NUIComponent.Instance
          page = cache.page.create({ id: component.id, onChange })
        }
      }

      name && page && page.page !== name && (page.page = name)
      ;(page as NUIPage)?.use(() => o.getRoot()[page?.page || '']?.components)

      return page
    },
    createPlugin(
      location:
        | t.Plugin.Location
        | t.Plugin.ComponentObject
        | t.NUIComponent.Instance = 'head',
      obj?: t.NUIComponent.Instance | t.Plugin.ComponentObject,
    ) {
      let _location = '' as t.Plugin.Location
      let _path = (isComponent(obj) ? obj.blueprint?.path : obj?.path) || ''

      if (u.isStr(location)) {
        _location = location
      } else {
        obj = location
        _path = location.blueprint?.path || ''
        const type = location?.type
        if (_path.endsWith('.css')) _location = 'head'
        else if (_path.endsWith('.html')) _location = 'body-top'
        // else if (type === 'plugin') _location = 'head'
        else if (type === 'pluginHead') _location = 'head'
        else if (type === 'pluginBodyTop') _location = 'body-top'
        else if (type === 'pluginBodyTail') _location = 'body-bottom'
        !_location && (_location = 'head')
      }

      const id = _path
      const plugin = {
        id,
        content: '',
        initiated: false,
        location: _location,
        path: _path,
      } as t.Plugin.Object

      if (!_path) {
        _path = ''
        plugin.id = ''
        plugin.path = ''
      }

      !cache.plugin.has(id) && cache.plugin.add(_location, plugin)
      return plugin
    },
    createActionChain(
      trigger: t.NUITrigger,
      actions: OrArray<t.NUIActionObjectInput>,
      opts?: {
        component?: t.NUIComponent.Instance
        context?: Record<string, any>
        loadQueue?: boolean
        page?: NUIPage
      },
    ) {
      if (!u.isArr(actions)) actions = [actions]

      const actionChain = createActionChain({
        actions: u.reduce(
          actions,
          (acc: t.NUIActionObject[], obj) => {
            const errors = getActionObjectErrors(obj)
            errors.length &&
              errors.forEach((errMsg) =>
                console.log(`%c${errMsg}`, `color:#ec0000;`, obj),
              )
            if (u.isObj(obj) && !('actionType' in obj)) {
              obj = { ...obj, actionType: getActionType(obj) }
            } else if (u.isFnc(obj)) {
              obj = { actionType: 'anonymous', fn: obj }
            }
            return acc.concat(obj as t.NUIActionObject)
          },
          [],
        ),
        trigger,
        loader: (objs) => {
          function __createExecutor(
            action: t.NUIAction,
            fns: (t.Store.ActionObject | t.Store.BuiltInObject)[] = [],
            options: t.ConsumerOptions,
          ) {
            return async function executeActionChain(event?: Event) {
              let results = [] as (Error | any)[]
              if (fns.length) {
                const callbacks = fns.map(
                  async (obj: t.Store.ActionObject | t.Store.BuiltInObject) =>
                    obj.fn?.(action as any, {
                      ...options,
                      component: opts?.component,
                      event,
                      ref: actionChain,
                    }),
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
            if (Identify.folds.emit(obj)) {
              const action = createAction(trigger, obj)
              if (opts?.component) {
                const iteratorVar =
                  opts?.context?.iteratorVar || findIteratorVar(opts.component)

                const dataObject =
                  opts?.context?.dataObject ||
                  findListDataObject(opts.component)

                if (obj.emit?.dataKey) {
                  action.dataKey = createEmitDataKey(
                    obj.emit.dataKey,
                    _getQueryObjects({
                      component: opts.component,
                      page: opts.page,
                      listDataObject: dataObject,
                    }),
                    { iteratorVar },
                  )
                }
              }

              const callbacks = o.cache.actions.emit?.get(trigger) || []

              action.executor = __createExecutor(
                action,
                callbacks,
                o.getConsumerOptions({
                  context: opts?.context,
                  component: opts?.component,
                  page: opts?.page as NUIPage,
                }),
              )

              return action
            }

            const action = createAction(trigger, obj)

            action.executor = __createExecutor(
              action,
              Identify.action.builtIn(obj)
                ? o.cache.actions.builtIn.get(obj.funcName as string)
                : Identify.goto(obj)
                ? o.cache.actions.goto
                : o.cache.actions[obj.actionType] || [],
              o.getConsumerOptions({
                context: opts?.context,
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
    get createSrc() {
      return _createSrc
    },
    get emit() {
      return _emit
    },
    getAssetsUrl: () => '',
    getActions: _getActions,
    getBuiltIns: () => cache.actions.builtIn,
    getBaseUrl: () => '',
    getBaseStyles(component: t.NUIComponent.Instance) {
      const origStyle = component?.blueprint?.style || {}
      const styles = { ...origStyle } as any

      if (VP.isNil(origStyle?.top) || origStyle?.top === 'auto') {
        styles.position = 'relative'
      } else {
        styles.position = 'absolute'
      }
      origStyle?.position == 'fixed' && (styles.position = 'fixed')

      u.isNil(origStyle.height) && (styles.height = 'auto')

      return merge(
        { ...o.getRoot()?.Style, position: 'absolute', outline: 'none' },
        origStyle,
        styles,
      )
    },
    getConsumerOptions<C extends t.NUIComponent.Instance>({
      callback,
      component,
      page,
      context,
    }: {
      callback?(component: C): C | void
      component?: C
      page: NUIPage
      context?: Record<string, any>
    } & { [key: string]: any }) {
      return {
        ...o,
        callback,
        cache,
        component,
        context, // Internal context during component resolving
        get createPage() {
          return o.createPage
        },
        createActionChain(
          trigger: t.NUITrigger,
          actions: t.NUIActionObject | t.NUIActionObject[],
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
        get createSrc() {
          return _createSrc
        },
        get emit() {
          return _emit
        },
        get: _createGetter(page),
        get getBaseStyles() {
          return o.getBaseStyles
        },
        get getQueryObjects() {
          return _getQueryObjects
        },
        get page() {
          return page || o.getRootPage()
        },
        get resolveComponents() {
          return _resolveComponents
        },
        get viewport() {
          return page?.viewport
        },
      }
    },
    getPlugins(location?: t.Plugin.Location) {
      return cache.plugin.get(location)
    },
    getPages() {
      return [] as string[]
    },
    getPreloadPages() {
      return [] as string[]
    },
    getRoot() {
      return {} as Record<string, any>
    },
    getRootPage() {
      if (!cache.page.has('root')) {
        return cache.page.create({ viewport: new VP() })
      }
      return u.array(cache.page.get('root'))[0]?.page as NUIPage
    },
    get resolveComponents() {
      return _resolveComponents
    },
    reset(
      filter?:
        | (
            | 'actions'
            | 'builtIns'
            | 'components'
            | 'pages'
            | 'plugins'
            | 'register'
            | 'transactions'
          )
        | (
            | 'actions'
            | 'builtIns'
            | 'components'
            | 'pages'
            | 'plugins'
            | 'register'
            | 'transactions'
          )[],
    ) {
      if (filter) {
        u.arrayEach(filter, (f: typeof filter) => {
          if (f === 'actions') {
            o.cache.actions.clear()
          } else if (f === 'builtIns') {
            o.cache.actions.builtIn.clear()
          } else if (f === 'components') {
            cache.component.clear()
          } else if (f === 'pages') {
            cache.page.clear()
          } else if (f === 'plugins') {
            cache.plugin.clear()
          } else if (f === 'register') {
            cache.register.clear()
          } else if (f === 'transactions') {
            cache.transactions.clear()
          }
        })
      } else {
        cache.actions.clear()
        cache.actions.reset()
        cache.component.clear()
        cache.page.clear()
        cache.plugin.clear()
        cache.register.clear()
        cache.transactions.clear()
      }
      o._defineGetter('getAssetsUrl', () => '')
      o._defineGetter('getBaseUrl', () => '')
      o._defineGetter('getPages', () => [])
      o._defineGetter('getPreloadPages', () => [])
      o._defineGetter('getRoot', () => '')
    },
    use(args: t.UseArg) {
      for (const actionType of groupedActionTypes) {
        if (actionType in args) {
          u.arrayEach(args[actionType], (fn) => {
            invariant(
              u.isFnc(fn),
              `fn is required for handling actionType "${actionType}"`,
            )
            cache.actions[actionType]?.push({ actionType, fn })
          })
        }
      }

      if ('builtIn' in args) {
        u.eachEntries(
          args.builtIn,
          (funcName, fn: t.Store.BuiltInObject['fn']) => {
            u.arrayEach(fn, (f) => {
              invariant(!!funcName, `"Missing funcName in a builtIn handler`)
              invariant(
                u.isFnc(f),
                `fn is not a function for builtIn "${funcName}"`,
              )
              if (!cache.actions.builtIn.has(funcName)) {
                cache.actions.builtIn.set(funcName, [])
              }
              cache.actions.builtIn.get(funcName)?.push({
                actionType: 'builtIn',
                funcName,
                fn: f,
              })
            })
          },
        )
      }

      if ('emit' in args) {
        u.eachEntries(
          args.emit,
          (trigger: t.NUITrigger, func: (...args: any[]) => any) => {
            u.arrayEach(func, (fn) => {
              invariant(
                u.isFnc(fn),
                `Emit trigger "${trigger}" was provided with an invalid "fn"`,
              )
              o.cache.actions.emit.get(trigger)?.push({
                actionType: 'emit',
                fn,
                trigger,
              })
            })
          },
        )
      }

      if ('plugin' in args) {
        u.arrayEach(args.plugin, (plugin) =>
          o.createPlugin(getPluginLocation(plugin), plugin),
        )
      }

      if ('register' in args) {
        if (
          Identify.component.register(args.register) ||
          u.isArr(args.register)
        ) {
          u.arrayEach(args.register, (component) => {
            o._experimental.register(component)
          })
        } else {
          u.eachEntries(args.register, (event, fn: t.Register.Object['fn']) => {
            u.isFnc(fn) && o._experimental.register(event, fn)
          })
        }
      }

      if ('transaction' in args) {
        u.eachEntries(args.transaction, (tid, fn) => {
          const opts = {} as any
          u.isFnc(fn) ? (opts.fn = fn) : u.isObj(fn) && u.assign(opts, fn)
          cache.transactions.set(tid as t.TransactionId, opts)
        })
      }

      for (const key of [
        'getAssetsUrl',
        'getBaseUrl',
        'getPages',
        'getPreloadPages',
        'getRoot',
      ]) {
        args[key] && o._defineGetter(key, args[key])
      }

      return o
    },
  }

  return o
})()

export default NUI
