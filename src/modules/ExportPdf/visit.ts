import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'

function visit(callback: (el: HTMLElement) => void, el: HTMLElement) {
  const nodes = [el] as HTMLElement[]

  while (nodes.length) {
    const node = nodes.shift()

    let index = 0

    while (node?.children.length) {
      const childNode = node.children[index++]
    }
  }
}

export default visit
