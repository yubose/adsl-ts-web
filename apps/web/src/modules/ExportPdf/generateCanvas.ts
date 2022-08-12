import type { Options as Html2CanvasOptions } from 'html2canvas'

async function generateCanvas(
  el: HTMLElement,
  options?: Partial<Html2CanvasOptions>,
): Promise<HTMLCanvasElement> {
  try {
    return html2canvas(el, {
      allowTaint: true,
      // Putting this to true will avoid blank page when they try to re-download
      removeContainer: true,
      useCORS: true,
      ...options,
    })
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}

export default generateCanvas
