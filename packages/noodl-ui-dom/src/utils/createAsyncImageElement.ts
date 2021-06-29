/**
 * Creates an image element that loads asynchronously
 * @param { HTMLElement } container - Element to attach the image in
 * @param { function | undefined } opts.append - Overrides the "insertBefore" function with a custom child inserter
 * @param { function | undefined } opts.onLoad - Callback called after inserting to children
 */
function createAsyncImageElement(
  container: HTMLElement | null,
  opts?: {
    append?(args: { event: Event; node: HTMLImageElement }): void
    onLoad?(args: { event: Event; node: HTMLImageElement }): void
  },
) {
  let node = new Image()
  node.onload = (event) => {
    if (!container) container = document.body
    if (opts?.append) opts.append({ event, node })
    else container.insertBefore(node, container.childNodes[0])
    opts?.onLoad?.({ event, node })
  }
  return node
}

export default createAsyncImageElement
