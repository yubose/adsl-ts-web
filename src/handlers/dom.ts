import _ from 'lodash'
import Logger from 'logsnap'
import { eventTypes, NOODLActionTriggerType, SelectOption } from 'noodl-ui'
import { DataValueElement } from 'noodl-ui-dom'
import { forEachEntries } from 'utils/common'
import createElement from 'utils/createElement'
import noodluidom from 'app/noodl-ui-dom'

const log = Logger.create('dom.ts')

// TODO: Consider extending this to be better. We'll hard code this logic for now
noodluidom.on('all', function onCreateNode(node, props) {
  if (!node) return

  const {
    id,
    options,
    placeholder,
    poster,
    src,
    style,
    type,
    videoFormat,
  } = props

  // TODO reminder: Remove this listdata in the noodl-ui client
  // const dataListData = props['data-listdata']

  if (id) node['id'] = props.id
  if (src) node.setAttribute('src', src)
  if (type === 'video') node.setAttribute('poster', poster || '')
  if (videoFormat) node.setAttribute('type', videoFormat)
  if (placeholder) node.setAttribute('placeholder', placeholder)

  /** Dataset identifiers */
  if ('data-listid' in props) node.dataset['listid'] = props['data-listid']
  if ('data-name' in props) node.dataset['name'] = props['data-name']
  if ('data-key' in props) node.dataset['key'] = props['data-key']
  if ('data-ux' in props) node.dataset['ux'] = props['data-ux']
  if ('data-value' in props) node.dataset['value'] = props['data-value']

  /** Data values */
  if ('data-value' in props) {
    if (['input', 'select', 'textarea'].includes(type)) {
      let elem = node as DataValueElement
      elem['value'] = props['data-value'] || ''
      if (type === 'select') {
        elem = node as HTMLSelectElement
        if (elem.length) {
          // Put the default value to the first option in the list
          elem['selectedIndex'] = 0
        }
        if (!options) {
          log.func('onCreateNode: all')
          log.red(
            `Attempted to attach a data-value to a select element's value but ` +
              `"options" was not provided. This may not display its value as expected`,
            props,
          )
        }
      } else {
        elem.dataset['value'] = props['data-value'] || ''
        elem['value'] = elem.dataset['value'] || ''
      }
    } else {
      node.innerHTML =
        props['data-value'] || props.text || props.placeholder || ''
    }
  }

  /** Event handlers */
  forEachEntries(props, (key, value) => {
    if (eventTypes.includes(key as NOODLActionTriggerType)) {
      const isEqual = (k: NOODLActionTriggerType) => k === key
      const eventName = _.find(eventTypes, isEqual)
      const lowercasedEventName = eventName?.toLowerCase?.() || ''
      const directEventName = lowercasedEventName.startsWith('on')
        ? lowercasedEventName.replace('on', '')
        : lowercasedEventName
      if (directEventName) {
        // TODO: Test this
        const eventFn = async (...args: any[]) => {
          await value(...args)
          node.removeEventListener(directEventName, eventFn)
          node.addEventListener(directEventName, eventFn)
        }
        // Attach the event handler
        node.addEventListener(directEventName, eventFn)
      }
    }
    if (key === 'data-value') {
      /**
       * EXPERIMENTAL AND WILL BE MOVED TO A BETTER LOCATION IF IT IS
       * AN ACCEPTED SOLUTION
       */
      const onChange = noodluidom.createOnChangeFactory?.(props['data-key'])()
      if (!_.isFunction(onChange)) {
        log.func('onCreateNode -- all').red('onChange is not a function')
      }
      node.addEventListener('change', onChange)
    }
  })

  /** Styles */
  if (_.isPlainObject(style)) {
    forEachEntries(style, (k, v) => (node.style[k as any] = v))
  } else {
    log.func('onCreateNode: all')
    log.red(
      `Expected a style object but received ${typeof style} instead`,
      style,
    )
  }
  // Remove the default padding since the NOODL was designed without
  // expecting a padding default (which defaults to padding-left:"40px")
  if (type === 'ul') node.style['padding'] = '0px'

  /** Children */
  if (options) {
    if (type === 'select') {
      if (_.isArray(options)) {
        _.forEach(options, (option: SelectOption) => {
          if (option) {
            const optionElem = document.createElement('option')
            optionElem['id'] = option.key
            optionElem['value'] = option?.value
            optionElem['innerText'] = option.label
            node.appendChild(optionElem)
          } else {
            // TODO: log
          }
        })
      } else {
        // TODO: log
      }
    }
  }
  if (type === 'video') {
    const sourceEl = createElement('source')
    sourceEl['src'] = src || ''
  }
})

noodluidom.on('create.button', function onCreateButton(node, props) {
  const { onClick: onClickProp, src } = props
  /**
   * Buttons that have a "src" property
   * ? NOTE: Seems like these components are deprecated. Leave this here for now
   */
  if (src) {
    const img = document.createElement('img')
    img.src = src
    img.style['width'] = '35%'
    img.style['height'] = '35%'
    node.style['overflow'] = 'hidden'
    node.style['display'] = 'flex'
    node.style['alignItems'] = 'center'
  }
  node.style['cursor'] = _.isFunction(onClickProp) ? 'pointer' : 'auto'
})

noodluidom.on('create.image', function onCreateImage(node, props) {
  const { children, onClick } = props

  if (_.isFunction(onClick)) {
    node.style['cursor'] = 'pointer'
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
    node.style['width'] = '100%'
    node.style['height'] = '100%'
  }
})

noodluidom.on('create.label', function onCreateLabel(node, props) {
  const { onClick } = props
  node.style['cursor'] = _.isFunction(onClick) ? 'pointer' : 'auto'
})

/** NOTE: node is null in this handler */
noodluidom.on('create.plugin', async function (node, props) {
  log.func('create.plugin')
  const { src = '' } = props
  if (_.isString(src)) {
    if (src.startsWith('http')) {
      const { default: axios } = await import('axios')
      const { data } = await axios.get(src)
      /**
       * Fetch the data
       * Check if its an HTML element string
       * Create a script element, set innerHTML
       * node.appendChild(scriptElem)
       */
      console.info(data)
      // node.innerHTML = `${data}`
      // For now we will just directly insert the HTML string to the document
      document.body.innerHTML += `${data}`
    } else {
      log.red(
        `Received a src from a "plugin" component that did not start with an http(s) protocol`,
        { props, src },
      )
    }
  }
})

noodluidom.on('create.textfield', function onCreateTextField(node, props) {
  const { contentType } = props

  // Password inputs
  if (contentType === 'password') {
    if (!node?.dataset.mods?.includes('[password.eye.toggle]')) {
      import('app/noodl-ui').then(({ default: noodlui }) => {
        const assetsUrl = noodlui.getContext().assetsUrl
        const toggledSrc = assetsUrl + 'makePasswordInvisible.png'
        const untoggledSrc = assetsUrl + 'makePasswordVisiable.png'
        const originalParent = node?.parentNode as HTMLDivElement
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

        // Transfer styles to the new parent to position our custom elements
        _.forEach(dividedStyleKeys, (styleKey) => {
          newParent.style[styleKey] = props.style?.[styleKey]
          // Remove the transfered styles from the original input element
          node.style[styleKey] = ''
        })

        newParent.style['display'] = 'flex'
        newParent.style['alignItems'] = 'center'
        newParent.style['backgroundColor'] = '#fff'

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

        eyeIcon.setAttribute('src', toggledSrc)

        // Restructing the node structure to match our custom effects with the
        // toggling of the eye icons

        if (originalParent.contains(node)) originalParent.removeChild(node)
        eyeContainer.appendChild(eyeIcon)
        newParent.appendChild(node)
        newParent.appendChild(eyeContainer)
        originalParent.appendChild(newParent)

        let selected = false

        function onClick(e: Event) {
          if (selected) {
            eyeIcon.setAttribute('src', untoggledSrc)
            node.setAttribute('type', 'text')
          } else {
            eyeIcon.setAttribute('src', toggledSrc)
            node.setAttribute('type', 'password')
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
            `more than once in the same page this might be a memory leak!)`,
          { node, parent, toggledSrc, untoggledSrc },
        )

        eyeContainer.addEventListener('click', onClick)
      })
    }
  }
})

/**
 * Apply the original raw data key value if it is showing. This is meant to be
 * used in conjunction with isShowingDataKey and when the env is 'stable'
 * Else make it invisible in the UI
 * @param { object } props
 */
// export function getFallbackDataValue(props: any) {
//   if (!props.noodl) {
//     return ''
//   }
//   const { noodl } = props
//   let value
//   if (typeof props?.text === 'string') {
//     value = noodl.text
//   } else if (typeof noodl?.placeholder === 'string') {
//     value = noodl.placeholder
//   }

//   return value || !isReference(value as string) ? value : '' || ''
// }

/**
 * Returns true if the component is presumed to be displaying raw referenced data keys
 * ex: .Global.vertex.currentUser
 * @param { object } props
 */
// export function isShowingDataKey(props: any) {
//   if (props['data-key']) {
//     return (
//       props['data-key'] === props['data-value'] ||
//       props['data-key'] === props.children ||
//       isReference(props['data-value'] as string) ||
//       isReference(props.children as string)
//     )
//   }
//   return false
// }
