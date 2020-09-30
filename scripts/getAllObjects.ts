import fs from 'fs-extra'
import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'
import * as log from './utils/log'
import Aggregator from './modules/Aggregator'
import Saver, { DataOptions } from './modules/Saver'
import { paths } from './config'

// TODO: fix saving yml

export interface GetAllNOODLObjectsOptions {
  parseAs: 'json' | 'yml'
  endpoint: string
  dir: string
}

/** Fetches, parses and saves NOODL page objects to the base object dir */
async function getAllObjects({
  parseAs,
  endpoint,
  dir,
}: GetAllNOODLObjectsOptions) {
  const exts = { [parseAs]: true }
  const saver = new Saver({ dir, exts })
  const aggregator = new Aggregator({ endpoint, exts })
  const bases = aggregator.getBasesMod()
  const pages = aggregator.getPagesMod()

  bases.onRootConfig = () => {
    log.yellow(`Retrieved root config using ${chalk.magentaBright(endpoint)}`)
  }

  bases.onNoodlConfig = () => {
    log.yellow(`Retrieved noodl config`)
    log.white(`Config version set to ${chalk.yellowBright(bases.version)}`)
    log.blank()
  }

  bases.onBaseItems = async () => {
    const names = _.keys(bases.baseItems)
    const savingPromises = []
    let consoleSaveMsg = `Saved rootConfig, noodlConfig`

    const toOptions = ({
      name,
      type,
    }: Pick<DataOptions, 'type'> & { name: string }) => [
      { data: bases.baseItems[name][type], filename: `${name}.${type}`, name },
      { data: bases.rootConfig[type], filename: `rootConfig.${type}`, name },
      { data: bases.noodlConfig[type], filename: `noodlConfig.${type}`, name },
    ]

    _.forEach(names, (name, index, coll) => {
      name && log.green(`Retrieved ${name}`)
      savingPromises.push(...toOptions({ name, type: parseAs }))
      if (index + 1 < coll.length) {
        consoleSaveMsg += `, ${name}`
      } else {
        consoleSaveMsg += `, and ${name} `
      }
    })

    await Promise.all(
      savingPromises.map(async ({ data, filename }) => {
        await saver.save({ dir: paths[parseAs], filename, data, type: parseAs })
      }),
    )

    consoleSaveMsg += `to: \n${chalk.magenta(path.normalize(dir))}`

    log.blank()
    log.green(consoleSaveMsg)
    log.blank()
  }

  log.blue(`Endpoint set to ${chalk.magentaBright(endpoint)}`)
  log.blue('Cleaning up previous data...')

  await fs.remove(dir)
  await fs.ensureDir(path.resolve(dir, 'pages'))

  log.blue(`Recreated the ${parseAs}s directory`)
  log.blank()

  await aggregator.initializeMods({ includeBasePages: true })
  await Promise.all(
    pages.pages.map(async (resolvedPage) => {
      await saver.save({
        data: resolvedPage.data,
        dir: path.join(paths[parseAs], 'pages'),
        filename: resolvedPage.name + saver.getExt(),
        type: parseAs,
      })
      log.green(`Retrieved and saved page ${parseAs}: ${resolvedPage.name}`)
    }),
  )
}

export default getAllObjects
