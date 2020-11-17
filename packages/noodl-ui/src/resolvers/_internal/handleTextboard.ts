import _ from 'lodash'
import { current, isDraft } from 'immer'
import Logger from 'logsnap'
import { isBreakLineTextBoardItem } from 'noodl-utils'
import { formatColor } from '../../utils/common'
import { ConsumerOptions, IComponentTypeInstance } from '../../types'
import createComponent from '../../utils/createComponent'
import { _resolveChildren } from './helpers'

const log = Logger.create('internal[handleList]')

const handleTextboardInternalResolver = (
  component: IComponentTypeInstance,
  options: ConsumerOptions,
  _internalResolver,
) => {
  const { resolveComponent } = options
  let { textBoard, text } = component.get(['textBoard', 'text'])
  if (isDraft(textBoard)) textBoard = current(textBoard)

  if (_.isArray(textBoard)) {
    if (_.isString(text)) {
      log.red(
        'A component cannot have a "text" and "textBoard" property because ' +
          'they both overlap. The "text" will take precedence.',
        component.snapshot(),
      )
    }

    _.forEach(textBoard, (item) => {
      if (isBreakLineTextBoardItem(item)) {
        const br = createComponent('br')
        component.createChild(br)
      } else {
        /**
         * NOTE: Normally in the return type we would return the child
         * component wrapped with a resolveComponent call but it is conflicting
         * with our custom implementation because its being assigned unwanted style
         * attributes like "position: absolute" which disrupts the text display.
         * TODO: Instead of a resolverComponent, we should make a resolveStyles
         * to get around this issue. For now we'll hard code known props like "color"
         */
        const text = createComponent({
          type: 'label',
          style: {
            display: 'inline-block',
            ...(item.color ? { color: formatColor(item.color) } : undefined),
          },
          text: item.text,
        })
        resolveComponent(component.createChild(text))
      }
    })
  } else {
    log.red(
      `Expected textBoard to be an array but received "${typeof textBoard}". ` +
        `This part of the component will not be included in the output`,
      { component: component.snapshot(), textBoard },
    )
  }
}

export default handleTextboardInternalResolver
