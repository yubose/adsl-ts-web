import { Identify } from 'noodl-types'
import {
  createComponent,
  formatColor,
  NUIComponent,
  event as noodluiEvent,
  SelectOption,
} from 'noodl-ui'
import { Resolve } from '../types'
import { toSelectOption } from '../utils'
import createEcosDocElement from '../utils/createEcosDocElement'
import * as u from '../utils/internal'

const domComponentsResolver: Resolve.Config = {
  name: `[noodl-ui-dom] Default Component Resolvers`,
  cond: (n, c) => !!(n && c),
  resolve(node, component, { draw, ndom }) {
    if (!u.isFnc(node)) {
      const original = component.blueprint || {}

      const {
        children,
        contentType,
        controls,
        mimeType,
        onClick,
        options: selectOptions,
        plugin,
        poster,
        text,
        videoType,
      } = original

      // BUTTON
      if (Identify.component.button(component)) {
        if (component.get('data-src')) {
          node.style.overflow = 'hidden'
          node.style.display = 'flex'
          node.style.alignItems = 'center'
        }
        node.style.cursor = onClick ? 'pointer' : 'auto'
      }
      // ECOSDOC
      else if (Identify.component.ecosDoc(component)) {
        const idLabel =
          (u.isImageDoc(component) && 'image') ||
          (u.isMarkdownDoc(component) && 'markdown') ||
          (Identify.ecosObj.doc(component) && 'doc') ||
          (u.isTextDoc(component) && 'text') ||
          (u.isWordDoc(component) && 'word-doc') ||
          'ecos'
        const iframe = createEcosDocElement(node, component.get('ecosObj'))
        iframe && (iframe.id = `${idLabel}-document-${component.id}`)
        node.appendChild(iframe)
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
        component.on('path', (result: string) => {
          node && ((node as HTMLImageElement).src = result)
        })
        if (component.get('data-src')) {
          ;(node as HTMLImageElement).src = component.get('data-src')
        }
      }
      // LABEL
      else if (Identify.component.label(component)) {
        if (component.get('data-value')) {
          node.innerHTML = String(component.get('data-value'))
        } else if (text) {
          node.innerHTML = String(text)
        } else if (component.get('data-placeholder')) {
          node.innerHTML = String(component.get('data-placeholder'))
        }
        onClick && (node.style.cursor = 'pointer')
      }
      // LIST
      else if (Identify.component.listLike(component)) {
        //
      }
      // PAGE
      else if (Identify.component.page(component)) {
        if (ndom.pages[component.id].rootNode !== node) {
          try {
            if (document.body.contains(ndom.pages[component.id].rootNode)) {
              ndom.pages[component.id].rootNode.textContent = ''
              document.body.removeChild(ndom.pages[component.id].rootNode)
            }
          } catch (error) {
            console.error(error)
          }
          ndom.pages[component.id].rootNode = node as any
        }
        component.on(
          noodluiEvent.component.page.PAGE_COMPONENTS,
          () => {
            component.children?.forEach((child: NUIComponent.Instance) =>
              draw(
                child,
                (node as HTMLIFrameElement).contentDocument?.body,
                ndom.pages[component.id],
              ),
            )
          },
          `[noodl-ui-dom] ${noodluiEvent.component.page.PAGE_COMPONENTS}`,
        )
      }
      // PLUGIN
      else if (Identify.component.plugin(original)) {
        // !NOTE - We passed the node argument as a function that expects our
        // resolved node instead
        // This is specific for these plugin components but may be extended to be used more later
        function getMetadata(component: NUIComponent.Instance) {
          const src = String(component.get('data-src'))
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
          pluginNode.src = component.get('data-src')
        } else if (
          metadata.type === 'text/html' ||
          metadata.type === 'text/css'
        ) {
          component.on(
            'content',
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
        function clearOptions(_node: HTMLSelectElement) {
          const numOptions = _node.options
          for (let index = 0; index < numOptions.length; index++) {
            const option = _node.options[index]
            option.remove()
          }
        }

        function setSelectOptions(_node: HTMLSelectElement, opts: any[]) {
          opts.forEach((option: SelectOption, index) => {
            option = toSelectOption(option)
            const optionNode = document.createElement('option')
            _node.appendChild(optionNode)
            optionNode.id = option.key
            optionNode.value = option.value
            optionNode.textContent = option.label
            if (option?.value === component.props['data-value']) {
              // Default to the selected index if the user already has a state set before
              _node.selectedIndex = index
              _node.dataset.value = option.value
              _node.value = option.value
            }
          })
        }

        clearOptions(node as HTMLSelectElement)

        if (u.isArr(selectOptions)) {
          setSelectOptions(node as HTMLSelectElement, selectOptions)
        } else if (u.isStr(selectOptions)) {
          // Retrieved through reference
          component.on('options', (dataOptions: any[]) => {
            setSelectOptions(node as HTMLSelectElement, dataOptions)
          })
        }
        // Default to the first item if the user did not previously set their state
        // @ts-expect-error
        if (node?.selectedIndex === -1) node.selectedIndex = 0
      } else if (Identify.textBoard(original)) {
        const { textBoard, text } = component.props
        if (u.isArr(component)) {
          if (u.isArr(textBoard)) {
            if (u.isStr(text)) {
              console.log(
                `%cA component cannot have a "text" and "textBoard" property ` +
                  `because they both overlap. The "text" will take precedence.`,
                `color:#ec0000;`,
                component.snapshot(),
              )
            }

            textBoard.forEach((item) => {
              if (Identify.textBoardItem(item)) {
                const br = createComponent('view')
                component.createChild(br as any)
              } else {
                /**
                 * NOTE: Normally in the return type we would return the child
                 * component wrapped with a resolveComponent call but it is conflicting
                 * with our custom implementation because its being assigned unwanted style
                 * attributes like "position: absolute" which disrupts the text display.
                 * TODO: Instead of a resolverComponent, we should make a resolveStyles
                 * to get around this issue. For now we'll hard code known props like "color"
                 */
                const text = createComponent({
                  type: 'label',
                  style: {
                    display: 'inline-block',
                    ...(item.color
                      ? { color: formatColor(item.color) }
                      : undefined),
                  },
                  text: item.text,
                })
                component.createChild(text as any)
              }
            })
          } else {
            console.log(
              `%cExpected textBoard to be an array but received "${typeof textBoard}". ` +
                `This part of the component will not be included in the output`,
              `color:#ec0000;`,
              { component: component.snapshot(), textBoard },
            )
          }
        }
      }
      /* -------------------------------------------------------
        ---- DISABLING / ENABLING
      -------------------------------------------------------- */
      // TEXTVIEW
      else if (Identify.component.textView(component)) {
        if (component.has('isEditable')) {
          const isEditable = component.get('isEditable')
          const isDisabled = Identify.isBooleanFalse(isEditable)
          ;(node as HTMLTextAreaElement).disabled = isDisabled
        }
      }
      // VIDEO
      else if (Identify.component.video(component)) {
        const videoEl = node as HTMLVideoElement
        let sourceEl: HTMLSourceElement
        let notSupportedEl: HTMLParagraphElement
        videoEl.controls = Identify.isBooleanTrue(controls)
        if (poster) videoEl.setAttribute('poster', component.get('poster'))
        if (component.has('path')) {
          component.on('path', (res) => {
            sourceEl = document.createElement('source')
            notSupportedEl = document.createElement('p')
            if (videoType) sourceEl.setAttribute('type', videoType)
            sourceEl.setAttribute('src', res)
            notSupportedEl.style.textAlign = 'center'
            // This text will not appear unless the browser isn't able to play the video
            notSupportedEl.innerHTML =
              "Sorry, your browser doesn's support embedded videos."
            videoEl.appendChild(sourceEl)
            videoEl.appendChild(notSupportedEl)
          })
        }
        if (component.get('data-src')) {
          // sourceEl = document.createElement('source')
          // notSupportedEl = document.createElement('p')
          // if (videoType) sourceEl.setAttribute('type', videoType)
          // sourceEl.setAttribute('src', component.get('data-src'))
          // notSupportedEl.style.textAlign = 'center'
          // // This text will not appear unless the browser isn't able to play the video
          // notSupportedEl.innerHTML =
          //   "Sorry, your browser doesn's support embedded videos."
          // videoEl.appendChild(sourceEl)
          // videoEl.appendChild(notSupportedEl)
        }
        videoEl.style.objectFit = 'contain'
      }
    }
  },
}

export default domComponentsResolver
