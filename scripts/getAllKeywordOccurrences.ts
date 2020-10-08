import _ from 'lodash'
import chalk from 'chalk'
import { createObjWithKeys, createRegexpByKeywords } from './utils/common'
import * as log from './utils/log'
import Aggregator from './modules/Aggregator'
import Saver from './modules/Saver'
import { forEachDeepEntries } from '../src/utils/common'

export interface GenerateStatsForKeywordsOptions {
  dir: string
  endpoint: string
  keywords: string[]
  saveAsFilename: string
}

async function getAllKeywordOccurrences({
  dir,
  endpoint,
  keywords,
  saveAsFilename,
}: GenerateStatsForKeywordsOptions) {
  try {
    const aggregator = new Aggregator({ endpoint, json: true })
    const saver = new Saver({ dir, exts: { json: true } })
    const accumulate = createAccumulator(keywords)
    const { base, app } = aggregator

    base.onRootConfig = () => {
      log.yellow(`Retrieved rootConfig using ${chalk.magentaBright(endpoint)}`)
    }

    base.onNoodlConfig = () => {
      log.yellow(
        `Retrieved noodl config from ${chalk.magentaBright(
          base.noodlEndpoint,
        )}`,
      )
      log.white(`Config version set to ${chalk.yellowBright(base.version)}`)
      log.blank()
    }

    base.onBaseItems = () => {
      _.forEach(_.keys(base.items), (name) => {
        name && log.green(`Retrieved ${name}`)
      })
    }

    log.blue(`Endpoint set to ${chalk.magentaBright(endpoint)}`)
    log.blank()

    const items = await aggregator.load({
      includeBasePages: true,
      includePages: true,
    })

    const allObjects = _.map(_.entries(items), ([key, value]) => ({
      data: value,
      filename: key,
      filepath: '',
    }))

    let output = {}
    let result: any
    let totalObjects = aggregator.length

    for (let index = 0; index < totalObjects; index++) {
      const obj: any = allObjects[index]
      result = accumulate(obj.filename, obj, { returnItemOnly: true })
      if (result) {
        output[obj.filename] = result
        log.green(`Processed page ${chalk.magentaBright(obj.filename)} `)
      }
    }

    await saver.save({
      data: output,
      dir,
      filename: saveAsFilename,
      type: 'json',
    })

    return output
  } catch (error) {
    console.error(error)
    throw error
  }
}

function createAccumulator(keywords: string[]) {
  const stats: {
    [pageName: string]: {
      occurences: {
        [keyword: string]: number
      }
      results: {
        [keyword: string]: any[]
      }
    }
  } = {}

  const regex = createRegexpByKeywords({
    keywords,
    flags: '',
  })

  const isMatch = (keyword: string) => regex.test(keyword)

  function _add(pageName: string, { key, value }: { key: string; value: any }) {
    if (!stats[pageName]) {
      stats[pageName] = {
        occurences: createObjWithKeys(keywords, 0),
        results: createObjWithKeys(keywords, {}),
      }
    }
    if (!_.isArray(stats[pageName].results[key])) {
      stats[pageName].results[key] = []
    }
    stats[pageName].results[key].push({ value })
  }

  return function run(
    pageName: string,
    obj: { [key: string]: any },
    options: { returnItemOnly?: boolean } = {},
  ) {
    const { returnItemOnly } = options

    forEachDeepEntries(obj, (key, value) => {
      if (isMatch(key)) {
        _add(pageName, { key, value })
        stats[pageName].occurences[key]++
      }
    })

    return returnItemOnly ? stats[pageName] : stats
  }
}

export default getAllKeywordOccurrences
