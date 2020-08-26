import _ from 'lodash'
import { Styles } from 'app/types'
import { forEachEntries } from 'utils/common'

export interface SetStyle<Elem extends HTMLElement> {
  (node: Elem, key: string | { [key: string]: any }, value?: any): void
}

export function setStyle(
  node: HTMLElement,
  key?: string | Styles,
  value?: any,
) {
  if (node) {
    if (_.isString(key)) {
      node.style[key as any] = value
    } else if (_.isPlainObject(key)) {
      forEachEntries(key, (k: any, v) => {
        node.style[k] = v
      })
    }
  }
}
