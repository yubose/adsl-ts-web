import type { Options as Html2CanvasOptions } from 'html2canvas'
import sizes from './sizes'

async function generateCanvas(
  el: HTMLElement,
  options?: Partial<Html2CanvasOptions>,
  idToScrollTo = '',
) {
  try {
    const { width, height } = el.getBoundingClientRect()
    return html2canvas(el, {
      width,
      height,
      windowWidth: sizes.A4.width,
      windowHeight: sizes.A4.height,
      useCORS: true,
      ...options,
      onclone: (d, e) => {
        try {
          d.getElementById(idToScrollTo)?.scrollIntoView?.()
          e.querySelector(`#${idToScrollTo}`)?.scrollIntoView?.()
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          console.error(err)
        }
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

export default generateCanvas
