import { Component } from 'noodl-ui'
import { NOODLDOMElement, NOODLDOMEvent } from './types'
import NOODLUIDOM from './noodl-ui-dom'

export interface NOODLDOMResolver<N extends NOODLDOMElement = any, C = any> {
  (node: N, component: C): void
  (node: null, component: C): void
  (node: N | null, component: C): void
}

function createResolver<N extends NOODLDOMElement, C extends Component = any>(
  eventName: NOODLDOMEvent,
  resolver: NOODLDOMResolver<N, C>,
): NOODLDOMResolver<N, C> {
  return function (node: N | null, component: C) {
    return function (noodluidom: NOODLUIDOM) {
      const fn: NOODLDOMResolver<N, C> = (n, c) => {
        resolver?.(n, c)
      }
    }
  }
}

export default createResolver
