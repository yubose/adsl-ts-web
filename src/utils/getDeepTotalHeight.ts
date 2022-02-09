export default function getDeepTotalHeight(
  el: Element | HTMLElement | null | undefined,
) {
  if (!el) return 0

  let accHeight = 0
  let scrollHeight = el.scrollHeight

  if (el.childElementCount) {
    for (const childNode of el.children) {
      accHeight += getDeepTotalHeight(childNode)
    }
  } else {
    accHeight += scrollHeight
  }

  return accHeight
}
