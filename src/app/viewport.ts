import { Viewport as VP } from 'noodl-ui'

/**
 * This is a handler for the viewWidthHeightRatio object in the config
 * When the user's aspect ratio is less than the min, set min * windowHeight
 * When the user's aspect ratio is larger than the max, set max * windowHeight
 */

export interface ConsumerFn {
  (
    event: UIEvent,
    args: { width: number; height: number; aspectRatio: number },
  ): void
}

interface WrapperFn {
  (consumerFn: ConsumerFn): (event: UIEvent) => void
}

const handleViewWidthHeightRatio = (function () {
  const fns = new Map<ConsumerFn, (event: UIEvent) => void>()

  const wrap: WrapperFn = (consumerFn: ConsumerFn) =>
    function onResize(event: UIEvent): any {
      consumerFn(event, {
        width: document.body.clientWidth,
        height: document.body.clientHeight,
        aspectRatio: VP.getAspectRatio(
          document.body.clientWidth,
          document.body.clientHeight,
        ),
      })
    }

  function use(fn: ConsumerFn) {
    if (typeof fn === 'function') {
      fns.set(fn, wrap(fn))
      window.addEventListener('resize', fns.get(fn) as EventListener)
    }
  }

  return {
    use(callback: ConsumerFn) {
      if (fns.has(callback)) {
        console.log(
          `%cThis callback has already been registered. If you intend to ` +
            `pass a duplicate, create a new function and pass that in`,
          `color:#ec0000;font-weight:bold;`,
          { callback, fns },
        )
      } else {
        use(callback)
      }
      return this
    },
    unuse(callback: ConsumerFn) {
      if (fns.has(callback)) {
        fns.delete(callback)
      }
      return this
    },
  }
})()

export default handleViewWidthHeightRatio
