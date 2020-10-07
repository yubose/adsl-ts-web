// Recurses through objects and exposes all the properties of objects and
// its nested objects
import fs from 'fs-extra'
import _ from 'lodash'
import chalk from 'chalk'
import Saver, { DataOptions } from './modules/Saver'
import { sortObjByProperties } from './utils/common'
import { getDirFilesAsJson } from './utils/filesystem'
import { forEachDeepEntries } from '../src/utils/common'
import { paths } from './config'
import * as log from './utils/log'

export interface GetAllPropertiesOutput {
  overall: {
    [keyword: string]: number
  }
  results: {
    [pageName: string]: {
      [property: string]: number
    }
  }
}

export interface GetAllPropertiesOptions {
  dir: string
  endpoint: string
  filename: string
}

async function getAllNOODLProperties({
  dir,
  endpoint,
  filename,
}: GetAllPropertiesOptions) {
  try {
    return
    const exts = { json: true }
    const saver = new Saver({ dir, exts })
    const bases = new Bases({ endpoint, exts })
    let pages: Pages
    // let allObjects:

    const output: GetAllPropertiesOutput = {
      overall: {},
      results: {},
    } as GetAllPropertiesOutput

    let name: string

    _.forEach(objects, (obj) => {
      name = obj.filename.replace('.json', '')
      forEachDeepEntries(obj, (key) => {
        if (_.isUndefined(output.results[name])) {
          output.results[name] = { [key]: 0 }
        }

        if (_.isUndefined(output.results[name][key])) {
          output.results[name][key] = 0
        }

        output.results[name][key]++

        if (_.isUndefined(output.overall[key])) {
          output.overall[key] = 0
        }

        output.overall[key]++
      })

      if (obj) {
        log.green(`Processed ${chalk.magentaBright(name)}`)
      }
    })

    // Sort the overall counts in descending order to make it easier to read
    {
      const keyValues = _.entries(output.overall)
      output.overall = {}
      _.forEach(
        keyValues.sort((a, b) => (a[1] > b[1] ? -1 : 1)),
        _.spread((key, count) => {
          output.overall[key] = count
        }),
      )
    }

    // Sort the output results to make it easier to read
    _.forEach(_.orderBy(_.keys(output.results)), (filename) => {
      // If the value is nested object (second level)
      if (_.isObjectLike(output.results[filename])) {
        output.results[filename] = sortObjByProperties(output.results[filename])
      }
    })

    await fs.writeJson(saveTo, output, { spaces: 2 })

    return { pageCount: objects.length }
  } catch (error) {
    console.error(error)
    throw error
  }
}

export default getAllNOODLProperties
