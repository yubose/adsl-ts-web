import { ElementArg } from '../app/types'

export default function mapEachSibling(
  dir: 'left' | 'right',
  cb: (node: ElementArg) => HTMLElement = (n) => n as HTMLElement,
  el: ElementArg,
) {
  if (!el) return []

  let sibKey = dir === 'left' ? 'previousElementSibling' : 'nextElementSibling'
  let siblings = [] as HTMLElement[]
  let sibling = el?.[sibKey]

  while (sibling) {
    sibling = sibling[sibKey]
    sibling && siblings.push(cb(sibling))
  }

  return siblings
}
