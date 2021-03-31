import { Identify, userEvent } from 'noodl-types'
import { dataAttributes } from 'noodl-ui'
import { isActionChain } from 'noodl-action-chain'
import { Resolve } from '../types'
import { isTextFieldLike, normalizeEventName } from '../utils'
import * as u from '../utils/internal'

/* -------------------------------------------------------
  ---- DEFAULT RESOLVERS
-------------------------------------------------------- */

const resolveAttributes: Resolve.Config = {
  name: `[noodl-ui-dom] Default Common Resolvers`,
  resolve(node, component) {
    const original = component?.blueprint || {}

    const { contentType, text, placeholder, path } = original

    if (component && node && !u.isFnc(node)) {
      node.id = component.id
      /* -------------------------------------------------------
        ---- DATA ATTRIBUTES
      -------------------------------------------------------- */
      dataAttributes.forEach((key) => {
        if (!u.isUnd(original[key])) {
          node.dataset[key.replace('data-', '')] = original[key]
        }
      })
      // NON-INPUT FIELDS DISPLAYABLE VALUES (ex: label, p, span, etc)
      if (!isTextFieldLike(node)) {
        if (text || placeholder || original['data-value']) {
          const dataValue = original['data-value']
          let textVal = u.isStr(dataValue) ? dataValue : text || text || ''
          if (!textVal && placeholder) textVal = placeholder
          if (!textVal) textVal = ''
          if (textVal && node) node.innerHTML = `${textVal}`
        }
      } else {
        // if (!node.innerHTML?.trim()) {
        //   if (u.isDisplayable(original['data-value'])) {
        //     node.innerHTML = `${original['data-value']}`
        //   } else if (u.isDisplayable(text)) {
        //     node.innerHTML = `${text}`
        //   }
        // }
      }
      // INPUT FIELDS DISPLAYABLE VALUES (ex: input, textarea, select, etc)
      if (original['data-placeholder']) {
        if (Identify.emit(original.placeholder)) {
          component.on('placeholder', (src: string) => {
            setTimeout(() => ((node as HTMLInputElement).placeholder = src))
          })
        } else {
          ;(node as HTMLInputElement).placeholder = original['data-placeholder']
        }
      }
      // MEDIA (images / videos)
      if (path && original['data-src']) {
        // Images
        if (node.tagName !== 'VIDEO' && node.tagName !== 'IFRAME') {
          ;(node as HTMLImageElement).src = original['data-src'] || ''
        }
      }
      // TEXTFUNC ('text=func') [date components most likely]
      if (u.isFnc(original['text=func']) && contentType === 'timer') {
        node.textContent = original['data-value'] || ''
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
        const actionChain = component.get(eventType)
        if (isActionChain(actionChain)) {
          // Putting a setTimeout here helps to avoid the race condition in where
          // the emitted action handlers are being called before local root object
          // gets their data values updated.
          // TODO - Unit test + think of a better solution
          node.addEventListener(
            normalizeEventName(eventType),
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

const createResolveAttributes: Resolve.Func = function _createResolverAttributes(
  ndom,
) {
  return resolveAttributes
}

export default createResolveAttributes
