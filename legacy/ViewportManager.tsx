import React from 'react'
import { ViewportOptions } from 'react-noodl'
import { noodl } from 'app/client'

/**
 * This is a global independent component that manages viewport aspect ratios for the SDK
 * whenever it changes. This affects the endpoints that the SDK uses to load pages
 */
function ViewportManager() {
  const [state, setState] = React.useState<ViewportOptions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  React.useEffect(() => {
    /**
     * The binary Great Common Divisor calculator (fastest performance)
     * https://stackoverflow.com/questions/1186414/whats-the-algorithm-to-calculate-aspect-ratio
     * @param { number } u - Upper
     * @param { number } v - Lower
     */
    function getGCD(u: number, v: number): any {
      if (u === v) return u
      if (u === 0) return v
      if (v === 0) return u
      if (~u & 1)
        if (v & 1) return getGCD(u >> 1, v)
        else return getGCD(u >> 1, v >> 1) << 1
      if (~v & 1) return getGCD(u, v >> 1)
      if (u > v) return getGCD((u - v) >> 1, v)
      return getGCD((v - u) >> 1, u)
    }

    function getSizes(w: number, h: number) {
      var d = getGCD(w, h)
      return [w / d, h / d]
    }

    const [newWidth, newHeight] = getSizes(state.width, state.height)
    const aspectRatio = newWidth / newHeight

    noodl.aspectRatio = aspectRatio

    const logMsg = `%c[ViewportManager.tsx][useEffect] Aspect ratio changed`
    const logStyle = `color:#00b406;font-weight:bold;`

    console.log(logMsg, logStyle, {
      aspectRatio,
      width: newWidth,
      height: newHeight,
    })
  }, [state])

  React.useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setState((prevState) => {
        if (width !== prevState.width || height !== prevState.height) {
          const logMsg = `%c[ViewportManager.tsx][onResize] Updating state because viewport changed`
          const logStyle = `color:#00b406;font-weight:bold;`
          console.log(logMsg, logStyle)
          return {
            width,
            height,
          }
        }
        return prevState
      })
    }

    window.addEventListener('resize', onResize)

    return function cleanup() {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return null
}

export default ViewportManager
