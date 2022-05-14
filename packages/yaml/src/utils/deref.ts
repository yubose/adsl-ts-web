/**
 * State machine dereferencer
 */
import y from 'yaml'
import * as u from '@jsmanifest/utils'
import { getRefProps, toPath, trimReference } from '@noodl/core'
import type { ReferenceString } from 'noodl-types'
import type { ARoot } from '@noodl/core'
import get from './get'
import is from './is'
import unwrap from './unwrap'

export interface DerefOptions {
  node: y.Scalar<string> | string
  root?: ARoot
  rootKey?: y.Scalar | string
  subscribe?: {
    onUpdate?: (prevState: any, nextState: any) => void
  }
}

function createDerefStateMachine(
  root: ARoot,
  subscribers?: DerefOptions['subscribe'],
) {
  let _state = {
    paths: [] as string[],
    results: [] as any[],
    value: null,
  }

  function reducer(state, action) {
    switch (action.type) {
      case 'start': {
        const paths = getRefProps(action.reference).paths
        return {
          ...state,
          result: get(root.value, paths[0] as string),
          paths: paths.slice(1),
        }
      }
      case 'next': {
        const result = get(state.result, state.paths[0])
        return {
          ...state,
          paths: state.paths.slice(1),
          result,
          results: state.results.concat({ key: state.paths[0], value: result }),
        }
      }
      case 'end':
        return { ...state, result: action.result }
    }
  }

  function dispatch(
    action:
      | { type: 'start'; reference: ReferenceString }
      | { type: 'next' }
      | { type: 'end'; result: any },
  ) {
    const prevState = _state
    _state = reducer(_state, action)
    subscribers?.onUpdate?.(prevState, _state)
  }

  return { getState: () => _state, dispatch }
}

function deref({ node, root, rootKey, subscribe }: DerefOptions) {
  let currValue: any
  let derefMachine = createDerefStateMachine(root as ARoot, { ...subscribe })
  let reference = unwrap(node)

  derefMachine.dispatch({ type: 'start', reference })

  derefMachine.getState().paths.forEach(() => {
    derefMachine.dispatch({ type: 'next' })
    currValue = derefMachine.getState().value
  })

  derefMachine.dispatch({ type: 'end', result: currValue })

  return u.merge(
    { reference, rootKey },
    u.pick(derefMachine.getState(), ['results', 'value']),
  )
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
