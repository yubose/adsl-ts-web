/**
 * Creates an image element that loads asynchronously
 * @param { HTMLElement } container - Element to attach the image in
 * @param { object } options
 * @param { function | undefined } options.onLoad
 */
function createAsyncImageElement(
  container: HTMLElement,
  opts?: { onLoad?(event: Event): void },
) {
  let node = new Image()
  node.onload = (event) => {
    if (!container) container = document.body
    container.insertBefore(node as HTMLImageElement, container.childNodes[0])
    opts?.onLoad?.(event)
  }
  return node
}

export default createAsyncImageElement
