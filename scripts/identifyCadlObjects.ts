// @ts-nocheck
import fs from 'fs-extra'
import chalk from 'chalk'
import path from 'path'
import yaml, { Document, scalarOptions, CST } from 'yaml'
import isString from 'lodash/isString'
import { Node, Pair, YAMLMap, YAMLSeq, Scalar } from 'yaml/types'
import * as log from './utils/log'
import identifyScalar from './utils/identifyScalar'
import identifyPair from './utils/identifyPair'
import identifyMap from './utils/identifyMap'
import identifySeq from './utils/identifySeq'
import getDirFilesAsDocNodes, {
  ResultObject,
} from './utils/getDirFilesAsDocNodes'

export type Identifiers =
  | typeof identifyScalar
  | typeof identifyPair
  | typeof identifyMap
  | typeof identifyPair

export type ExpectedNode = YAMLMap | YAMLSeq | Pair | Scalar

const makeIdentifyNoodlObjects = function () {
  const _data: {
    [name: string]: Document
  } = {}

  const _ext = '.yml'

  async function _add(name: string, dir: string) {
    if (isString(dir)) {
      _data[name] = await getFileAsDocNode(`${dir}${name}${_ext}`)
    }
  }

  function _isIterable(node: unknown): node is YAMLMap | YAMLSeq {
    return node instanceof YAMLMap || node instanceof YAMLSeq
  }

  function _makeIdentifierRecords(identifiers: Identifiers) {
    return (node: ExpectedNode) => {
      return _run(node, identifiers)
    }
  }

  function _run(node: ExpectedNode, identifiers: Identifiers): ExpectedNode[] {
    let results = [],
      result

    if (_isIterable(node)) {
      for (let index = 0; index < node.items.length; index++) {
        const item = node.items[index]
        if (_isIterable(item.value)) {
          results.push(..._run(item.value, identifiers))
        }
        result = _runIdentifiers(item, identifiers)
        if (result) results.push(result)
      }
    }

    return results
  }

  function _runIdentifiers(node: any, identifiers: Identifiers) {
    return Object.entries(identifiers).reduce(
      (acc, [identifierName, identify]) => {
        if (identify(node)) {
          acc.push({
            [identifierName]: node,
          })
        }
        return acc
      },
      [],
    )
  }

  return {
    async load(name?: string | string[]) {
      let baseDirFileNames: any = fs.readdir(dirYmls)
      let pageDirFileNames: any = fs.readdir(dirPageYmls)
      // Parallel the requests
      baseDirFileNames = await baseDirFileNames
      pageDirFileNames = await pageDirFileNames

      // Load a single noodl object
      if (isString(name)) {
        const fullFileName = `${name}${_ext}`
        if (baseDirFileNames.includes(fullFileName)) {
          await _add(name, dirYmls)
        } else {
          if (pageDirFileNames.includes(fullFileName)) {
            const results = (await getDirFilesAsDocNodes({
              dir: dirPageYmls,
              files: 'SignIn',
              returnAs: 'object',
            })) as ResultObject[]

            results.forEach((result) => {
              _data[result.filename] = result.doc
            })
          } else {
            throw new Error(
              chalk.redBright(
                `Could not find ${chalk.yellowBright(
                  `${name}${_ext}`,
                )} anywhere`,
              ),
            )
          }
        }
      } else if (Array.isArray(name)) {
        // Load multiple selected noodl objects
        const results = (await getDirFilesAsDocNodes({
          dir: dirPageYmls,
          files: name,
          returnAs: 'object',
        })) as ResultObject[]

        results.forEach((result) => {
          _data[result.filename] = result.doc
        })
      } else {
        // Default to loading all objects
        const baseDocs = await getDirFilesAsDocNodes({
          dir: dirYmls,
          returnAs: 'object',
        })
        const pagesDocs = await getDirFilesAsDocNodes({
          dir: dirPageYmls,
          returnAs: 'object',
        })
        const allDocObjects = [...baseDocs, ...pagesDocs]

        for (let index = 0; index < allDocObjects.length; index++) {
          const docObject = allDocObjects[index] as ResultObject
          const { filepath, filename, ext, doc } = docObject
          _data[filename] = doc
        }
      }
      return _data
    },
    page(name: string, doc: Document) {
      const contents: YAMLMap = doc['contents']
      const results = []

      if (contents instanceof YAMLMap) {
        const identifyWithPairs = _makeIdentifierRecords(identifyPair)
        results.push(...identifyWithPairs(contents))
      } else {
        throw new Error(`doc.contents was not a YAMLMap. Investigate this`)
      }
      return {
        [name]: results,
      }
    },
  }
}

async function identifyNoodlObjects() {
  try {
    const identifier = makeIdentifyNoodlObjects()
    const data = await identifier.load('SignIn')
    const doc = data['SignIn']
    log.divider()
    console.log(doc)
    log.divider()
    const identified = identifier.page('SignIn', doc)
    console.log(JSON.stringify(identified, null, 2))
    log.divider()
    return identified
  } catch (error) {
    console.error(error)
  }
}

export default identifyNoodlObjects
