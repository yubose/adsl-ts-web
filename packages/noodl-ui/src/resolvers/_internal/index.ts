import _ from 'lodash'
import { publish } from 'noodl-utils'
import Component from '../../components/Base'
import handleList from './handleList'
import handleTextboard from './handleTextboard'
import Resolver from '../../Resolver'
import { _resolveChildren } from './helpers'

/**
 * These resolvers are used internally by the lib. They handle all the logic
 * as defined in the NOODL spec and they're responsible for ensuring that
 * the components are behaving as expected behind the scenes
 */
const _internalResolver = new Resolver()

_internalResolver.setResolver((component, options) => {
  /**
   * Deeply parses every child node in the tree
   * @param { Component } c
   */
  const resolveChildren = (c: Component) => {
    _resolveChildren(c, {
      onResolve: (child: any) => {
        if (child) {
          if (child.noodlType === 'list') {
            return handleList(child, options, _internalResolver)
          }
          if (child.get('textBoard')) {
            return handleTextboard(child, options, _internalResolver)
          }
          return resolveChildren(child)
        }
      },
      resolveComponent: options.resolveComponent,
    })
  }

  const resolveInternalNode = <C extends Component = any>(c: C) => {
    if (c.id && typeof options.componentCache === 'function') {
      options.componentCache().set(c)
      publish(c as any, (innerChild) => {
        if (innerChild?.id) options.componentCache().set(innerChild)
      })
    }
  }

  resolveChildren(component)
  resolveInternalNode(component)
})

_internalResolver.internal = true

export default _internalResolver
