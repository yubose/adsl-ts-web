import _ from 'lodash'
import Logger from 'logsnap'
import { eventTypes, NOODLActionTriggerType, SelectOption } from 'noodl-ui'
import { DataValueElement, NodePropsFunc } from 'noodl-ui-dom'
import { forEachEntries } from 'utils/common'
import { isDisplayable } from 'utils/dom'
import createElement from 'utils/createElement'
import noodluidom from 'app/noodl-ui-dom'

const log = Logger.create('dom.ts')

// TODO: Consider extending this to be better. We'll hard code this logic for now
noodluidom.on('all', function onCreateNode(node, component) {
  if (!node) return

  const js = component.toJS()

  const {
    children,
    id = '',
    options,
    placeholder = '',
    poster = '',
    src,
    style,
    type = '',
    videoFormat = '',
  } = js

  // TODO reminder: Remove this listdata in the noodl-ui client
  // const dataListData = component['data-listdata']

  if (id) node['id'] = id
  if (placeholder) node.setAttribute('placeholder', placeholder)
  if (type === 'video' && poster) node.setAttribute('poster', poster)
  if (src && type !== 'video') node.setAttribute('src', src)
  if (videoFormat) node.setAttribute('type', videoFormat)
  /** Dataset identifiers */
  if ('data-listid' in js) node.dataset['listid'] = js['data-listid']
  if ('data-name' in js) node.dataset['name'] = js['data-name']
  if ('data-key' in js) node.dataset['key'] = js['data-key']
  if ('data-ux' in js) node.dataset['ux'] = js['data-ux']
  if ('data-value' in js) node.dataset['value'] = js['data-value']

  /** Data values */
  if ('data-value' in js) {
    if (['input', 'select', 'textarea'].includes(type)) {
      let elem = node as DataValueElement
      elem['value'] = js['data-value'] || ''
      if (type === 'select') {
        elem = node as HTMLSelectElement
        if (elem.length) {
          // Put the default value to the first option in the list
          elem['selectedIndex'] = 0
        }
        if (!options) {
          log.func('noodluidom.on -- all')
          log.red(
            `Attempted to attach a data-value to a select element's value but ` +
              `"options" was not provided. This may not display its value as expected`,
            js,
          )
        }
      } else {
        elem.dataset['value'] = js['data-value'] || ''
        elem['value'] = elem.dataset['value'] || ''
      }
    } else if ('text=func' in js && js['data-value']) {
      node.innerHTML = js['data-value']
    } else {
      // For non data-value elements like labels or divs that just display content
      // If there's no data-value (which takes precedence here), use the placeholder
      // to display as a fallback
      let text = ''
      text = js['data-value'] || ''
      if (!text && children) text = `${children}` || ''
      if (!text && placeholder) text = placeholder
      if (!text) text = ''
      if (text) node.innerHTML = `${text}`
      node.innerHTML = js['data-value'] || js.placeholder || ''
    }
  }

  /** Event handlers */
  forEachEntries(js, (key, value) => {
    let eventName: string

    if (eventTypes.includes(key as NOODLActionTriggerType)) {
      const isEqual = (k: NOODLActionTriggerType) => k === key
      eventName = _.find(eventTypes, isEqual)?.toLocaleLowerCase() || ''
      eventName = eventName.startsWith('on')
        ? eventName.replace('on', '')
        : eventName

      if (eventName) {
        // TODO: Test this
        const eventFn = (...args: any[]) => {
          log.func('on all --> eventFn')
          log.grey(`User action invoked handler`, {
            props,
            eventName,
            [key]: value,
          })
          console.groupCollapsed('', { eventName, node, props })
          console.trace()
          console.groupEnd()
          return value(...args)
        }
        // Attach the event handler
        node.addEventListener(eventName, eventFn)
      }
    }
  })
  // Attach an additional listener for data-value elements that are expected
  // to change values on the fly by some "on change" logic (ex: input/select elements)
  if ('data-value' in js) {
    import('utils/sdkHelpers')
      .then(({ createOnDataValueChangeFn }) => {
        const onChange = createOnDataValueChangeFn(js['data-key'])
        node.addEventListener('change', onChange)
      })
      .catch((err) => log.func('noodluidom.on: all').red(err.message))
  }

  /** Styles */
  if (_.isPlainObject(style)) {
    forEachEntries(style, (k, v) => (node.style[k as any] = v))
  } else {
    log.func('noodluidom.on: all')
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
        _.forEach(options, (option: SelectOption, index) => {
          if (option) {
            const optionElem = document.createElement('option')
            optionElem['id'] = option.key
            optionElem['value'] = option?.value
            optionElem['innerText'] = option.label
            node.appendChild(optionElem)
            if (option?.value === props['data-value']) {
              // Default to the selected index if the user already has a state set before
              console.log({ node, props })
              ;(node as HTMLSelectElement)['selectedIndex'] = index
            }
          } else {
            // TODO: log
          }
        })
        // Default to the first item if the user did not previously set their state
        if ((node as HTMLSelectElement).selectedIndex == -1) {
          ;(node as HTMLSelectElement)['selectedIndex'] = 0
        }
      } else {
        // TODO: log
      }
    }
  }
  if (type === 'video') {
    const sourceEl = createElement('source')
    if (src) sourceEl.setAttribute('src', src)
    node.appendChild(sourceEl)
  }
  if (!node.innerHTML.trim()) {
    if (isDisplayable(props['data-value'])) {
      node.innerHTML = `${props['data-value']}`
    } else if (isDisplayable(children)) {
      node.innerHTML = `${children}`
    } else if (isDisplayable(props.text)) {
      node.innerHTML = `${props.text}`
    }
  }
})

noodluidom.on('create.button', function onCreateButton(node, component) {
  if (node) {
    const js = component.toJS()
    const { onClick: onClickProp, src } = js
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
  }
})

noodluidom.on('create.image', function onCreateImage(node, component) {
  if (node) {
    const { children, onClick } = component.toJS()

    if (_.isFunction(onClick)) {
      node.style['cursor'] = 'pointer'
    }

    // If an image has children, we will assume it is some icon button overlapping
    //    Ex: profile photos and showing pencil icon on top to change it
    if (children) {
      log.func('create.image: Image')
      log.orange(
        `An image component has children. This is a weird practice. Consider ` +
          `discussion about this`,
        component.toJS(),
      )
      node.style['width'] = '100%'
      node.style['height'] = '100%'
    }
  }
})

noodluidom.on('create.label', function onCreateLabel(node, component) {
  if (node) {
    const { onClick } = component.toJS()
    node.style['cursor'] = _.isFunction(onClick) ? 'pointer' : 'auto'
  }
})

/** NOTE: node is null in this handler */
noodluidom.on('create.plugin', async function (noop, component) {
  log.func('create.plugin')
  const js = component.toJS()
  const { src = '' } = js
  if (_.isString(src)) {
    if (src.startsWith('http')) {
      const { default: axios } = await import('app/axios')
      const { data } = await axios.get(src)
      /**
       * TODO - Check the ext of the filename
       * TODO - If its js, run eval on it
       */
      try {
        eval(data)
      } catch (error) {
        console.error(error)
      }
    } else {
      log.red(
        `Received a src from a "plugin" component that did not start with an http(s) protocol`,
        { component: js, src },
      )
    }
  }
})

noodluidom.on('create.textfield', function onCreateTextField(node, component) {
  if (node) {
    const { contentType } = component.toJS()

    // Password inputs
    if (contentType === 'password') {
      if (!node?.dataset.mods?.includes('[password.eye.toggle]')) {
        return import('app/noodl-ui').then(({ default: noodlui }) => {
          const assetsUrl = noodlui.getContext()?.assetsUrl || ''
          const eyeOpened = assetsUrl + 'makePasswordVisiable.png'
          const eyeClosed = assetsUrl + 'makePasswordInvisible.png'
          const originalParent = node?.parentNode as HTMLDivElement
          const newParent = document.createElement('div')
          const eyeContainer = document.createElement('button')
          const eyeIcon = document.createElement('img')

          // const restDividedStyleKeys = _.omit(component.style, dividedStyleKeys)

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

          if (originalParent.contains(node)) originalParent.removeChild(node)
          eyeContainer.appendChild(eyeIcon)
          newParent.appendChild(node)
          newParent.appendChild(eyeContainer)
          originalParent.appendChild(newParent)

          let selected = false

          function onClick(e: Event) {
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
          eyeIcon.dataset.mods = ''
          eyeIcon.dataset.mods += '[password.eye.toggle]'
          eyeContainer.addEventListener('click', onClick)
        })
      }
    }
  }
})

export function setAttrBy(attr: string, cb: NodePropsFunc): NodePropsFunc {
  return (n, p) => (n[attr] = cb(n, p))
}

export function setAttrByProp(attr: string, prop: string): NodePropsFunc {
  return (n, p) => prop && p && prop in p && (n[attr] = p[prop])
}

export function setDatasetAttrBy(
  attr: string,
  cb: NodePropsFunc,
): NodePropsFunc {
  return (n, p) =>
    p && attr in p && (n.dataset[attr.replace('data-', '')] = cb(n, p))
}

export function setDatasetAttrByProp(prop: string): NodePropsFunc {
  return setDatasetAttrBy(
    prop,
    (n, p) => (n.dataset[prop.replace('data-', '')] = p[prop]),
  )
}

export const setDataListId = setDatasetAttrByProp('data-listid')
export const setDataName = setDatasetAttrByProp('data-name')
export const setDataKey = setDatasetAttrByProp('data-key')
export const setDataUx = setDatasetAttrByProp('data-ux')
export const setDataValue = setDatasetAttrByProp('data-value')
export const setId = setAttrByProp('id', 'id')
export const setSrc = setAttrByProp('src', 'src')
export const setPlaceholder = setAttrByProp('placeholder', 'placeholder')
export const setVideoFormat = setAttrByProp('type', 'videoFormat')

export function compose(...fns: NodePropsFunc[]): NodePropsFunc {
  return (n, p) => {
    fns.forEach((fn) => fn && fn(n, p))
  }
}

export const cbs = compose(
  setId,
  setSrc,
  setPlaceholder,
  setVideoFormat,
  setDataListId,
  setDataName,
  setDataKey,
  setDataUx,
  setDataValue,
)
