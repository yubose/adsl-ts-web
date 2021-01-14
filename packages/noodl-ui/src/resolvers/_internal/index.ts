import handleList from './handleList'
import handlePage from './handlePage'
import handleTextboard from './handleTextboard'
import { InternalResolver } from '../../Resolver'
import { _resolveChildren } from './helpers'
import { findParent, publish } from '../../utils/noodl'
import { ComponentInstance } from '../../types'
import Page from '../../components/Page'

/**
 * These resolvers are used internally by the lib. They handle all the logic
 * as defined in the NOODL spec and they're responsible for ensuring that
 * the components are behaving as expected behind the scenes
 */
const _internalResolver = new InternalResolver()

_internalResolver.setResolver((component, options, ref) => {
  const run = (component: ComponentInstance) => {
    if (component) {
      if (component.noodlType === 'list') {
        return handleList(component as any, options, _internalResolver)
      }
      if (component.noodlType === 'page') {
        return handlePage(component as any, options, { _internalResolver, ref })
      }
      if (component.get('textBoard')) {
        return handleTextboard(component as any, options, _internalResolver)
      }

      let resolveComponents: Page['resolveComponents'] | undefined

      findParent(component, (p: Page) => {
        if (p?.noodlType === 'page') {
          resolveComponents = p.resolveComponents.bind(p)
          return true
        }
        return false
      })

      if (!resolveComponents) {
        resolveComponents = options.resolveComponent.bind(
          ref,
        ) as Page['resolveComponents']
      }

      // Deeply parses every child node in the tree
      _resolveChildren(component, {
        onResolve: (o) => run(o),
        resolveComponent: (...args) => resolveComponents?.(...args),
      })
    }
  }
  const resolveInternalNode = <C extends ComponentInstance = any>(c: C) => {
    if (c.id && typeof options?.componentCache === 'function') {
      options.componentCache().set(c)
      publish(c as any, (innerChild) => {
        if (innerChild?.id) options?.componentCache().set(innerChild)
      })
    }
  }

  run(component)
  resolveInternalNode(component)
})

_internalResolver.internal = true

export default _internalResolver
