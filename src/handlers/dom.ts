import Logger from 'logsnap'
import {
  findByElementId,
  isTextFieldLike,
  NOODLDOMDataValueElement,
  NOODLDOMElement,
  Resolve,
} from 'noodl-ui-dom'
import App from '../App'
import * as u from '../utils/common'

const log = Logger.create('src/handlers/dom.ts')

const createExtendedDOMResolvers = function (app: App) {
  const domResolvers: Record<string, Omit<Resolve.Config, 'name'>> = {
    '[App] data-value': {
      cond: (node) => isTextFieldLike(node),
      resolve(node, component) {
        // Attach an additional listener for data-value elements that are expected
        // to change values on the fly by some "on change" logic (ex: input/select elements)
        return import('../utils/sdkHelpers').then(
          ({ createOnDataValueChangeFn }) => {
            ;(node as NOODLDOMElement)?.addEventListener(
              'change',
              createOnDataValueChangeFn(
                node as NOODLDOMDataValueElement,
                component,
                {
                  onChange: component.get('onChange'),
                  eventName: 'onchange',
                },
              ),
            )
            if (component.get('onBlur')) {
              ;(node as NOODLDOMElement)?.addEventListener(
                'blur',
                createOnDataValueChangeFn(
                  node as NOODLDOMDataValueElement,
                  component,
                  {
                    onBlur: component.get('onBlur'),
                    eventName: 'onblur',
                  },
                ),
              )
            }
          },
        )
      },
    },
    '[App] image': {
      cond: 'image',
      async resolve(node, component) {
        const img = node as HTMLImageElement
        const parent = component.parent
        const pageObject =
          app.nui.getRoot()[app.nui.getRootPage()?.page || ''] || {}
        if (
          img?.src === pageObject?.docDetail?.document?.name?.data &&
          pageObject?.docDetail?.document?.name?.type == 'application/pdf'
        ) {
          img?.style && (img.style.visibility = 'hidden')
          let parentNode = findByElementId(parent) as HTMLElement
          const iframeEl = document.createElement('iframe')
          iframeEl.setAttribute('src', img.src)
          if (u.isObj(component.style)) {
            Object.entries(component.style).forEach(
              ([k, v]) => (iframeEl.style[k as any] = v),
            )
          }
          parentNode?.appendChild(iframeEl)
        }
      },
    },
    '[App] textField (password)': {
      cond: 'textField',
      resolve(node: any, component: any) {
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
