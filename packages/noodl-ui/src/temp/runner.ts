import { WritableDraft } from 'immer/dist/internal'
import { ComponentObject } from 'noodl-types'
import { AnyFn } from '../types'

const runner = (function () {
  const o = {
    // draw === util.Consumer.consume
    run(args: { component: WritableDraft<ComponentObject>; draw: AnyFn }) {
      const { component, draw } = args
      if (component) {
        draw(component)
        if (Array.isArray(component.children)) {
          const numChildren = component.children.length
          for (let index = 0; index < numChildren; index++) {
            draw(component.children[index])
          }
        } else if (component.children) {
          draw(component.children)
        }
      }
    },
  }

  return o
})()

export default runner
