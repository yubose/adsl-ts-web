import _ from 'lodash'
import Logger from 'logsnap'
import makeComponentResolver from './factories/makeComponentResolver'
import * as T from './types'
import NOODLViewport from './Viewport'

class NOODL {
  #componentResolver: T.ComponentResolver
  initialized: boolean = false
  page: T.Page = { name: '', object: null }

  init({
    log,
    viewport,
  }: { log?: { enabled?: boolean }; viewport?: NOODLViewport } = {}) {
    this.#componentResolver = makeComponentResolver({ roots: {}, viewport })
    this.initialized = true
    Logger[log?.enabled ? 'enable' : 'disable']?.()
    return this
  }

  addLifecycleListener(
    ...args: Parameters<T.ComponentResolver['addLifecycleListener']>
  ) {
    this.#componentResolver.addLifecycleListener(...args)
    return this
  }

  hasLifeCycle(name: string | Function) {
    if (_.isString(name)) {
      return this.#componentResolver.hasLifeCycle(name)
    } else if (_.isFunction(name)) {
      return this.#componentResolver.hasLifeCycle(name)
    }
    return false
  }

  getContext() {
    return this.#componentResolver?.getResolverContext()
  }

  resolveComponents(
    components: T.NOODLComponent | T.NOODLComponent[],
  ): T.NOODLComponentProps[]
  resolveComponents(pageObject?: T.Page['object']): T.NOODLComponentProps[]
  resolveComponents(
    componentsProp?: T.NOODLComponent | T.NOODLComponent[] | T.Page['object'],
  ): T.NOODLComponentProps[] {
    let resolvedComponents: T.NOODLComponentProps[] = []

    if (_.isArray(componentsProp)) {
      resolvedComponents = componentsProp.map(
        (c) =>
          this.#componentResolver.resolve({
            ...c,
            id: this.page.name,
          }) as T.NOODLComponentProps,
      )
    } else if (
      componentsProp &&
      !(componentsProp as T.NOODLPageObject).components
    ) {
      resolvedComponents.push(
        this.#componentResolver.resolve({
          ...(componentsProp as T.NOODLComponent),
          id: this.page.name,
        }) as T.NOODLComponentProps,
      )
    } else {
      if (!componentsProp) {
        componentsProp = this.getContext().page?.object
      }
      const components = (componentsProp as T.NOODLPageObject)?.components || []
      resolvedComponents = _.map(components, (c: T.NOODLComponent) => {
        return this.#componentResolver.resolve({
          ...c,
          id: this.page.name,
        }) as T.NOODLComponentProps
      })
    }

    return resolvedComponents
  }

  setAssetsUrl(...args: Parameters<T.ComponentResolver['setAssetsUrl']>) {
    this.#componentResolver.setAssetsUrl(...args)
    return this
  }

  setPage(page: T.Page) {
    this.page = page || { name: '', object: null }
    this.#componentResolver.setPage(this.page)
    return this
  }

  setResolvers(...args: Parameters<T.ComponentResolver['setResolvers']>) {
    this.#componentResolver.setResolvers(...args)
    return this
  }

  setRoot(...args: Parameters<T.ComponentResolver['setRoot']>) {
    this.#componentResolver.setRoot(...args)
    return this
  }

  getViewport() {
    return this.#componentResolver.getViewport()
  }

  setViewport(...args: Parameters<T.ComponentResolver['setViewport']>) {
    this.#componentResolver.setViewport(...args)
    return this
  }
}

export default NOODL
