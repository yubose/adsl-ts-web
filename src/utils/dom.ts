import _ from 'lodash'
import { forEachEntries } from 'utils/common'
import { Styles } from 'app/types'

export function mergeStyles(node: HTMLElement, styles: Styles) {
  if (_.isPlainObject(styles)) {
    forEachEntries(styles, (key, value) => {
      // @ts-expect-error
      node.style[key] = value
    })
  }
}
