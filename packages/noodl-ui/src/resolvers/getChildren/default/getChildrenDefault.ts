import _ from 'lodash'
import getChildProps from '../getChildProps'
import {
  ComponentType,
  IComponent,
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
  const noodlChildren = component.get('children')
  const children = component.children()

  if (_.isArray(noodlChildren)) {
    _.forEach(noodlChildren, (noodlChild: ComponentType, index: number) =>
      component.createChild(
        resolveComponent(
          getChildProps(component, noodlChild, index, mergingArgs),
          resolverOptions,
        ),
      ),
    )
  } else if (_.isPlainObject(children)) {
    const noodlChild = getChildProps(component, children, mergingArgs)
    component.createChild(resolveComponent(noodlChild, resolverOptions))
  }
}

export default getChildrenDefault
