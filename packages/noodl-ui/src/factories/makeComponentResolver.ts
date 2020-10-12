import _ from 'lodash'
import Logger from 'logsnap'
import { isDraft, current } from 'immer'
import ActionChain from '../ActionChain'
import Component from '../Component'
import getChildrenResolver from '../resolvers/getChildren'
import makeRootsParser from './makeRootsParser'
import OptionsBuilder from '../OptionsBuilder'
import {
  forEachDeepEntries,
  forEachEntries,
  formatColor,
  getRandomKey,
  hasLetter,
} from '../utils/common'
import isReference from '../utils/isReference'
import Viewport from '../Viewport'
import * as T from '../types'

const log = Logger.create('makeComponentResolver')

function makeComponentResolver({
  showDataKey,
  roots,
  viewport,
}: {
  showDataKey?: boolean
  roots: { [key: string]: any }
  viewport?: Viewport
}): T.ComponentResolver {
  const _state: T.ComponentResolverState = {
    drafted: {},
    lists: {},
    pending: {}, // Pending data used by a data consumer (ex: for list item children)
  }

  if (!viewport) viewport = new Viewport()

  let parser = makeRootsParser(roots)
  const lifeCycleListeners: Map<any, any> = new Map()
  const optionsBuilder = new OptionsBuilder({
    showDataKey,
    viewport,
  })

  function _createId(proxiedComponent: any) {
    return proxiedComponent?.id || getRandomKey()
  }

  function _getInitialStyles(styles?: T.NOODLStyle) {
    return {
      ...roots?.Style,
      position: 'absolute',
      outline: 'none',
      ...styles,
    }
  }

  function _init(
    proxiedComponent: Parameters<T.ComponentResolver['resolve']>[0],
  ) {
    let component: T.IComponent | T.ProxiedComponent

    if (proxiedComponent instanceof Component) {
      component = proxiedComponent
    } else {
      component = new Component<any>(proxiedComponent)
    }
    // NOTE: component.id is also applied in the getChildren resolver. Give that higher
    // priority first because it is establishing communication to its children with it
    if (!component.id) component.setId(_createId(proxiedComponent))
    component.set('noodlType', proxiedComponent.type)
    // NOTE: The base styles are not being picked up from the resolvers and
    // they only know of the styles coming from proxiedComponent. This
    // means we have to handle them somewhere at the end as we did above
    let initialStyles: T.NOODLStyle | undefined
    if (component.type === 'image') {
      if (!('height' in component)) {
        // Remove the height to maintain the aspect ratio since images are
        // assumed to have an object-fit of 'contain'
        initialStyles = _.omit(
          _getInitialStyles(component.get('style')),
          'height',
        )
      }
    }
    if (!initialStyles) {
      initialStyles = _getInitialStyles(component.get('style'))
    }
    component.assignStyles(initialStyles as T.NOODLStyle)
    _setDraftNode(component)
    return component
  }

  function _setDraftNode(component: T.IComponent) {
    if (!component.id) {
      console.groupCollapsed(
        `%c[_setDraftNode] Cannot set this node to drafted state because the id is invalid`,
        'color:#ec0000',
        component.snapshot(),
      )
      console.trace()
      console.groupEnd()
    } else {
      _state.drafted[component.id as string] = component
    }
  }

  function _finalize(component: T.IComponent) {
    const { style } = component
    if (_.isObjectLike(style)) {
      forEachDeepEntries(style, (key, value) => {
        if (_.isString(value)) {
          if (value.startsWith('0x')) {
            component.set('style', key, formatColor(value))
          } else if (/(fontsize|borderwidth|borderradius)/i.test(key)) {
            if (!hasLetter(value)) {
              component.set('style', key, `${value}px`)
            }
          }
        }
      })
    }
    return component.done()
  }

  // Set default parser by default
  optionsBuilder.setParser(parser)

  /**
   * @param map - Map of lifecycle listeners
   * @param name
   * @param fn
   */
  function _appendLifeCycleListener(
    map: Map<any, any>,
    name: string | Function | { [key: string]: any },
    fn?: Function | { [key: string]: any },
  ) {
    if (_.isString(name)) {
      if (typeof fn === 'object') {
        const innerMap = new Map()
        map.set(name, innerMap)
        forEachEntries(fn, (key, value) => {
          _appendLifeCycleListener(innerMap, key, value)
        })
      } else if (_.isFunction(fn)) {
        map.set(name, fn)
      }
    } else if (_.isFunction(name)) {
      map.set(name, name)
    } else if (_.isPlainObject(name)) {
      forEachEntries(name, (key, value) => {
        _appendLifeCycleListener(map, key, value)
      })
    }
  }

  const o: T.ComponentResolver = {
    init(...args) {
      _init(...args)
      return this
    },
    finalize(...args) {
      _finalize(...args)
      return this
    },
    getState() {
      return _state
    },
    getDraftedNodes() {
      return _state.drafted
    },
    getDraftedNode(component) {
      if (component instanceof Component) {
        return _state.drafted[component.id as string]
      }
      return _state.drafted[component as string]
    },
    getList(listId) {
      return _.isString(listId) ? _state.lists[listId] : undefined
    },
    getListItem(listId, index, defaultValue) {
      if (!listId || _.isUndefined(index)) {
        return defaultValue
      }
      return _state.lists[listId]?.[index] || defaultValue
    },
    /**
     * Consumes data from the "pending" object using the component id as the key
     * or the component reference itself
     * @param { string | Component } component
     */
    consume(component) {
      const componentId = component.id || ''
      log.func('consume')
      if (!componentId) {
        log.red('Invalid componentId used to consume list data', {
          component: component.snapshot(),
          pending: _state.pending,
        })
      }
      const value = _state.pending[componentId]
      if (value) {
        delete _state.pending[componentId]
      } else {
        console.groupCollapsed(
          `%c[consume] Expected data to be consumed by a component with id ` +
            `"${componentId}" but received null or undefined when attempting ` +
            `to retrieve it`,
          'color:#ec0000',
          {
            targetObject: _state.pending,
            expectingKey: componentId,
            consumedResult: value,
            component: component.snapshot(),
          },
        )
        console.trace()
        console.groupEnd()
      }
      return value
    },
    setConsumerData(component: T.IComponent | string, data: any) {
      if (component instanceof Component) {
        _state.pending[component.id as string] = data
      } else if (_.isString(component)) {
        const id = component
        if (!id) {
          log.func('setConsumerData')
          log.red(
            `Could not set data for a list data consumer because the child component's ` +
              `id was invalid`,
            { id, data },
          )
        } else {
          log.func('setConsumerData')
          log.grey(
            `Attached consumer data for child component id: ${id}`,
            _state.pending,
          )
          _state.pending[id] = data
        }
      }
      return this
    },
    setDraftNode(component) {
      _setDraftNode(component)
      return this
    },
    setList(listId, data) {
      _state.lists[listId] = data
      return this
    },
    addLifecycleListener(name, fn) {
      _appendLifeCycleListener(lifeCycleListeners, name, fn)
      return this
    },
    removeLifeCycleListener(name) {
      if (lifeCycleListeners.has(name)) {
        lifeCycleListeners.delete(name)
      }
      return this
    },
    // Handle only top + second level for now
    hasLifeCycle(name) {
      if (lifeCycleListeners.has(name)) {
        return true
      }

      if (_.isString(name)) {
        const paths = name.split('.')

        // Assume it is a nested lookup
        if (paths.length > 1) {
          //
        }
      }

      const arr = Array.from(lifeCycleListeners.values())

      for (let index = 0; index < arr.length; index++) {
        const key = arr[index]
        if (key instanceof Map) {
          if (key.has(name)) {
            return true
          }
        }
      }

      return false
    },
    getLifeCycle(name) {
      return lifeCycleListeners.get(name)
    },
    createActionChain(actions, { trigger, ...otherOptions }) {
      const actionListeners = lifeCycleListeners.get('action')
      const builtInListeners = lifeCycleListeners.get('builtIn')
      const options = { builtIn: builtInListeners, trigger, ...otherOptions }

      if (actionListeners instanceof Map) {
        actionListeners.forEach((value, key) => {
          options[key] = value
        })
      }

      const actionChain = new ActionChain(actions, options)
      // @ts-expect-error\
      window.ac = actionChain
      return actionChain.build({
        context: o?.getResolverContext(),
        parser,
        ...otherOptions,
      })
      // return makeActionChain(lifeCycleListeners).createHandler(...args)
    },
    addResolvers(...args) {
      optionsBuilder.addResolvers(...args)
      return this
    },
    removeResolver(...args) {
      optionsBuilder.removeResolver(...args)
      return this
    },
    callResolvers(component, resolverConsumerOptions) {
      const fns = [...optionsBuilder.resolvers]
      const index = _.findIndex(fns, (f) => !!f?.getChildren)

      let getChildren: typeof getChildrenResolver | T.Resolver | undefined

      if (index !== -1) {
        // Separate the getChildren resolver since we need to pass in ResolverOptions
        // in order to render its children hieararchy correctly
        getChildren = fns.splice(index, 1)[0]
      }

      // Note: getChildren is not being invoked in this loop because it will be called separately
      for (let i = 0; i < fns.length; i++) {
        const fn = fns[i]
        if (_.isFunction(fn)) {
          fn(component, resolverConsumerOptions)
        }
      }

      if (_.isFunction(getChildren)) {
        getChildren(
          component,
          _.assign({}, resolverConsumerOptions, {
            resolverOptions: o.getResolverOptions(),
          }),
        )
      }
    },
    createSrc(path) {
      let src = ''
      if (path && _.isString(path)) {
        if (path && _.isString(path)) {
          if (path.startsWith('http')) {
            src = path
          } else if (path.startsWith('~/')) {
            // Should be handled by an SDK
          } else {
            src = o.getAssetsUrl() + path
          }
        }
      }
      return src
    },
    getAssetsUrl() {
      return optionsBuilder?.assetsUrl
    },
    getParser() {
      return parser
    },
    getResolverOptions(additionalOptions?: any) {
      return optionsBuilder.build({
        include: {
          parser,
          resolveComponent: this.resolve,
          ...this.getStateGetters(),
          ...this.getStateSetters(),
          ...lifeCycleListeners,
          ...additionalOptions,
        },
      }) as T.ResolverOptions
    },
    getResolverConsumerOptions(opts) {
      return optionsBuilder.build({
        type: 'consumer',
        include: {
          createActionChain: o.createActionChain,
          createSrc: o.createSrc,
          getFallbackDataValue: o.getFallbackDataValue,
          resolveComponent: o.resolve,
          snapshot: o.snapshot,
          ...this.getStateGetters(),
          ...this.getStateSetters(),
          ...opts,
        },
      }) as T.ResolverConsumerOptions
    },
    getResolverContext() {
      return optionsBuilder.build({ type: 'context' }) as T.ResolverContext
    },
    getRoots() {
      return optionsBuilder.roots
    },
    getStateGetters() {
      return {
        consume: this.consume,
        getList: this.getList,
        getListItem: this.getListItem,
        getState: this.getState,
        getDraftedNodes: this.getDraftedNodes,
        getDraftedNode: this.getDraftedNode,
      }
    },
    getStateSetters() {
      return {
        setConsumerData: this.setConsumerData,
        setDraftNode: this.setDraftNode,
        setList: this.setList,
      }
    },
    /**
     * Apply the original fallback value if the data key is showing and
     * showDataKey === true, else return an empty string (invisible in the UI)
     * @param { object } args
     */
    getFallbackDataValue(component, defaultValue = '') {
      const { text, dataKey, listId, listItemIndex = 0 } = component.get([
        'text',
        'dataKey',
        'listId',
        'listItemIndex',
      ])

      if (!text) return ''

      let value

      if (_.isString(text) && !isReference(text)) {
        value = text
      } else if (_.isString(dataKey)) {
        // TODO - replace itemObject with the dynamic iteratorVar approach
        // Most likely a child of a list
        if (dataKey.startsWith('itemObject')) {
          const listItem = o.getListItem(
            listId as string,
            listItemIndex as number,
          )
          const path = dataKey.split('.').slice(1)
          value = _.get(listItem, path, defaultValue)
        }
      }
      return value || defaultValue
    },
    resolve(proxiedComponent) {
      const component = _init(proxiedComponent)
      const page = optionsBuilder.page
      const resolverConsumerOptions = o.getResolverConsumerOptions({
        component,
      })

      const type = component.get('type') || ''

      if (!type) {
        log.func('resolve')
        log.red(
          'Encountered a NOODL component without a "type"',
          component.snapshot(),
        )
      }

      if (page.name && parser.getLocalKey() !== page.name) {
        parser.setLocalKey(page.name)
      }

      // Lifecycle --> onBeforeResolve
      if (o.hasLifeCycle('onBeforeResolve')) {
        // If they provided this callback, call it and get the result. Allow
        //    this to be merged into the component right before starting the resolving process
        const onBeforeResolve = o.getLifeCycle('onBeforeResolve')

        const injectingProps = _.isFunction(onBeforeResolve)
          ? onBeforeResolve(component, resolverConsumerOptions)
          : onBeforeResolve?.[type]?.(component, resolverConsumerOptions)

        // They can also listen for a "finally" event if they passed it as an object of funcs
        // this is to allow a callback to be invoked by all components instead of
        // specific ones
        if (!_.isFunction(onBeforeResolve)) {
          onBeforeResolve?.finally?.(component, resolverConsumerOptions)
        }
        if (injectingProps) {
          // They might want to make this callback an async but not intend to merge anything which
          //  which would unexpectably run these lines because a promise is truthy, so we negate this
          if (!(injectingProps instanceof Promise)) {
            component.merge(injectingProps)
          }
        }
      }

      // Call all resolvers, finalizing the draft
      o.callResolvers(component, resolverConsumerOptions)

      if (o.hasLifeCycle('onAfterResolve')) {
        const onAfterResolve = o.getLifeCycle('onAfterResolve')

        const injectingProps = _.isFunction(onAfterResolve)
          ? onAfterResolve(component, resolverConsumerOptions)
          : onAfterResolve?.[type]?.(component, resolverConsumerOptions)

        if (injectingProps && !(injectingProps instanceof Promise)) {
          component.merge(injectingProps)
        }
      }

      return _finalize(component)
    },
    setAssetsUrl(assetsUrl) {
      optionsBuilder.setAssetsUrl(assetsUrl)
      return this
    },
    setPage(...args) {
      const [page] = args
      if (page) {
        if (page.name !== parser.getLocalKey()) parser.setLocalKey(page.name)
      }
      optionsBuilder.setPage(...args)
      return this
    },
    setResolvers(...args) {
      optionsBuilder.setResolvers(...args)
      return this
    },
    setRoot(key, value) {
      let newRoot
      if (_.isString(key)) {
        newRoot = { [key]: value }
      } else if (_.isPlainObject(key)) {
        newRoot = key
      }
      if (newRoot) {
        roots = newRoot
        parser.setRoot(roots)
        optionsBuilder.setRoots(roots)
      }
      return this
    },
    hasViewport() {
      return !!viewport?.isValid()
    },
    getViewport() {
      return viewport
    },
    setViewport({ width, height }) {
      if (viewport) {
        if (_.isFinite(width)) {
          viewport.width = width
        }
        if (_.isFinite(height)) {
          viewport.height = height
        }
      }
      return this
    },
    /**
     * Safely retrieves the current state of the draft
     * @param { ProxiedDraftComponent } draft - Draft NOODL component
     */
    snapshot(draft) {
      return isDraft(draft) ? current(draft) : draft
    },
  }

  return o
}

export default makeComponentResolver
