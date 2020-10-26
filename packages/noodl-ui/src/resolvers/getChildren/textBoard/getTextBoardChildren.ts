import _ from 'lodash'
import Logger from 'logsnap'
import { isBreakLineTextBoardItem } from 'noodl-utils'
import { IComponent, ProxiedComponent, Resolver } from '../../../types'
import { createNOODLComponent, identify } from '../../../utils/noodl'
import { formatColor } from '../../../utils/common'
import getChildProps from '../getChildProps'

const log = Logger.create('getTextBoardChildren')

/*
  This resolver creates children for the component containing a "textBoard"
  A textBoard represents a component that is expected to render text that can be 
  styled within eachother separately such as different coloring
*/
const getTextBoardChildren: Resolver = (component: IComponent) => {
  const { textBoard, text } = component.get(['textBoard', 'text'])

  if (_.isArray(textBoard)) {
    if (_.isString(text)) {
      log.red(
        'A component cannot have a "text" and "textBoard" property because ' +
          'they both overlap. The "text" will take precedence.',
        component.snapshot(),
      )
    }

    component.set(
      'children',
      textBoard.map((item) => {
        let childComponent: IComponent

        // console.info(isBreakLineTextBoardItem(item))
        // console.info(isBreakLineTextBoardItem(item))
        // console.info(isBreakLineTextBoardItem(item))

        if (isBreakLineTextBoardItem(item)) {
          console.info(isBreakLineTextBoardItem.toString())
          childComponent = createNOODLComponent<ProxiedComponent>('br')
          const childProps = getChildProps(component, childComponent)
          console.info('childProps', childProps)
          return childProps?.toJS?.() || childProps
        } else {
          // Create a label component to isolate away from others
          /**
           * NOTE: Normally in the return type we would return the child
           * component wrapped with a resolveComponent call but it is conflicting
           * with our custom implementation because its being assigned unwanted style
           * attributes like "position: absolute" which disrupts the text display.
           * TODO: Instead of a resolverComponent, we should make a resolveStyles
           * to get around this issue. For now we'll hard code known props like "color"
           */
          childComponent = createNOODLComponent<ProxiedComponent>('label')
          console.info(item)
          childComponent
            .set('children', item.text)
            .set('style', 'display', 'inline-block')

          if (_.isString(item.color)) {
            childComponent.set('style', 'color', formatColor(item.color))
          }
          return getChildProps(component, childComponent)
        }
      }),
    )
  } else {
    log.red(
      `Expected textBoard to be an array but received "${typeof textBoard}". ` +
        `This part of the component will not be included in the output`,
      { component: component.snapshot(), textBoard },
    )
  }
}

export default getTextBoardChildren
