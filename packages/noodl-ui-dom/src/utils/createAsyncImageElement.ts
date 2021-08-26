/**
 * Creates an image element that loads asynchronously
 * @param { HTMLElement } container - Element to attach the image in
 */
function createAsyncImageElement(
  container = document.body,
  onBeforeLoad?: (node: HTMLImageElement) => void,
): Promise<{
  event: Event
  node: HTMLImageElement
}> {
  return new Promise((resolve, reject) => {
    let node = new Image()
    onBeforeLoad?.(node)
    node.addEventListener('load', (event) => resolve({ event, node }))
    node.addEventListener('error', reject)
    try {
      container?.appendChild?.(node)
    } catch (error) {
      console.error(error)
      reject(error)
    } finally {
      node.dispatchEvent(new Event('load'))
    }
  })
}

export default createAsyncImageElement
