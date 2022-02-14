export default function getDeepTotalHeight(
  el: Element | HTMLElement | null | undefined,
  accHeight = 0,
) {
  if (!el) return 0

  if (el.childElementCount) {
    let currChild = el.firstElementChild

    while (currChild) {
      if (currChild.scrollHeight > accHeight) {
        accHeight = currChild.scrollHeight
        const accChildrenHeight = getDeepTotalHeight(currChild, accHeight)
        if (accChildrenHeight > accHeight) accHeight = accChildrenHeight
      }
      currChild = currChild.nextElementSibling
    }
  } else {
    accHeight += el.scrollHeight
  }

  return el.scrollHeight > accHeight ? el.scrollHeight : accHeight
}
