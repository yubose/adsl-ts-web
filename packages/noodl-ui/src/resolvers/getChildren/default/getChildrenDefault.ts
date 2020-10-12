import _ from 'lodash'
import getChildProps from '../getChildProps'
import {
  IComponent,
  NOODLComponent,
  ResolverConsumerOptions,
  ResolverOptions,
} from '../../../types'

/** Default renderer for children */
function getChildrenDefault(
  component: IComponent,
  options: ResolverConsumerOptions & { resolverOptions: ResolverOptions },
  mergingArgs?: Record<string, any>,
) {
  const { resolveComponent, resolverOptions } = options
  const children = component.get('children')

  if (_.isArray(children)) {
    const fn = (child: IComponent, index: number) => {
      const proxiedChild = getChildProps(component, child, index, mergingArgs)
      return resolveComponent?.(proxiedChild, resolverOptions)
    }
    component.set('children', _.map(children as NOODLComponent[], fn))
  } else if (_.isPlainObject(children)) {
    const child = getChildProps(
      component,
      children as IComponent<any>,
      mergingArgs,
    )
    component.child()
    component.set('children', resolveComponent(child, resolverOptions))
  } else {
    component.set('children', String(children))
  }
}

export default getChildrenDefault
