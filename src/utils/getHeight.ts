export default function getHeight(
  el: Element | HTMLElement | null | undefined,
) {
  if (el) return el.getBoundingClientRect().height
  return 0
}
