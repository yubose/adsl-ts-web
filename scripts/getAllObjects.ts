import fs from 'fs-extra'
import chalk from 'chalk'
import path from 'path'
import * as log from './utils/log'
import Aggregator from './modules/Aggregator'
import Saver from './modules/Saver'
import { ParseMode, ParseModeModifier } from './types'
import { paths } from './config'

/** Fetches, parses and saves NOODL page objects to the base object dir */
async function getAllObjects({
  config: configName,
  dir,
  endpoint,
  parseMode,
  parseModifier = 'default',
}: {
  config: string
  dir: string
  endpoint: string
  parseMode: ParseMode
  parseModifier: ParseModeModifier
}) {
  const exts = { [parseMode]: true }
  const saver = new Saver({ dir, exts: { ...exts, yml: false } })
  const aggregator = new Aggregator({
    endpoint,
    ...exts,
    yml: false,
    baseOptions: {
      meta: {
        rootConfig: { label: configName },
        appConfig: { label: 'cadlEndpoint' },
      },
    },
  })
  const { base } = aggregator

  base.onRootConfig = () => {
    log.yellow(
      `Retrieved ${
        base.meta.rootConfig.label
      } config using ${chalk.magentaBright(endpoint)}`,
    )
  }

  base.onNoodlConfig = () => {
    log.yellow(`Retrieved ${base.meta.appConfig.label} config`)
    log.white(`Config version set to ${chalk.yellowBright(base.version)}`)
    log.blank()
  }

  base.onBaseItems = async () => {
    const names = Object.keys(base.items)
    let consoleSaveMsg = `Saving ${base.meta.rootConfig.label} config, ${base.meta.appConfig.label} config`

    names.forEach((name, index, coll) => {
      name && log.green(`Retrieved ${name}`)
      if (index + 1 < coll.length) {
        consoleSaveMsg += `, ${name}`
      } else {
        consoleSaveMsg += `, and ${name} `
      }
    })

    consoleSaveMsg += `to: \n${chalk.magenta(path.normalize(dir))}`

    log.blank()
    log.green(consoleSaveMsg)
    log.blank()
  }

  if (parseModifier !== 'default') {
    if (parseModifier === 'ui') {
      log.blue(
        `The ${chalk.magenta(
          'parseModifier',
        )} option is set to "${chalk.magenta(
          'ui',
        )}", which will include the parsing output from ${chalk.magentaBright(
          'noodl-ui',
        )} for ${chalk.magenta('pages')}`,
      )
    }
  }
  log.blue(`Endpoint set to ${chalk.magentaBright(endpoint)}`)
  log.blue('Cleaning up previous data...')

  // await fs.remove(dir)
  if (parseMode !== 'yml') {
    await fs.ensureDir(path.resolve(dir, 'pages'))
  }

  log.blue(`Recreated the ${parseMode}s directory`)
  log.blank()

  try {
    const items = await aggregator.load({
      includeBasePages: true,
      includePages: true,
    })
    await Promise.all(
      Object.entries(items).map(async ([name, { json: resolvedPage }]) => {
        const opts = {}
        await saver.save({
          data: resolvedPage,
          dir: path.join(
            paths[parseMode],
            /(base|config)/i.test(name) || parseMode === 'yml' ? '' : 'pages',
          ),
          filename: name + saver.getExt(),
          type: parseMode,
          ...opts,
        })
        log.green(`Retrieved and saved page ${parseMode}: ${name}`)
      }),
    )
  } catch (error) {
    if (error.response?.data) {
      console.log(chalk.redBright(error.response.data))
    } else {
      console.log(chalk.redBright(`[${error.name}]: ${error.message}`))
    }
  }
}

export default getAllObjects
