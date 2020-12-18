import { Component } from 'noodl-ui'
import NOODLUIDOM from 'noodl-ui-dom'
// import { noodluidom } from '../../packages/noodl-ui-dom/src/test-utils'

const noodluidom = new NOODLUIDOM()

noodluidom
  .register({
    name: 'data-value (sync with sdk)',
    resolve(node: any, component: any) {
      // Attach an additional listener for data-value elements that are expected
      // to change values on the fly by some "on change" logic (ex: input/select elements)
      import('../utils/sdkHelpers').then(({ createOnDataValueChangeFn }) => {
        node.addEventListener(
          'onchange',
          createOnDataValueChangeFn(node, component, {
            onChange: component.get('onChange'),
            eventName: 'onchange',
          }),
        )
      })
    },
  })
  .register({
    name: 'image',
    resolve(node: any, component: any) {
      import('../app/noodl-ui').then(({ default: noodlui }) => {
        const parent = component.parent()
        const context = noodlui.getContext()
        const pageObject = noodlui.root[context?.page || ''] || {}
        if (
          node?.src === pageObject?.docDetail?.document?.name?.data &&
          pageObject?.docDetail?.document?.name?.type == 'application/pdf'
        ) {
          node.style.visibility = 'hidden'
          const parentNode = document.getElementById(parent?.id || '')
          const iframeEl = document.createElement('iframe')
          iframeEl.setAttribute('src', node.src)
          if (_.isPlainObject(component.style)) {
            Object.entries(component.style).forEach(([k, v]) => {
              // @ts-expect-error
              iframeEl.style[k] = v
            })
          }
          parentNode?.appendChild(iframeEl)
        }
      })
    },
  })
  .register({
    name: 'plugin',
    cond: (node, component) => component.noodlType === 'plugin',
    async resolve(node: any, component: any) {
      const src = component?.get?.('src')
      if (typeof src === 'string') {
        if (src.startsWith('http')) {
          if (src.endsWith('.js')) {
            const { default: axios } = await import('../app/axios')
            const { data } = await axios.get(src)
            /**
             * TODO - Check the ext of the filename
             * TODO - If its js, run eval on it
             */
            try {
              console.log(data)
              eval(data)
            } catch (error) {
              console.error(error)
            }
          }
        } else {
          console.error(
            `Received a src from a "plugin" component that did not start with an http(s) protocol`,
            { component: component.toJS(), src },
          )
        }
      }
    },
  })
  .register({
    name: 'password textField',
    resolve(node: HTMLTextAreaElement, component: Component) {
      if (node && component) {
        // Password inputs
        if (component.get('contentType') === 'password') {
          if (!node?.dataset.mods?.includes('[password.eye.toggle]')) {
            import('../app/noodl-ui').then(({ default: noodlui }) => {
              const assetsUrl = noodlui.assetsUrl || ''
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
                node.style[styleKey] = ''
              })

              newParent.style['display'] = 'flex'
              newParent.style['alignItems'] = 'center'
              newParent.style['background'] = 'none'

              node.style['width'] = '100%'
              node.style['height'] = '100%'

              eyeContainer.style['top'] = '0px'
              eyeContainer.style['bottom'] = '0px'
              eyeContainer.style['right'] = '6px'
              eyeContainer.style['width'] = '42px'
              eyeContainer.style['background'] = 'none'
              eyeContainer.style['border'] = '0px'
              eyeContainer.style['outline'] = 'none'

              eyeIcon.style['width'] = '100%'
              eyeIcon.style['height'] = '100%'
              eyeIcon.style['userSelect'] = 'none'

              eyeIcon.setAttribute('src', eyeClosed)
              eyeContainer.setAttribute(
                'title',
                'Click here to reveal your password',
              )
              node.setAttribute('type', 'password')
              node.setAttribute('data-testid', 'password')

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
                eyeContainer['title'] = !selected
                  ? 'Click here to hide your password'
                  : 'Click here to reveal your password'
              }
            })
          }
        } else {
          // Set to "text" by default
          node.setAttribute('type', 'text')
        }
      }
    },
  })

export default noodluidom
