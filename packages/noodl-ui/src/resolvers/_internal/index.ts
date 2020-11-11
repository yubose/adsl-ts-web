import _ from 'lodash'
import Logger from 'logsnap'
import createComponent from '../../utils/createComponent'
import handleList from './handleList'
import handleListItem from './handleListItem'
import Resolver from '../../Resolver'
import { IComponentTypeInstance } from '../../types'

const log = Logger.create('_internalResolver')

/**
 * These resolvers are used internally by the lib. They handle all the logic
 * as defined in the NOODL spec and they're responsible for ensuring that
 * the components are behaving as expected behind the scenes
 */
const _internalResolver = new Resolver()

_internalResolver.setResolver((component, options) => {
  const { resolveComponent } = options

  /**
   * Prepares to call the instance resolver on each children.
   * After conversion, they're passed to the behavior handler
   * to control the behavior to comply with the NOODL spec
   * @param { IComponentTypeInstance } c
   */
  const resolveChildren = (c: IComponentTypeInstance | undefined) => {
    if (c?.original?.children) {
      let noodlChildren: any[] | undefined

      if (typeof c.original.children === 'string') {
        noodlChildren = [{ type: c.original.children }]
      } else if (_.isPlainObject(c.original.children)) {
        noodlChildren = [c.original.children]
      } else if (_.isArray(c.original.children)) {
        noodlChildren = c.original.children
      }

      if (noodlChildren) {
        _.forEach(noodlChildren, (noodlChild) => {
          if (noodlChild) {
            const inst = c.createChild(createComponent(noodlChild))
            if (inst) {
              switch (inst.noodlType) {
                case 'list':
                  return void handleList(inst, options)
                case 'listItem':
                  return void handleListItem(inst, options)
                default: {
                  resolveComponent(inst)
                  resolveChildren(inst)
                  break
                }
              }
            }
          }
        })
      }
    }
  }

  resolveChildren(component)
})

_internalResolver.internal = true

export default _internalResolver
