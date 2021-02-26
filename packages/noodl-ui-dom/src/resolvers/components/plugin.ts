import { isPluginComponent } from 'noodl-utils'
import { RegisterOptions } from '../../types'

export default {
  name: 'pluginHead/pluginBodyTop/pluginBodyTail',
  cond: (node, component) =>
    // The "plugin" component is handled in the main client and/or the consumer handler
    isPluginComponent(component) && component.noodlType !== 'plugin',
  // !NOTE - We passed getNode as a function that takes our resolved node instead
  // This is specific for these plugin components but may be extended to be used more later
  resolve(getNode, component) {
    const plugin = component.get('plugin')
    const isOutsideDomain = component.get('contentType') === 'library'
    let node: HTMLScriptElement | undefined
    let src = component.get('src') || ''
    let mimeType = ''

    if (plugin) {
      mimeType = src.endsWith?.('.html')
        ? 'text/html'
        : src.endsWith?.('.js')
        ? 'text/javascript'
        : 'text/html'

      // TODO - Handle other mimeTypes
      if (mimeType === 'text/javascript') {
        // The behavior for these specific components will take on the shape of
        // a <script> DOM node, since the fetched contents from their url comes within
        // the component instance themselves
        node = document.createElement('script')
        node.type = 'text/javascript'

        node.onload = () => {
          if (plugin.location === 'head') {
            document.head.appendChild(node as any)
          } else if (plugin.location === 'body-top') {
            document.body.insertBefore(node as any, document.body.childNodes[0])
          } else if (plugin.location === 'body-bottom') {
            document.body.appendChild(node as any)
          }
        }

        component.on('path', (newSrc: string) => {
          src = isOutsideDomain ? component.get('path') : newSrc
          node && (node.src = src)
        })

        // If the node is a function then it is expecting our resolved nodex
        if (typeof getNode === 'function') {
          getNode(node)
        } else {
          node = getNode as HTMLScriptElement
        }
      }
    }

    return node
  },
} as RegisterOptions
