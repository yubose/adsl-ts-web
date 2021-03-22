class NOODLUI {
  #id: number
  #cache = componentCache
  #cb: {
    action: Partial<
      Record<ActionType | 'emit' | 'goto' | 'toast', T.Store.ActionObject[]>
    >
    builtIn: { [funcName: string]: T.Store.BuiltInObject[] }
    chaining: Partial<Record<T.ActionChainEventId, Function[]>>
    on: {
      [nuiEvent.SET_PAGE]: ((pageName: string) => void)[]
      [nuiEvent.NEW_PAGE]: ((page: string) => Promise<NOODLUI> | undefined)[]
      [nuiEvent.NEW_PAGE_REF]: ((ref: Page) => Promise<void> | undefined)[]
    }
    registered: RegisterCallbacks
  } = {
    action: {},
    builtIn: {},
    chaining: Object.values(nuiEvent.actionChain).reduce(
      (acc, key) => Object.assign(acc, { [key]: [] }),
      {},
    ),
    on: {
      [nuiEvent.SET_PAGE]: [],
      [nuiEvent.NEW_PAGE]: [],
      [nuiEvent.NEW_PAGE_REF]: [],
    },
    registered: {},
  }
  #getAssetsUrl: () => string = () => ''
  #getBaseUrl: () => string = () => ''
  #getPreloadPages: () => string[] = () => []
  #getPages: () => string[] = () => []
  #resolvers: ComponentResolver<T.ResolverFn>[] = []
  #getRoot: () => T.Root = () => ({})
  #state: T.State
  #viewport: Viewport
  actionsContext: T.ActionChainContext = { noodlui: this }
  refs: { main: NOODLUI } & { [page: string]: NOODLUI } = {} as {
    main: NOODLUI
  } & {
    [page: string]: NOODLUI
  }
  initialized: boolean = false

  constructor({
    showDataKey,
    viewport,
  }: {
    showDataKey?: boolean
    viewport?: Viewport
  } = {}) {
    id++
    this.#id = id
    this.#state = _createState({ showDataKey })
    this.#viewport = viewport || new Viewport()
  }

  get id() {
    return this.#id
  }

  get assetsUrl() {
    return this.#getAssetsUrl()
  }

  get page() {
    return this.#state.page
  }

  get root() {
    return this.#getRoot()
  }

  get viewport() {
    return this.#viewport
  }

  resolveComponents(component: T.ComponentCreationType): T.ComponentInstance
  resolveComponents(
    components: T.ComponentCreationType[],
  ): T.ComponentInstance[]
  resolveComponents(
    componentsParams:
      | T.ComponentCreationType
      | T.ComponentCreationType[]
      | T.PageObjectContainer['object'],
  ) {
    let components: any[] = []
    let resolvedComponents: T.ComponentInstance[] = []

    if (componentsParams) {
      if (isComponent(componentsParams)) {
        components = [componentsParams]
      } else if (!u.isArr(componentsParams) && u.isObj(componentsParams)) {
        if ('components' in componentsParams) {
          components = componentsParams.components
        } else {
          components = [componentsParams]
        }
      } else if (u.isArr(componentsParams)) {
        components = componentsParams
      } else if (u.isStr(componentsParams)) {
        components = [componentsParams]
      }
    }

    // Page components are currently not using plugins
    if (this?.plugins) {
      // Add plugin components first
      ;[
        ...this.plugins('head').map((plugin: T.PluginObject) => plugin.ref),
        ...this.plugins('body-top').map((plugin: T.PluginObject) => plugin.ref),
        ...this.plugins('body-bottom').map(
          (plugin: T.PluginObject) => plugin.ref,
        ),
      ].forEach((c) => this.#resolve(c))
    }

    // Finish off with the internal resolvers to handle the children
    components.forEach((c) => {
      const component = this.#resolve(c)
      _internalResolver.resolve(
        component,
        this.getConsumerOptions({ component }),
        this,
      )
      resolvedComponents.push(component)
    })

    return u.isArr(componentsParams)
      ? resolvedComponents
      : resolvedComponents[0]
  }

  #resolve = (c: T.ComponentInstance | ComponentObject) => {
    const component = createComponent(c as any)

    const consumerOptions = this.getConsumerOptions({ component })
    const baseStyles = this.getBaseStyles(component)

    component.assignStyles(baseStyles)

    if (component.type === 'register') {
      log.func('#resolve')
      // Skip the resolving for register type components since they only need
      // to be processed once in the lifetime of the page
      if (this.componentCache().has(component)) {
        log.grey(
          `This register component was found in the cache and was returned it instead`,
          this.componentCache().state(),
        )
      } else {
        handleRegister(component, consumerOptions)
      }
      return component
    }

    store.resolvers.forEach((obj) => {
      obj.resolver.resolve(component, consumerOptions)
    })

    // Finalizing
    if (component.style && typeof component.style === 'object') {
      forEachDeepEntries(component.style, (key, value) => {
        if (typeof value === 'string') {
          if (value.startsWith('0x')) {
            component.style.key = formatColor(value)
          } else if (/(fontsize|borderwidth|borderradius)/i.test(key)) {
            if (!hasLetter(value)) component.style[key] = `${value}px`
          }
        }
      })
      // this.styleFinalizer.finalize(component, consumerOptions)
    }

    return component
  }

  createActionChainHandler(
    actions: ActionObject[],
    options: T.ActionConsumerCallbackOptions & {
      trigger?: T.ActionChainEmitTrigger
    },
  ) {
    const actionChain = new ActionChain(
      u.isArr(actions) ? actions : [actions],
      options as T.ActionConsumerCallbackOptions & {
        trigger: T.ActionChainEmitTrigger
      },
      this.actionsContext,
    )
    Object.values(store.actions).forEach((objs) => {
      objs.forEach((obj) => {
        if (isEmitObj(obj)) {
          // Only accept the emit action handlers where their
          // actions only exist in action chains
          if (!isActionChainEmitTrigger(obj.trigger)) return
          obj.actionType = 'emit'
        }
        actionChain.useAction(obj)
      })
    })
    Object.values(store.builtIns).forEach((obj) => {
      actionChain.useBuiltIn(obj)
    })
    // @ts-expect-error
    if (!window.ac) window['ac'] = {}
    // @ts-expect-error
    window.ac[options.component?.id || ''] = actionChain
    return actionChain.build.call(actionChain).bind(actionChain)
  }

  createSrc<O extends EmitObject>(
    path: O,
    component?: T.ComponentInstance,
  ): string | Promise<string>
  createSrc<O extends IfObject>(
    path: O,
    component?: T.ComponentInstance,
  ): string | Promise<string>
  createSrc<S extends string>(
    path: S,
    component?: T.ComponentInstance,
  ): string | Promise<string>
  createSrc(
    path: string | EmitObject | IfObject,
    component?: T.ComponentInstance,
  ) {
    log.func('createSrc')
    // TODO - fix this in the component constructor so we can remove this
    if (isDraft(path)) path = original(path) as typeof path

    if (path) {
      if (u.isStr(path)) {
        // Components of type "noodl" can have a path that points directly to a page
        // ex: "path: LeftPage"
        if (
          this.#getPages()
            .concat(this.#getPreloadPages())
            .includes(path)
        ) {
          const pageLink = this.#getBaseUrl() + path + '_en.yml'
          setTimeout(() => component?.emit('path', pageLink))
          return pageLink
        } else {
          return resolveAssetUrl(path, this.assetsUrl)
        }
      }
      // "If" object evaluation
      else if (isIfObj(path)) {
        return resolveAssetUrl(
          evalIf((val: any) => {
            if (isNOODLBoolean(val)) return isBooleanTrue(val)
            if (typeof val === 'function') {
              if (component) return val(findListDataObject(component))
              return val()
            }
            return !!val
          }, path as IfObject),
          this.assetsUrl,
        )
      }
      // Emit object evaluation
      else if (isEmitObj(path)) {
        // TODO - narrow this query to avoid only using the first encountered obj
        const obj = store.actions.emit?.find?.((o) => o.trigger === 'path')

        if (typeof obj?.fn === 'function') {
          const emitObj = {
            ...path,
            actionType: 'emit',
          } as T.T.EmitActionObject
          const emitAction = new EmitAction(emitObj, {
            iteratorVar: component?.get('iteratorVar'),
            trigger: 'path',
          })
          if ('dataKey' in (emitAction.original.emit || {})) {
            emitAction.setDataKey(
              createEmitDataKey(
                emitObj.emit.dataKey,
                [
                  findListDataObject(component),
                  () => this.getPageObject(this.page),
                  () => this.#getRoot(),
                ],
                { iteratorVar: emitAction.iteratorVar },
              ),
            )
          }

          emitAction['callback'] = async (snapshot) => {
            log.grey(`Executing emit action callback`, snapshot)
            const callbacks = (store.actions.emit || []).reduce(
              (acc, obj) => (obj?.trigger === 'path' ? acc.concat(obj) : acc),
              [],
            )

            if (!callbacks.length) return ''

            const result = await Promise.race(
              callbacks.map((obj: T.Store.ActionObject) =>
                obj?.fn?.(
                  emitAction,
                  this.getConsumerOptions({ component, path }),
                  // Action context
                  this.actionsContext,
                  //
                ),
              ),
            )

            return (u.isArr(result) ? result[0] : result) || ''
          }

          // Result returned should be a string type
          let result = emitAction.execute(path) as string | Promise<string>
          let finalizedRes = ''

          log.grey(`Result received from emit action`, {
            action: emitAction,
            result,
          })

          if (isPromise(result)) {
            return result
              .then((res) => {
                if (typeof res === 'string' && res.startsWith('http')) {
                  finalizedRes = res
                } else {
                  finalizedRes = resolveAssetUrl(String(res), this.assetsUrl)
                }
                component?.emit('path', finalizedRes)
                return finalizedRes
              })
              .catch((err) => Promise.reject(err))
          } else if (result) {
            if (typeof result === 'string' && result.startsWith('http')) {
              finalizedRes = result
              component?.emit('path', finalizedRes)
              return result
            }
            finalizedRes = resolveAssetUrl(result, this.assetsUrl)
            component?.emit('path', finalizedRes)
          }
        }
      }
      // Assuming we are passing in a dataObject
      else if (typeof path === 'function') {
        if (component) {
          const dataObject: any = findListDataObject(component)
          // Assuming it is a component retrieving its value from a dataObject
          if (component.get?.('iteratorVar')) {
            path = evalIf((fn, val1, val2) => fn?.(dataObject), path)
          }
        } else {
          log.red(
            'Attempted to evaluate a path "function" from an if object but ' +
              'a component is required to query for a dataObject. The "src" ' +
              'value will default to its raw path',
            { component, path },
          )
        }
        return resolveAssetUrl(path, this.#getAssetsUrl())
      }
    }

    return ''
  }

  createPluginObject(component: T.ComponentInstance): T.PluginObject
  createPluginObject(component: ComponentObject): T.PluginObject
  createPluginObject(plugin: T.PluginObject): T.PluginObject
  createPluginObject(path: string): T.PluginObject
  createPluginObject(plugin: T.PluginCreationType): T.PluginObject
  createPluginObject(plugin: T.PluginCreationType): T.PluginObject {
    if (typeof plugin === 'string') {
      plugin = {
        content: '',
        location: 'head',
        path: plugin,
        ref: createComponent({
          type: 'pluginHead',
          location: 'head',
          path: plugin,
          content: '',
        }),
      }
    } else if (isComponent(plugin)) {
      plugin = {
        content: plugin.get('content') || '',
        location: getPluginTypeLocation(plugin.type) as T.PluginLocation,
        path: plugin.get('path'),
        ref: plugin,
      }
    } else if ('type' in plugin) {
      plugin = {
        content: plugin.content || '',
        location: getPluginTypeLocation(plugin.type as string) || 'head',
        path: plugin.path,
        ref: createComponent({
          content: '',
          path: '',
          ...plugin,
          location: getPluginTypeLocation(plugin.type || '') || 'head',
        }),
      }
    } else if (
      'content' in plugin ||
      'location' in plugin ||
      'path' in plugin ||
      'ref' in plugin
    ) {
      plugin = {
        content: plugin.content || '',
        location: plugin.location || 'head',
        path: plugin.path || '',
        ref:
          plugin.ref ||
          createComponent({
            ...plugin,
            location: 'head',
            type: plugin.location === 'head' ? 'pluginHead' : 'pluginBodyTop',
          }),
      }
    } else {
      plugin = {
        content: '',
        location: 'head',
        path: '',
        ref: createComponent({
          type: 'pluginHead',
          content: '',
          location: 'head',
          path: '',
        }),
      }
    }
    plugin.ref.set('plugin', plugin)
    return plugin.ref.get('plugin')
  }

  on(e: typeof nuiEvent.SET_PAGE, fn: (page: string) => void): this
  on(
    e: typeof nuiEvent.NEW_PAGE,
    fn: (page: string) => Promise<ComponentObject[] | undefined>,
  ): this
  on(
    e: typeof nuiEvent.NEW_PAGE_REF,
    fn: (ref: NOODLUI) => Promise<void> | undefined,
  ): this
  on(e: any, fn: any) {
    if (
      [nuiEvent.SET_PAGE, nuiEvent.NEW_PAGE, nuiEvent.NEW_PAGE_REF].includes(e)
    ) {
      if (!this.#cb.on[e]) this.#cb.on[e] = []
      if (!this.#cb.on[e].includes(fn)) {
        this.#cb.on[e].push(fn)
      }
    }
    return this
  }

  // TODO - Support other types of register args
  register({
    component,
    key,
    prop = 'onEvent', // Hard code to onEvent for now
    fn, // Note: fn MUST be passed in if the register component does not have an emit
  }: {
    component: T.ComponentInstance | RegisterComponentObject | null
    key: string
    prop?: string
    fn?: T.AnyFn
  }) {
    let id: string = ''
    let inst: T.ComponentInstance
    let cbs = this.getCbs('register')

    if (!cbs[key]) cbs[key] = {}
    if (!cbs[key][prop]) cbs[key][prop] = {}

    if (component !== null) {
      if (isComponent(component)) {
        id = component.original?.onEvent || ''
        inst = component
      } else {
        id = component.onEvent || ''
        inst = this.resolveComponents(component)
      }

      log.func('register')
      log.grey(`[${prop}] Registering ${id}: `, {
        ...arguments[0],
        instance: inst,
      })

      cbs[key][prop][id] = {
        component: inst,
        prop,
        id,
        key,
        fn: async (data: any) => {
          const registerInfo = { component, prop, id, key, data }
          if (inst.original?.emit) {
            // Limiting the consumer objs to 1 for now
            const obj = store.actions.emit?.find?.(
              (o) => o.trigger === 'register',
            )

            if (typeof obj?.fn === 'function') {
              const emitObj = { emit: inst.original.emit } as EmitObject
              const dataKey = inst.original.emit?.dataKey
              const emitAction = new EmitAction(
                emitObj as T.T.EmitActionObject,
                {
                  trigger: 'register',
                },
              )

              if (typeof dataKey === 'string') {
                if (dataKey === prop) emitAction.setDataKey(registerInfo.data)
                else emitAction.setDataKey(prop)
              } else if (isPlainObject(dataKey)) {
                emitAction.setDataKey(
                  Object.entries(dataKey).reduce((acc, [key, value]) => {
                    if (value === prop) acc[key] = registerInfo.data
                    else acc[key] = value
                    return acc
                  }, {}),
                )
              }

              emitAction.callback = async (snapshot) => {
                log.func('register [callback]')
                log.grey(`Executing register emit action callback`, snapshot)
                const result = await obj?.fn?.(
                  emitAction,
                  this.getConsumerOptions({ component: inst }),
                  this.actionsContext,
                )
                return (u.isArr(result) ? result[0] : result) || ''
              }

              let result = await emitAction.execute(emitObj)
              inst.emit(prop, { ...registerInfo, result })
            } else {
              const cbs = this.getCbs('register')
              if (!cbs[registerInfo.id]) {
                cbs[registerInfo.id] = {
                  [registerInfo.prop]: {
                    [registerInfo.id]: fn,
                  },
                }
              }
            }
          }
        },
      }
    } else {
      if (!id) id = key
      // If this call reaches here then this was registered sometime in the
      // beginning prior to parsing components if component is explicitly set
      // to null. When resolveComponents is called and this component is encountered,
      // it will set the component at that time.
      cbs[key][prop][id] = {
        component: null,
        prop,
        id,
        key,
        fn,
      }
    }

    return cbs[key][prop][id]
  }

  // emit(eventName: ComponentObjectEventId, cb: T.ComponentEventCallback): void
  emit(
    eventName: 'register',
    args: { key: string; id?: string; prop: 'onEvent'; data?: string },
  ): this
  emit(eventName: string, ...args: any[]) {
    stable && log.cyan(`Emitting: ${eventName}`, args)
    if (typeof eventName === 'string') {
      if (eventName === 'register') {
        // type ex: "onEvent"
        const { prop = '', key = '', id = '', ...rest } = args[0] || {}
        if (prop === 'onEvent') {
          const cbs = this.getCbs('register')
          const obj = cbs[key]?.[prop]?.[id]
          const fn = obj?.fn
          const params = { id, key, prop, ...rest }
          if (typeof fn === 'function') {
            if (obj.component) {
              if (obj.component?.original?.actions) {
                // Create the action chain and pass it as a final callback
                params.next = () => {
                  stable && log.cyan(`next() is getting called`)
                  return this.createActionChainHandler(
                    obj.component.original.actions,
                    {
                      ...getActionConsumerOptions(this),
                      component: obj.component,
                      trigger: 'register',
                    },
                  )()
                }
              } else {
                stable &&
                  log.cyan(
                    `A "register" component not using an emit object did not have an "actions" list. Is this supported?`,
                    {
                      ...obj,
                      params,
                    },
                  )
              }
            }
            // The result can be passed as args to the action chain if this component
            // has an action chain waiting to be called
            const result = fn(params.data)
            stable &&
              log.cyan(`Ran the "func" on the register component`, {
                result,
                ...obj,
              })
            if (isPromise(result)) {
              result
                .then((res) =>
                  log.grey(`Emit result for register nuiEvent: `, res),
                )
                .catch((err) => {
                  throw new Error(err)
                })
            } else {
              log.grey(`Emit result for register nuiEvent: `, result)
            }
          } else {
            log.func('emit')
            log.red(
              'Could not locate a "register" component to send this message to',
              args[0],
            )
          }
        }
      } else {
        const path = this.#getCbPath(eventName)
        if (path) {
          let cbs = get(this.#cb, path) as Function[]
          if (!u.isArr(cbs)) cbs = cbs ? [cbs] : []
          cbs.forEach((cb) => cb(...args))
        }
      }
    }
    return this
  }

  off(eventName: T.EventId, cb: T.ComponentEventCallback) {
    if (typeof eventName === 'string') {
      const path = this.#getCbPath(eventName)
      if (path) {
        const cbs = get(this.#cb, path)
        if (u.isArr(cbs)) {
          if (cbs.includes(cb)) {
            set(
              this.#cb,
              path,
              cbs.filter((fn) => fn !== cb),
            )
          }
        }
      }
    }
    return this
  }

  #getCbPath = (key: T.EventId | 'action' | 'chaining' | 'all') => {
    let path = ''
    if (key === 'all') {
      path = 'component.all'
    } else if (key in this.#cb) {
      path = key
    } else if (key in this.#cb.action) {
      path = `action.${key}`
    } else if (key in this.#cb.builtIn) {
      path = `builtIn.${key}`
    } else if (key in this.#cb.chaining) {
      path = `chaining.${key}`
    } else if (
      [nuiEvent.SET_PAGE, nuiEvent.NEW_PAGE, nuiEvent.NEW_PAGE_REF].includes(
        key as any,
      )
    ) {
      path = `on.${key}`
    }
    return path
  }

  getCbs(
    key: 'actions',
  ): Partial<
    Record<ActionType | 'emit' | 'goto' | 'toast', T.Store.ActionObject[]>
  >
  getCbs(
    key: 'builtIns',
  ): Partial<
    Record<ActionType | 'emit' | 'goto' | 'toast', T.Store.BuiltInObject[]>
  >
  getCbs(key: 'register'): RegisterCallbacks
  getCbs(
    key?:
      | 'actions'
      | 'builtIns'
      | 'chaining'
      | 'register'
      | typeof nuiEvent.SET_PAGE
      | typeof nuiEvent.NEW_PAGE
      | typeof nuiEvent.NEW_PAGE_REF,
  ) {
    switch (key) {
      case 'actions':
      case 'builtIns':
      case 'chaining':
        return store[key] as any
      case 'register':
        return this.#cb.registered
      case nuiEvent.SET_PAGE:
      case nuiEvent.NEW_PAGE:
      case nuiEvent.NEW_PAGE_REF:
        return this.#cb.on[key]
    }
    return this.#cb
  }

  removeCbs(actionType: string, funcName?: string) {
    if (store.actions[actionType]) store.actions[actionType].length = 0
    if (actionType === 'builtIn' && funcName) {
      if (store.builtIns[funcName]) store.builtIns[funcName].length = 0
    }
    return this
  }

  init({
    _log = true,
    actionsContext,
    getAssetsUrl,
    getRoot,
    viewport,
  }: { _log?: boolean; actionsContext?: NOODLUI['actionsContext'] } & {
    getAssetsUrl?: () => string
    getRoot?: () => T.Root
    plugins?: {
      fetcher?(...args: any[]): Promise<any>
      head: any[]
      body: {
        top: any[]
        bottom: any[]
      }
    }
    viewport?: Viewport
  } = {}) {
    if (!_log) Logger.disable()
    if (actionsContext) Object.assign(this.actionsContext, actionsContext)
    if (getAssetsUrl) this.#getAssetsUrl = getAssetsUrl
    if (getRoot) this.#getRoot = getRoot
    if (viewport) this.setViewport(viewport)
    this.initialized = true
    return this
  }

  getBaseStyles(component?: T.ComponentInstance) {
    let originalStyle = (component?.original?.style as StyleObject) || undefined
    let styles = { ...originalStyle } as StyleObject

    // if (styles?.top === 'auto') styles.top = '0'
    if (isPlainObject(originalStyle)) {
      // "Auto top" for web. Set top to 0 to start immediately after the previous
      if (!('top' in originalStyle)) styles.top = '0'

      if (isComponent(component)) {
        const parent = component.parent as T.ComponentInstance
        let top

        if (parent) {
          let parentTop = parent?.style?.top
          let parentHeight = parent?.style?.height

          // if (parentTop === 'auto') parentTop = '0'
          if (parentTop !== undefined) {
            if (parentTop === 'auto') {
              top = 0
            } else {
              top = Viewport.getSize(parentTop, this.viewport.height as number)
            }
          }
          if (parentHeight !== undefined) {
            top = Viewport.getSize(
              top + toNumber(parentHeight === 'auto' ? '0' : parentHeight),
              this.viewport.height as number,
            )
          }

          if (typeof top === 'number') {
            // REMINDER: "top" is a value here like 0.202 (not yet converted to size in px)
            top =
              (this.viewport.height as number) -
              Viewport.getSize(top, this.viewport.height as number)

            // originalStyle.top = Viewport.getSize(
            //   top,
            //   this.viewport.height as number,
            //   { unit: 'px' },
            // )
            component.setStyle(
              'top',
              Viewport.getSize(top, this.viewport.height as number, {
                unit: 'px',
              }),
            )
            if (!('height' in originalStyle)) {
              styles.height = 'auto'
            }
          }

          if (parent?.original?.style?.axis === 'vertical') {
            u.assign(styles, {
              // position: 'relative',
              // height: 'inherit',
            })
          }
        }

        if (!('top' in originalStyle) && !('height' in originalStyle)) {
          styles.position = 'relative'
          styles.height = 'auto'
        }

        if (!('height' in styles)) {
          styles.height = 'auto'
        }

        if (component.original?.children?.length || component.length) {
          // styles.position = 'relative'
        }
      } else if (isPlainObject(component)) {
        //
      }
    }

    return merge(
      {
        ...this.#getRoot().Style,
        position: 'absolute',
        outline: 'none',
      },
      originalStyle,
      styles,
    )
  }

  getActionsContext() {
    return this.actionsContext
  }

  getContext(component?: ComponentInstance) {
    let ctx = {} as { iteratorVar?: string }

    if (component) {
      const iteratorVar = findIteratorVar(component)
      iteratorVar && (ctx.iteratorVar = iteratorVar)
    }

    return {
      actionsContext: this.actionsContext,
      assetsUrl: this.assetsUrl,
      page: this.page,
      ...ctx,
    } as T.ResolverContext
  }

  getPageObject(page: string) {
    return this.#getRoot()[page]
  }

  getBaseUrl() {
    return this.#getBaseUrl?.()
  }

  getConsumerOptions({
    component,
    ...rest
  }: {
    component: T.ComponentInstance
    [key: string]: any
  }) {
    const iteratorVar = findIteratorVar(component)
    return {
      component,
      componentCache: this.componentCache.bind(this),
      context: this.getContext(component),
      createActionChainHandler: (action, options) =>
        this.createActionChainHandler(action, {
          ...getActionConsumerOptions(this),
          ...options,
          component: component as T.ComponentInstance,
        }),
      createSrc: ((path: string) => this.createSrc(path, component)).bind(this),
      getAssetsUrl: this.#getAssetsUrl.bind(this),
      getBaseUrl: this.#getBaseUrl.bind(this),
      getBaseStyles: this.getBaseStyles.bind(this),
      getCbs: this.getCbs.bind(this),
      getPreloadPages: this.#getPreloadPages.bind(this),
      getPages: this.#getPages.bind(this),
      getPageObject: this.getPageObject.bind(this),
      getResolvers: (() => this.#resolvers).bind(this),
      getRoot: this.#getRoot.bind(this),
      getState: this.getState.bind(this),
      plugins: this.plugins.bind(this),
      page: this.page,
      register: this.register.bind(this),
      resolveComponent: this.#resolve.bind(this),
      resolveComponentDeep: this.resolveComponents.bind(this),
      showDataKey: this.#state.showDataKey,
      viewport: this.#viewport,
      setPlugin: this.setPlugin.bind(this),
      ...rest,
    } as T.ConsumerOptions
  }

  getResolvers() {
    return this.#resolvers.map((resolver) => resolver.resolve)
  }

  getState() {
    return this.#state
  }

  setPage(pageName: string) {
    this.#state['page'] = pageName
    this.#cb.on[nuiEvent.SET_PAGE]?.forEach((cb) => cb?.(pageName))
    this.componentCache().clear()
    return this
  }

  setViewport(viewport: Viewport) {
    this.#viewport = viewport // main
    return this
  }

  plugins(location: 'head'): T.PluginObject[]
  plugins(location: 'body-top'): T.PluginObject[]
  plugins(location: 'body-bottom'): T.PluginObject[]
  plugins(location?: T.PluginLocation) {
    switch (location) {
      case 'head':
        return this.getState()?.plugins?.head
      case 'body-top':
        return this.getState()?.plugins?.body.top
      case 'body-bottom':
        return this.getState()?.plugins?.body.bottom
      default:
        return this.getState()?.plugins
    }
  }

  setPlugin(value: T.PluginCreationType) {
    if (!value) return
    const plugin: T.PluginObject = this.createPluginObject(value)
    if (plugin.location === 'head') {
      this.#state?.plugins?.head.push(plugin)
    } else if (plugin.location === 'body-top') {
      this.#state?.plugins?.body.top.push(plugin)
    } else if (plugin.location === 'body-bottom') {
      this.#state?.plugins?.body.bottom.push(plugin)
    }
    return plugin
  }

  use(resolver: Resolver | Resolver[]): this
  use(action: T.ActionChainUseObject | T.ActionChainUseObject[]): this
  use(viewport: Viewport): this
  use(o: {
    actionsContext?: Partial<NOODLUI['actionsContext']>
    getAssetsUrl?(): string
    getBaseUrl?(): string
    getPreloadPages?(): string[]
    getPages?(): string[]
    getRoot?(): T.Root
    plugins?: T.PluginCreationType[]
  }): this
  use(
    mod:
      | Resolver
      | T.ActionChainUseObject
      | Viewport
      | {
          actionsContext?: Partial<NOODLUI['actionsContext']>
          getAssetsUrl?(): string
          getBaseUrl?(): string
          getPreloadPages?(): string[]
          getPages?(): string[]
          getRoot?(): T.Root
          plugins?: T.PluginCreationType[]
        }
      | (
          | Resolver
          | T.ActionChainUseObject
          | {
              actionsContext?: Partial<NOODLUI['actionsContext']>
              getAssetsUrl?(): string
              getBaseUrl?(): string
              getPreloadPages?(): string[]
              getPages?(): string[]
              getRoot?(): T.Root
              plugins?: T.PluginCreationType[]
            }
        )[],
    ...rest: any[]
  ) {
    const mods = ((u.isArr(mod) ? mod : [mod]) as any[]).concat(rest)
    const handleMod = (m: typeof mods[number]) => {
      if (m) {
        if ('actionType' in m || 'funcName' in m || 'resolver' in m) {
          store.use(m)
        } else if (m instanceof Viewport) {
          this.setViewport(m)
        } else if (m instanceof Resolver) {
          this.#resolvers.push(m)
        } else if (
          'actionsContext' in m ||
          'getAssetsUrl' in m ||
          'getBaseUrl' in m ||
          'getPreloadPages' in m ||
          'getPages' in m ||
          'getRoot' in m ||
          'plugins' in m
        ) {
          // prettier-ignore
          if ('actionsContext' in m) Object.assign(this.actionsContext, m.actionsContext)
          if ('getAssetsUrl' in m) this.#getAssetsUrl = m.getAssetsUrl
          if ('getBaseUrl' in m) this.#getBaseUrl = m.getBaseUrl
          if ('getPreloadPages' in m) this.#getPreloadPages = m.getPreloadPages
          if ('getPages' in m) this.#getPages = m.getPages
          if ('getRoot' in m) this.#getRoot = m.getRoot
          if ('plugins' in m) {
            if (u.isArr(m.plugins)) {
              m.plugins.forEach((plugin: T.PluginCreationType) => {
                this.setPlugin(plugin)
              })
            }
          }
        }
      }
    }

    mods.forEach((m) => {
      if (u.isArr(m)) [...m, ...rest].forEach((_m) => handleMod(_m))
      else handleMod(m)
    })

    return this
  }

  unuse(mod: Resolver) {
    if (mod instanceof Resolver) {
      if (mod.internal) {
        throw new Error('Internal resolvers cannot be removed')
      }
      if (this.#resolvers.includes(mod)) {
        this.#resolvers = this.#resolvers.filter((r) => r !== mod)
      }
    }
    return this
  }

  componentCache() {
    return this.#cache
  }

  reset(
    opts: {
      keepCallbacks?: boolean
      keepPlugins?: boolean
      keepRegistry?: boolean
      keepActions?: boolean
      keepBuiltIns?: boolean
    } = {},
  ) {
    const newState = {} as Partial<T.State>
    if (opts.keepPlugins) newState.plugins = this.#state.plugins
    this.#state = _createState(newState)
    if (!opts.keepCallbacks) {
      this.#cb = {
        action: [],
        builtIn: [],
        chaining: [],
        on: { page: [] },
      } as any
    }
    if (!opts.keepActions) store.clearActions()
    if (!opts.keepBuiltIns) store.clearBuiltIns()
    return this
  }
}
