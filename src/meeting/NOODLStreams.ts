class NOODLStream {
  #node: HTMLDivElement | null = null
  #id: string

  constructor(node: HTMLDivElement | null) {
    this.#node = node
    if (node?.id) this.#id = node.id
  }
}

class NOODLStreams {
  #mainStream: HTMLDivElement | null = null
  #selfStream: HTMLDivElement | null = null
  #subStream: HTMLDivElement[] = []

  constructor() {
    //
  }
}

export default NOODLStreams
