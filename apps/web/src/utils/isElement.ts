function isElement(node: unknown): node is HTMLElement {
  return !!node && typeof node == 'object' && 'tagName' in node
}

export default isElement
