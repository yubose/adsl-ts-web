import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import chalk from 'chalk'
import curry from 'lodash/curry'
import _get_ from 'lodash/get'

export type RootArg = Record<string, any> | (() => Record<string, any>)
export type PathItem = string | number

function isPathable(value: unknown): value is PathItem {
  return u.isStr(value) || u.isNum(value)
}

function unwrap(root: RootArg) {
  return (u.isFnc(root) ? root() : root) || {}
}

function getByRoot(root: RootArg, datapath = '') {
  return _get_(unwrap(root), nu.toDataPath(datapath))
}

function getByLocalRoot(root: RootArg, localKey = '', datapath = '') {
  return _get_(unwrap(root), [localKey, ...nu.toDataPath(datapath)])
}

function keyExists(key: PathItem | undefined, obj: unknown) {
  if (key === undefined) return false
  if (u.isArr(obj) && isPathable(key)) return obj.indexOf(Number(key)) == key
  if (u.isObj(obj)) return key in obj
  return false
}

export function getValue<O extends Record<string, any>>(
  dataObject: O,
  path: string[],
) {
  let previousPaths = [] as PathItem[]
  let currentPath = [
    ...nu.trimReference(path.join('.') as nt.ReferenceString).split('.'),
  ]
  let currentKey = currentPath.shift() as PathItem
  let currentValue = isPathable(currentKey) ? dataObject[currentKey] : undefined
  let lastValue: any = currentValue

  while (currentPath.length) {
    // console.info({
    //   currentKey,
    //   currentValue,
    //   previousPaths,
    //   path: [currentKey, ...currentPath],
    //   keyExists: keyExists(currentKey, currentValue),
    // })
    previousPaths.push(currentKey)
    if (!keyExists(currentPath[0], currentValue)) break
    currentKey = currentPath.shift() as PathItem
    lastValue = currentValue
    currentValue = currentValue?.[currentKey]
  }

  return {
    currentKey,
    currentValue,
    currentPath,
    dataObject,
    lastValue,
    previousPaths,
  }
}

const get = curry<Parameters<typeof unwrap>[0], string, string, any>(
  (root: Parameters<typeof unwrap>[0], key = '', localKey = '') => {
    if (u.isStr(key)) {
      let datapathStr = nt.Identify.reference(key) ? nu.trimReference(key) : key
      let value: any = key

      console.info(`[${u.green('1')}]`, { datapathStr, localKey, value })

      if (nt.Identify.reference(value)) {
        datapathStr = nu.trimReference(value)
        let datapath = nu.toDataPath(datapathStr)

        if (datapath.length) {
          if (value.startsWith('..') || nt.Identify.localKey(datapathStr)) {
            const result = getValue(unwrap(root), datapath)
            value = result.value
            datapath = result.path
          } else {
            // Must be an eval reference "=." or another reference type. Default to retrieve the value at the path it points to
            value = getByRoot(root, datapathStr)
            // const result = getValue(unwrap(root),)
          }
        }
        console.info(`[${u.green('2')}]`, { datapathStr, localKey, value })
      }

      if (!nt.Identify.reference(value)) {
        console.info(`[${u.green('3')}]`, { datapathStr, localKey, value })
        if (nt.Identify.localKey(datapathStr)) {
          value = getByLocalRoot(root, localKey, datapathStr)
        } else {
          value = getByRoot(root, datapathStr)
        }
        console.info(`[${u.green('4')}]`, { datapathStr, localKey, value })
        if (!nt.Identify.reference(value)) return value
      }

      console.info(`[${u.green('5')}]`, { datapathStr, localKey, value })

      while (nt.Identify.reference(value)) {
        datapathStr = nu.trimReference(value)
        console.info(`[${u.green('6')}]`, { datapathStr, localKey, value })
        if (value.startsWith('..') || nt.Identify.localKey(datapathStr)) {
          value = getByLocalRoot(root, localKey, datapathStr)
        } else {
          // Must be an eval reference "=." or another reference type. Default to retrieve the value at the path it points to
          value = getByRoot(root, datapathStr)
        }
        console.info(`[${u.green('7')}]`, { datapathStr, localKey, value })
      }

      console.info(`[${u.green('8 - final')}]`, {
        datapathStr,
        localKey,
        value,
      })
      return value
    }

    return null
  },
)

export default get
