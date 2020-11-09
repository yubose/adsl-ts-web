import Resolver from '../../Resolver'
import handleList from './handleList'

/**
 * These resolvers are used internally by the lib. They handle all the logic
 * as defined in the NOODL spec and they're responsible for ensuring that
 * the components are behaving as expected behind the scenes
 */
const _internalResolver = new Resolver()

_internalResolver.setResolver((component, options) => {
  if (component.noodlType === 'list') {
    handleList(component, options)
  }
})

_internalResolver.internal = true

export default _internalResolver
