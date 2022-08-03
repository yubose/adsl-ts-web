import { ElementArg } from '../app/types'
import mapEachSibling from './mapEachSibling'

export default function forEachSibling(
  dir: 'left' | 'right',
  cb: (node: HTMLElement) => void,
  el: ElementArg,
) {
  mapEachSibling(
    dir,
    (node) => {
      cb(node as HTMLElement)
      return node as HTMLElement
    },
    el,
  )
}
