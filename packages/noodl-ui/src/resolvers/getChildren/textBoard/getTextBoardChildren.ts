import _ from 'lodash'
import { IComponent, ProxiedComponent, Resolver } from '../../../types'
import { createNOODLComponent, identify } from '../../../utils/noodl'
import { formatColor } from '../../../utils/common'
import getChildProps from '../getChildProps'
import Logger from '../../../Logger'

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
      _.map(textBoard, (item) => {
        let childComponent: IComponent

        if (_.isObjectLike(item)) {
          // Create a label component to isolate away from others
          if (identify.textBoard.item.isTextObject(item)) {
            /**
             * NOTE: Normally in the return type we would return the child
             * component wrapped with a resolveComponent call but it is conflicting
             * with our custom implementation because its being assigned unwanted style
             * attributes like "position: absolute" which disrupts the text display.
             * TODO: Instead of a resolverComponent, we should make a resolveStyles
             * to get around this issue. For now we'll hard code known props like "color"
             */
            childComponent = createNOODLComponent<ProxiedComponent>('label')

            childComponent
              .set('children', item.text)
              .set('style', 'display', 'inline-block')

            if (_.isString(item.color)) {
              childComponent.set('style', 'color', formatColor(item.color))
            }
            return getChildProps(component, childComponent)
          }
          return null
        } else if (identify.textBoard.item.isBreakLine(item)) {
          childComponent = createNOODLComponent<ProxiedComponent>('br')
          return getChildProps(component, childComponent)
        } else {
          log.red(
            `Expected an item of textBoard to be object-like or string but ` +
              `received the type "${typeof item}" instead. This part of the ` +
              `component will not be included in the output`,
          )
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
