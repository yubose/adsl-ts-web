import invariant from 'invariant'
import merge from 'lodash/merge'
import get from 'lodash/get'
import set from 'lodash/set'
import * as u from '@jsmanifest/utils'
import { isActionChain } from 'noodl-action-chain'
import {
  ComponentObject,
  EmitObjectFold,
  Identify,
  IfObject,
  PageObject,
  RegisterComponentObject,
} from 'noodl-types'
import {
  createEmitDataKey,
  evalIf,
  excludeIteratorVar,
  trimReference,
} from 'noodl-utils'
import EmitAction from './actions/EmitAction'
import ComponentCache from './cache/ComponentCache'
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
import PageCache from './cache/PageCache'
import PluginCache from './cache/PluginCache'
import RegisterCache from './cache/RegisterCache'
import TransactionCache from './cache/TransactionsCache'
import VP from './Viewport'
import resolveAsync from './resolvers/resolveAsync'
import resolveComponents from './resolvers/resolveComponents'
import resolveStyles from './resolvers/resolveStyles'
import resolveDataAttribs from './resolvers/resolveDataAttribs'
import { isPromise, promiseAllSafely } from './utils/common'
import {
  findIteratorVar,
  findListDataObject,
  getPluginLocation,
  isListConsumer,
  resolveAssetUrl,
} from './utils/noodl'
import { groupedActionTypes, nuiEmitType } from './constants'
import * as t from './types'

const NUI = (function _NUI() {
  /** @type { object } cache */
  const cache = {
    actions: new ActionsCache() as ActionsCache &
      Record<
        t.NUIActionGroupedType,
        t.Store.ActionObject<t.NUIActionGroupedType>[]
      > & {
        builtIn: Map<string, t.Store.BuiltInObject[]>
        emit: Map<t.NUITrigger, t.Store.ActionObject[]>
        register: Record<string, t.Register.Object[]>
      },
    component: new ComponentCache(),
    page: new PageCache(),
    plugin: new PluginCache(),
    register: new RegisterCache(),
    transactions: new TransactionCache(),
  }

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
      | t.NUIComponent.Instance
      | ComponentObject
      | null
      | undefined,
    page = o.getRootPage(),
  ) {
    if (isComponent(componentObject)) return componentObject
    const component = createComponent(componentObject as ComponentObject)
    cache.component.add(component, page)
    return component
  }

  /**
   *  Create a url
   * @param { function } createSrc
   */
  function _createSrc(args: {
    component: t.NUIComponent.Instance
    page: NUIPage
  }): Promise<string>
  function _createSrc(
    path: EmitObjectFold,
    opts?: {
      component: t.NUIComponent.Instance
      context?: Record<string, any>
    },
  ): Promise<string>
  function _createSrc(path: IfObject): string
  function _createSrc(path: string): string
  function _createSrc(
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
    let component: t.NUIComponent.Instance
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
              callbacks.map((obj: t.Store.ActionObject) =>
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
          console.log(
            `%cThe register event "${event}" exists in the register cache`,
            `color:#95a5a6;`,
          )
          const obj = cache.register.get(event)
          if (obj.handler) {
            console.log(
              `%c"Handler" is an object. Attempting to use a "callback" in the handler object if it exists`,
              `color:#95a5a6;`,
            )
            const callback = obj.handler.fn
            if (u.isFnc(callback)) {
              console.log(
                `%cThe callback exists in the handler object. It will be invoked`,
                `color:#95a5a6;`,
              )
              const result = await callback?.(obj, opts.params)
              results.push(result)
              console.log(
                `%cChecking if a "register" transaction was registered in from the client`,
                `color:#95a5a6;`,
              )
              const transactionHandler = o.cache.transactions.getHandler(
                'register',
                event,
              )
              if (u.isFnc(transactionHandler)) {
                console.log(
                  `%cFound a transaction handler from the client. It will be invoked at the end and passed the return value of the callback from the handler object earlier`,
                  `color:#95a5a6;`,
                )
                const _result = await transactionHandler(result)
                console.log(
                  `%cResult from transaction handler`,
                  `color:#95a5a6;`,
                  _result,
                )
              } else {
                console.log(
                  `%cA transaction handler was not found in the transaction cache. Only the callback in the handler object will be called`,
                  `color:#CCCD17;`,
                )
              }
            } else {
              console.log(
                `%cEntered a handler object that did not have a callback function. Nothing will happen`,
                `color:#ec0000;`,
              )
            }
            return results
          } else {
            console.log(
              `%cA handler object did not exist. A default function will be used that calls the functions in the callbacks list by default`,
              `color:#95a5a6;`,
            )
            console.log(obj)
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
        const fn = cache.transactions.get(opts.transaction)?.fn
        if (!u.isFnc(fn)) {
          console.log(
            `%cMissing a callback handler for transaction "${
              opts.transaction
            }" but received ${typeof fn}`,
            `color:#ec0000;`,
            opts,
          )
        }
        return fn?.(opts.params as string | NUIPage)
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
    components: t.NUIComponent.CreateType
    context?: Record<string, any>
  }): t.NUIComponent.Instance
  function _resolveComponents(opts: {
    page: NUIPage
    components: t.NUIComponent.CreateType[]
    context?: Record<string, any>
  }): t.NUIComponent.Instance[]
  function _resolveComponents(
    page: NUIPage,
    component: t.NUIComponent.CreateType,
  ): t.NUIComponent.Instance
  function _resolveComponents(
    page: NUIPage,
    components: t.NUIComponent.CreateType[],
  ): t.NUIComponent.Instance[]
  function _resolveComponents(
    component: t.NUIComponent.CreateType,
  ): t.NUIComponent.Instance
  function _resolveComponents(
    components: t.NUIComponent.CreateType[],
  ): t.NUIComponent.Instance[]
  function _resolveComponents(
    pageProp:
      | NUIPage
      | t.NUIComponent.CreateType
      | t.NUIComponent.CreateType[]
      | {
          page?: NUIPage
          components: t.NUIComponent.CreateType | t.NUIComponent.CreateType[]
          context?: Record<string, any>
        },
    componentsProp?: t.NUIComponent.CreateType | t.NUIComponent.CreateType[],
  ) {
    let isArr = true
    let resolvedComponents: t.NUIComponent.Instance[] = []
    let components: t.NUIComponent.CreateType[] = []
    let page: NUIPage
    let context: Record<string, any> = {}

    if (isPage(pageProp)) {
      page = pageProp
      components = u.array(componentsProp) as t.NUIComponent.CreateType[]
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

    function xform(c: t.NUIComponent.Instance) {
      const options = o.getConsumerOptions({ component: c, page, context })
      _transform(c, options)
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

    components.forEach((c: t.NUIComponent.Instance, i) => {
      const component = o.createComponent(c)
      component.ppath = `[${i}]`
      resolvedComponents.push(xform(component))
    })

    return isArr ? resolvedComponents : resolvedComponents[0]
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
              } else {
                register[key] = val
              }
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
          console.log(
            `%cAdding a new register object "${event}" to the store`,
            `color:#95a5a6;`,
            register,
          )
          if (register.handler) {
            if (u.isFnc(register.handler.fn)) {
              if (u.isFnc(register.fn)) {
                register.fn = undefined
                console.log(
                  `%cSetting register.fn to undefined because a custom handler fn was provided`,
                  `color:#95a5a6;`,
                  register,
                )
              }
            }
          } else {
            if (!u.isFnc(register.fn)) {
              register.fn = async function onRegisterFn(obj, params) {
                console.log(
                  `%cFunction has been called on register event "${event}"`,
                  `color:aquamarine;`,
                  { obj, params },
                )
                const results = await Promise.all(
                  o.cache.register.get(event)?.callbacks?.map(async (cb) => {
                    if (isActionChain(cb)) {
                      return cb?.execute?.call(cb, obj, params)
                    }
                    return u.isFnc(cb) ? cb(obj, params) : cb
                  }) || [],
                )
                return results
              }
            }
          }
          // TODO - Should we convert the component object to a NUI component instance?
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

      return cache.register.set(
        event,
        register as t.Register.Object,
      ) as t.Register.Object
    } catch (error) {
      console.error(`[${error.name}] ${error.message}`)
    }
  }

  const _experimental = {
    register: _experimental_Register,
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
    cache,
    clean: _clean,
    createGetter: _createGetter,
    createComponent: _createComponent,
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
          if (isViewport(args.viewport)) viewport = args.viewport
          else if (u.isObj(args.viewport)) viewport = new VP(args.viewport)
        }
      }

      let isPreexistent = false

      if (name) {
        for (const obj of o.cache.page) {
          if (obj) {
            const [pageId, { page: _prevPage }] = obj
            if (_prevPage.page === name) {
              page = _prevPage
              isPreexistent = true

              let totalStaleComponents = 0
              let totalStaleComponentIds = [] as string[]

              // Delete the cached components from the page since it will be re-rerendered
              for (const obj of o.cache.component) {
                if (obj) {
                  if (obj.page === page.page) {
                    totalStaleComponentIds.push(obj.component.id)
                    o.cache.component.remove(obj.component)
                    totalStaleComponents++
                  }
                }
              }

              if (totalStaleComponents > 0) {
                console.log(
                  `%cRemoved ${totalStaleComponents} old/stale cached components from ` +
                    `page "${name}"`,
                  `color:#95a5a6;`,
                  totalStaleComponentIds,
                )
              }
            }
          }
        }
      }

      if (!isPreexistent) {
        page = cache.page.create({ id, viewport: viewport }) as NUIPage
      }

      name && page && (page.page = name)
      ;(page as NUIPage).use(() => NUI.getRoot()[page?.page || '']?.components)

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
        console.log(
          `%cThe path "${_path}" passed to a plugin component is null or undefined`,
          `color:#ec0000;`,
          plugin,
        )
        _path = ''
        plugin.id = ''
        plugin.path = ''
      }

      !cache.plugin.has(id) && cache.plugin.add(_location, plugin)
      return plugin
    },
    createActionChain(
      trigger: t.NUITrigger,
      actions: t.NUIActionObjectInput | t.NUIActionObjectInput[],
      opts?: {
        component?: t.NUIComponent.Instance
        context?: Record<string, any>
        loadQueue?: boolean
        page?: NUIPage
      },
    ) {
      if (!u.isArr(actions)) actions = [actions]

      const actionChain = createActionChain({
        actions: actions?.reduce((acc: t.NUIActionObject[], obj) => {
          const errors = getActionObjectErrors(obj)
          if (errors.length) {
            errors.forEach((errMsg) =>
              console.log(`%c${errMsg}`, `color:#ec0000;`, obj),
            )
          }
          if (u.isObj(obj) && !('actionType' in obj)) {
            obj = { ...obj, actionType: getActionType(obj) }
          } else if (u.isFnc(obj)) {
            obj = { actionType: 'anonymous', fn: obj }
          }
          return acc.concat(obj as t.NUIActionObject)
        }, []),
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
                  async function executeActionChainCallback(
                    obj: t.Store.ActionObject | t.Store.BuiltInObject,
                  ) {
                    return obj.fn?.(action as any, {
                      ...options,
                      component: opts?.component,
                      event,
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
            if (Identify.folds.emit(obj)) {
              const action = createAction(trigger, obj)
              if (opts?.component) {
                const iteratorVar =
                  opts?.context?.iteratorVar || findIteratorVar(opts.component)

                const dataObject =
                  opts?.context?.dataObject ||
                  findListDataObject(opts.component)

                const dataKey = obj.emit?.dataKey

                if (dataKey) {
                  if (Identify.component.page(opts.component)) {
                    // if (Identify.reference(dataKey)) {
                    //   action.dataKey = createEmitDataKey(
                    //     dataKey,
                    //     _getQueryObjects({
                    //       component: opts.component,
                    //       page: opts.page,
                    //       listDataObject: dataObject,
                    //     }),
                    //     { iteratorVar },
                    //   )
                    // }
                  } else {
                    action.dataKey = createEmitDataKey(
                      dataKey,
                      _getQueryObjects({
                        component: opts.component,
                        page: opts.page,
                        listDataObject: dataObject,
                      }),
                      { iteratorVar },
                    )
                  }
                }
              }

              const callbacks = o.cache.actions.emit?.get(trigger) || []

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
              Identify.action.builtIn(obj)
                ? o.cache.actions.builtIn.get(obj.funcName as string)
                : Identify.goto(obj)
                ? o.cache.actions.goto
                : o.cache.actions[obj.actionType] || [],
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
    getActions: _getActions,
    getBuiltIns: () => cache.actions.builtIn,
    getBaseUrl: () => '',
    getBaseStyles({ component }: { component: t.NUIComponent.Instance }) {
      const originalStyle = component?.blueprint?.style || {}
      const styles = { ...originalStyle } as any

      if (VP.isNil(originalStyle?.top) || originalStyle?.top === 'auto') {
        styles.position = 'relative'
      } else {
        styles.position = 'absolute'
      }
      if (originalStyle?.position == 'fixed') {
        styles.position = 'fixed'
      }

      u.isNil(originalStyle.height) && (styles.height = 'auto')

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
      component?: t.NUIComponent.Instance
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
        get createPlugin() {
          return o.createPlugin
        },
        createSrc: _createSrc,
        emit: _emit,
        get: _createGetter(page),
        getBaseStyles(c: t.NUIComponent.Instance) {
          return o.getBaseStyles?.({ component: c })
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
    getPlugins: (location?: t.Plugin.Location) => cache.plugin.get(location),
    getPages: () => [] as string[],
    getPreloadPages: () => [] as string[],
    getRoot: () => ({} as Record<string, any>),
    getRootPage() {
      if (!cache.page.has('root')) {
        return cache.page.create({ viewport: new VP() })
      }
      return u.array(cache.page.get('root'))[0]?.page as NUIPage
    },
    getTransactions: () => cache.transactions,
    resolveComponents: _resolveComponents,
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

      //

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
            if (u.isFnc(fn)) o._experimental.register(event, fn)
          })
        }
      }

      if ('transaction' in args) {
        u.eachEntries(args.transaction, (tid, fn) => {
          const opts = {} as any
          u.isFnc(fn) ? (opts.fn = fn) : u.isObj(fn) && u.assign(opts, fn)
          o.getTransactions().set(tid as t.TransactionId, opts)
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
