function isNodeList<E extends Element>(
  nodes: unknown,
): nodes is HTMLCollection | NodeListOf<E> {
  if (nodes && typeof nodes === 'object') {
    if (
      /^\[object (HTMLCollection|NodeList|Object)\]$/.test(
        Object.prototype.toString.call(nodes),
      )
    ) {
      const length = nodes['length']
      if (typeof length === 'number') {
        return (
          length === 0 ||
          (typeof nodes[0] === 'object' && nodes[0]?.nodeType > 0)
        )
      }
    }
  }

  return false
}

export default isNodeList
