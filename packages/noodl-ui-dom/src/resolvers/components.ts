import SignaturePad from 'signature_pad'
import has from 'lodash/has'
import { ComponentObject, Identify } from 'noodl-types'
import {
  createComponent,
  flatten,
  formatColor,
  event as nuiEvent,
  NUIComponent,
  Page as NUIPage,
  SelectOption,
  Plugin,
} from 'noodl-ui'
import { Resolve } from '../types'
import { toSelectOption } from '../utils'
import createEcosDocElement from '../utils/createEcosDocElement'
import NDOMPage from '../Page'
import * as u from '../utils/internal'
import * as c from '../constants'
import { cache } from '../nui'

const domComponentsResolver: Resolve.Config = {
  name: `[noodl-ui-dom] components`,
  cond: (n, c) => !!(n && c),
  resolve(node, component, { ndom, nui, page }) {
    if (u.isFnc(node)) {
      // PLUGIN
      if (
        [
          Identify.component.plugin,
          Identify.component.pluginHead,
          Identify.component.pluginBodyTop,
          Identify.component.pluginBodyTail,
        ].some((cond) => cond(component))
      ) {
        let path = (component.get('path') || component.blueprint.path) as string
        let plugin = component.get('plugin') as Plugin.Object
        let tagName = '' // 'div', etc
        let type = '' // text/html, etc

        if (path.endsWith('.css')) {
          type = 'text/css'
          tagName = 'style'
        } else if (path.endsWith('.html')) {
          tagName = 'iframe'
        } else if (path.endsWith('.js')) {
          type = 'text/javascript'
          tagName = 'script'
        } else {
          type = 'text/plain'
          tagName = 'script'
        }

        let pluginNode = getPluginElem(tagName) as any
        // If the node is a function then it is expecting us to decide what node to use
        u.isFnc(node) && node(pluginNode)

        function getPluginElem(tagName: 'link'): HTMLLinkElement
        function getPluginElem(tagName: 'script'): HTMLScriptElement
        function getPluginElem(tagName: 'style'): HTMLStyleElement
        function getPluginElem(tagName: 'iframe'): HTMLIFrameElement
        function getPluginElem(tagName: string): HTMLElement | null
        function getPluginElem<T extends string>(tagName: T) {
          switch (tagName as T) {
            case 'link':
              const node = document.createElement('link')
              node.rel = 'stylesheet'
              return node
            case 'iframe':
              return document.createElement('div')
            case 'script':
              return document.createElement('script')
            case 'style':
              return document.createElement('style')
            default:
              return null
          }
        }

        function loadAttribs(
          component: NUIComponent.Instance,
          elem: HTMLLinkElement | null,
          data: any,
        ): HTMLLinkElement
        function loadAttribs(
          component: NUIComponent.Instance,
          elem: HTMLScriptElement | null,
          data: any,
        ): HTMLScriptElement
        function loadAttribs(
          component: NUIComponent.Instance,
          elem: HTMLStyleElement | null,
          data: any,
        ): HTMLStyleElement
        function loadAttribs(
          component: NUIComponent.Instance,
          elem: HTMLIFrameElement | null,
          data: any,
        ): HTMLIFrameElement
        function loadAttribs<
          N extends
            | HTMLLinkElement
            | HTMLScriptElement
            | HTMLStyleElement
            | HTMLIFrameElement,
        >(component: NUIComponent.Instance, elem: N | null, data: any) {
          if (!elem) return elem
          elem.id = component.id
          if (elem instanceof HTMLLinkElement) {
            elem.innerHTML = String(data)
            elem.rel = 'stylesheet'
          } else if (elem instanceof HTMLScriptElement) {
            elem.innerHTML = String(data)
            elem.type = type
            // eval(data)
          } else if (elem instanceof HTMLStyleElement) {
            elem.innerHTML = String(data)
          } else if (elem instanceof HTMLIFrameElement) {
            // elem.onload = (evt) => {
            //   elem.contentDocument.documentElement.innerHTML = data
            //   debugger
            // }
            const parentNode = elem.parentNode || page.rootNode || document.body

            elem.innerHTML += data

            if (parentNode.children.length) {
              parentNode.insertBefore(elem, parentNode.childNodes[0])
            } else {
              parentNode.appendChild(elem)
            }
          }
          return elem
        }

        component.on(
          'content',
          (content: string) => {
            loadAttribs(component, pluginNode, content)
          },
          'content',
        )

        try {
          if (pluginNode) {
            const insert = (
              node: HTMLElement | null,
              location: Plugin.Location | undefined,
            ) => {
              const appendChild = (
                page: NDOMPage,
                childNode: HTMLElement,
                top = true,
              ) => {
                const parentNode = node || page.rootNode || document.body

                if (top) {
                  if (parentNode.children.length) {
                    parentNode.insertBefore(childNode, parentNode.childNodes[0])
                  } else parentNode.appendChild(childNode)
                } else parentNode.appendChild(childNode)
              }

              if (node) {
                if (
                  node instanceof HTMLIFrameElement ||
                  node instanceof HTMLDivElement
                ) {
                  appendChild(page, node)
                } else if (node instanceof HTMLLinkElement) {
                  if (page.rootNode instanceof HTMLIFrameElement) {
                    page.rootNode.contentDocument?.head.appendChild(node)
                  } else {
                    document.head.appendChild(node)
                  }
                } else if (node instanceof HTMLScriptElement) {
                  appendChild(page, node, location === 'body-bottom')
                }
              }
            }

            insert(pluginNode, component.get('plugin')?.location)
          }
          // document.body.appendChild(pluginNode)
        } catch (error) {
          console.error(error)
        }

        return pluginNode
      }
    } else {
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
        if (node) {
          if (component.get('data-src')) {
            node.style.overflow = 'hidden'
            node.style.display = 'flex'
            node.style.alignItems = 'center'
          }
          node.style.cursor = onClick ? 'pointer' : 'auto'
        }
      }
      // CANVAS
      else if (Identify.component.canvas(component)) {
        const dataKey = (component.get('data-key') ||
          original.dataKey) as string

        if (dataKey) {
          const signaturePad = component.get('signaturePad') as SignaturePad
          if (signaturePad) {
            signaturePad.onEnd = (evt) => {
              const dataUrl = signaturePad.toDataURL()
              const mimeType = dataUrl.split(';')[0].split(':')[1] || ''
              ;(node as HTMLCanvasElement).toBlob(
                (blob) => {
                  if (nui) {
                    // TEMP - Remove this when "isRootDataKey" is not giving the "not a function" error
                    function isRootDataKey(dataKey: string | undefined) {
                      if (typeof dataKey === 'string') {
                        if (dataKey.startsWith('.')) {
                          dataKey = dataKey
                            .substring(dataKey.search(/[a-zA-Z]/))
                            .trim()
                        }
                        if (!/^[a-zA-Z]/i.test(dataKey)) return false
                        if (dataKey)
                          return dataKey[0].toUpperCase() === dataKey[0]
                      }
                      return false
                    }

                    let dataObject = isRootDataKey(dataKey)
                      ? nui.getRoot()
                      : nui.getRoot()?.[ndom?.page?.page || '']
                    if (has(dataObject, dataKey)) {
                      // set(dataObject, dataKey, blob)
                    } else {
                      console.log(
                        `%cTried to set a signature blob using path "${dataKey}" ` +
                          `but it was not found in the root or local root object. ` +
                          `It will be created now.`,
                        `color:#ec0000;`,
                        {
                          blob,
                          currentPage: ndom?.page?.page,
                          node,
                          root: nui.getRoot(),
                        },
                      )
                    }
                  } else {
                    console.log(
                      `%c"nui" is missing in the "components" DOM resolver`,
                      `color:#ec0000;`,
                      this,
                    )
                  }
                },
                mimeType,
                8,
              )
            }
          } else {
            console.log(
              `%cSignature pad is missing from a canvas component!`,
              `color:#ec0000;`,
              { node, component, signaturePad },
            )
          }
          window['pad'] = signaturePad
        } else {
          console.log(
            `%cInvalid data key "${dataKey}" for a canvas component. ` +
              `There may be unexpected behavior`,
            `color:#ec0000;`,
            component,
          )
        }
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

        const iframe = createEcosDocElement(
          node as HTMLElement,
          component.get('ecosObj'),
        )

        iframe && (iframe.id = `${idLabel}-document-${component.id}`)
        node?.appendChild(iframe)
      }
      // IMAGE
      else if (Identify.component.image(component)) {
        if (node) {
          if (onClick) node.style.cursor = 'pointer'
          // If an image has children, we will assume it is some icon button overlapping
          //    Ex: profile photos and showing pencil icon on top to change it
          if (children) {
            node.style.width = '100%'
            node.style.height = '100%'
          }
        }
        component.on('path', (result: string) => {
          node && ((node as HTMLImageElement).src = result)
          node && (node.dataset.src = result)
        })
        if (component.get('data-src')) {
          ;(node as HTMLImageElement).src = component.get('data-src')
          node && (node.dataset.src = component.get('data-src'))
        }

        // load promise return to image
        if (component.blueprint?.['path=func']) {
          // ;(node as HTMLImageElement).src = '../waiting.png'
          component.get('data-src').then((path: any) => {
            console.log('test path=func', path)
            if (path) {
              ;(node as HTMLImageElement).src = path
            } else {
              ;(node as HTMLImageElement).src = component.get('data-src')
            }
          })
        }
      }
      // LABEL
      else if (Identify.component.label(component)) {
        if (node) {
          if (component.get('data-value')) {
            node.innerHTML = String(component.get('data-value'))
          } else if (text) {
            node.innerHTML = String(text)
          } else if (component.get('data-placeholder')) {
            node.innerHTML = String(component.get('data-placeholder'))
          }
          onClick && (node.style.cursor = 'pointer')
        }
      }
      // LIST
      else if (Identify.component.listLike(component)) {
        //
      }
      // PAGE
      else if (Identify.component.page(component)) {
        const src = component.get('data-src') || ''
        // TODO - Finish http implementation
        if (
          process.env.NODE_ENV !== 'test' &&
          ['.css', '.html', '.js'].some((ext) => src.endsWith(ext))
        ) {
          let nuiPage = component.get('page')
          let ndomPage = ndom.findPage(nuiPage) || ndom.createPage(nuiPage)

          // ndomPage.rootNode?.parentNode?.removeChild?.(ndomPage.rootNode)
          ndomPage.rootNode.parentElement?.replaceChild(node, ndomPage.rootNode)
          // ndomPage.rootNode = node as HTMLIFrameElement
          ndomPage.rootNode.src = src
          ndomPage.rootNode.style.border = '1px solid cyan'
          debugger
        } else {
          const getPageChildIds = (c: NUIComponent.Instance) =>
            c.children?.reduce(
              (acc, child) =>
                acc.concat(
                  flatten(child).map((c) =>
                    c?.id == '0' ? c.id : c?.id || '',
                  ),
                ),
              [] as string[],
            )

          component.set('ids', getPageChildIds(component))

          const getOrCreateNDOMPage = (component: NUIComponent.Instance) => {
            if (!component.get('page')) {
              console.log(
                `%cA page component is missing its NUIPage in the DOM resolver!`,
                `color:#ec0000;`,
                component,
              )
            } else {
              let ndomPage = [
                ndom.findPage(component.get('page')),
                ndom.findPage(component.id),
              ].find(Boolean) as NDOMPage

              if (!ndomPage) {
                try {
                  ndomPage = ndom.createPage(
                    component.get('page') || { id: component.id },
                  )
                } catch (error) {
                  console.error(error)
                  if (error instanceof Error) throw error
                  else throw new Error(error.message)
                }
              }

              return ndomPage
            }
          }

          const listen = () => {
            let ndomPage = getOrCreateNDOMPage(component) as NDOMPage

            component.on(
              nuiEvent.component.page.PAGE_COMPONENTS,
              ({ page: nuiPage, type }) => {
                const childrensNUIPage = component.get('page') as NUIPage
                ndomPage = ndom.findPage(childrensNUIPage)

                if (type === 'init') {
                  ndomPage.rootNode?.parentNode?.removeChild?.(
                    ndomPage.rootNode,
                  )
                  ndomPage.rootNode = node as HTMLIFrameElement
                } else {
                  component.set('ids', getPageChildIds(component))
                  const prevChildIds = component.get('ids')
                  if (!prevChildIds?.length) {
                    console.log(
                      `%cNo previous page children component ids to remove`,
                      `color:#95a5a6;`,
                      { component, prevChildIds },
                    )
                  } else {
                    const ids = component.get('ids') || []
                    ids.forEach((id: string) => {
                      ndom.cache.component.remove(
                        ndom.cache.component.get(id)?.component,
                      )
                      console.log(
                        `%cRemoved "${id}" from page "${component.id}" (${nuiPage.page})`,
                        `color:#95a5a6;`,
                      )
                    })
                    component.set('ids', [])
                  }

                  if (ndomPage.rootNode.contentDocument) {
                    // ndomPage.rootNode.contentDocument.body.innerHTML = ''
                  } else {
                    console.log(
                      `%cA document body for a page component was not available after a page component update`,
                      `color:#ec0000;`,
                      { component, nuiPage: childrensNUIPage, ndomPage },
                    )
                  }
                }

                if (ndomPage.rootNode.contentDocument) {
                  // ndomPage.rootNode.contentDocument.body.innerHTML = ''
                } else {
                  console.log(
                    `%cA document body for a page component was not available`,
                    `color:#ec0000;`,
                    { component, nuiPage: childrensNUIPage, ndomPage },
                  )
                }

                // component.clear('children')

                const children = u.array(
                  nui.resolveComponents({
                    components:
                      childrensNUIPage.components?.map?.(
                        (obj: ComponentObject) => {
                          let child = nui.createComponent(obj, childrensNUIPage)
                          child = component.createChild(child)
                          return child
                        },
                      ) || [],
                    page: childrensNUIPage,
                  }),
                )

                const renderChildren = (
                  nuiPage: NUIPage,
                  children: NUIComponent.Instance[],
                ) => {
                  children?.forEach((child) => {
                    if (nuiPage) {
                      const cachedObj = cache.component.get(child)
                      if (cachedObj) {
                        if (cachedObj.page !== nuiPage.page) {
                          cachedObj.page = nuiPage.page
                        }
                      }
                    }

                    const childNode = ndom.draw(
                      child,
                      ndomPage.rootNode,
                      ndomPage,
                    )

                    if (childNode instanceof HTMLElement) {
                      if (ndomPage.rootNode?.contentDocument?.body) {
                        if (
                          !ndomPage.rootNode.contentDocument.body.contains(
                            childNode,
                          )
                        ) {
                          ndomPage.rootNode.contentDocument.body.appendChild(
                            childNode,
                          )
                        }
                      }
                    }

                    child?.length && renderChildren(nuiPage, child.children)
                  })
                }

                renderChildren(childrensNUIPage, children)
              },
            )
          }

          if (!component.get('page')) {
            component.on(nuiEvent.component.page.PAGE_CREATED, listen)
          } else {
            listen()
          }
        }
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
                component.toJSON(),
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
              { component: component.toJSON(), textBoard },
            )
          }
        }
      }
      /* -------------------------------------------------------
        ---- DISABLING / ENABLING
      -------------------------------------------------------- */
      // TEXTVIEW
      else if (Identify.component.textView(component)) {
        if (component.blueprint?.['isEditable']) {
          const isEditable = component.get('isEditable')
          const isDisabled = Identify.isBooleanFalse(isEditable)
          ;(node as HTMLTextAreaElement).disabled = isDisabled
        }
      }
      // textField
      else if (Identify.component.textField(component)) {
        if (component.blueprint?.isEditable) {
          const isEditable = component.get('isEditable')
          const isDisabled = Identify.isBooleanFalse(isEditable)
          ;(node as HTMLTextAreaElement).disabled = isDisabled
        }
        if (component.blueprint?.autocomplete) {
          const autocomplete = component.get('autocomplete')
          ;(node as HTMLTextAreaElement).setAttribute(
            'autocomplete',
            autocomplete,
          )
        }
      }
      // VIDEO
      else if (Identify.component.video(component)) {
        const videoEl = node as HTMLVideoElement
        let sourceEl: HTMLSourceElement
        let notSupportedEl: HTMLParagraphElement
        videoEl.controls = Identify.isBooleanTrue(controls)
        if (poster) videoEl.setAttribute('poster', component.get('poster'))
        if (component.blueprint?.['path']) {
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

        videoEl.style.objectFit = 'contain'
      }
    }
  },
}

export default domComponentsResolver
