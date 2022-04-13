export default function getElementTop(el: HTMLElement) {
  return (
    el.offsetTop +
      (el.offsetParent && getElementTop(el.offsetParent as HTMLElement)) || 0
  )
}
