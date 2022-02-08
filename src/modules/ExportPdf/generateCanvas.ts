import type { Options as Html2CanvasOptions } from 'html2canvas'
import sizes from './sizes'

async function generateCanvas(
  el: HTMLElement,
  options?: Partial<Html2CanvasOptions>,
) {
  try {
    return html2canvas(el, {
      windowWidth: sizes.A4.width,
      windowHeight: sizes.A4.height,
      useCORS: true,
      ...options,
    })
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}

export default generateCanvas
