console.clear()
import path from 'path'
import chalk from 'chalk'
import { Command } from 'commander'
import { ConfigId, endpoint, paths } from './config'
import { forEachDeepEntries } from '../src/utils/common'
import { ParseMode, ParseModeModifier } from './types'
import * as log from './utils/log'

const program = new Command('NOODL Scripts')

program.command('eval').action(() => {
  log.attention(
    `Evaluating saved NOODL objects \n   To invoke a different script, use the ` +
      `${chalk.magenta('--mode')} option`,
  )
})

program
  .command('fetch <parseMode> <config> [parseModifier]')
  .action(
    async (
      parseMode: ParseMode = 'json',
      config: ConfigId,
      parseModifier: ParseModeModifier = 'default',
    ) => {
      try {
        if (!['json', 'yml'].includes(parseMode)) {
          throw new Error(
            `Please choose between fetching as "json" or "yml". Example: ` +
              `${chalk.magenta('fetch json')}`,
          )
        }
        log.attention(
          `Fetching NOODL ${parseMode}s using the "${config}" config`,
        )

        const { default: getAllObjects } = await import('./getAllObjects')
        await getAllObjects({
          endpoint: endpoint.get(config),
          dir: paths[parseMode],
          parseMode,
          parseModifier,
        })
      } catch (error) {
        throw error
      }
    },
  )

program
  .command('keys <keyword> <filename> [config]')
  .action(async (keys: string, filename: string, config: string = 'meet') => {
    const keywords = keys.split(',').map((s) => s.trim())

    log.attention(
      `Accumulating results for keywords set to: ${chalk.magentaBright(
        keywords.join(', '),
      )}`,
    )
    const { default: getAllKeywordOccurrences } = await import(
      './getAllKeywordOccurrences'
    )
    await getAllKeywordOccurrences({
      endpoint: endpoint.config[config],
      keywords,
      saveAsFilename: filename,
    })

    log.attention(
      `Saved results to: ${chalk.green(path.join(paths.compiled, filename))}`,
    )
  })

program.command('properties [config]').action(async (config = 'meet') => {
  try {
    log.attention(`Retrieving all properties`)
    const filename = 'properties.json'
    const filepath = path.join(paths.compiled, filename)
    const { default: getAllProperties } = await import('./getAllProperties')
    const { pageCount } = await getAllProperties({
      dir: paths.compiled,
      endpoint: endpoint.config[config],
      filename,
    })
    log.attention(
      `Saved all properties of ${pageCount} pages to ${chalk.magentaBright(
        filepath,
      )}`,
    )
  } catch (error) {
    throw new Error(error)
  }
})

program.command('testfile').action(() => {
  import('./modules/Aggregator')
})

program.command('component-type').action(async () => {
  log.attention('Retrieving all component types')

  const fs = await import('fs-extra')
  const Aggregator = (await import('./modules/Aggregator')).default
  const aggregator = new Aggregator({
    endpoint: endpoint.config['meet'],
    exts: { json: true },
  })

  await aggregator.initializeMods({ includeBasePages: true })
  const allObjects = aggregator.getAllObjects()
  const totalObjects = allObjects.length
  const results: { name: string; results: any[] }[] = []
  for (let index = 0; index < totalObjects; index++) {
    const { name, data: obj } = allObjects[index]
    const result = []
    // @ts-expect-error
    forEachDeepEntries(obj, (key: string, val: any, o: any) => {
      if (o.type) {
        if (
          key === 'type' && // Keep the strings
          typeof val !== 'object' && // Remove the objects
          Number(o.type).toString() === 'NaN' // Remove the numbers
        ) {
          result.push(o.type)
        }
      }
    })
    results.push({ name, results: result.sort() })
    log.yellow(`Saved ${chalk.magenta(results.length)} component types`)
  }

  await fs.writeJson(
    path.join(paths.compiled, 'component-types.json'),
    {
      combinations: results
        .reduce((acc, { results: items }) => {
          items.forEach((componentType) => {
            if (!acc.includes(componentType)) {
              acc.push(componentType)
            }
          })
          return acc
        }, [])
        .sort(),
      pages: results,
    },
    { spaces: 2 },
  )

  log.blank()
  log.yellow(`Processed ${results.length || 0} pages`)
})

// program.command('ui <name>').action(async (name: 'parseprops') => {
//   log.attention('Extracting parsed component props')

//   const pageName = 'VideoChat'

//   const saveTo = path.resolve(`${paths._dev_}/compiled`, 'props.json')

//   try {
//     await cadl.init()
//     console.log('HELLO!!!!!!')

//     await cadl.initPage(pageName, [])

//     await getPageComponents(cadl.root[pageName])

//     log.attention(`Parsed props save to: ${chalk.magentaBright(saveTo)}`)
//   } catch (error) {
//     console.error(error)
//   }
// })

program.parse()
