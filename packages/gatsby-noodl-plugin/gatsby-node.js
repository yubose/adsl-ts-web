/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 * https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/
 */
const axios = require('axios').default
const u = require('@jsmanifest/utils')
const log = require('loglevel')
const curry = require('lodash/curry')
const fs = require('fs-extra')
const nu = require('noodl-utils')
const has = require('lodash/has')
const get = require('lodash/get')
const set = require('lodash/set')
const path = require('path')
const y = require('yaml')
const { getGenerator, monkeyPatchAddEventListener } = require('./generator')
const {
  ensureYmlExt,
  getConfigVersion,
  replaceNoodlPlaceholders,
} = require('./utils')

/**
 * @typedef PluginOptions
 * @property { import('../homepage/node_modules/gatsby').PluginOptions['plugins'] } options.plugins
 * @property { string } [options.config]
 * @property { string } [options.configPrefix]
 * @property { string } [options.configVersion]
 * @property { 'error' | 'debug' | 'info' | 'silent' | 'trace' | 'warn' } [options.loglevel]
 * @property { string } [options.path]
 */

const BUILTIN_EVAL_TOKEN = '=.'
const BASE_CONFIG_URL = `https://public.aitmed.com/config/`
const LOGLEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent']

const data = {
  configKey: '',
  configUrl: '',
  configVersion: '',
  appKey: '',
  path: '',
}

exports.data = data

/**
 * https://www.gatsbyjs.com/docs/node-apis/
 */

/**
 * @argument { PluginOptions } pluginOptions
 */
exports.onPreInit = (args, pluginOptions) => {
  log.debug(`[onPreInit] args`, { args, pluginOptions })
  const { config = 'aitmed', loglevel, path } = pluginOptions || {}

  if (loglevel && u.isStr(loglevel) && LOGLEVELS.includes(loglevel)) {
    log.setLevel(loglevel.toUpperCase())
  } else {
    log.setLevel('INFO')
  }

  log.debug(`Config key: ${config}`)
  log.debug(`Output path: ${path}`)

  data.configKey = config
  data.configUrl = ensureYmlExt(`${BASE_CONFIG_URL}${config}`)
  data.path = path
}

/**
 *
 * @param { Gatsby.SourceNodesArgs } args
 * @param { PluginOptions } pluginOptions
 */
exports.sourceNodes = async (args, pluginOptions) => {
  const {
    actions,
    cache,
    createContentDigest,
    createNodeId,
    schema,
    store,
    graphql,
    reporter,
    traceId,
    tracing,
  } = args

  log.debug(`Fetching config from ${data.configUrl}`)

  const { data: configYml } = await axios.get(data.configUrl)

  log.debug(`Config fetched`)

  const configJson = y.parse(configYml)

  log.debug(`Parsed config`)

  data.appKey = configJson.cadlMain.replace('.yml', '')
  log.debug(`App key: ${configJson.cadlMain}`)

  data.configVersion = getConfigVersion(configJson)
  log.debug(`Config version set to: ${data.configVersion}`)

  log.info({
    cadlBaseUrl: configJson.cadlBaseUrl,
    cadlVersion: data.configVersion,
    designSuffix: configJson.designSuffix,
  })

  const replacePlaceholders = nu.createNoodlPlaceholderReplacer({
    cadlBaseUrl: configJson.cadlBaseUrl,
    cadlVersion: data.configVersion,
    designSuffix: '',
  })

  data.cadlBaseUrl = replacePlaceholders(configJson.cadlBaseUrl)

  log.debug(`Parsed placeholder(s) in cadlBaseUrl`)

  if (configJson.myBaseUrl) {
    data.myBaseUrl = replacePlaceholders(configJson.myBaseUrl)
    log.debug(`Parsed myBaseUrl`)
  }

  const appConfigLink = replacePlaceholders(
    ensureYmlExt(data.cadlBaseUrl + data.appKey),
  )

  log.debug(data)
  log.debug(`Link to app config yml: ${appConfigLink}`)
  log.debug(`App key: ${data.appKey}`)
  log.debug(`Retrieving app config`)

  const { data: appYml } = await axios.get(appConfigLink)

  log.debug(`Retrieved app config`)

  const appConfigJson = y.parse(appYml)

  log.debug(`Parsed app config`)

  const { preload = [], page: pages = [] } = appConfigJson

  log.debug(
    `There are ${preload.length} pages to preload and ${pages.length} pages to load afterwards`,
  )

  const assetsUrl = replaceNoodlPlaceholders(appConfigJson.assetsUrl)

  log.debug(`assetsUrl: ${assetsUrl}`)

  await Promise.all(
    [...preload, ...pages].map(async (name) => {
      try {
        const filename = ensureYmlExt(`${name}_en`)
        const dlLink = `${data.cadlBaseUrl}${filename}`

        log.debug(`Fetching ${name} from ${dlLink}`)

        const { data: yml } = await axios.get(dlLink, {
          onDownloadProgress: (progress) => {
            console.log({ progress })
          },
          responseType: 'text',
        })

        log.info(`Retrieved ${filename}`)
        const json = y.parse(yml)
      } catch (error) {
        u.logError(error)
      }
    }),
  )

  const { createPage, createNode, createNodeField } = actions

  /** @type { any[] } */
  const components = await fs.readJson(
    path.join(
      __dirname,
      '../homepage/src/resources/data/homepage-components.json',
    ),
  )

  log.debug(`[sourceNodes] Loaded ${components.length} components`, components)

  components.forEach((component) => {
    //
  })

  try {
    const getTraverse = curry(
      /**
       * @param { (key: string, value: any, parent: Record<string, any>) => void } cb
       * @param { import('noodl-types').ComponentObject } bp
       */
      (cb, bp, path = []) => {
        if (u.isObj(bp)) {
          const entries = u.entries(bp)
          const numEntries = entries.length
          for (let index = 0; index < numEntries; index++) {
            const [key, value] = entries[index]
            cb(key, value, bp, path.concat(key))
            getTraverse(cb, value, path.concat(key))
          }
        } else if (u.isArr(bp)) {
          bp.forEach((b, i) => getTraverse(cb, b, path.concat(i)))
        }
      },
    )

    log.info(`${'Generating components'}`)

    const { components, getGoto, nui, page, sdk, transform } =
      await getGenerator({
        configKey: 'www',
        on: {
          createComponent(comp, opts) {
            // const componentLabel = `[${comp.type}]`
            const path = opts.path || []
            traverse(comp.blueprint, path)
            // const logArgs = [
            //   comp.type,
            //   opts.parent?.type || '',
            //   u.isNum(opts?.index) ? opts.index : null,
            // ]
            // if (u.isStr(comp.blueprint.path)) logArgs.push(comp.blueprint.path)
            // else if (comp.blueprint.viewTag)
            //   logArgs.push(comp.blueprint.viewTag)
            // console.log(logArgs)
            // if (comp.blueprint.onClick) {
            //   let goto = getGoto(comp.blueprint.onClick)
            //   if (goto) {
            //     if ('goto' in goto) {
            //       comp.set('onClick', { actions: [goto], trigger: 'onClick' })
            //     }
            //   }
            // }
          },
          patch: u.reduce(
            ['addEventListener', 'removeEventListener'],
            (acc, evtName) => {
              /**
               * @argument { object } args
               * @param { boolean } args.wasPatched
               */
              acc[evtName] = function (args) {
                let label = ''

                label += u.yellow('EventTarget')
                label += u.magenta('#')
                label += u.white(evtName)

                args.wasPatched
                  ? log.debug(`${label} is already patched.`)
                  : log.debug(`${label} ${u.green('patched!')}`)
              }
              return acc
            },
            {},
          ),
        },
        startPage: 'HomePage',
        viewport: { width: 1024, hight: 768 },
      })

    const paths = []

    const traverse = getTraverse((key, value, parent, path) => {
      if (key.startsWith('=.builtIn')) {
        // key = key.replace(BUILTIN_EVAL_TOKEN, '')
        path[path.length - 1] = key.replace(BUILTIN_EVAL_TOKEN, '')
        const pathStr = path.join('.')
        paths.push(pathStr)

        // log([key, value, parent, pathStr])

        if (u.isObj(value)) {
          try {
            // const processed = sdk.processPopulate({
            //   source: value,
            //   lookFor: ['.', '..', '=', '~'],
            //   pageName: 'HomePage',
            //   withFns: false,
            // })
            // console.dir(processed, { depth: Infinity })
            // return processed
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error))
            log.error(
              `[key:${key}-${u.yellow(err.name)}] ${u.red(err.message)}`,
              value,
            )
          }
        }
      }
    })

    /**
     *
     * @param { nt.ComponentObject | nt.ComponentObject[] } value
     * @returns { Promise<import('./generator').NuiComponent[] }
     */
    async function transformAllComponents(value) {
      const components = []
      const componentsList = u.filter(Boolean, u.array(value))
      const numComponents = componentsList.length
      for (let index = 0; index < numComponents; index++) {
        components.push(await transform(componentsList[index], index))
      }
      return components
    }

    const transformedComponents = await transformAllComponents(components)

    log.debug(components)

    for (let path of paths) {
      let builtInKey = ''
      let indexOfBuiltInKey = path.indexOf('builtIn')
      if (indexOfBuiltInKey > -1) {
        builtInKey = path.substring(indexOfBuiltInKey)
        path = path.substring(0, indexOfBuiltInKey - 1)
      }

      path = [
        ...path.split('.'),
        ...(builtInKey ? [`${BUILTIN_EVAL_TOKEN}${builtInKey}`] : []),
      ]

      log.debug(has(components, path), path)
      log.debug(get(components, path))
    }

    await fs.writeJson(
      path.resolve(
        path.join(
          process.cwd(),
          './src/resources/data/homepage-components.json',
        ),
      ),
      transformedComponents,
      { spaces: 2 },
    )

    log.info(`${'Components generated'}`)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

/** @argument { import('gatsby').CreatePageArgs } args */
exports.onCreatePage = async (args) => {
  const {
    page,
    actions,
    cache,
    getNode,
    getNodes,
    getNodesByType,
    loadNodeContent,
    store,
  } = args
  const { createPage, deletePage } = actions

  if (page.path === '/') {
    deletePage(page)
    createPage({
      ...page,
      context: {
        ...page.context,
        components: await fs.readJson(
          path.join(
            __dirname,
            '../homepage/src/resources/data/homepage-components.json',
          ),
        ),
      },
    })
  }
}
