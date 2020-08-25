import _ from 'lodash'
import {
  noodlEventTypes,
  isReference,
  NOODLComponentProps,
  SelectOption,
} from 'noodl-ui'
import { forEachEntries } from 'utils/common'

// TODO do a more generic solution
const keysHandling = [
  'children',
  'data-value',
  'onClick',
  'options',
  'placeholder',
  'style',
] as const

export const attachChildren = createAttacher(
  (node: HTMLElement, { key, value, props }) => {
    if (key === 'children') {
      if (_.isString(value) || _.isNumber(value)) {
        node.innerHTML += `${value}`
      } else if (_.isArray(value)) {
        _.forEach(value, toDOMNode)
      }
    }
    // Attaching children for the select elem
    else if (key === 'options') {
      if (props.type === 'select') {
        if (_.isArray(value)) {
          _.forEach(value, (option: SelectOption) => {
            if (option) {
              const optionElem = document.createElement('option')
              optionElem.id = option.key
              optionElem.value = option?.value
              optionElem.innerText = option.label
              node.appendChild(optionElem)
            } else {
              //log
            }
          })
        } else {
          // log
        }
      }
    }
  },
)

export const attachEventHandlers = createAttacher(
  (node: HTMLElement, { key, value, props }) => {
    if (node) {
      if (noodlEventTypes.includes(key as typeof noodlEventTypes[number])) {
        if (_.isFunction(value)) {
          const lowercasedEventType = (key as string).toLowerCase()
          node.addEventListener(
            lowercasedEventType.startsWith('on')
              ? lowercasedEventType.replace('on', '')
              : lowercasedEventType,
            (e) => {
              console.log(e)
              value(e)
            },
          )
        } else {
          // log
        }
      }
      if (key === 'data-value') {
        // const onChange = (e: Event) => {
        //   const target: typeof e.target & {
        //     value?: any
        //   } | null = e.target
        // }
        // node.addEventListener('onchange', onChange)
      }
    }
  },
)

export const attachStyles = createAttacher((node, { key, value }) => {
  if (key === 'style' && _.isObjectLike(value)) {
    forEachEntries(value, (k, v) => {
      node.style[k as any] = v
    })
  } else {
    // log
  }
})

export const attachValues = createAttacher((node, { key, value, props }) => {
  if (key === 'data-value' && value != undefined) {
    if (props.type === 'input') {
      const inputElem = node as HTMLInputElement
      inputElem.value = value
    } else if (props.type == 'select') {
      const selectElem = node as HTMLSelectElement
      selectElem.value = value
    }
  }
  // Placeholder
  else if (key === 'placeholder') {
    node.setAttribute('placeholder', `${value}`)
  }
})

export function composeAttachers(...fns: any[]) {
  const attachFns = (
    node: HTMLElement,
    args: { key: string | number; value: any; props: NOODLComponentProps },
  ) => {
    _.forEach(fns, (fn) => fn?.(node, args))
  }
  return attachFns
}

export const attachToDOMNode = composeAttachers(
  attachChildren,
  attachEventHandlers,
  attachStyles,
  attachValues,
)

export function createAttacher(fn: ReturnType<typeof composeAttachers>) {
  return (...args: Parameters<ReturnType<typeof composeAttachers>>) => {
    if (args[1]) {
      return fn(...args)
    }
  }
}

/**
 * Takes a parsed NOODL component and transforms its attributes to create a
 * representable DOM node
 * @param { NOODLComponentProps } props - Props resulting from a resolved ProxiedComponent
 */
export function toDOMNode(props: NOODLComponentProps) {
  const node = document.createElement(props.type)

  if (node) {
    forEachEntries(props, (key, value) => {
      if (keysHandling.includes(key as any)) {
        attachToDOMNode(node, { key, value, props })

        if (key === 'children') {
          if (_.isObjectLike(value)) {
            _.forEach(value, (child) => {
              let childNode
              if (_.isPlainObject(child)) {
                childNode = toDOMNode(child)
                if (childNode) {
                  node?.appendChild(childNode)
                }
              } else if (_.isString(child) || _.isFinite(child)) {
                node.innerHTML += child
              }
            })
          }
        }
      } else {
        node.setAttribute(key as string, value)
      }
      // Traverse the children hierarchy and resolve them as descendants
      // if (key === 'children') {

      // } else if (key && key !== 'style') {
      //   node.setAttribute(key as string, value)
      // }
    })
  }

  return node
}
