import Logger from 'logsnap'
import { current, isDraft } from 'immer'
import { isBreakLineTextBoardItem } from 'noodl-utils'
import { formatColor } from '../../utils/common'
import { ConsumerOptions } from '../../types'
import { _resolveChildren } from './helpers'
import Component from '../../components/Base'
import createComponent from '../../utils/createComponent'

const log = Logger.create('internal[handleList]')
const stable = process.env.ECOS_ENV === 'stable'

const handleTextboardInternalResolver = (
  component: Component,
  options: ConsumerOptions,
  _internalResolver: any,
) => {
  let { textBoard, text } = component.get(['textBoard', 'text'])
  if (isDraft(textBoard)) textBoard = current(textBoard)

  if (Array.isArray(textBoard)) {
    if (typeof text === 'string') {
      log.red(
        'A component cannot have a "text" and "textBoard" property because ' +
          'they both overlap. The "text" will take precedence.',
        component.snapshot(),
      )
    }

    textBoard.forEach((item) => {
      if (isBreakLineTextBoardItem(item)) {
        const br = createComponent('br')
        component.createChild(br as any)
        stable &&
          log.cyan(`Created and attached custom "BR" child component`, {
            br,
            component,
            textBoard,
          })
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
          type: 'div',
          noodlType: 'label',
          style: {
            display: 'inline-block',
            ...(item.color ? { color: formatColor(item.color) } : undefined),
          },
          text: item.text,
        })
        stable &&
          log.cyan(`Created a text component (label)`, {
            label: text,
            component,
          })
        component.createChild(text as any)
        stable &&
          log.cyan(`Attached the new text component as a child`, {
            label: text,
            component,
          })
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
