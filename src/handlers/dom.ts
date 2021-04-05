import Logger from 'logsnap'
import set from 'lodash/set'
import has from 'lodash/has'
import { Identify } from 'noodl-types'
import { Draft } from 'immer'
import {
  getFirstByElementId,
  isTextFieldLike,
  NOODLDOMDataValueElement,
  Resolve,
} from 'noodl-ui-dom'
import { excludeIteratorVar, getAllByDataKey } from 'noodl-utils'
import {
  findIteratorVar,
  findListDataObject,
  NOODLUIActionChain,
  NUIComponent,
} from 'noodl-ui'
import App from '../App'
import * as u from '../utils/common'

const log = Logger.create('src/handlers/dom.ts')

const createExtendedDOMResolvers = function (app: App) {
  const getOnChange = function _getOnChangeFn(args: {
    actionChain: NOODLUIActionChain | undefined
    component: NUIComponent.Instance
    node: NOODLDOMDataValueElement
    dataKey: string
    evtName: string
    iteratorVar?: string
  }) {
    const { actionChain, component, node, dataKey, evtName, iteratorVar } = args

    async function onChange(event: Event) {
      const target:
        | (typeof event.target & {
            value?: string
          })
        | null = event.target

      const localRoot = app.noodl?.root?.[app.mainPage.page]
      const value = target?.value || ''

      if (iteratorVar) {
        const dataObject = findListDataObject(component)
        if (dataObject) {
          set(dataObject, excludeIteratorVar(dataKey, iteratorVar), value)
          component.edit('data-value', value)
          node.dataset.value = value
        } else {
          log.red(
            'Expected a dataObject to update from onChange but no dataObject was found',
            { component, node, dataKey, currentValue: value, event, evtName },
          )
        }

        // TODO - Come back to this to provide more robust functionality
        if (Identify.emit(component.blueprint.dataValue)) {
          await actionChain?.execute?.(event)
        }
      } else {
        app.noodl.editDraft((draft: Draft<{ [key: string]: any }>) => {
          if (!has(draft?.[app.mainPage.page], dataKey)) {
            log.orange(
              `Warning: The dataKey path ${dataKey} does not exist in the local root object ` +
                `If this is intended then ignore this message.`,
              {
                component,
                dataKey,
                localRoot,
                node,
                pageName: app.mainPage.page,
                pageObject: app.noodl.root[app.mainPage.page],
                value,
              },
            )
          }
          set(draft?.[app.mainPage.page], dataKey, value)
          component.edit('data-value', value)
          node.dataset.value = value

          /** TEMP - Hardcoded for SettingsUpdate page to speed up development */
          if (/settings/i.test(app.mainPage.page)) {
            if (node.dataset?.name === 'code') {
              const pathToTage = 'verificationCode.response.edge.tage'
              if (has(app.noodl.root?.[app.mainPage.page], pathToTage)) {
                app.noodl.editDraft((draft: any) => {
                  set(draft?.[app.mainPage.page], pathToTage, value)
                  console.log(`Updated: SettingsUpdate.${pathToTage}`)
                })
              }
            }
          }

          if (!iteratorVar) {
            /**
             * EXPERIMENTAL - When a data key from the local root is being updated
             * by a node, update all other nodes that are referencing it.
             * Note: This will not work for list items which is fine because they
             * reference their own data objects
             */
            getAllByDataKey(dataKey)?.forEach((node) => {
              // Since select elements have options as children, we should not
              // edit by innerHTML or we would have to unnecessarily re-render the nodes
              if (node.tagName === 'SELECT') {
              } else if (isTextFieldLike(node)) {
                node.dataset.value = value
              } else {
                node.innerHTML = `${value || ''}`
              }
            })
          }
        })
        await actionChain?.execute?.(event)
      }
    }

    return onChange
  }

  const domResolvers: Record<string, Omit<Resolve.Config, 'name'>> = {
    '[App] data-value': {
      cond: (node) => isTextFieldLike(node),
      before(node, component) {
        ;(node as HTMLInputElement).value = component.get('data-value') || ''
        node.dataset.value = component.get('data-value') || ''

        if (node.tagName === 'SELECT') {
          if ((node as HTMLSelectElement).length) {
            // Put the default value to the first option in the list
            ;(node as HTMLSelectElement)['selectedIndex'] = 0
          }
        }
      },
      resolve(node, component) {
        const iteratorVar = findIteratorVar(component)
        const dataKey =
          component.get('data-key') || component.get('dataKey') || ''
        node.addEventListener(
          'change',
          getOnChange({
            actionChain: component.get('onChange'),
            component,
            evtName: 'onchange',
            node: node as NOODLDOMDataValueElement,
            dataKey,
            iteratorVar,
          }),
        )
        if (component.has('onBlur')) {
          node.addEventListener(
            'blur',
            getOnChange({
              actionChain: component.get('onBlur'),
              node: node as NOODLDOMDataValueElement,
              component,
              dataKey,
              evtName: 'onblur',
              iteratorVar,
            }),
          )
        }
      },
    },
    '[App] image': {
      cond: 'image',
      async resolve(node, component) {
        const img = node as HTMLImageElement
        const parent = component.parent
        const pageObject = app.nui.getRoot()[app.mainPage?.page || ''] || {}
        if (
          img?.src === pageObject?.docDetail?.document?.name?.data &&
          pageObject?.docDetail?.document?.name?.type == 'application/pdf'
        ) {
          img?.style && (img.style.visibility = 'hidden')
          const parentNode = parent && getFirstByElementId(parent)
          const iframeEl = document.createElement('iframe')
          iframeEl.setAttribute('src', img.src)
          if (u.isObj(component.style)) {
            u.entries(component.style).forEach(
              ([k, v]) => (iframeEl.style[k as any] = v),
            )
          }
          parentNode?.appendChild(iframeEl)
        }
      },
    },
    '[App] textField (password)': {
      cond: 'textField',
      resolve(node, component) {
        // Password inputs
        if (component.contentType === 'password') {
          if (!node?.dataset.mods?.includes('[password.eye.toggle]')) {
            import('../app/noodl-ui').then(() => {
              const assetsUrl = app.nui.getAssetsUrl() || ''
              const eyeOpened = assetsUrl + 'makePasswordVisiable.png'
              const eyeClosed = assetsUrl + 'makePasswordInvisible.png'
              const originalParent = node?.parentNode as HTMLDivElement
              const newParent = document.createElement('div')
              const eyeContainer = document.createElement('button')
              const eyeIcon = document.createElement('img')

              // Transfering the positioning/sizing attrs to the parent so we can customize with icons and others
              const dividedStyleKeys = [
                'position',
                'left',
                'top',
                'right',
                'bottom',
                'width',
                'height',
              ] as const

              // Transfer styles to the new parent to position our custom elements
              dividedStyleKeys.forEach((styleKey) => {
                newParent.style[styleKey] = component.style?.[styleKey]
                // Remove the transfered styles from the original input element
                node && (node.style[styleKey] = '')
              })

              newParent.style.display = 'flex'
              newParent.style.alignItems = 'center'
              newParent.style.background = 'none'

              node && (node.style.width = '100%')
              node && (node.style.height = '100%')

              eyeContainer.style.top = '0px'
              eyeContainer.style.bottom = '0px'
              eyeContainer.style.right = '6px'
              eyeContainer.style.width = '42px'
              eyeContainer.style.background = 'none'
              eyeContainer.style.border = '0px'
              eyeContainer.style.outline = 'none'

              eyeIcon.style.width = '100%'
              eyeIcon.style.height = '100%'
              eyeIcon.style.userSelect = 'none'

              eyeIcon.setAttribute('src', eyeClosed)
              eyeContainer.setAttribute(
                'title',
                'Click here to reveal your password',
              )
              node && node.setAttribute('type', 'password')
              node && node.setAttribute('data-testid', 'password')

              // Restructing the node structure to match our custom effects with the
              // toggling of the eye iconsf

              if (originalParent) {
                if (originalParent.contains(node))
                  originalParent.removeChild(node)
                originalParent.appendChild(newParent)
              }
              eyeContainer.appendChild(eyeIcon)
              newParent.appendChild(node)
              newParent.appendChild(eyeContainer)

              let selected = false

              eyeIcon.dataset.mods = ''
              eyeIcon.dataset.mods += '[password.eye.toggle]'
              eyeContainer.onclick = () => {
                if (selected) {
                  eyeIcon.setAttribute('src', eyeOpened)
                  node?.setAttribute('type', 'text')
                } else {
                  eyeIcon.setAttribute('src', eyeClosed)
                  node?.setAttribute('type', 'password')
                }
                selected = !selected
                eyeContainer.title = !selected
                  ? 'Click here to hide your password'
                  : 'Click here to reveal your password'
              }
            })
          }
        } else {
          // Set to "text" by default
          node.setAttribute('type', 'text')
        }
      },
    },
  }

  return Object.entries(domResolvers).reduce(
    (acc, [name, obj]) => acc.concat({ ...obj, name }),
    [] as Resolve.Config[],
  )
}

export default createExtendedDOMResolvers
