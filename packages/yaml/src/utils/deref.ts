/**
 * State machine dereferencer
 */
import y from 'yaml'
import * as u from '@jsmanifest/utils'
import { getRefProps } from '@noodl/core'
import type { ReferenceString } from 'noodl-types'
import type { ARoot } from '@noodl/core'
import get from './get'
import unwrap from './unwrap'

export interface DerefOptions {
  node: y.Scalar<string> | string
  root?: ARoot
  rootKey?: y.Scalar | string
  subscribe?: {
    onUpdate?: (prevState: any, nextState: any) => void
  }
}

function createDerefReducer(
  root: ARoot | undefined,
  { rootKey, ...subscribers } = {} as {
    rootKey?: string
  } & DerefOptions['subscribe'],
) {
  let _result: any
  let _state = {
    paths: [] as string[],
    results: [] as any[],
  }

  function reducer(
    state: typeof _state,
    action: Parameters<typeof dispatch>[0],
  ) {
    switch (action.type) {
      case 'start': {
        const { isLocalRef, paths } = getRefProps(action.reference)
        if (isLocalRef && rootKey) paths.unshift(rootKey)
        _result = get(root?.value, paths[0] as string, { rootKey })
        return { ...state, paths: paths.slice(1) }
      }
      case 'next': {
        _result = get(_result, state.paths[0], { rootKey })
        return {
          ...state,
          paths: state.paths.slice(1),
          results: state.results.concat({
            key: state.paths[0],
            value: _result,
          }),
        }
      }
    }
  }

  function dispatch(
    action: { type: 'start'; reference: ReferenceString } | { type: 'next' },
  ) {
    const prevState = _state
    _state = reducer(_state, action) as typeof _state
    subscribers?.onUpdate?.(prevState, _state)
  }

  return {
    getState: () => ({ ..._state, value: _result }),
    dispatch,
  }
}

function getRootKey(ref: ReferenceString, rootKey = '' as string | y.Scalar) {
  const { isLocalRef, paths } = getRefProps(ref)
  return (isLocalRef ? rootKey : paths[0]) as string
}

function deref({ node, root, rootKey: rootKeyProp, subscribe }: DerefOptions) {
  const reference = unwrap(node) as ReferenceString
  const rootKey = getRootKey(reference, rootKeyProp)
  const derefer = createDerefReducer(root, { rootKey, ...subscribe })

  derefer.dispatch({ type: 'start', reference })
  derefer.getState().paths.forEach(() => derefer.dispatch({ type: 'next' }))

  return {
    reference,
    ...u.omit(derefer.getState(), ['paths']),
  }
}

export default deref

// export class RefNode {
//   left: any
//   right: any
//   value: any

//   constructor(key: any, left?: any, right?: any) {
//     this.value = key || null
//     this.left = left || null
//     this.right = right || null
//   }

//   toJSON() {
//     return {
//       left: this.left?.toJSON?.() || null,
//       value: this.value,
//       right: this.right?.toJSON?.() || null,
//     }
//   }

//   toString(spaces?: number) {
//     return JSON.stringify(this.toJSON(), null, spaces)
//   }
// }
// let refNode: RefNode | undefined
// refNode = new RefNode(derefMachine.getState().currentKey)
// refNode.value = derefMachine.getState().result
// for (let currKey of [...derefMachine.getState().paths]) {
// const newRefNode = new RefNode(currKey)
// newRefNode.value = derefMachine.getState().result
// refNode.left = newRefNode
// newRefNode.right = refNode
// refNode = newRefNode
// }
