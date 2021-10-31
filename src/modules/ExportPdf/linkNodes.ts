export class NodeLink {
  #node: HTMLElement
  #next: NodeLink | null = null
  constructor(node: HTMLElement) {
    this.#node = node
  }
  get next() {
    return this.#next
  }
  set next(next) {
    this.#next = next
  }
  get node() {
    return this.#node
  }
}

function linkNodes(...nodes: HTMLElement[]) {
  const node = nodes.shift()
  let linkedNode = new NodeLink(node as HTMLElement)
  if (node) {
    for (const n of nodes) {
      if (n) {
        const nextLinkedNode = new NodeLink(n)
        linkedNode.next = nextLinkedNode
        linkedNode = nextLinkedNode
      }
    }
  }
  return linkedNode
}

export default linkNodes
