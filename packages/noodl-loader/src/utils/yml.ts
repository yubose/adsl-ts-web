import axios from 'axios'
import y from 'yaml'
import type { ToStringOptions } from 'yaml'
import * as t from '../types'

/**
 * Fetches a yaml file using the url provided.
 * If "as" is "json", the result will be parsed and returned as json
 *
 * @param url URL
 * @param as Return data as json or yml. Defaults to 'yml'
 * @returns { string | Record<string, any> }
 */
export async function fetchYml(url = '', as: 'json' | 'yml' = 'yml') {
  try {
    const isJson = as === 'json'
    const contentType = isJson ? 'application/json' : 'text/plain'
    const { data: yml } = await axios.get(url, {
      headers: {
        Accept: contentType,
        'Content-Type': contentType,
      },
    })
    return isJson ? y.parse(yml) : yml
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

export function isNode(
  value: unknown,
): value is y.Document | y.Document.Parsed | y.Node | y.Pair {
  return (
    value !== null &&
    typeof value === 'object' &&
    (y.isNode(value) || y.isPair(value) || y.isDocument(value))
  )
}

export function parse<DataType extends t.Loader.RootDataType>(
  dataType: DataType,
  yml = '',
  opts?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions,
): DataType extends 'map' ? y.Document.Parsed : Record<string, any> {
  return dataType === 'map' ? y.parseDocument(yml, opts) : y.parse(yml, opts)
}

/**
 * Returns the stringified output of the yaml document or object.
 * If there are errors when parsing yaml documents, it returns a stringified yaml output of the errors instead
 * @param { y.Document } doc
 */
export function stringify<O extends Record<string, any> | y.Document>(
  value: O | null | undefined,
  opts?: ToStringOptions,
) {
  let result = ''

  if (value) {
    if (y.isDocument(value)) {
      if (value.errors.length) {
        result = y.stringify(value.errors)
      } else {
        result = value.toString(opts)
      }
    } else {
      result = y.stringify(value)
    }
  }

  return result
}

/**
 * Will convert value to a yaml document
 * @param value The value to convert. Supports yaml string or an object literal
 * @returns A yaml document
 */
export function toDocument(
  value: Record<string, any> | string,
  opts?: y.DocumentOptions & y.ParseOptions & y.SchemaOptions,
) {
  if (value) {
    return y.parseDocument(
      typeof value === 'string' ? value : y.stringify(value),
      opts,
    )
  }
  return new y.Document(value, opts)
}

export function withYmlExt(s = '') {
  return !s.endsWith('.yml') && (s += '.yml')
}
