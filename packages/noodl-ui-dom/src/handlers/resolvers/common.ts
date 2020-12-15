export default function (noodluidom: any) {}

// noodluidom.on('component', (node, component: Component) => {
//   if (!node || !component) return
//   log.func('on [component]')

//   const {
//     children,
//     options,
//     placeholder = '',
//     src,
//     text = '',
//   } = component.get(['children', 'options', 'src', 'text', 'videoFormat'])

//   const { style, type } = component
//   /** Handle attributes */
//   if (_.isArray(defaultPropTable.attributes)) {
//     _.forEach(defaultPropTable.attributes, (key) => {
//       let attr, val: any
//       if (!_.isString(key)) {
//         const { attribute, cond } = key
//         if (_.isFunction(cond)) {
//           if (cond(node, component)) attr = attribute
//         } else {
//           attr = attribute
//         }
//         val =
//           component.get((attr || '') as any) ||
//           component[(attr || '') as keyof Component]
//       } else {
//         attr = key
//       }
//       val =
//         component.get((attr || '') as keyof Component) ||
//         component[(attr || '') as keyof Component]
//       if (val !== undefined) node.setAttribute(attr as keyof typeof node, val)
//     })
//   }
//   /** Handle dataset assignments */
//   if (_.isArray(defaultPropTable.dataset)) {
//     _.forEach(defaultPropTable.dataset, (key) => {
//       const val = component.get(key) || component[key as keyof Component]
//       if (val !== undefined) node.dataset[key.replace('data-', '')] = val
//       // Initiate the value
//       if (key === 'data-value' && 'value' in node) {
//         node.value = node.dataset.value
//       }
//     })
//     if (isEmitObj(component.get('dataKey'))) {
//       component.on('dataKey', (dataKey: string) => {
//         node.dataset.key = val
//       })
//     }
//   }
//   // Handle direct assignments
//   if (_.isArray(defaultPropTable.values)) {
//     const pending = defaultPropTable.values.slice()
//     let prop = pending.pop()
//     let val
//     while (prop) {
//       if (prop !== undefined) {
//         val = component.get(prop) || component[prop as keyof Component]
//         // @ts-expect-error
//         if (val !== undefined) node[prop] = val
//       }
//       prop = pending.pop()
//     }
//   }

//   // The src is placed on its "source" dom node
//   if (src && /(video)/.test(type)) node.removeAttribute('src')

//   const datasetAttribs = component.get(defaultPropTable.dataset)

//   /** Data values */
//   /** Emit's onChange will be handled in action handlers */
//   if (!isEmitObj(component.get('dataValue'))) {
//     if (component.get('text=func')) {
//       node.innerHTML = datasetAttribs['data-value'] || ''
//     } else if (!isTextFieldLike(node)) {
//       // For non data-value elements like labels or divs that just display content
//       // If there's no data-value (which takes precedence here), use the placeholder
//       // to display as a fallback
//       let text = ''
//       text = datasetAttribs['data-value'] || ''
//       if (!text && children) text = `${children}` || ''
//       if (!text && placeholder) text = placeholder
//       if (!text) text = ''
//       if (text) node.innerHTML = `${text}`
//       node['innerHTML'] =
//         datasetAttribs['data-value'] || component.get('placeholder') || ''
//     }
//   }

//   // The "handler" argument is a func returned from ActionChain#build
//   const attachEventHandler = (eventType: any, handler: Function) => {
//     const eventName = (eventType.startsWith('on')
//       ? eventType.replace('on', '')
//       : eventType
//     ).toLocaleLowerCase()
//     if (isTextFieldLike(node)) {
//       // Attach an additional listener for data-value elements that are expected
//       // to change values on the fly by some "on change" logic (ex: input/select elements)
//       import('../utils/sdkHelpers').then(({ createOnDataValueChangeFn }) => {
//         node.addEventListener(
//           eventName,
//           createOnDataValueChangeFn(node, component, {
//             onChange: handler,
//             eventName,
//           }),
//         )
//         node.onkeypress = (e: KeyboardEvent) => {
//           if (e.key === 'Enter') {
//             const inputs = document.querySelectorAll('input')
//             log.grey(`Moving to next input field`)
//             const currentIndex = [...inputs].findIndex((el) =>
//               node.isEqualNode(el),
//             )
//             //focus the following element
//             const targetIndex = (currentIndex + 1) % inputs.length
//             if (currentIndex + 1 < inputs.length) {
//               inputs[targetIndex]?.focus?.()
//             }
//           }
//         }
//       })
//     } else {
//       node.addEventListener(eventName, (event) => {
//         log.func(`on component --> addEventListener: ${eventName}`)
//         log.grey(`User action invoked handler`, {
//           component,
//           event,
//           eventName,
//           node,
//         })
//         return handler?.(event)
//       })
//     }
//   }

//   /** Event handlers */
//   if (isTextFieldLike(node)) {
//     attachEventHandler('onChange', component.get('onChange'))
//   } else {
//     _.forEach(eventTypes, (eventType) => {
//       if (component.get(eventType)) {
//         attachEventHandler(eventType, component.get(eventType))
//       }
//     })
//   }

//   /** Styles */
//   if (node?.tagName !== 'SCRIPT') {
//     if (_.isPlainObject(style)) {
//       forEachEntries(style, (k, v) => (node.style[k as any] = v))
//     } else {
//       log.func('noodluidom.on: all')
//       log.red(
//         `Expected a style object but received ${typeof style} instead`,
//         style,
//       )
//     }
//   }

//   /** Children */
//   if (options) {
//     if (type === 'select') {
//       if (_.isArray(options)) {
//         _.forEach(options, (option: SelectOption, index) => {
//           if (option) {
//             const optionElem = document.createElement('option')
//             optionElem['id'] = option.key
//             optionElem['value'] = option?.value
//             optionElem['innerText'] = option.label
//             node.appendChild(optionElem)
//             if (option?.value === datasetAttribs['data-value']) {
//               // Default to the selected index if the user already has a state set before
//               ;(node as HTMLSelectElement)['selectedIndex'] = index
//             }
//           } else {
//             // TODO: log
//           }
//         })
//         // Default to the first item if the user did not previously set their state
//         if ((node as HTMLSelectElement).selectedIndex == -1) {
//           ;(node as HTMLSelectElement)['selectedIndex'] = 0
//         }
//       } else {
//         // TODO: log
//       }
//     }
//   }

//   if (!node.innerHTML.trim()) {
//     if (isDisplayable(datasetAttribs['data-value'])) {
//       node.innerHTML = `${datasetAttribs['data-value']}`
//     } else if (isDisplayable(children)) {
//       node.innerHTML = `${children}`
//     } else if (isDisplayable(text)) {
//       node.innerHTML = `${text}`
//     }
//   }
// })
