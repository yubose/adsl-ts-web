import _ from 'lodash'
import Logger from 'logsnap'
import { eventTypes, NOODLActionTriggerType, SelectOption } from 'noodl-ui'
import { DataValueElement, NodePropsFunc } from 'noodl-ui-dom'
import { forEachEntries } from 'utils/common'
import { isDisplayable } from 'utils/dom'
import createElement from 'utils/createElement'
import noodluidom from 'app/noodl-ui-dom'
import noodlui from 'app/noodl-ui'

const log = Logger.create('dom.ts')

// TODO: Consider extending this to be better. We'll hard code this logic for now
noodluidom.on('all', function onCreateNode(node, props) {
  if (!node) return

  const {
    children,
    id = '',
    options,
    placeholder = '',
    poster = '',
    src,
    style,
    type,
    videoFormat,
  } = props

  // TODO reminder: Remove this listdata in the noodl-ui client
  // const dataListData = props['data-listdata']
  if (id) node['id'] = id
  if (placeholder) node.setAttribute('placeholder', placeholder)
  if (type === 'video' && poster) node.setAttribute('poster', poster)
  if (src && type !== 'video') node.setAttribute('src', src)
  if (videoFormat) node.setAttribute('type', videoFormat)

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
          log.func('noodluidom.on -- all')
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
    } else if ('text=func' in props && props['data-value']) {
      node.innerHTML = props['data-value']
    } else {
      let text = ''
      text = props['data-value'] || ''
      if (!text && children) text = `${children}` || ''
      if (!text && placeholder) text = placeholder
      if (!text) text = ''
      if (text) node.innerHTML = `${text}`
    }
  }

  /** Event handlers */
  forEachEntries(props, (key, value) => {
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
  if ('data-value' in props) {
    import('utils/sdkHelpers')
      .then(({ createOnDataValueChangeFn }) => {
        const onChange = createOnDataValueChangeFn(props['data-key'])
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

noodluidom.on('create.button', function onCreateButton(node, props) {
  if (node) {
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
  }
})

noodluidom.on('create.image', function onCreateImage(node, props) {
  if (node) {
    const { children, onClick } = props

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
        props,
      )
      node.style['width'] = '100%'
      node.style['height'] = '100%'
    }

    if (node.src === noodlui?.page?.object?.docDetail?.document?.name?.data && noodlui?.page?.object?.docDetail?.document?.name?.type == 'application/pdf') {
      node.style.visibility = 'hidden'
      const parent = document.getElementById(props.parentId)
      var new_obj = document.createElement('iframe');

      // async function getUrl(url) {
      //   const file = await fetch(url).then(r => r.blob()).then(blobFile => new Blob([blobFile], { type: "application/pdf" }))
      //   // window.open(file)
      //   const url = URL.createObjectURL(file)
      //   return url
      // }
      // console.log('#################################################', node.src)
      // const pdf_url = getUrl(node.src)
      // const testing_url = "http://www.pdf995.com/samples/pdf.pdf"

      new_obj.setAttribute("src", node.src)
      if (_.isPlainObject(props.style)) {
        forEachEntries(props.style, (k, v) => (new_obj.style[k as any] = v))
      } else {
        log.func('noodluidom.on: all')
        log.red(
          `Expected a style object but received ${typeof style} instead`,
          props.style,
        )
      }
      parent?.appendChild(new_obj)
    }
  }
})

noodluidom.on('create.label', function onCreateLabel(node, props) {
  if (node) {
    const { onClick } = props
    node.style['cursor'] = _.isFunction(onClick) ? 'pointer' : 'auto'
  }
})

/** NOTE: node is null in this handler */
noodluidom.on('create.plugin', async function (noop, props) {
  log.func('create.plugin')
  const { src = '' } = props
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
        { props, src },
      )
    }
  }
})

noodluidom.on('create.textfield', function onCreateTextField(node, props) {
  if (node) {
    const { contentType } = props

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
