export default function getHeight(
  el: Element | HTMLElement | null | undefined,
) {
  if (el) return el.scrollHeight
  return 0
}
