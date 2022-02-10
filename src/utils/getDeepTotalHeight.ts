import getHeight from './getHeight'

export default function getDeepTotalHeight(
  el: Element | HTMLElement | null | undefined,
  accHeight = 0,
) {
  if (!el) return 0

  let scrollHeight = el.scrollHeight

  if (el.childElementCount) {
    for (const childNode of el.children) {
      accHeight += getDeepTotalHeight(childNode, getHeight(childNode))
    }
  } else {
    accHeight += scrollHeight
  }

  return accHeight
}
