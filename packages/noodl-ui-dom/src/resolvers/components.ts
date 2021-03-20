import { Identify } from 'noodl-types'
import {
  ComponentInstance,
  event as noodluiEvent,
  SelectOption,
} from 'noodl-ui'
import { isBooleanTrue, isPluginComponent } from 'noodl-utils'
import { Resolve } from '../types'
import { toSelectOption } from '../utils'
import * as u from '../utils/internal'

const domComponentsResolver: Resolve.Config = {
  name: `[noodl-ui-dom] Default Component Resolvers`,
  resolve(node, component, { draw, noodlui }) {
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
        src,
        text,
        videoType,
      } = original

      // BUTTON
      if (Identify.component.button(original)) {
        if (props.src) {
          node.style.overflow = 'hidden'
          node.style.display = 'flex'
          node.style.alignItems = 'center'
        }
        node.style.cursor = onClick ? 'pointer' : 'auto'
      }
      // IMAGE
      else if (Identify.component.image(original)) {
        if (onClick) node.style.cursor = 'pointer'
        // If an image has children, we will assume it is some icon button overlapping
        //    Ex: profile photos and showing pencil icon on top to change it
        if (children) {
          node.style.width = '100%'
          node.style.height = '100%'
        }
        component.on('path', (result: string) => {
          node && ((node as HTMLImageElement).src = result)
        })
      }
      // LABEL
      else if (Identify.component.label(original)) {
        if (props['data-value']) node.innerHTML = String(props['data-value'])
        else if (text) node.innerHTML = String(text)
        else if (placeholder) node.innerHTML = String(placeholder)
        onClick && (node.style.cursor = 'pointer')
      }
      // LIST
      else if (Identify.component.list(original)) {
        // noodl-ui delegates the responsibility for us to decide how
        // to control how list children are first rendered to the DOM
        const listObject = props.listObject || []
        const numDataObjects = listObject.length

        component.edit({ listObject: [] })
        component.clearChildren()

        component.children.forEach((c) => {
          c?.setDataObject?.(null)
          component.removeDataObject?.(0)
        })

        // Remove the placeholders
        for (let index = 0; index < numDataObjects; index++) {
          // This emits the "create list item" event that we should already have a listener for
          component.addDataObject?.(listObject[index])
          console.log(listObject[index])
        }

        component.on(noodluiEvent.component.list.CREATE_LIST_ITEM, (result) => {
          noodlui?.componentCache().set(result.listItem)
        })

        component.on(noodluiEvent.component.list.REMOVE_LIST_ITEM, (result) => {
          noodlui?.componentCache().remove(result.listItem)
          document.getElementById(result.listItem.id)?.remove?.()
        })

        component.on(
          noodluiEvent.component.list.UPDATE_LIST_ITEM,
          (result, options) => {
            // const childNode = document.getElementById(result.listItem?.id)
            // redraw(childNode, result.listItem, options as any)
          },
        )
      }
      // PAGE
      else if (component.type === 'page') {
        node.name = component.get('path') || ''

        component.on(
          noodluiEvent.component.page.COMPONENTS_RECEIVED,
          () => {},
          `[noodl-ui-dom] ${noodluiEvent.component.page.COMPONENTS_RECEIVED}`,
        )

        component.on(
          noodluiEvent.component.page.RESOLVED_COMPONENTS,
          () => {
            component.children.forEach((child: ComponentInstance) => {
              const childNode = draw(child, node.contentDocument?.body)
              // redraw(childNode, child, options)
              ;(window as any).child = childNode
            })
          },
          `[noodl-ui-dom] ${noodluiEvent.component.page.RESOLVED_COMPONENTS}`,
        )

        component.on(
          noodluiEvent.component.page.MISSING_COMPONENTS,
          () => {},
          `[noodl-ui-dom] ${noodluiEvent.component.page.MISSING_COMPONENTS}`,
        )
      }
      // PLUGIN
      else if (isPluginComponent(original)) {
        // !NOTE - We passed the node argument as a function that expects our
        // resolved node instead
        // This is specific for these plugin components but may be extended to be used more later
        function getMetadata(component: ComponentInstance) {
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
