// export function ensureArray(value: any, path: string) {
//   if (value && typeof value === 'object' && typeof path === 'string') {
//     let parts = path.split(' ')
//     let prev: any
//     let obj: any = value

//     while (parts.length) {
//       const part = parts.shift()
//       if (part) {
//         prev = obj
//         obj = obj?.[part]
//         if (!obj) {
//           prev = []
//         }
//       }
//     }
//   }
// }

export function ensureDatasetHandlingArr<N extends HTMLElement>(node: N) {
  if (node && node.dataset) {
    if (!Array.isArray(node.dataset.handling)) {
      node.dataset.handling = [] as any
    }
  }
}

export const get = <T = any>(o: T, k: string) => {
  if (typeof o !== 'object' || typeof k !== 'string') return

  let parts = k.split('.').reverse()
  let result: any = o
  let key = ''

  while (parts.length) {
    key = parts.pop() as string
    result = result[key]
  }

  return result
}

export function isHandlingEvent<N extends HTMLElement>(
  node: N,
  eventId: string,
) {
  if (node && eventId && Array.isArray(node.dataset.handling)) {
    return node.dataset.handling.includes(eventId)
  }
  return false
}

export const handlingDataset = (function () {
  function _get(node: any) {
    return node?.dataset?.handling
  }

  function _parse(node: any) {
    let result: any
    if (node) {
      try {
        result = JSON.parse(_get(node))
      } catch (error) {
        console.error(error)
      }
    }
    return result || null
  }

  function _insert(node: any, value: string) {
    let result: any
    const handling = _parse(node)
    return result
  }

  const o = {
    parse: _parse,
    insert: _insert,
  }

  return o
})()
