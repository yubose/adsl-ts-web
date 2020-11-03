import _ from 'lodash'
import Logger from 'logsnap'
import { eventTypes, SelectOption } from 'noodl-ui'
import { DataValueElement } from 'noodl-ui-dom'
import { isBooleanTrue } from 'noodl-utils'
import { forEachEntries } from 'utils/common'
import { isDisplayable } from 'utils/dom'
import createElement from 'utils/createElement'
import noodlui from 'app/noodl-ui'

const log = Logger.create('dom.ts')

// TODO: Consider extending this to be better. We'll hard code this logic for now
noodlui.on('all', (node, component) => {
  if (!node) return

  const {
    children,
    id = '',
    options,
    placeholder = '',
    src,
    style,
    text = '',
    type = '',
    videoFormat = '',
  } = component.get([
    'children',
    'id',
    'options',
    'placeholder',
    'src',
    'style',
    'text',
    'type',
    'videoFormat',
  ])

  // TODO reminder: Remove this listdata in the noodl-ui client
  // const dataListData = component['data-listdata']

  if (id) node['id'] = id
  if (placeholder) node.setAttribute('placeholder', placeholder)
  if (src && type !== 'video') node.setAttribute('src', src)

  const datasetAttribs = component.get([
    'data-listid',
    'data-name',
    'data-key',
    'data-ux',
    'data-value',
  ])

  /** Dataset identifiers */
  if ('data-listid' in datasetAttribs)
    node.dataset['listid'] = datasetAttribs['data-listid']
  if ('data-name' in datasetAttribs)
    node.dataset['name'] = datasetAttribs['data-name']
  if ('data-key' in datasetAttribs)
    node.dataset['key'] = datasetAttribs['data-key']
  if ('data-ux' in datasetAttribs)
    node.dataset['ux'] = datasetAttribs['data-ux']
  if ('data-value' in datasetAttribs)
    node.dataset['value'] = datasetAttribs['data-value']

  /** Data values */
  if ('data-value' in datasetAttribs) {
    if (['input', 'select', 'textarea'].includes(type)) {
      let elem = node as DataValueElement
      elem['value'] = datasetAttribs['data-value'] || ''
      if (type === 'select') {
        elem = node as HTMLSelectElement
        if (elem.length) {
          // Put the default value to the first option in the list
          elem['selectedIndex'] = 0
        }
      } else {
        elem.dataset['value'] = datasetAttribs['data-value'] || ''
        elem['value'] = elem.dataset['value'] || ''
      }
    } else if (component.get('text=func') && datasetAttribs['data-value']) {
      node.innerHTML = datasetAttribs['data-value']
    } else {
      // For non data-value elements like labels or divs that just display content
      // If there's no data-value (which takes precedence here), use the placeholder
      // to display as a fallback
      let text = ''
      text = datasetAttribs['data-value'] || ''
      if (!text && children) text = `${children}` || ''
      if (!text && placeholder) text = placeholder
      if (!text) text = ''
      if (text) node.innerHTML = `${text}`
      node.innerHTML =
        datasetAttribs['data-value'] || component.get('placeholder') || ''
    }
  }

  /** Event handlers */
  _.forEach(eventTypes, (eventType) => {
    const handler = component.get(eventType)
    if (handler) {
      const event = (eventType.startsWith('on')
        ? eventType.replace('on', '')
        : eventType
      ).toLocaleLowerCase()

      // TODO: Test this
      // Attach the event handler
      node.addEventListener(event, (...args: any[]) => {
        const props = component.toJS()
        log.func(`on all --> addEventListener: ${event}`)
        log.grey(`User action invoked handler`, { props, [event]: handler })
        console.groupCollapsed('', { event, node, props })
        console.trace()
        console.groupEnd()
        return handler(...args)
      })
    }
  })

  // Attach an additional listener for data-value elements that are expected
  // to change values on the fly by some "on change" logic (ex: input/select elements)
  if ('data-value' in datasetAttribs) {
    import('utils/sdkHelpers')
      .then(({ createOnDataValueChangeFn }) => {
        const onChange = createOnDataValueChangeFn(datasetAttribs['data-key'])
        node.addEventListener('change', onChange)
      })
      .catch((err) => (log.func('noodlui.on: all'), log.red(err.message)))
  }

  /** Styles */
  if (_.isPlainObject(style)) {
    forEachEntries(style, (k, v) => (node.style[k as any] = v))
  } else {
    log.func('noodlui.on: all')
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
            if (option?.value === datasetAttribs['data-value']) {
              // Default to the selected index if the user already has a state set before
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

  if (!node.innerHTML.trim()) {
    if (isDisplayable(datasetAttribs['data-value'])) {
      node.innerHTML = `${datasetAttribs['data-value']}`
    } else if (isDisplayable(children)) {
      node.innerHTML = `${children}`
    } else if (isDisplayable(text)) {
      node.innerHTML = `${text}`
    }
  }
})

noodlui.on('create.button', (node, component) => {
  if (node) {
    const { onClick: onClickProp, src } = component.get(['onClick', 'src'])
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

noodlui.on('create.image', function onCreateImage(node, component) {
  if (node) {
    const { onClick } = component.get(['children', 'onClick'])

    if (_.isFunction(onClick)) {
      node.style['cursor'] = 'pointer'
    }

    // If an image has children, we will assume it is some icon button overlapping
    //    Ex: profile photos and showing pencil icon on top to change it
    if (component.original?.children) {
      log.func('create.image: Image')
      log.orange(
        `An image component has children. This is a weird practice. Consider ` +
          `discussion about this`,
        component.toJS(),
      )
      node.style['width'] = '100%'
      node.style['height'] = '100%'
    }

    import('app/noodl-ui').then(({ default: noodlui }) => {
      const context = noodlui.getContext()
      const pageObject = context?.page?.object || {}
      if (
        // @ts-expect-error
        node?.src === pageObject?.docDetail?.document?.name?.data &&
        pageObject?.docDetail?.document?.name?.type == 'application/pdf'
      ) {
        node.style.visibility = 'hidden'
        const parent = document.getElementById(component.parent()?.id || '')
        const iframeEl = document.createElement('iframe')
        // @ts-expect-error
        iframeEl.setAttribute('src', node.src)

        if (_.isPlainObject(component.style)) {
          forEachEntries(
            component.style,
            (k, v) => (iframeEl.style[k as any] = v),
          )
        } else {
          log.func('noodlui.on: all')
          log.red(
            `Expected a style object but received "${typeof component.style}" instead`,
            component.style,
          )
        }
        parent?.appendChild(iframeEl)
      }
    })
  }
})

noodlui.on('create.label', (node, component) => {
  if (node) {
    if (_.isFunction(component.get('onClick'))) {
      node.style['cursor'] = 'pointer'
    }
  }
})

noodlui.on('create.list', (node, component) => {
  log.func('create.list')
  log.hotpink(`LIST CREATED`, { node, component })
})

// /** NOTE: node is null in this handler */
noodlui.on('create.plugin', async function (noop, component) {
  log.func('create.plugin')
  const { src = '' } = component.get('src')
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
        { component: component.toJS(), src },
      )
    }
  }
})

noodlui.on('create.textfield', (node, component) => {
  if (node) {
    const contentType = component.get('contentType')

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

noodlui.on('create.video', (node, component) => {
  const { controls, poster, src, videoType } = component.get([
    'controls',
    'poster',
    'src',
    'videoType',
  ])
  if (node) {
    const videoEl = node as HTMLVideoElement
    let sourceEl: HTMLSourceElement
    let notSupportedEl: HTMLParagraphElement
    videoEl['controls'] = isBooleanTrue(controls) ? true : false
    if (poster) videoEl.setAttribute('poster', poster)
    if (src) {
      sourceEl = createElement('source')
      notSupportedEl = createElement('p')
      if (videoType) sourceEl.setAttribute('type', videoType)
      sourceEl.setAttribute('src', src)
      notSupportedEl.style['textAlign'] = 'center'
      // This text will not appear unless the browser isn't able to play the video
      notSupportedEl.innerHTML =
        "Sorry, your browser doesn's support embedded videos."
      videoEl.appendChild(sourceEl)
      videoEl.appendChild(notSupportedEl)
    }
  }
})
