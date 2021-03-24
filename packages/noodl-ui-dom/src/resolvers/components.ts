import { Identify } from 'noodl-types'
import { NUIComponent, event as noodluiEvent, SelectOption } from 'noodl-ui'
import { isBooleanTrue, isPluginComponent } from 'noodl-utils'
import { Resolve } from '../types'
import { toSelectOption } from '../utils'
import * as u from '../utils/internal'

const domComponentsResolver: Resolve.Config = {
  name: `[noodl-ui-dom] Default Component Resolvers`,
  cond: (n, c) => !!(n && c),
  resolve(node, component, { draw }) {
    if (node && !u.isFnc(node)) {
      const original = component.original || {}
      const props = component.props() || {}

      const {
        children,
        contentType,
        controls,
        mimeType,
        onClick,
        options: selectOptions,
        placeholder,
        plugin,
        poster,
        text,
        videoType,
      } = original

      // BUTTON
      if (Identify.component.button(original)) {
        if (props['data-src']) {
          node.style.overflow = 'hidden'
          node.style.display = 'flex'
          node.style.alignItems = 'center'
        }
        node.style.cursor = onClick ? 'pointer' : 'auto'
      }
      // IMAGE
      else if (Identify.component.image(component)) {
        if (onClick) node.style.cursor = 'pointer'
        // If an image has children, we will assume it is some icon button overlapping
        //    Ex: profile photos and showing pencil icon on top to change it
        if (children) {
          node.style.width = '100%'
          node.style.height = '100%'
        }
        component.on('path', (result) => {
          node && ((node as HTMLImageElement).src = result)
        })
      }
      // LABEL
      else if (Identify.component.label(component)) {
        if (props['data-value']) node.innerHTML = String(props['data-value'])
        else if (text) node.innerHTML = String(text)
        else if (props['data-placeholder']) {
          node.innerHTML = String(props['data-placeholder'])
        }
        onClick && (node.style.cursor = 'pointer')
      }
      // LIST
      else if (Identify.component.listLike(component)) {
        //
      }
      // PAGE
      else if (Identify.component.page(component)) {
        node.name = component.get('path') || ''

        component.on(
          noodluiEvent.component.page.RESOLVED_COMPONENTS,
          () => {
            component.children.forEach((child: NUIComponent.Instance) => {
              const childNode = draw(child, node.contentDocument?.body)
              // redraw(childNode, child, options)
              ;(window as any).child = childNode
            })
          },
          `[noodl-ui-dom] ${noodluiEvent.component.page.RESOLVED_COMPONENTS}`,
        )
      }
      // PLUGIN
      else if (isPluginComponent(original)) {
        // !NOTE - We passed the node argument as a function that expects our
        // resolved node instead
        // This is specific for these plugin components but may be extended to be used more later
        function getMetadata(component: NUIComponent.Instance) {
          const src = String(props.src)
          const isLib = contentType === 'library'
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
            metadata.type = mimeType || 'text/plain'
            metadata.tagName = 'SCRIPT'
          }
          return metadata
        }

        const metadata = getMetadata(component)
        const pluginNode = document.createElement(
          metadata.tagName,
        ) as HTMLScriptElement

        pluginNode.type = metadata.type

        if (metadata.type === 'text/javascript') {
          pluginNode.onload = function onLoadJsPluginDOMNode(evt) {
            const location = plugin?.location || ''
            if (location) {
              try {
                if (location === 'head') {
                  document.head.appendChild(pluginNode)
                } else if (location === 'body-top') {
                  document.body.insertBefore(
                    pluginNode,
                    document.body.childNodes[0],
                  )
                } else if (location === 'body-bottom') {
                  document.body.appendChild(pluginNode)
                } else {
                  document.body.appendChild(pluginNode)
                }
              } catch (error) {
                console.error(error)
              }
            }
          }
          pluginNode.src = src
        } else if (
          metadata.type === 'text/html' ||
          metadata.type === 'text/css'
        ) {
          component.on(
            'plugin:content',
            (content: string) => (node.innerHTML += content),
          )
        }
        // If the node is a function then it is expecting us to decide what node to use
        u.isFnc(node) && node(pluginNode)
        try {
          pluginNode && document.body.appendChild(pluginNode)
        } catch (error) {
          console.error(error)
        }
        return pluginNode
      }
      // SELECT
      else if (Identify.component.select(original)) {
        if (u.isArr(selectOptions)) {
          const selectNode = node as HTMLSelectElement

          function clearOptions(node: HTMLSelectElement) {
            const numOptions = node.options
            for (let index = 0; index < numOptions.length; index++) {
              const option = node.options[index]
              option.remove()
            }
          }

          clearOptions(selectNode)

          selectOptions.forEach((option: SelectOption, index) => {
            option = toSelectOption(option)
            const optionNode = document.createElement('option')
            selectNode.appendChild(optionNode)
            optionNode.id = option.key
            optionNode.value = option.value
            optionNode.textContent = option.label
            if (option?.value === component.get('data-value')) {
              // Default to the selected index if the user already has a state set before
              selectNode.selectedIndex = index
              selectNode.dataset.value = option.value
              selectNode.value = option.value
            }
          })
        }
        // Default to the first item if the user did not previously set their state
        if (node?.selectedIndex === -1) node.selectedIndex = 0
      }
      // VIDEO
      else if (Identify.component.video(original)) {
        const videoEl = node as HTMLVideoElement
        let sourceEl: HTMLSourceElement
        let notSupportedEl: HTMLParagraphElement
        videoEl.controls = isBooleanTrue(controls)
        if (poster) videoEl.setAttribute('poster', poster)
        if (src) {
          sourceEl = document.createElement('source')
          notSupportedEl = document.createElement('p')
          if (videoType) sourceEl.setAttribute('type', videoType)
          sourceEl.setAttribute('src', src)
          notSupportedEl.style.textAlign = 'center'
          // This text will not appear unless the browser isn't able to play the video
          notSupportedEl.innerHTML =
            "Sorry, your browser doesn's support embedded videos."
          videoEl.appendChild(sourceEl)
          videoEl.appendChild(notSupportedEl)
        }
        videoEl.style.objectFit = 'contain'
      }
    }
  },
}

export default domComponentsResolver
