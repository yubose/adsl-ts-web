/**
 * State pattern dereferencer
 */
import y from 'yaml'
import * as u from '@jsmanifest/utils'
import { is as coreIs, getRefProps, trimReference } from '@noodl/core'
import type { ReferenceString } from 'noodl-types'
import type DocRoot from '../DocRoot'
import get from './get'
import is from './is'
import unwrap from './unwrap'

export interface DerefOptions {
  depth?: number
  node: y.Scalar<string> | string
  root?: DocRoot
  rootKey?: y.Scalar | string
  subscribe?: {
    onUpdate?: (prevState: any, nextState: any) => void
  }
}

export interface DerefResult {
  depth: number
  initiator: string
  key: string
  value: any
  path?: string[]
  prevKey?: string
}

function createDerefReducer(
  root: DocRoot | undefined,
  { rootKey, ...subscribers } = {} as DerefOptions['subscribe'] & {
    rootKey?: string
  },
) {
  let _result: any
  let _state = {
    initialValue: undefined as string | undefined,
    depth: 0,
    paths: [] as string[],
    results: [] as DerefResult[],
  }

  function reducer(
    state: typeof _state,
    action: Parameters<typeof dispatch>[0],
  ) {
    switch (action.type) {
      case 'start': {
        const {
          isLocalRef,
          paths,
          ref: initiator,
        } = getRefProps(action.reference)
        if (isLocalRef && rootKey) paths.unshift(rootKey)
        _result = get(root?.value, paths[0] as string, { rootKey })
        return {
          ...state,
          depth: action.depth,
          initialValue: action.reference,
          paths: paths.slice(1),
          results: state.results.concat({
            depth: action.depth,
            initiator,
            key: paths[0],
            value: is.ymlNode(_result) ? _result?.toJSON?.() : _result,
          }),
        }
      }
      case 'next': {
        let currResults = [...state.results]

        _result = get(_result, state.paths[0], { rootKey })

        currResults.push({
          initiator: state.initialValue as string,
          depth: state.depth,
          key: state.paths[0],
          value: is.ymlNode(_result) ? _result?.toJSON?.() : _result,
        })

        let nextPaths = state.paths.slice(1)
        let newDerefedResults: ReturnType<typeof deref>

        if (
          (coreIs.str(_result) && coreIs.reference(_result)) ||
          (is.scalarNode(_result) && is.reference(_result))
        ) {
          // The result is the current reference or another (chained) reference.
          // Correctly prepare the next props for pathing
          let refProps = getRefProps(unwrap(_result) as ReferenceString)
          let isRootRef = !refProps.isLocalRef
          let isSameRootKey =
            (isRootRef && refProps.paths[0] === rootKey) || true
          let nextRootKey = rootKey

          if (isRootRef) {
            if (isSameRootKey) {
              refProps.paths = refProps.paths.slice(1)
              refProps.path = refProps.paths.join('.')
              nextPaths.unshift(...refProps.paths)
            } else {
              nextRootKey = refProps.paths[0]
            }
          }

          newDerefedResults = deref({
            depth: state.depth,
            node: refProps.ref,
            root,
            rootKey: nextRootKey,
          })

          const childResults = newDerefedResults.results
            .slice(isRootRef ? 0 : 1)
            .map((obj, i, coll) => {
              const prevKey = coll[i - 1]?.key
              const meta = {
                ...obj,
                depth: coreIs.num(obj.depth) ? obj.depth : state.depth,
                initiator: newDerefedResults.initialValue,
              } as DerefResult

              if (prevKey) meta.prevKey = prevKey
              meta.path = coll.map((obj) => obj.key)
              return meta
            })

          currResults.push(...childResults)

          _result = unwrap(newDerefedResults.value)

          if (!_result) {
            // const fullPath = isSameRootKey
            //   ? trimReference(newDerefedResults.reference)
            //   : `${rootKey}.${trimReference(newDerefedResults.reference)}`
            // if (root?.has(fullPath)) {
            //   const lastResult = currResults[currResults.length - 1]
            //   lastResult.value = state.initialValue
            //   console.log(`UNRESOLVED INFO: ${fullPath}`, {
            //     initialValue: state.initialValue,
            //     lastResult,
            //     nextRootKey,
            //     refProps,
            //   })
            // }
          }
        }

        return {
          ...state,
          paths: nextPaths,
          results: currResults,
        }
      }
    }
  }

  function dispatch(
    action:
      | { type: 'next' }
      | { type: 'start'; depth: number; reference: ReferenceString },
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

function getRootKey(ref: ReferenceString, rootKey = '' as y.Scalar | string) {
  const { isLocalRef, paths } = getRefProps(ref)
  return (isLocalRef ? rootKey : paths[0]) as string
}

function deref({
  depth = -1,
  node,
  root,
  rootKey: rootKeyProp,
  subscribe,
}: DerefOptions) {
  const reference = unwrap(node) as ReferenceString
  const rootKey = getRootKey(reference, rootKeyProp)
  const derefer = createDerefReducer(root, { rootKey, ...subscribe })

  derefer.dispatch({ type: 'start', reference, depth: ++depth })
  derefer.getState().paths.forEach(() => derefer.dispatch({ type: 'next' }))

  return {
    reference,
    ...u.omit(derefer.getState(), ['paths']),
  }
}

export default deref
