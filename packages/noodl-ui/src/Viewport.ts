import { IViewport, ViewportListener } from './types'
import { isBrowser } from './utils/common'

class Viewport implements IViewport {
  #onResize: () => void

  width: number | undefined = undefined
  height: number | undefined = undefined

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
        const previousWidth = this.width
        const previousHeight = this.height
        this.width = window.innerWidth
        this.height = window.innerHeight

        callback({
          width: this.width,
          height: this.height,
          previousWidth,
          previousHeight,
        })
      }

      const onUnload = (e: Event) => {
        window.removeEventListener('resize', this.#onResize)
        window.removeEventListener('unload', onUnload)
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', this.#onResize)
        window.addEventListener('unload', onUnload)
      }
    }
  }
}

export default Viewport
