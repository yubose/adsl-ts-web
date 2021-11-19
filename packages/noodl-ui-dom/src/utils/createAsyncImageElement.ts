/**
 * Creates an image element that loads asynchronously
 * @param { HTMLElement } container - Element to attach the image in
 */
function createAsyncImageElement(
  container = document.body,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const node = new Image()
    node.onload = (evt) => {}
    node
      .decode()
      .then(() => resolve(node))
      .catch(reject)
    try {
      requestAnimationFrame(() => container.appendChild(node))
    } catch (error) {
      console.error(error)
      reject(error)
    }
  })
}

export default createAsyncImageElement
