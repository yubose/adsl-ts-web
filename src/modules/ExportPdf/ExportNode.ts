import getBounds from './getBounds'

class ExportNode {
  #getMetadata: (() => { text?: string }) | undefined
  el: HTMLElement | null
  start = 0
  end = 0
  hidden = [] as string[]
  nativeBounds: DOMRect;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(el: HTMLElement, { metadata = false } = {}) {
    this.el = el
    this.nativeBounds = this.el?.getBoundingClientRect?.()

    if (metadata) {
      this.#getMetadata = () => {
        return { text: (el.textContent || '').substring(0, 35) } as {
          text?: string
        }
      }
    }
  }

  get bounds() {
    return this.el ? getBounds(this.el, this.start) : null
  }

  get height() {
    return this.nativeBounds?.height || 0
  }

  get metadata() {
    return this.#getMetadata ? this.#getMetadata() : null
  }

  toJSON() {
    return {
      bounds: this.bounds,
      nativeBounds: this.nativeBounds,
      el: this.el,
      start: this.start,
      end: this.end,
      height: this.height,
    }
  }
}

export default ExportNode
