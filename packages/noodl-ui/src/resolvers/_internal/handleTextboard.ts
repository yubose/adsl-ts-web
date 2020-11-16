import _ from 'lodash'
import produce from 'immer'
import Logger from 'logsnap'
import { forEachEntries, getRandomKey } from '../../utils/common'
import { forEachDeepChildren } from '../../utils/noodl'
import { IComponentTypeInstance, IComponentTypeObject } from '../../types'
import { event } from '../../constants'
import createComponent from '../../utils/createComponent'
import { _resolveChildren } from './helpers'

const log = Logger.create('internal[handleList]')

const handleTextboardInternalResolver = (
  component: IComponentTypeInstance,
  options,
  _internalResolver,
) => {
  return null
  const { resolveComponent } = options

  const commonProps = {}

  if (_.isArray(textBoard)) {
    if (_.isString(text)) {
      log.red(
        'A component cannot have a "text" and "textBoard" property because ' +
          'they both overlap. The "text" will take precedence.',
        component.snapshot(),
      )
    }

    let child: IComponentTypeInstance | null | undefined

    while (child) {
      child = component.child()

      if (child) {
        _.forEach(textBoard, (item) => {
          if (isBreakLineTextBoardItem(item)) {
            component.createChild(createComponent('br'))
          } else {
            /**
             * NOTE: Normally in the return type we would return the child
             * component wrapped with a resolveComponent call but it is conflicting
             * with our custom implementation because its being assigned unwanted style
             * attributes like "position: absolute" which disrupts the text display.
             * TODO: Instead of a resolverComponent, we should make a resolveStyles
             * to get around this issue. For now we'll hard code known props like "color"
             */
            component.createChild(
              createComponent({
                type: 'label',
                style: {
                  display: 'inline-block',
                  ...(item.color
                    ? { color: formatColor(item.color) }
                    : undefined),
                },
                text: item.text,
              }),
            )
          }

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
              component.createChild(
                createComponent({
                  type: 'label',
                  style: {
                    display: 'inline-block',
                    ...(item.color
                      ? { color: formatColor(item.color) }
                      : undefined),
                  },
                  text: item.text,
                }),
              )
            }
            return null
          }
        })
      }
    }
  } else {
    log.red(
      `Expected textBoard to be an array but received "${typeof textBoard}". ` +
        `This part of the component will not be included in the output`,
      { component: component.snapshot(), textBoard },
    )
  }
}

export default handleTextboardInternalResolver
