import _ from 'lodash'
import Component from '../../Component'
import { getRandomKey } from '../../utils/common'
import { IComponent, ProxiedComponent } from '../../types'

/**
 * Helper to merge in common props like ids, parent ids, etc to a component
 * @param { IComponent } parent
 * @param { IComponent | undefined } child
 * @param { number | undefined } index
 * @param { ...any[] | undefined } otherArgs
 */
function getChildProps(
  parent: IComponent,
  child: IComponent | ProxiedComponent | undefined,
  // If number, this is an index and is inside an array of siblings --> children[] otherwise assume its the only child (object)
  index?: number | { [key: string]: any },
  otherArgs?: { [key: string]: any },
): ProxiedComponent {
  if (!_.isNumber(index)) {
    otherArgs = index
  }

  // Inject a custom ID to avoid duplicate keys in react
  return {
    ...((child as IComponent)?.snapshot?.() || child || undefined),
    ...getIds(parent, child, _.isNumber(index) ? index : undefined),
    ...otherArgs,
  } as ProxiedComponent
}

export function getIds(
  parent: IComponent,
  child: IComponent | ProxiedComponent | undefined,
  index?: number,
) {
  const id =
    child instanceof Component ? getId(child as IComponent) : getId(child)

  // If number, this is inside a children array
  if (_.isFinite(index)) {
    if (parent.id) {
      // Currently when we create components from list data, we have to provide
      // custom ids for each child. We can keep referencing the same dataKey for
      // debugging purposes and still allow them to be unique by appending indexes
      // inside square brackets like when working with array accessors
      return {
        parentId: parent.id,
        id: `${parent.id}-${id}[${index}]`,
      }
    }
    return { id }
  }
  // Else assume the child is a single child (object or some primitive type)
  else {
    if (parent.id) {
      return {
        parentId: parent.id,
        id,
      }
    }
    // Guarding against strings/numbers as children (may be possible by a dev mistake)
    return { id }
  }
}

export function getId(component: IComponent | ProxiedComponent | undefined) {
  let dataKey
  if (component && component instanceof Component) {
    dataKey = component.get('dataKey')
  } else {
    dataKey = component?.id
  }
  return dataKey || component?.id || getRandomKey()
}

export default getChildProps
