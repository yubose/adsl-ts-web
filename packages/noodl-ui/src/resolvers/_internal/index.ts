import handleList from './handleList'
import handleTextboard from './handleTextboard'
import Resolver from '../../Resolver'
import { _resolveChildren } from './helpers'
import { publish } from '../../utils/noodl'
import { ComponentInstance } from '../../types'

/**
 * These resolvers are used internally by the lib. They handle all the logic
 * as defined in the NOODL spec and they're responsible for ensuring that
 * the components are behaving as expected behind the scenes
 */
const _internalResolver = new Resolver()

_internalResolver.setResolver((component, options) => {
  const run = (component: ComponentInstance) => {
    if (component) {
      if (component.noodlType === 'list') {
        return handleList(component as any, options, _internalResolver)
      }
      if (component.get('textBoard')) {
        return handleTextboard(component as any, options, _internalResolver)
      }
      // Deeply parses every child node in the tree
      _resolveChildren(component, {
        onResolve: (o) => run(o),
        resolveComponent: (...args) => options.resolveComponent(...args),
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
