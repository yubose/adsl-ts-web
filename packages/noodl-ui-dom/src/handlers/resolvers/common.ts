import { eventTypes } from 'noodl-ui'
import { NOODLDOMDataValueElement } from '../../types'
import {
  getDataAttribKeys,
  isTextFieldLike,
  normalizeEventName,
} from '../../utils'
import resolveSelectElement from './select'
import resolve from '../../resolve'

resolve
  .register({
    name: 'dataset',
    cond: (node, component) => !!(node && component),
    resolve: (node, component) => {
      Object.entries(
        component.get(getDataAttribKeys() as any) as { [key: string]: any },
      ).forEach(
        ([k, v]) =>
          v != undefined && node && (node.dataset[k.replace('data-', '')] = v),
      )
    },
  })
  .register({
    name: 'data values in non-textfield-like components',
    cond: (node) => !!node && !isTextFieldLike(node),
    resolve: (node, component) => {
      let { children, placeholder, text } = component.get([
        'children',
        'placeholder',
        'text',
      ])
      text = component.get('data-value') || text || ''
      if (!text && children) text = `${children}` || ''
      if (!text && placeholder) text = placeholder
      if (!text) text = ''
      if (text && node) node.innerHTML = `${text}`
    },
    // if (node && !node.innerHTML.trim()) {
    //   if (isDisplayable(component.get('data-value'))) {
    //     node.innerHTML = `${component.get('data-value')}`
    //   } else if (isDisplayable(component.get('children'))) {
    //     node.innerHTML = `${component.get('children')}`
    //   } else if (isDisplayable(component.get('text'))) {
    //     node.innerHTML = `${component.get('text')}`
    //   }
    //   if (text && node) node.innerHTML = text
    // }
  })
  .register({
    name: 'events',
    cond: Boolean,
    resolve: (node: NOODLDOMDataValueElement, component) => {
      eventTypes.forEach((eventType: string) => {
        if (typeof component.get(eventType) === 'function') {
          node.addEventListener(normalizeEventName(eventType), (e) =>
            component.get(eventType)(e),
          )
        }
      })
    },
  })
  .register({
    name: 'id',
    resolve: (node, component) => node && (node.id = component.id || ''),
  })
  .register({
    name: 'input enter key',
    cond: (node) => !!(node?.tagName === 'INPUT'),
    resolve: (node: HTMLInputElement) => {
      node.onkeypress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const inputs = document.querySelectorAll('input')
          const currentIndex = [...inputs].findIndex((el) =>
            node.isEqualNode(el),
          )
          const targetIndex = (currentIndex + 1) % inputs.length
          if (currentIndex + 1 < inputs.length) inputs[targetIndex]?.focus?.()
        }
      }
    },
  })
  .register({
    name: 'path (non videos)',
    cond: (n, c, { original }) =>
      typeof original?.path === 'string' && n?.tagName !== 'VIDEO',
    resolve: (node: HTMLImageElement, component) => {
      node.src = component.get('src') || ''
    },
  })
  .register({
    name: 'placeholder',
    cond: (node, component) =>
      !!(node && 'placeholder' in node && !component.get('placeholder')),
    resolve: (node: HTMLInputElement, component) =>
      node && (node.placeholder = component.get('placeholder') || ''),
  })
  .register({
    name: 'select',
    cond: (node) => node?.tagName === 'SELECT',
    resolve: resolveSelectElement,
  })
  .register({
    name: 'styles',
    resolve: (node, component) => {
      if (node && node.tagName !== 'SCRIPT') {
        const { style } = component
        if (style != null && typeof style === 'object') {
          Object.entries(style).forEach((k: any, v: any) => (style[k] = v))
        }
      }
    },
  })
  .register({
    name: 'text=func',
    cond: (n, c) => typeof c.get('text=func') === 'function',
    resolve: (node, c) => node && (node.innerHTML = c.get('data-value') || ''),
  })

/*
          import('../utils/sdkHelpers').then(
            ({ createOnDataValueChangeFn }) => {
              node.addEventListener(
                eventName,
                createOnDataValueChangeFn(node, component, {
                  onChange: handler,
                  eventName,
                }),
              )
           
            },
          )
*/
