import isElement from '../../utils/isElement'

/**
 * FOR DEBUGGING
 */

export default function highlightElement(
  el: Element | HTMLElement | null | undefined,
  scrollToView = true,
) {
  if (isElement(el)) {
    if (scrollToView) el.scrollIntoView()
    el.style.border = '1px solid red'
    debugger
    el.style.border = ''
  }
}
