import _ from 'lodash'
import Logger from 'logsnap'
import handleList from './handleList'
import Resolver from '../../Resolver'
import { _resolveChildren } from './helpers'
import { IComponentTypeInstance, IList } from '../../types'

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
  // const resolveChildren = (
  //   c: IComponentTypeInstance | undefined,
  //   opts: {
  //     props?: PropsOptionFunc<any> | PropsOptionObj
  //     onResolve?: (child: typeof c) => void
  //   } = {},
  // ) => {
  //   if (c?.original?.children) {
  //     let noodlChildren: any[] | undefined

  //     if (typeof c.original.children === 'string') {
  //       noodlChildren = [{ type: c.original.children }]
  //     } else if (_.isPlainObject(c.original.children)) {
  //       noodlChildren = [c.original.children]
  //     } else if (_.isArray(c.original.children)) {
  //       noodlChildren = c.original.children
  //     }

  //     if (noodlChildren) {
  //       _.forEach(noodlChildren, (noodlChild) => {
  //         if (noodlChild) {
  //           const inst = resolveComponent(
  //             c.createChild(createComponent(noodlChild, { props: opts.props })),
  //           ) as IComponentTypeInstance

  //           if (inst) {
  //             switch (inst.noodlType) {
  //               case 'list':
  //                 return void handleList(inst, options, { resolveChildren })
  //               default: {
  //                 resolveComponent(inst)
  //                 resolveChildren(inst)
  //                 break
  //               }
  //             }
  //           }

  //           opts?.onResolve?.(inst)
  //         }
  //       })
  //     }
  //   }
  // }

  const resolveChildren = (c: IComponentTypeInstance) => {
    _resolveChildren(c, {
      onResolve: (child) => {
        if (child) {
          switch (child.noodlType) {
            case 'list':
              return void handleList(child as IList, options)
            default: {
              resolveComponent(child)
              resolveChildren(child)
              break
            }
          }
        }
      },
      resolveComponent,
    })
  }

  resolveChildren(component)
})

_internalResolver.internal = true

export default _internalResolver
