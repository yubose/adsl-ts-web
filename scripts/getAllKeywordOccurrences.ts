import _ from 'lodash'
import chalk from 'chalk'
import { DescriptiveItem } from './utils/filesystem'
import { paths } from './config'
import { createObjWithKeys, createRegexpByKeywords } from './utils/common'
import * as log from './utils/log'
import Bases from './modules/Bases'
import Pages from './modules/Pages'
import Saver from './modules/Saver'
import { forEachDeepEntries } from '../src/utils/common'

export interface GenerateStatsForKeywordsOptions {
  endpoint: string
  keywords: string[]
  saveAsFilename: string
}

async function getAllKeywordOccurrences({
  endpoint,
  keywords,
  saveAsFilename,
}: GenerateStatsForKeywordsOptions) {
  try {
    const accumulate = createAccumulator(keywords)
    const bases = new Bases({ exts: { json: true }, endpoint })
    const saver = new Saver({ exts: { json: true } })
    let pages: Pages

    bases.onRootConfig = () => {
      log.yellow(`Retrieved rootConfig using ${chalk.magentaBright(endpoint)}`)
    }

    bases.onNoodlConfig = () => {
      log.yellow(
        `Retrieved noodl config from ${chalk.magentaBright(
          bases.noodlEndpoint,
        )}`,
      )
      log.white(`Config version set to ${chalk.yellowBright(bases.version)}`)
      log.blank()
    }

    bases.onBaseItems = () => {
      _.forEach(_.keys(bases.baseItems), (name) => {
        name && log.green(`Retrieved ${name}`)
      })
    }

    log.blue(`Endpoint set to ${chalk.magentaBright(endpoint)}`)
    log.blank()

    await bases.load({ includeBasePages: true })

    const noodlConfig = bases.getNoodlConfig()

    pages = new Pages({
      endpoint: bases.noodlBaseUrl,
      exts: { json: true },
      pages: noodlConfig.page || [],
      baseUrl: bases.noodlBaseUrl,
    })

    const resolvedPages = await pages.load()
    const totalObjects = _.add(
      _.keys(bases.baseItems).length,
      resolvedPages.length,
    )

    log.blank()
    log.blue(
      `Retrieved ${chalk.magentaBright(
        resolvedPages.length,
      )} noodl page objects --- ${chalk.magentaBright(
        totalObjects,
      )} noodl objects in total`,
    )
    log.blank()

    const allObjects = _.map(_.entries(bases.baseItems), ([key, value]) => ({
      data: value,
      filename: key,
      filepath: '',
    })).concat(
      _.map(resolvedPages, (obj) => ({
        data: obj.data,
        filename: obj.name,
        filepath: obj.url,
      })),
    )

    let output = {}
    let result: any
    let pageName: string

    for (let index = 0; index < totalObjects; index++) {
      const obj: DescriptiveItem = allObjects[index]
      pageName = obj.filename.replace(/\.(json|yml)/i, '')
      result = accumulate(pageName, obj, { returnItemOnly: true })
      if (result) {
        output[pageName] = result
        log.green(`Processed page ${chalk.magentaBright(pageName)} `)
      }
    }

    await saver.save({
      data: output,
      dir: paths.compiled,
      filename: saveAsFilename,
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
