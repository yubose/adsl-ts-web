import { Identify, userEvent } from 'noodl-types'
import { NOODLUIActionChain } from 'noodl-ui'
import { isActionChain } from 'noodl-action-chain'
import { resolveAssetUrl } from 'noodl-ui/dist/utils/noodl'
import { NodeResolverConfig, NodeResolverFactoryFunc } from '../types'
import * as u from '../utils'

/* -------------------------------------------------------
  ---- DEFAULT RESOLVERS
-------------------------------------------------------- */

const resolveAttributes: NodeResolverConfig = {
  name: `[noodl-ui-dom] Default Common Resolvers`,
  resolve({ node, component }) {
    const original = component?.blueprint || {}
    const props = component?.props() || {}
    const dataAttribKeys = u.getDataAttribKeys()

    const { contentType, text, placeholder, path } = props

    if (component && node && !u.isFnc(node)) {
      node.id = component.id
      /* -------------------------------------------------------
        ---- DATA ATTRIBUTES
      -------------------------------------------------------- */
      dataAttribKeys.forEach((key) => {
        if (!u.isUnd(props[key])) {
          node.dataset[key.replace('data-', '')] = props[key]
        }
      })
      // NON-INPUT FIELDS DISPLAYABLE VALUES (ex: label, p, span, etc)
      if (!u.isTextFieldLike(node)) {
        if (text || placeholder || props['data-value']) {
          const dataValue = props['data-value']
          let textVal = u.isStr(dataValue) ? dataValue : text || text || ''
          if (!textVal && placeholder) textVal = placeholder
          if (!textVal) textVal = ''
          if (textVal && node) node.innerHTML = `${textVal}`
        }
      } else {
        // if (!node.innerHTML?.trim()) {
        //   if (u.isDisplayable(props['data-value'])) {
        //     node.innerHTML = `${props['data-value']}`
        //   } else if (u.isDisplayable(text)) {
        //     node.innerHTML = `${text}`
        //   }
        // }
      }
      // INPUT FIELDS DISPLAYABLE VALUES (ex: input, textarea, select, etc)
      if (props['data-placeholder']) {
        if (Identify.emit(original.placeholder)) {
          component.on('placeholder', (src: string) => {
            setTimeout(() => ((node as HTMLInputElement).placeholder = src))
          })
        } else {
          ;(node as HTMLInputElement).placeholder = props['data-placeholder']
        }
      }
      // MEDIA (images / videos)
      if (path && props['data-src']) {
        // Images
        if (node.tagName !== 'VIDEO' && node.tagName !== 'IFRAME') {
          ;(node as HTMLImageElement).src = props['data-src'] || ''
        }
      }
      // TEXTFUNC ('text=func') [date components most likely]
      if (u.isFnc(original['text=func']) && contentType === 'timer') {
        node.textContent = props['data-value'] || ''
      }
      /* -------------------------------------------------------
        ---- USER EVENTS
      -------------------------------------------------------- */
      // Jump to next input field when user presses their enter key
      if (node.tagName === 'INPUT') {
        node.onkeypress = function onKeyPress(keyboardEvent: KeyboardEvent) {
          if (keyboardEvent.key === 'Enter') {
            const inputs = document.querySelectorAll('input')
            const currentIndex = [...inputs].findIndex((el) =>
              node.isEqualNode(el),
            )
            const targetIndex = (currentIndex + 1) % inputs.length
            if (currentIndex + 1 < inputs.length) inputs[targetIndex]?.focus?.()
          }
        }
      }

      // Attach event handlers on user events (ex: onClick, onHover, etc)
      userEvent.forEach((eventType) => {
        const actionChain = component.get(eventType) as NOODLUIActionChain
        if (isActionChain(actionChain)) {
          // Putting a setTimeout here helps to avoid the race condition in where
          // the emitted action handlers are being called before local root object
          // gets their data values updated.
          // TODO - Unit test + think of a better solution
          node.addEventListener(
            u.normalizeEventName(eventType),
            async function onClickEvent(mouseEvent) {
              if (!isActionChain(actionChain)) {
                console.log(
                  `%cUser event for "${eventType}" was not an ActionChain. ` +
                    `This will not take any effect`,
                  `color:#ec0000;`,
                  { actionChain, node, component, mouseEvent },
                )
              }
              await actionChain?.execute?.(mouseEvent)
            },
          )
        }
      })
      /* -------------------------------------------------------
        ---- STYLES
      -------------------------------------------------------- */
      if (node.tagName !== 'SCRIPT') {
        if (u.isObj(component.style) && node.style) {
          for (const [key, value] of Object.entries(component.style)) {
            node.style[key] = value
          }
        }
      }
      // TEMP - Experimenting CSS
      if (component.type === 'scrollView') {
        u.addClassName('scroll-view', node)
      }
      if (component.has('textBoard')) {
        u.addClassName('text-board', node)
      }
    } else {
      // Plugins
    }
  },
}

const createResolveAttributes: NodeResolverFactoryFunc = function _createResolverAttributes(
  ndom,
) {
  return resolveAttributes
}

export default createResolveAttributes
