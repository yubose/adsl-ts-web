import handleList from './handleList'
import handlePage from './handlePage'
import handleRegister from './handleRegister'
import handleTextboard from './handleTextboard'
import handleTimer from './handleTimer'
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

  const run = (c: ComponentInstance) => {
    if (c) {
      if (c.noodlType === 'list') {
        return handleList(c as any, options, _internalResolver)
      }
      if (c.noodlType === 'page') {
        return handlePage(c as any, options, { _internalResolver, ref })
      }
      if (c.noodlType === 'register') {
        return handleRegister(c as any, options)
      }
      // @ts-expect-error
      if (c.get('textBoard')) {
        return handleTextboard(c as any, options, _internalResolver)
      }
      if (c.contentType === 'timer') {
        return handleTimer(c, options)
      }

      // Deeply parses every child node in the tree
      _resolveChildren(c, {
        onResolve: run,
        resolveComponent: resolveComponents?.bind(ref),
      })

      if (c.noodlType === 'scrollView') {
        // Set immediate children to relative so they can stack on eachother
        c.children().forEach((child: ComponentInstance) => {
          child.assignStyles({ position: 'absolute', display: 'block' })
        })
      }
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
