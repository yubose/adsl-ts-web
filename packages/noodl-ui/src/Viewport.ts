import { IViewport, ViewportListener } from './types'
import { isBrowser } from './utils/common'

class Viewport implements IViewport {
  #width: number | undefined
  #height: number | undefined
  #onResize: () => void

  get width() {
    return this.#width
  }

  set width(width: number | undefined) {
    this.#width = width
  }

  get height() {
    return this.#height
  }

  set height(height: number | undefined) {
    this.#height = height
  }

  isValid() {
    return this.width !== null && this.height !== null
  }

  get onResize() {
    return this.#onResize
  }

  set onResize(callback: ViewportListener) {
    if (isBrowser()) {
      window.removeEventListener('resize', this.#onResize)

      this.#onResize = () => {
        this.#width = window.innerWidth
        this.#height = window.innerHeight

        callback({
          width: this.#width,
          height: this.#height,
        })
      }

      const onUnload = (e: Event) => {
        window.removeEventListener('resize', this.#onResize)
        window.removeEventListener('unload', onUnload)
      }

      window.addEventListener('resize', this.#onResize)
      window.addEventListener('unload', onUnload)
    }
  }
}

export default Viewport
