import * as u from '@jsmanifest/utils'
import { isActionChain } from 'noodl-action-chain'
import { createEmitDataKey } from 'noodl-utils'
import { OrArray } from '@jsmanifest/typefest'
import SignaturePad from 'signature_pad'
import curry from 'lodash/curry'
import has from 'lodash/has'
import { ComponentObject, Identify } from 'noodl-types'
import {
  createAction,
  createComponent,
  formatColor,
  event as nuiEvent,
  NUI,
  NUIComponent,
  SelectOption,
  Page as NuiPage,
  Plugin,
  NUIActionChain,
  Store,
  EmitAction,
} from 'noodl-ui'
import {
  findFirstByElementId,
  isComponentPage,
  isPage as isNDOMPage,
  toSelectOption,
} from '../utils'
import createEcosDocElement from '../utils/createEcosDocElement'
import applyStyles from '../utils/applyStyles'
import copyAttributes from '../utils/copyAttributes'
import copyStyles from '../utils/copyStyles'
import NDOM from '../noodl-ui-dom'
import NDOMPage from '../Page'
import * as t from '../types'
import * as i from '../utils/internal'
import * as c from '../constants'

const componentsResolver: t.Resolve.Config = {
  name: `[noodl-ui-dom] components`,
  async resolve(args) {
    const { nui, renderPage, setAttr, setDataAttr, setStyleAttr } = args

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
              elem.parentNode || args.page.node || document.body
            elem.innerHTML += data
            if (parentNode.children.length) {
              parentNode.insertBefore(elem, parentNode.childNodes[0])
            } else {
              parentNode.appendChild(elem)
            }
          }
          return elem
        }

        if (args.component.has('content')) {
          loadAttribs(args.component, pluginNode, args.component.get('content'))
        }

        args.component.on(
          'content',
          (content: string) => loadAttribs(args.component, pluginNode, content),
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
                const parentNode = node || page.node || document.body

                if (top) {
                  if (parentNode.children.length) {
                    parentNode.insertBefore(childNode, parentNode.childNodes[0])
                  } else parentNode.appendChild(childNode)
                } else parentNode.appendChild(childNode)
              }

              if (node) {
                if (i._isIframeEl(node) || i._isDivEl(node))
                  appendChild(args.page, node)
                else if (i._isLinkEl(node)) {
                  if (i._isIframeEl(args.page.node)) {
                    args.page.node.contentDocument?.head.appendChild(node)
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
        controls,
        dataKey,
        onClick,
        options: selectOptions,
        poster,
        text,
        videoType,
      } = original

      // BUTTON
      if (Identify.component.button(args.component)) {
        if (args.node) {
          if (args.component.get(c.DATA_SRC)) {
            u.forEach(
              ([k, v]) => setStyleAttr(k as any, v),
              [
                ['overflow', 'hidden'],
                ['display', 'flex'],
                ['alignItems', 'center'],
              ],
            )
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
            signaturePad.onEnd = () => {
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

        let iframe: HTMLIFrameElement | undefined

        try {
          const loadResult = await createEcosDocElement(
            args.node as HTMLElement,
            args.component.get('ecosObj'),
          )
          iframe = loadResult.iframe
        } catch (error) {
          console.error(error)
          iframe = document.createElement('iframe')
        }

        iframe && (iframe.id = `${idLabel}-document-${args.component.id}`)
        iframe.addEventListener('error', (err) =>
          console.error(`[ERROR]: In ecosDoc component: ${err.message}`, err),
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
        if (args.component.get(c.DATA_SRC)) {
          setAttr('src', args.component.get(c.DATA_SRC))
          setDataAttr('src', args.component.get(c.DATA_SRC))
        }
        args.component.on('path', (result: string) => {
          if (args.node) {
            setAttr('src', result)
            setDataAttr('src', result)
          }
        })

        // load promise return to image
        if (args.component.blueprint?.['path=func']) {
          // ;(node as HTMLImageElement).src = '../waiting.png'
          setAttr('src', args.component.get(c.DATA_SRC))
          args.component.get(c.DATA_SRC).then((path: any) => {
            if (path) {
              console.log('load path', path)
              setAttr('src', path)
            }
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
        if (u.isStr(args.component.get('path'))) {
          const componentPage = i._getOrCreateComponentPage(
            args.component,
            args.findPage,
            args.createPage,
          )

          if (componentPage) {
            const nuiPage = args.cache.page.get(componentPage?.id)?.page
            if (nuiPage) {
              console.info(`nuiPage exists on initial handling`)
              debugger
              if (args.component !== componentPage.component) {
                if (!componentPage.component) {
                  console.info(
                    `Replacing empty component in ComponentPage with incoming component`,
                  )
                  componentPage.patch(args.component)
                } else {
                  console.info(
                    `Replacing existing component in ComponentPage with incoming component because they are different`,
                    {
                      'componentPage.component':
                        componentPage.component.toJSON(),
                      'args.component': args.component.toJSON(),
                    },
                  )
                  componentPage.patch(args.component)
                }
              }

              if (!componentPage.hasNuiPage) {
                if (nuiPage) {
                  console.info(
                    `Replacing empty nuiPage in ComponentPage with incoming nuiPage`,
                  )
                  componentPage.patch(nuiPage)
                }
              } else if (nuiPage && componentPage.getNuiPage() !== nuiPage) {
                console.info(
                  `Replacing nuiPage in ComponentPage with incoming nuiPage because they are differeent`,
                )
                componentPage.patch(nuiPage)
              }
            } else {
              console.info(`nuiPage did not exist on initial handling`)
            }
            debugger
            const pageName = componentPage.requesting || componentPage.page
            if (pageName) {
              if (!(pageName in nui.getRoot())) {
                console.info(
                  `%cPage "${pageName}" is not in the root. Fetching it now`,
                  `color:#00b406;`,
                  componentPage,
                )
                debugger
                // await args.transact('REQUEST_PAGE_OBJECT', componentPage)
              }
            }
          } else {
            console.info(`ComponentPage did not exist in initial handling`)
          }

          if (i._isIframeEl(args.node)) {
            const nuiPage = args.component.get('page')
            const path = args.component.get('path')
            const remote = i._isRemotePageOrUrl(path)
            const src = nuiPage.page

            if (remote) {
              /**
               * Page components loading content through remote URLs
               * (https links or anything that is an html file)
               */
              componentPage.on(
                c.eventId.componentPage.on.ON_MESSAGE,
                async (dataObject: Record<string, any>) => {
                  if (isActionChain(args.component.get('postMessage'))) {
                    const actionChain = args.component.get(
                      'postMessage',
                    ) as NUIActionChain

                    const postMessageAction = actionChain.queue.find(
                      (action) => action.trigger === 'postMessage',
                    ) as EmitAction

                    if (postMessageAction) {
                      postMessageAction.dataKey = createEmitDataKey(
                        postMessageAction.original?.emit?.dataKey,
                        dataObject,
                      )
                    } else {
                      console.log(
                        `%cCould not find a postMessage emit action inside a postMessage action chain`,
                        `color:#ec0000;`,
                        { ...args, dataObject },
                      )
                    }

                    // TODO - Migrate all actions to use this way of working with their data objects
                    // actionChain.data.set('dataObject', dataObject)
                    await actionChain.execute()
                  } else {
                    console.log(
                      `%cReceived a message from a child of a page component and expected an action chain but received "${typeof args.component.get(
                        'postMessage',
                      )}"`,
                      `color:#ec0000;`,
                      { ...args, dataObject },
                    )
                  }
                },
              )

              function onLoad(opts: {
                event?: Event
                node: t.NDOMElement<'page'>
                component: NUIComponent.Instance
                createPage: NDOM['createPage']
                findPage: NDOM['findPage']
                resolvers: NDOM['resolvers']
              }) {
                let src = opts.component.get('page')?.page || ''
                let componentPage = i._getOrCreateComponentPage(
                  args.component,
                  args.findPage,
                  args.createPage,
                )

                if (
                  componentPage.id !== 'root' &&
                  componentPage.node !== opts.node
                ) {
                  try {
                    componentPage.replaceNode(opts.node)
                  } catch (error) {
                    console.error(error)
                  }
                }

                src && opts.node.src !== src && (opts.node.src = src)
              }

              if (src) {
                onLoad({
                  component: args.component,
                  createPage: args.createPage,
                  findPage: args.findPage,
                  node: args.node,
                  resolvers: args.resolvers,
                })
              } else {
                componentPage.window?.addEventListener('load', (evt) =>
                  onLoad({
                    event: evt,
                    createPage: args.createPage,
                    component: args.component,
                    node: args.node as HTMLIFrameElement,
                    findPage: args.findPage,
                    resolvers: args.resolvers,
                  }),
                )
              }

              // args.node.src = args.component.get('page')?.page || ''
              componentPage.node?.addEventListener('error', console.error)
            } else {
              /**
               * If this page component is not remote, it is loading a page
               * from the "page" list from a noodl app config
               */
              const componentPage = i._getOrCreateComponentPage(
                args.component,
                args.createPage,
                args.findPage,
              )

              const onPageComponents = curry(async (_args: typeof args) => {
                try {
                  // if (componentPage) {
                  //   const nuiPage = args.cache.page.get(componentPage.id)?.page
                  //   if (nuiPage) {
                  //     if (
                  //       args.component &&
                  //       componentPage.component !== args.component
                  //     ) {
                  //       console.info(
                  //         `Incoming component is not the same as current component. Patching now`,
                  //       )
                  //       componentPage.patch(args.component)
                  //     }

                  //     if (!componentPage.hasNuiPage && nuiPage) {
                  //       console.info(
                  //         `ComponentPage does not have a nuiPage. Patching now with a new one`,
                  //       )
                  //       componentPage.patch(nuiPage)
                  //     } else if (
                  //       nuiPage &&
                  //       nuiPage !== componentPage.getNuiPage()
                  //     ) {
                  //       console.info(
                  //         `The nuiPage in the ComponentPage is different than the incoming one. Patching with the incoming one now`,
                  //         nuiPage,
                  //       )
                  //       componentPage.patch(nuiPage)
                  //     }
                  //   } else {
                  //     console.info(`nuiPage does not exist in the PageCache`)
                  //   }

                  //   const pageName =
                  //     componentPage.requesting || componentPage.page

                  //   if (pageName) {
                  //     if (!(pageName in nui.getRoot())) {
                  //       console.info(
                  //         `%cPage "${pageName}" is not in the root. Fetching it now`,
                  //         `color:#00b406;`,
                  //         componentPage,
                  //       )
                  //       args.cache.component.clear()
                  //       await args.transact('REQUEST_PAGE_OBJECT', componentPage)
                  //     }
                  //   }
                  // } else {
                  //   console.info(
                  //     `ComponentPage is null or undefined inside onPageComponents`,
                  //   )
                  // }

                  // if (!nuiPage) {
                  //   if (!componentPage.hasNuiPage) {
                  //     nuiPage = args.cache.page.get(args.component.id).page
                  //     nuiPage && componentPage.patch(nuiPage)
                  //   }
                  // } else if (nuiPage !== componentPage.getNuiPage()) {
                  //   if (componentPage.hasNuiPage) {
                  //     nuiPage = componentPage.getNuiPage()
                  //   } else {
                  //     componentPage.patch(nuiPage)
                  //   }
                  // }

                  // console.info({
                  //   ['_args.page']: _args.page,
                  //   ['args.page']: args.page,
                  //   cachedPages: [..._args.cache.page.get().values()].map(
                  //     ({ page }) => page,
                  //   ),
                  //   componentPage,
                  //   findPage: _args.findPage(_args.component),
                  //   globalPages: _args.global.pages,
                  //   globalPageIds: _args.global.pageIds,
                  //   nuiPage,
                  //   nuiPageFromCache: _args.cache.page.get(_args.component.id)
                  //     ?.page,
                  //   currentPathValue: _args.component.get('path'),
                  //   componentHooks: _args.component?.hooks,
                  //   componentPageComponentHooks: componentPage.component?.hooks,
                  // })

                  /** Initiation / first time rendering */
                  // if (type === 'init') {
                  if (!componentPage.initialized) {
                    componentPage.initialized = true
                    if (componentPage.node !== _args.node) {
                      // const currentStyles = copyStyles(_args.node)
                      componentPage.replaceNode(_args.node as HTMLIFrameElement)
                      _args.node = componentPage.node
                      // applyStyles(_args.node, currentStyles)
                    }
                  }
                  // }

                  /**
                   * Clean up inactive components if any remain from
                   * previous renders
                   */
                  if (componentPage.requesting && componentPage.page) {
                    console.info(
                      `Clearing components from page "${componentPage.requesting}" ` +
                        `from the component cache`,
                    )
                    debugger
                    // _args.cache.component.clear(componentPage.page)
                    _args.cache.component.clear(componentPage.requesting)
                  }

                  if (componentPage?.component) {
                    const descendentIds = i._getDescendantIds(
                      componentPage.component,
                    )
                    console.info(
                      `Removing ${
                        descendentIds?.length || 0
                      } descendent ids from page component`,
                    )
                    for (const id of descendentIds) {
                      // _args.cache.component.remove(id)
                      // findFirstByElementId?.(id)?.remove?.()
                    }
                  }

                  // args.component.clear('children')
                  // _args.component.clear('children')
                  // componentPage.component?.clear?.('children')

                  debugger

                  console.info(componentPage.components)

                  const children = await Promise.all(
                    componentPage.components?.map(
                      async (obj: ComponentObject) => {
                        let child = await nui.resolveComponents({
                          components: obj,
                          page: nuiPage,
                        })

                        let childNode = await _args.draw(
                          child,
                          componentPage.body,
                          componentPage,
                        )

                        childNode && componentPage.appendChild(childNode)
                        // TODO - We might not need this line
                        _args.component.createChild(child)
                        return child
                      },
                    ) || [],
                  )

                  console.info(
                    [...(componentPage.body?.children || [])].map((c) => c.id),
                  )
                } catch (error) {
                  console.error(error)
                }
              })

              args.node.addEventListener(
                'load',
                async function () {
                  console.info(`Iframe (ComponentPage) loaded`)
                  try {
                    //   if (
                    //     args.component !==
                    //     args.cache.component.get(args.component.id).component
                    //   ) {
                    //     console.info(
                    //       `Incoming component is different than the one in the ComponentCache. Replacing now...`,
                    //     )
                    //     args.component = args.cache.component.get(
                    //       args.component.id,
                    //     ).component
                    //   }
                    // await onPageComponents(args, {
                    //   page: componentPage.getNuiPage(),
                    //   type: 'init',
                    // })
                  } catch (error) {
                    console.error(error)
                  }
                },
                { once: true },
              )

              /**
               * This is used to keep the component up-to-date with changes in the DOM
               */
              args.component.on(
                nuiEvent.component.page.PAGE_COMPONENTS,
                onPageComponents(args),
              )
            }
          } else {
            console.log(
              `%cEncountered a page component with a node that is not an iframe. This is not supported yet`,
              `color:#FF5722;`,
              args,
            )
          }
        } else {
          console.log(
            `%cA page component did not receive its NUIPage instance`,
            `color:#ec0000;`,
            args,
          )
        }
      }
      // SELECT
      else if (Identify.component.select(original)) {
        let dataKey = original.dataKey
        if (args.component.get('size')) {
          const size = args.component.get('size')
          const select = args.node as HTMLTextAreaElement
          let height = args.component?.style?.height
          const initHeight =
            typeof height == 'string'
              ? parseFloat(height.replace('px', ''))
              : height
          const sizeHeight =
            typeof initHeight == 'number' ? initHeight * size : 0
          select.onmouseup = function () {
            select.setAttribute('size', size)
            select.style.height = sizeHeight + 'px'
          }
          select.onblur = function () {
            select.removeAttribute('size')
            select.style.height = initHeight + 'px'
          }
          select.onchange = function () {
            select.removeAttribute('size')
            select.style.height = initHeight + 'px'
          }
        }
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
        } else if (u.isStr(selectOptions) || (dataKey && u.isStr(dataKey))) {
          // Retrieved through reference
        }

        args.component.on('options', (dataOptions: any[]) => {
          clearOptions(args.node as HTMLSelectElement)
          clearOptions(args.node as HTMLSelectElement)
          setSelectOptions(args.node as HTMLSelectElement, dataOptions)
        })

        // Default to the first item if the user did not previously set their state
        if (
          args.component.get(c.DATA_VALUE) != undefined &&
          u.isArr(selectOptions)
        ) {
          const index = selectOptions.indexOf(args.component.get(c.DATA_VALUE))
          if (
            index !== -1 &&
            (args.node as HTMLSelectElement).selectedIndex !== index
          ) {
            ;(args.node as HTMLSelectElement).selectedIndex = index
          }
        } else if ((args.node as HTMLSelectElement)?.selectedIndex === -1) {
          ;(args.node as HTMLSelectElement).selectedIndex = 0
        }
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
}

export default componentsResolver
