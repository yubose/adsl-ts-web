/**
 * State machine dereferencer
 */
import y from 'yaml'
import * as u from '@jsmanifest/utils'
import { Identify } from 'noodl-types'
import type { ReferenceString } from 'noodl-types'
import { toPath, trimReference } from '@noodl/core'
import type { ARoot } from '@noodl/core'
import is from './is'
import unwrap from './unwrap'

function getValue(node: any, key: y.Scalar | string, keepScalar?: boolean) {
  key = unwrap(key) as string
  if (u.isMap(node)) return node.get(key)
  if (y.isDocument(node)) return node.get(key, keepScalar)
  if (y.isMap(node) || y.isSeq(node)) return node.get(key, keepScalar)
  if (y.isPair(node)) return node.value
  return u.get(node, key)
}

const stripRef = (ref: ReferenceString) => {
  const trimmed = trimReference(ref)
  return { paths: toPath(trimmed), path: trimmed }
}

export interface DerefOptions {
  currentKey?: string
  dataObject?: any
  node: y.Scalar<string> | string
  root?: ARoot
  rootKey?: y.Scalar | string
  subscribe?: {
    onUpdate?: (prevState: any, nextState: any) => void
  }
}

class RefNode {
  left: any
  right: any
  value: any

  constructor(key: any, left?: any, right?: any) {
    this.value = key || null
    this.left = left || null
    this.right = right || null
  }

  toJSON() {
    return {
      left: this.left?.toJSON?.() || null,
      value: this.value,
      right: this.right?.toJSON?.() || null,
    }
  }

  toString(spaces?: number) {
    return JSON.stringify(this.toJSON(), null, spaces)
  }
}

function createDerefStateMachine(
  root: ARoot,
  subscribers?: DerefOptions['subscribe'],
) {
  let _state = {
    currentKey: '',
    currentDataObject: null,
    currentIsLocal: false,
    nextKey: '',
    path: '',
    paths: [] as string[],
    reference: '',
    result: undefined,
    results: [] as any[],
  }

  function reducer(state, action) {
    switch (action.type) {
      case 'start': {
        const { paths } = stripRef(action.ref)
        const currentKey = paths.shift()
        const nextKey = paths[0]
        return {
          ...state,
          currentKey,
          currentDataObject: getValue(root.value, currentKey as string),
          currentIsLocal: Identify.localReference(action.ref),
          nextKey,
          reference: action.ref,
          paths,
          path: paths.join('.'),
        }
      }
      case 'next': {
        const paths = [...state.paths]
        const currentKey = paths[0]
        const nextKey = paths[1]
        const path = paths.join('.')
        const value = getValue(state.currentDataObject, currentKey)
        paths.shift()
        return {
          ...state,
          currentKey,
          currentDataObject: value,
          nextKey,
          paths,
          path,
          result: value,
          results: state.results.concat({ key: currentKey, value }),
        }
      }
      case 'end':
        return { ...state, result: action.result }
    }
  }

  function getState() {
    return _state
  }

  function dispatch(action) {
    const prevState = _state
    _state = reducer(_state, action)
    subscribers?.onUpdate?.(prevState, _state)
  }

  function start(ref: ReferenceString) {
    dispatch({ type: 'start', ref })
    return _state.currentDataObject
  }

  function next() {
    dispatch({ type: 'next' })
    return [_state.result, _state.currentDataObject]
  }

  function end(value: any) {
    dispatch({ type: 'end', result: value })
  }

  const o = {
    dispatch,
    getState,
    start,
    next,
    end,
  }

  return o
}

function deref({ node, root, rootKey, subscribe }: DerefOptions) {
  let derefMachine = createDerefStateMachine(root as ARoot, { ...subscribe })
  let ref = unwrap(node)
  let prevRootKey = rootKey
  let isLocal = Identify.localReference(ref)
  let refNode: RefNode | undefined
  let currValue: any

  derefMachine.start(ref)

  refNode = new RefNode(derefMachine.getState().currentKey)
  refNode.value = derefMachine.getState().result

  for (let currKey of [...derefMachine.getState().paths]) {
    derefMachine.next()[0]

    const newRefNode = new RefNode(currKey)

    newRefNode.value = derefMachine.getState().result
    refNode.left = newRefNode
    newRefNode.right = refNode
    currValue = newRefNode.value
    refNode = newRefNode
  }

  derefMachine.end(currValue)

  return {
    ...derefMachine.getState(),
    prevRootKey,
    rootKey,
    isLocal,
    refNode,
  }
}

export default deref
