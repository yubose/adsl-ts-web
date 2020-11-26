import _ from 'lodash'
import Logger from 'logsnap'
import isReference from '../utils/isReference'
import { RootsParser } from '../types'

const log = Logger.create('makeRootsParser')

export const rules = {
  dataKey: 'keyword-inherit',
  '.': 'global-inherit',
  '..': 'local-inherit',
  '=..': 'local-inherit-replacement',
  '@': 'inherit',
  '=': 'evaluate',
  _: 'local-reference',
}

function makeRootsParser<RootObjects = any>(
  root?: RootObjects,
  defaultState?: { localKey?: string },
): RootsParser {
  let localKey = defaultState?.localKey || ''

  function _get<K extends keyof RootObjects>(
    key: string,
  ): RootObjects[K] | any {
    if (!isReference(key)) {
      return key
    }
    // Reference from a root/local object (handles both cases)
    if (key.startsWith('.')) {
      return _parse(_getByDotReference(key))
    }
    // Evaluate
    else if (key.startsWith('=')) {
      return _parse(_getByEvaluation(key))
    }
    // Inherits
    if (key.endsWith('@')) {
      //
    }
  }

  // Retrieves the value using path
  function _getByDotReference(path: string) {
    let trimmedPath = path.replace(/(\.\.|\.)/, '')
    // Local/private reference
    if (path[0] === path[0].toLowerCase()) {
      return _.get(root?.[localKey], trimmedPath)
    }
    // Global reference
    if (path[0] === path[0].toUpperCase()) {
      return _.get(root, trimmedPath)
    }
  }

  // Evaluates the value, forwarding any chained references to other getters
  //    if found, then returns the result
  function _getByEvaluation(key: string) {
    if (key.startsWith('=')) {
      key = key.replace('=', '')
      // TODO: Handle other cases for evaluating situations (ex: updating global object)
      if (isReference(key)) {
        // Evaluations wait for a specific result to resolve before returning their final value,
        //    so we assign this part to a variable, decide what to do with it before returning the computed result
        const pendingValue = _get(key)
        const keyword = _parsePostEvaluationKeyword(key)
        // Currently "lastTop" is a signal to set/get a value from the local root
        if (keyword === 'lastTop') {
          //
        }
        const result = _get(key)
      }
      // Separating from the above lines for now for possible separation of concerning situation
      return _parse(key)
    } else {
      return _get(key)
    }
  }

  /**
   * Parses and returns the immediate keyword following the first referencing symbol
   * @param { string } keyword
   */
  function _parsePostEvaluationKeyword(keyword: string) {
    if (_.isString(keyword)) {
      const regex = /^(\.{1,2}|@|=|_)([a-zA-Z0-9]+)/i
      const matches = keyword.match(regex)
      if (Array.isArray(matches)) {
        // ['..lastTop', '..', 'lastTop']
        return matches[2]
      }
    }
    return ''
  }

  /**
   * Parses the value that should have been retrieved from _get
   * @param { any } value
   */
  function _parse(value: any): any {
    if (_.isString(value)) {
      return _get(value)
    }
    if (value && _.isObjectLike(value)) {
      const keys = Object.keys(value)
      return keys.reduce((acc, key) => {
        if (isReference(key)) {
          return {
            ...acc,
            // @ts-ignore
            ...mergeReference(key, value),
          }
        } else {
          acc[key] = value[key]
        }
        return acc
      }, {})
    } else if (Array.isArray(value)) {
      return value.map((val) => _parse(val))
    }
    return value
  }
  /**
   * Merges the original object (with the refKey omitted), evaluates and merges
   *    the value of the reference key evaluated into the result
   * @param { string } refKey - The key that is a reference to a NOODL object (ex: ..formData.countryCode)
   * @param { object } originalObj - Original object including the refKey key/value that will be merged with the refKey omitted
   */
  function mergeReference<T = any>(refKey: keyof T, originalObj: T) {
    if (_.isObjectLike(originalObj)) {
      if (_.isString(refKey)) {
        let value
        if (_.isObjectLike(originalObj[refKey])) {
          value = originalObj[refKey]
        }
        return {
          ..._get(refKey),
          ...value,
        }
      } else {
        log.red('Cannot merge using the reference key because it is invalid', {
          originalObj,
          refKey,
        })
      }
    } else {
      log.red(
        'Cannot merge with the original "object" because it was not an object',
        { originalObj, refKey },
      )
    }
    return
  }

  // Used when given in parsed action chain objects (updateObject, saveObject, etc)
  const _nameField = {
    getKeys(key: string): string[] {
      let fields: string[] = [],
        nameFieldPath,
        result

      if (_.isString(key)) {
        if (isReference(key)) {
          fields = _get(key)
        } else {
          nameFieldPath = key.split('.')

          if (!nameFieldPath.includes('name')) {
            nameFieldPath.push('name')
          }

          result =
            _.get(root, nameFieldPath) || _.get(root?.[localKey], nameFieldPath)

          if (!result) {
            log.red('Received an invalid value for nameField.getKeys', {
              fields,
              key,
              localKey,
              nameFieldPath,
              result,
              root,
            })
          } else if (_.isObjectLike(result)) {
            fields = _.keys(result)
          }

          return fields
        }
      } else {
        log.red(
          'Tried to parse a name field but the given key was not a string',
          { key },
        )
      }

      return fields
    },
  }

  return {
    /**
     * Returns a value from the root object using the value provided. Returns null if nothing was found
     * @param { string } value - Value used to grab a root object that it references
     */
    get<K extends keyof RootObjects>(key: string): RootObjects[K] | any {
      return _get(key)
    },
    getLocalKey() {
      return localKey
    },
    getByDataKey(dataKey: string, fallbackValue?: any) {
      if (isReference(dataKey)) {
        return _get(dataKey)
      }
      const path = dataKey.startsWith('.')
        ? dataKey.replace(/(..|.)/, '')
        : dataKey

      return (
        _.get(root?.[localKey], path, fallbackValue) ||
        _.get(root, path, fallbackValue)
      )
    },
    mergeReference,
    nameField: _nameField,
    parse: _parse,
    parseDataKey(value: string) {
      if (!_.isString(value)) value = String(value)
      const key = value.startsWith('.') ? value.replace(/(..|.)/, '') : value
      return _.last(key.split('.'))
    },
    setLocalKey(key: string) {
      if (_.isString(key)) localKey = key
      return this
    },
    setRoot(root: any) {
      root = root
      return this
    },
  }
}

export default makeRootsParser
