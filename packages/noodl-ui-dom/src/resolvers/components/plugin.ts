import { ComponentInstance } from 'noodl-ui'
import { isPluginComponent } from 'noodl-utils'
import { RegisterOptions } from '../../types'

function getMetadata(component: ComponentInstance) {
  const src = String(component.get('src'))
  const isLib = component.contentType === 'library'
  const metadata = {} as { type: string; tagName: string }
  if (src.endsWith('.css')) {
    metadata.type = 'text/css'
    metadata.tagName = 'STYLE'
  } else if (src.endsWith('.html')) {
    metadata.type = 'text/html'
    metadata.tagName = 'DIV'
  } else if (src.endsWith('.js') || isLib) {
    metadata.type = 'text/javascript'
    metadata.tagName = 'SCRIPT'
  } else {
    metadata.type = component.get('mimeType') || 'text/plain'
    metadata.tagName = 'SCRIPT'
  }
  return metadata
}

let c

export default {
  name: 'plugin-pluginHead-pluginBodyTop-pluginBodyTail',
  cond: (node, component) =>
    // The "plugin" component is handled in the main client and/or the consumer handler
    isPluginComponent(component),
  // !NOTE - We passed getNode as a function that takes our resolved node instead
  // This is specific for these plugin components but may be extended to be used more later
  resolve(getNode, component) {
    const path = String(component.get('path'))
    const plugin = component.get('plugin')
    const src = String(component?.get?.('src'))
    const metadata = getMetadata(component)
    const isLib = component.contentType === 'library'
    const node = document.createElement(metadata.tagName)

    node.type = metadata.type

    if (metadata.type === 'text/javascript') {
      node.onload = function onLoadJsPluginDOMNode(evt) {
        console.log('[plugin] ONLOAD', { node, component, event: evt })
        const location = plugin?.location || ''

        if (location) {
          try {
            if (location === 'head') {
              document.head.appendChild(node as any)
            } else if (location === 'body-top') {
              document.body.insertBefore(node, document.body.childNodes[0])
            } else if (location === 'body-bottom') {
              document.body.appendChild(node as any)
            } else {
              document.body.appendChild(node as any)
            }
          } catch (error) {
            console.error(error)
          }
        }
      }

      node.src = src
    } else if (metadata.type === 'text/html' || metadata.type === 'text/css') {
      component.on('plugin:content', (content) => {
        node.innerHTML += content
      })
    }

    // If the node is a function then it is expecting us to decide what
    // node to use
    if (typeof getNode === 'function') {
      getNode(node)
    }

    try {
      node && document.body.appendChild(node)
    } catch (error) {
      console.error(error)
    }

    return node
  },
} as RegisterOptions
