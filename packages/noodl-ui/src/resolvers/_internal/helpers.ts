import _ from 'lodash'
import { ComponentInstance, ResolveComponent } from '../../types'
import createComponent, { PropsOptionObj } from '../../utils/createComponent'

/**
 * Transforms a child or an array of children into their respective instances
 * @param { ComponentInstance } c
 * @param { object | undefined } opts - Optional options
 * @param { function } opts.onResolve - Callback called on each child that resolves
 * @param { object } opts.props - An object of component props passed to the resolving component
 * @param { function } opts.resolveComponent
 */
export function _resolveChildren<
  T extends ComponentInstance = ComponentInstance
>(
  c: T,
  opts: {
    onResolve?(child: ComponentInstance): void
    props?: PropsOptionObj
    resolveComponent: ResolveComponent
  },
) {
  if (c?.original?.children) {
    const { onResolve, props, resolveComponent } = opts || {}

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
          onResolve?.(
            resolveComponent?.(
              c.createChild(createComponent(noodlChild, { props })),
            ) as ComponentInstance,
          )
        }
      })
    }
  }
}
