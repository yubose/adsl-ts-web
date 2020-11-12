import _ from 'lodash'
import {
  IComponentTypeInstance,
  IComponentTypeObject,
  ResolveComponent,
} from '../../types'
import { forEachEntries } from '../../utils/common'
import { forEachDeepChildren } from '../../utils/noodl'
import createComponent, { PropsOptionObj } from '../../utils/createComponent'

/**
 * Transforms a child or an array of children into their respective instances
 * @param { IComponentTypeInstance } c
 * @param { object | undefined } opts - Optional options
 * @param { function } opts.onResolve - Callback called on each child that resolves
 * @param { object } opts.props - An object of component props passed to the resolving component
 * @param { function } opts.resolveComponent
 */
export function _resolveChildren<
  T extends IComponentTypeInstance = IComponentTypeInstance
>(
  c: T,
  opts: {
    onResolve?(child: IComponentTypeInstance): void
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
            ) as IComponentTypeInstance,
          )
        }
      })
    }
  }
}

export const redraw = (function () {
  const _applyChanges = (
    component: IComponentTypeInstance,
    changes: Partial<IComponentTypeObject>,
  ) => {
    forEachEntries(changes, (key, prop) => {
      component.set(key, prop)
    })
  }

  const _redraw = (
    component: IComponentTypeInstance,
    props: Partial<IComponentTypeObject>,
    opts: {
      onChild?(child: IComponentTypeInstance): void
      resolveComponent: ResolveComponent
    },
  ) => {
    const { onChild, resolveComponent } = opts

    _applyChanges(component, props)

    if (component?.length) {
      forEachDeepChildren(component, (c) => {
        m
        // TODO - resolve dataKey as objects (found in redraw actions)
        if (_.isString(child.get('dataKey')) && !child.get('data-value')) {
          const dataKey = child.get('dataKey')
          // Labels just need a simple data-value from using their dataKey as a path
          if (child.noodlType === 'label') {
            if (listItem) {
              const dataObject = listItem?.getDataObject?.()
              console.info(dataObject)
              if (dataObject) {
                child.set('data-value', getDataValue(dataObject, dataKey))
              }
            }
          }
        }

        onChild?.(c)
      })
    }
  }

  return _redraw
})()
