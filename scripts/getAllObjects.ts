// @ts-nocheck
import fs from 'fs-extra'
import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'
import * as log from './utils/log'
import Aggregator from './modules/Aggregator'
import Saver, { DataOptions } from './modules/Saver'
import { ParseMode, ParseModeModifier } from './types'
import { paths } from './config'

/** Fetches, parses and saves NOODL page objects to the base object dir */
async function getAllObjects({
  dir,
  endpoint,
  parseMode,
  parseModifier = 'default',
}: {
  dir: string
  endpoint: string
  parseMode: ParseMode
  parseModifier: ParseModeModifier
}) {
  const { noodl, noodlui } = await import('./utils/noodl')
  const exts = { [parseMode]: true }
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
      savingPromises.push(...toOptions({ name, type: parseMode }))
      if (index + 1 < coll.length) {
        consoleSaveMsg += `, ${name}`
      } else {
        consoleSaveMsg += `, and ${name} `
      }
    })

    await Promise.all(
      savingPromises.map(async ({ data, filename }) => {
        await saver.save({
          dir: paths[parseMode],
          filename,
          data,
          type: parseMode,
        })
      }),
    )

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

  await fs.remove(dir)
  await fs.ensureDir(path.resolve(dir, 'pages'))

  log.blue(`Recreated the ${parseMode}s directory`)
  log.blank()

  const root = _.assign(
    {},
    _.reduce(
      _.entries(bases.baseItems),
      (acc, [k, v]) => _.assign(acc, { [k]: v.json }),
      {},
    ),
    _.reduce(
      _.entries(pages.hash),
      (acc, [k, v]) => _.assign(acc, { [k]: v }),
      {},
    ),
  )

  let noodlSdk

  await aggregator.initializeMods({ includeBasePages: true })
  await Promise.all(
    pages.pages.map(async (resolvedPage) => {
      const opts = {}

      if (parseModifier === 'ui') {
        if (typeof window !== 'undefined') {
          if (!noodlSdk) {
            const { initializeSdk } = await import('./utils/noodl')
            noodlSdk = await initializeSdk()
          }
          const pagename = resolvedPage.name
          if (pagename) {
            if (!root[pagename]) {
              await noodlSdk.initPage(pagename)
              noodlui.setRoot(noodlSdk.root)
            }
            if (noodlui.getContext().page.name !== pagename) {
              noodlui.setPage({ name: pagename, object: resolvedPage.data })
            }
            await fs.writeJson(
              path.join(paths.json, 'objects/pages/ui'),
              noodlui.resolveComponents(),
              { spaces: 2 },
            )
          }
        } else {
          console.log(
            chalk.redBright(
              `NOTE: typeof window !== 'undefined' returned true, so the ` +
                `output of noodl-ui will not be generated`,
            ),
          )
        }
      }
      await saver.save({
        data: resolvedPage.data,
        dir: path.join(paths[parseMode], 'pages'),
        filename: resolvedPage.name + saver.getExt(),
        type: parseMode,
        ...opts,
      })
      log.green(`Retrieved and saved page ${parseMode}: ${resolvedPage.name}`)
    }),
  )
}

export default getAllObjects

import('./config')
  .then(({ endpoint }) =>
    getAllObjects({
      endpoint: endpoint.config['meet'],
      dir: paths['json'],
      parseMode: 'json',
      parseModifier: 'ui',
    }),
  )
  .catch((err) => {
    throw err
  })
