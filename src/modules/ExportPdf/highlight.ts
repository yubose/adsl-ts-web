/**
 * FOR DEBUGGING
 */
import * as u from '@jsmanifest/utils'
import type { FlatObject } from './exportPdfTypes'

export type ElInput = Element | HTMLElement | FlatObject

const BORDER_STYLE = '1px solid magenta'

const toggleHighlight = (
  elem: ElInput | ElInput[] | null | undefined,
  onOrOff: 'on' | 'off' = 'on',
) => {
  if (elem) {
    u.array(elem).forEach((el) => {
      if (u.isObj(el)) {
        let _el: HTMLElement | undefined

        if ('style' in el) {
          _el = el
        } else {
          _el = document.getElementById(el.id as string) as HTMLElement
        }

        _el.style.border = onOrOff === 'on' ? BORDER_STYLE : ''
      }
    })
  }
}

export default toggleHighlight
