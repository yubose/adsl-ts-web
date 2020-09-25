/**
 * This file holds the logic of injecting custom logic to DOM nodes
 * An example is an input with type: password to inject toggling on/off
 * of the eye icon
 */
import _ from 'lodash'
import { identify, NOODLComponentProps } from 'noodl-ui'
import NOODLElement from 'components/NOODLElement'
import Logger from 'app/Logger'

const log = Logger.create('domInjections.ts')

const onCreateNode = (
  onCreateNodeCb: (node: NOODLElement, props: NOODLComponentProps) => void,
) => {
  const predicates = [] as [
    (props: NOODLComponentProps) => boolean,
    (...args: Parameters<typeof onCreateNodeCb>) => any,
  ][]

  /** Images */
  predicates.push([
    ({ noodlType }) => noodlType === 'image',
    (node: unknown, props) => {
      const { children, onClick } = props
      const img = node as HTMLImageElement

      if (_.isFunction(onClick)) {
        img.style['cursor'] = 'pointer'
      }

      // If an image has children, we will assume it is some icon button overlapping
      //    Ex: profile photos and showing pencil icon on top to change it
      if (children) {
        log.func('onCreateNode: Image')
        log.orange(
          `An image component has children. This is a weird practice. Consider ` +
            `discussion about this`,
          props,
        )
        img.style['width'] = '100%'
        img.style['height'] = '100%'
      }
    },
  ])

  /** Labels */
  predicates.push([
    ({ noodlType }) => noodlType === 'label',
    (node: unknown, props) => {
      const label = node as HTMLDivElement
      const { onClick } = props
      label.style['cursor'] = _.isFunction(onClick) ? 'pointer' : 'auto'
    },
  ])

  /** Password inputs */
  predicates.push([
    identify.component.isPasswordInput,
    (node: unknown, props) => {
      const input = node as HTMLInputElement
      if (!input?.dataset.mods?.includes('[password.eye.toggle]')) {
        import('app/client').then(({ noodl }) => {
          const assetsUrl = noodl.getContext().assetsUrl
          const toggledSrc = assetsUrl + 'makePasswordInvisible.png'
          const untoggledSrc = assetsUrl + 'makePasswordVisiable.png'
          const grandParent = input?.parentNode as HTMLDivElement
          const newParent = document.createElement('div')
          const eyeContainer = document.createElement('button')
          const eyeIcon = document.createElement('img')

          // const restDividedStyleKeys = _.omit(props.style, dividedStyleKeys)

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

          // Transfer styles to the grand parent to position our custom elements
          _.forEach(dividedStyleKeys, (styleKey) => {
            grandParent.style[styleKey] = props.style?.[styleKey]
            // Remove the transfered styles from the original input element
            delete input.style[styleKey]
          })

          newParent.style['display'] = 'flex'
          newParent.style['alignItems'] = 'center'
          newParent.style['backgroundColor'] = '#fff'
          newParent.style['height'] = '100%'

          input.style['width'] = '100%'
          input.style['height'] = '100%'
          input.style['padding'] = '0px'
          input.style['position'] = 'relative'

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

          eyeIcon.setAttribute('src', toggledSrc)

          // Restructing the node structure to match our custom effects with the
          // toggling of the eye icons

          if (grandParent?.contains(input)) grandParent.removeChild(input)
          eyeContainer.appendChild(eyeIcon)
          newParent.appendChild(input)
          newParent.appendChild(eyeContainer)
          grandParent?.appendChild(newParent)

          let selected = false

          function onClick(e: Event) {
            if (selected) {
              eyeIcon.setAttribute('src', untoggledSrc)
              input.setAttribute('type', 'text')
            } else {
              eyeIcon.setAttribute('src', toggledSrc)
              input.setAttribute('type', 'password')
            }
            selected = !selected
            eyeContainer['title'] = !selected
              ? 'Click here to hide your password'
              : 'Click here to reveal your password'
          }

          eyeIcon.dataset.mods = ''
          eyeIcon.dataset.mods += '[password.eye.toggle]'

          log.func('onCreateNode: Password input')
          log.orange(
            `[Experimenting] (NOTE: If you see this ` +
              `more than once this might be a memory leak!)`,
            { node, parent, toggledSrc, untoggledSrc },
          )

          eyeContainer.addEventListener('click', onClick)
        })
      }
    },
  ])

  /** Buttons that have a "src" property */
  predicates.push([
    ({ src, type }) => !!(src && type === 'button'),
    (node: unknown, { onClick: onClickProp, src }) => {
      const btn = node as HTMLButtonElement
      if (src) {
        const img = document.createElement('img')
        img.src = src
        img.style['width'] = '35%'
        img.style['height'] = '35%'
        btn.style['overflow'] = 'hidden'
        btn.style['display'] = 'flex'
        btn.style['alignItems'] = 'center'
      }
      btn.style['cursor'] = _.isFunction(onClickProp) ? 'pointer' : 'auto'
    },
  ])

  return (node: NOODLElement, props: NOODLComponentProps) => {
    _.forEach(predicates, ([match, cb]) => {
      if (match(props)) {
        cb(node, props)
      }
    })

    onCreateNodeCb(node, props)
  }
}

export default onCreateNode
