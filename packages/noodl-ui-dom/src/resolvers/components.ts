import * as u from '@jsmanifest/utils'
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
import { toSelectOption } from '../utils'
import createEcosDocElement from '../utils/createEcosDocElement'
import NDOM from '../noodl-ui-dom'
import NDOMPage from '../Page'
import * as t from '../types'
import * as i from '../utils/internal'
import * as c from '../constants'

export default {
  name: `[noodl-ui-dom] components`,
  resolve(args) {
    const {
      cache,
      createPage,
      draw,
      findPage,
      nui,
      setAttr,
      setDataAttr,
      setStyleAttr,
    } = args

    if (u.isFnc(args.node)) {
      // PLUGIN
      if (i._isPluginComponent(args.component)) {
        let path = (args.component.get('path') ||
          args.component.blueprint.path) as string
        let plugin = args.component.get('plugin') as Plugin.Object
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
        u.isFnc(args.node) && args.node(pluginNode)

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
          if (i._isLinkEl(elem)) {
            elem.innerHTML = String(data)
            elem.rel = 'stylesheet'
          } else if (i._isScriptEl(elem)) {
            elem.innerHTML = String(data)
            elem.type = type
            // eval(data)
          } else if (i._isStyleEl(elem)) {
            elem.innerHTML = String(data)
          } else if (i._isIframeEl(elem)) {
            const parentNode =
              elem.parentNode || args.page.rootNode || document.body
            elem.innerHTML += data
            if (parentNode.children.length) {
              parentNode.insertBefore(elem, parentNode.childNodes[0])
            } else {
              parentNode.appendChild(elem)
            }
          }
          return elem
        }

        args.component.on(
          'content',
          (content: string) => {
            loadAttribs(args.component, pluginNode, content)
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
                if (i._isIframeEl(node) || i._isDivEl(node)) {
                  appendChild(args.page, node)
                } else if (i._isLinkEl(node)) {
                  if (i._isIframeEl(args.page.rootNode)) {
                    args.page.rootNode.contentDocument?.head.appendChild(node)
                  } else {
                    document.head.appendChild(node)
                  }
                } else if (i._isScriptEl(node)) {
                  appendChild(args.page, node, location === 'body-bottom')
                }
              }
            }

            insert(pluginNode, args.component.get('plugin')?.location)
          }
        } catch (error) {
          console.error(error)
        }

        return pluginNode
      }
    } else if (args.node) {
      const original = args.component.blueprint || {}

      const {
        children,
        contentType,
        controls,
        dataKey,
        mimeType,
        onClick,
        options: selectOptions,
        plugin,
        poster,
        text,
        videoType,
      } = original

      // BUTTON
      if (Identify.component.button(args.component)) {
        if (args.node) {
          if (args.component.get(c.DATA_SRC)) {
            setStyleAttr('overflow', 'hidden')
            setStyleAttr('display', 'flex')
            setStyleAttr('alignItems', 'center')
          }
          setStyleAttr('cursor', onClick ? 'pointer' : 'auto')
        }
      }
      // CANVAS
      else if (Identify.component.canvas(args.component)) {
        const _dataKey = (args.component.get(c.DATA_KEY) || dataKey) as string

        if (_dataKey) {
          const signaturePad = args.component.get(
            'signaturePad',
          ) as SignaturePad
          if (signaturePad) {
            signaturePad.onEnd = (evt) => {
              const dataUrl = signaturePad.toDataURL()
              const mimeType = dataUrl.split(';')[0].split(':')[1] || ''
              ;(args.node as HTMLCanvasElement).toBlob(
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

                    let dataObject = isRootDataKey(_dataKey)
                      ? nui.getRoot()
                      : nui.getRoot()?.[args.page?.page || '']
                    if (has(dataObject, _dataKey)) {
                      // set(dataObject, dataKey, blob)
                    } else {
                      console.log(
                        `%cTried to set a signature blob using path "${_dataKey}" ` +
                          `but it was not found in the root or local root object. ` +
                          `It will be created now.`,
                        `color:#ec0000;`,
                        {
                          blob,
                          currentPage: args?.page?.page,
                          node: args.node,
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
              args,
            )
          }
        } else {
          console.log(
            `%cInvalid data key "${dataKey}" for a canvas component. ` +
              `There may be unexpected behavior`,
            `color:#ec0000;`,
            args,
          )
        }
      }
      // ECOSDOC
      else if (Identify.component.ecosDoc(args.component)) {
        const idLabel =
          (i.isImageDoc(args.component) && 'image') ||
          (i.isMarkdownDoc(args.component) && 'markdown') ||
          (Identify.ecosObj.doc(args.component) && 'doc') ||
          (i.isTextDoc(args.component) && 'text') ||
          (i.isWordDoc(args.component) && 'word-doc') ||
          'ecos'

        const iframe = createEcosDocElement(
          args.node as HTMLElement,
          args.component.get('ecosObj'),
        )

        iframe && (iframe.id = `${idLabel}-document-${args.component.id}`)

        iframe.addEventListener(
          'error',
          function (err) {
            console.error(`[ERROR]: In ecosDoc component: ${err.message}`, err)
          },
          { once: true },
        )

        args.node?.appendChild(iframe)
      }
      // IMAGE
      else if (Identify.component.image(args.component)) {
        if (args.node) {
          if (onClick) setStyleAttr('cursor', 'pointer')
          // If an image has children, we will assume it is some icon button overlapping
          //    Ex: profile photos and showing pencil icon on top to change it
          if (children) {
            setStyleAttr('width', '100%')
            setStyleAttr('height', '100%')
          }
        }
        args.component.on('path', (result: string) => {
          if (args.node) {
            setAttr('src', result)
            setDataAttr('src', result)
          }
        })
        if (args.component.get(c.DATA_SRC)) {
          setAttr('src', args.component.get(c.DATA_SRC))
          setDataAttr('src', args.component.get(c.DATA_SRC))
        }

        // load promise return to image
        if (args.component.blueprint?.['path=func']) {
          // ;(node as HTMLImageElement).src = '../waiting.png'
          args.component.get(c.DATA_SRC).then((path: any) => {
            console.log('test path=func', path)
            setAttr('src', path || args.component.get(c.DATA_SRC))
          })
        }
      }
      // LABEL
      else if (Identify.component.label(args.component)) {
        if (args.node) {
          if (args.component.get(c.DATA_VALUE)) {
            setAttr('innerHTML', String(args.component.get(c.DATA_VALUE)))
          } else if (text) {
            setAttr('innerHTML', String(text))
          } else if (args.component.get(c.DATA_PLACEHOLDER)) {
            setAttr('innerHTML', String(args.component.get(c.DATA_PLACEHOLDER)))
          }
          onClick && setStyleAttr('cursor', 'pointer')
        }
      }
      // LIST
      else if (Identify.component.listLike(args.component)) {
        //
      }
      // PAGE
      else if (Identify.component.page(args.component)) {
        if (i._isIframeEl(args.node)) {
          if (i._isRemotePageOrUrl(String(args.component.get('path')))) {
            const path = (args.component.get('path') || '') as string
            const src = (args.component.get(c.DATA_SRC) || '') as string
            /**
             * Page components loading content through remote URLs
             * (https links or anything that is an html file)
             */
            if (args.node) {
              args.node.contentWindow?.addEventListener(
                'message',
                function (evt) {
                  console.log(`%c[noodl-ui-dom] Message`, `color:#e50087;`, evt)
                },
              )
              args.node.contentWindow?.addEventListener(
                'messageerror',
                function (evt) {
                  console.log(
                    `%c[noodl-ui-dom] Message error`,
                    `color:#e50087;`,
                    evt,
                  )
                },
                { once: true },
              )
            }

            function onLoad(opts: {
              event?: Event
              node: t.NDOMElement<'page'>
              component: NUIComponent.Instance
              createPage: NDOM['createPage']
              findPage: NDOM['findPage']
              resolvers: NDOM['resolvers']
            }) {
              console.log(`Page component loaded`)

              let src = opts.component.get(c.DATA_SRC) || ''
              let nuiPage = opts.component.get('page') as NUIPage
              let ndomPage = (opts.findPage(nuiPage) ||
                opts.createPage({ component: opts.component })) as NDOMPage

              if (opts.node) {
                if (ndomPage.id !== 'root' && ndomPage.rootNode !== opts.node) {
                  try {
                    if (ndomPage.rootNode?.parentElement) {
                      ndomPage.rootNode.parentElement.replaceChild(
                        opts.node,
                        ndomPage.rootNode,
                      )
                      console.log(
                        `%cReplacing old rootNode with new node`,
                        `color:#95a5a6;`,
                        { ...opts, ndomPage },
                      )
                    } else {
                      i._removeNode(ndomPage.rootNode)
                      ndomPage.rootNode = opts.node
                      console.log(
                        `%cRemoved old rootNode for new node`,
                        `color:#95a5a6;`,
                        { ...opts, ndomPage },
                      )
                    }
                  } catch (error) {
                    console.error(error)
                  }
                }

                opts.node.src = src
              } else {
                console.log(
                  `%cIframe element is empty inside a page component`,
                  `color:#ec0000;`,
                  opts,
                )
              }
            }

            if (src) {
              onLoad(args.component)
            } else {
              args.node.addEventListener(
                'load',
                (evt) =>
                  onLoad({
                    event: evt,
                    createPage: args.createPage,
                    component: args.component,
                    node: args.node as HTMLIFrameElement,
                    findPage: args.findPage,
                    resolvers: args.resolvers,
                  }),
                { once: true },
              )
            }

            args.node?.addEventListener('error', console.error, { once: true })
          } else {
            const getOrCreateNDOMPage = (component: NUIComponent.Instance) => {
              if (!component.get('page')) {
                console.log(
                  `%cA page component is missing its NUIPage in the DOM resolver`,
                  `color:#ec0000;`,
                  component,
                )
              } else {
                let ndomPage = [
                  findPage(component),
                  findPage(component.id),
                ].find(Boolean) as NDOMPage

                if (!ndomPage) {
                  try {
                    let nuiPage = component.get('page')
                    console.info(
                      `%cCould not find an NDOM page associated to a NUIPage of id "${nuiPage.id}" with the page of "${nuiPage.page}"`,
                      `color:#ec0000;`,
                      component,
                    )
                    ndomPage = createPage(nuiPage || component)
                  } catch (error) {
                    console.error(error)
                    if (error instanceof Error) throw error
                    else throw new Error(error.message)
                  }
                }

                return ndomPage
              }
            }

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

            args.component.set('ids', getPageChildIds(args.component))

            const listen = () => {
              let ndomPage = getOrCreateNDOMPage(args.component) as NDOMPage

              args.component.on(
                nuiEvent.component.page.PAGE_COMPONENTS,
                ({ page: nuiPage, type }) => {
                  const childrensNUIPage = args.component.get('page') as NUIPage
                  ndomPage = findPage(childrensNUIPage)

                  if (type === 'init') {
                    ndomPage.rootNode?.parentNode?.removeChild?.(
                      ndomPage.rootNode,
                    )
                    ndomPage.rootNode = args.node as HTMLIFrameElement
                  } else {
                    args.component.set('ids', getPageChildIds(args.component))

                    const prevChildIds = args.component.get('ids')

                    if (!prevChildIds?.length) {
                      console.log(
                        `%cNo previous page children component ids to remove`,
                        `color:#95a5a6;`,
                        { component: args.component, prevChildIds },
                      )
                    } else {
                      const ids = args.component.get('ids') || []
                      ids.forEach((id: string) => {
                        cache.component.remove(
                          cache.component.get(id)?.component,
                        )
                        console.log(
                          `%cRemoved "${id}" from page "${args.component.id}" (${nuiPage.page})`,
                          `color:#95a5a6;`,
                        )
                      })

                      args.component.set('ids', [])
                    }
                  }

                  const children = u.array(
                    nui.resolveComponents({
                      components:
                        childrensNUIPage.components?.map?.(
                          (obj: ComponentObject) => {
                            let child = nui.createComponent(
                              obj,
                              childrensNUIPage,
                            )
                            child = args.component.createChild(child)
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

                      const childNode = draw(child, ndomPage.rootNode, ndomPage)

                      if (childNode) {
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

            if (!args.component.get('page')) {
              args.component.on(nuiEvent.component.page.PAGE_CREATED, listen)
            } else {
              // Still create a ComponentPage even if the page name is empty to
              // be in sync with the NUIPage
              if (args.component.get('page')?.page === '') {
                console.info(args.component.toJSON())
                const ndomPage = getOrCreateNDOMPage(args.component)
              }
              listen()
            }

            args.component.children?.forEach?.(
              (child: NUIComponent.Instance) => {
                if (i._isIframeEl(args.node)) {
                  args.node.contentDocument?.body.appendChild(
                    this.draw(child, args.node, args.page, args) as HTMLElement,
                  )
                } else {
                  args.node?.appendChild(
                    this.draw(child, args.node, args.page, args) as HTMLElement,
                  )
                }
              },
            )
          }
        } else {
          console.info(
            `%cEncountered a page component with a rootNode that is not an iframe. This is not being handled`,
            `color:#FF5722;`,
            args,
          )
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
            if (option?.value === args.component.props[c.DATA_VALUE]) {
              // Default to the selected index if the user already has a state set before
              _node.selectedIndex = index
              _node.dataset.value = option.value
              _node.value = option.value
            }
          })
        }

        clearOptions(args.node as HTMLSelectElement)

        if (u.isArr(selectOptions)) {
          setSelectOptions(args.node as HTMLSelectElement, selectOptions)
        } else if (u.isStr(selectOptions)) {
          // Retrieved through reference
          args.component.on('options', (dataOptions: any[]) => {
            setSelectOptions(args.node as HTMLSelectElement, dataOptions)
          })
        }
        // Default to the first item if the user did not previously set their state
        if (args.node?.selectedIndex === -1) args.node.selectedIndex = 0
      } else if (Identify.textBoard(original)) {
        const { textBoard, text } = args.component.props
        if (u.isArr(args.component)) {
          if (u.isArr(textBoard)) {
            if (u.isStr(text)) {
              console.log(
                `%cA component cannot have a "text" and "textBoard" property ` +
                  `because they both overlap. The "text" will take precedence.`,
                `color:#ec0000;`,
                args.component.toJSON(),
              )
            }

            textBoard.forEach((item) => {
              if (Identify.textBoardItem(item)) {
                const br = createComponent('view')
                args.component.createChild(br as any)
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
                args.component.createChild(text as any)
              }
            })
          } else {
            console.log(
              `%cExpected textBoard to be an array but received "${typeof textBoard}". ` +
                `This part of the component will not be included in the output`,
              `color:#ec0000;`,
              { component: args.component.toJSON(), textBoard },
            )
          }
        }
      }
      /* -------------------------------------------------------
        ---- DISABLING / ENABLING
      -------------------------------------------------------- */
      // TEXTVIEW
      else if (Identify.component.textView(args.component)) {
        if (args.component.blueprint?.['isEditable']) {
          const isEditable = args.component.get('isEditable')
          const isDisabled = Identify.isBooleanFalse(isEditable)
          setAttr('disabled', isDisabled)
        }
        args.node?.addEventListener(
          'change',
          function (this: HTMLTextAreaElement) {
            this.dataset.value = this.value
            args.component.edit(c.DATA_VALUE, this.value)
            args.component.emit(c.DATA_VALUE, this.value)
          },
        )
      }
      // textField
      else if (Identify.component.textField(args.component)) {
        if (args.component.blueprint?.isEditable) {
          const isEditable = args.component.get('isEditable')
          const isDisabled = Identify.isBooleanFalse(isEditable)
          setAttr('disabled', isDisabled)
        }
        if (args.component.blueprint?.autocomplete) {
          const autocomplete = args.component.get('autocomplete')
          setAttr('autocomplete', autocomplete)
        }
        args.node?.addEventListener(
          'change',
          function (this: HTMLInputElement) {
            this.dataset.value = this.value
            args.component.edit(c.DATA_VALUE, this.value)
            args.component.emit(c.DATA_VALUE, this.value)
          },
        )
      }
      // VIDEO
      else if (Identify.component.video(args.component)) {
        const videoEl = args.node as HTMLVideoElement
        let sourceEl: HTMLSourceElement
        let notSupportedEl: HTMLParagraphElement
        videoEl.controls = Identify.isBooleanTrue(controls)
        if (poster) videoEl.setAttribute('poster', args.component.get('poster'))
        if (args.component.blueprint?.['path']) {
          args.component.on('path', (res) => {
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
} as t.Resolve.Config
