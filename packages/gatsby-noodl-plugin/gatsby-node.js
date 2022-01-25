/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 * https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/
 */
const axios = require('axios').default
const u = require('@jsmanifest/utils')
const log = require('loglevel')
const curry = require('lodash/curry')
const camelCase = require('lodash/camelCase')
const upperFirst = require('lodash/upperFirst')
const fs = require('fs-extra')
const nt = require('noodl-types')
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

log.setDefaultLevel('INFO')

const NOODL_PAGE_NODE_TYPE = 'NoodlPage'

function unstable_shouldOnCreateNode({ node }) {
  if (node.internal.mediaType === `text/yaml`) {
    log.info(`mediaType`, node)
    return true
  }
  return false
}

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
  appKey: '',
  appConfigLink: '',
  appConfigJson: null,
  cadlBaseUrl: '',
  configKey: '',
  configVersion: '',
  configJson: null,
  myBaseUrl: '',
  pages: {
    preload: {},
    app: {},
  },
}

exports.unstable_shouldOnCreateNode = unstable_shouldOnCreateNode

/**
 * https://www.gatsbyjs.com/docs/node-apis/
 */

/**
 * @argument { import('gatsby').NodePluginArgs } args
 * @argument { PluginOptions } pluginOptions
 */
exports.onPreInit = (args, pluginOptions) => {
  const { loglevel } = pluginOptions

  if (
    u.isStr(loglevel) &&
    loglevel !== 'INFO' &&
    LOGLEVELS.includes(loglevel)
  ) {
    log.setLevel(loglevel)
  }

  // Replaces backlashes for windows support
  for (const key of ['path', 'pageTemplate']) {
    if (pluginOptions[key]) {
      pluginOptions[key] = pluginOptions[key].replaceAll('\\', '/')
    }
  }
}

/**
 * @param { import('gatsby').NodePluginArgs } args
 * @param { PluginOptions } pluginOptions
 */
exports.onPluginInit = async function onPluginInit(args, pluginOptions) {
  const { cache } = args
  const { config = 'aitmed', path } = pluginOptions || {}

  log.debug(`Config key: ${config}`)
  log.debug(`Output path: ${path}`)

  data.configKey = config
  data.configUrl = ensureYmlExt(`${BASE_CONFIG_URL}${config}`)

  await cache.set('configKey', data.configKey)
  await cache.set('configUrl', data.configUrl)
}

/**
 * @param { import('gatsby').CreateNodeArgs } args
 * @param { PluginOptions } pluginOptions
 */
exports.onCreateNode = async function onCreateNode(args, pluginOptions) {
  // const { node, actions, loadNodeContent, createNodeId, createContentDigest } =
  //   args
  // if (!unstable_shouldOnCreateNode({ node })) {
  //   return
  // }
  // const content = await loadNodeContent(node)
}

/**
 * @param { import('gatsby').SourceNodesArgs } args
 * @param { PluginOptions } pluginOptions
 */
exports.sourceNodes = async (args, pluginOptions) => {
  const { actions, cache, createContentDigest, createNodeId } = args

  const { createNode } = actions

  log.debug(`Fetching noodl config from ${await cache.get('configUrl')}`)

  const { data: configYml } = await axios.get(data.configUrl)

  log.debug(`Noodl config fetched`)

  data.configJson = y.parse(configYml)

  log.debug(`Parsed noodl config`)

  data.appKey = data.configJson.cadlMain.replace('.yml', '')
  await cache.set('appKey', data.appKey)

  log.debug(`Noodl app key: ${data.appKey}`)

  data.configVersion = getConfigVersion(data.configJson)
  await cache.set('configVersion', data.configVersion)

  log.debug(`Noodl config version set to: ${data.configVersion}`)

  log.info({
    cadlBaseUrl: data.cadlBaseUrl,
    cadlVersion: data.configVersion,
    designSuffix: data.configJson.designSuffix,
  })

  const replacePlaceholders = nu.createNoodlPlaceholderReplacer({
    cadlBaseUrl: data.configJson.cadlBaseUrl,
    cadlVersion: data.configVersion,
    designSuffix: '',
  })

  data.cadlBaseUrl = replacePlaceholders(data.configJson.cadlBaseUrl)
  await cache.set('cadlBaseUrl', data.cadlBaseUrl)

  log.debug(`Parsed noodl placeholder(s) in cadlBaseUrl`)

  if (data.configJson.myBaseUrl) {
    data.myBaseUrl = replacePlaceholders(data.configJson.myBaseUrl)
    await cache.set('myBaseUrl', data.myBaseUrl)
    log.debug(`Parsed myBaseUrl in noodl config`)
  }

  data.appConfigLink = replacePlaceholders(
    ensureYmlExt(data.cadlBaseUrl + data.appKey),
  )

  await cache.set('appConfigLink', data.appConfigLink)

  log.debug(`Link to noodl app config yml: ${data.appConfigLink}`)
  log.debug(`Noodl app key: ${data.appKey}`)
  log.debug(`Retrieving noodl app config`)

  const { data: appYml } = await axios.get(data.appConfigLink)

  log.debug(`Retrieved noodl app config`)

  data.appConfigJson = y.parse(appYml)

  log.debug(`Parsed noodl app config`)

  const { preload = [], page: pages = [] } = data.appConfigJson

  log.debug(
    `There are ${preload.length} noodl pages to preload and ${pages.length} pages to load afterwards`,
  )

  {
    const toMapping = (arr = []) =>
      u.reduce(arr, (acc, key) => u.assign(acc, { [key]: '' }), {})

    data.pages.preload = toMapping(preload)
    data.pages.app = toMapping(pages)

    await cache.set('preload', data.pages.preload)
    await cache.set('pages', data.pages.app)
  }

  data.assetsUrl = replaceNoodlPlaceholders(data.appConfigJson.assetsUrl)
  await cache.set('assetsUrl', data.assetsUrl)

  log.debug(`Noodl assetsUrl: ${data.assetsUrl}`)

  log.debug(data)

  await Promise.all(
    [...u.keys(data.pages.preload), ...u.keys(data.pages.app)].map(
      async (name) => {
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

          const pagesKey = name in data.pages.preload ? 'preload' : 'app'
          data.pages[pagesKey][name] = yml

          await cache.set(`pages.${pagesKey}.${name}`, yml)

          const json = y.parse(yml)

          createNode({
            name,
            slug: `/${name}/`,
            content: JSON.stringify(json),
            isPreload: pagesKey === 'preload',
            id: createNodeId(`noodl_${name}`),
            children: [],
            internal: {
              contentDigest: createContentDigest(yml),
              type: NOODL_PAGE_NODE_TYPE,
            },
          })
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          if (axios.isAxiosError(err)) {
            const errResp = err.response
            console.log({
              name: err.name,
              message: err.message,
              respData: errResp.data,
              respStatus: errResp.status,
              respStatusText: errResp.statusText,
              req: errResp.request,
              reqConfig: errResp.config,
              reqHeaders: errResp.headers,
            })
          } else {
            throw err
          }
        }
      },
    ),
  )
}

/**
 * @param { import('gatsby').CreatePagesArgs } args
 * @param { PluginOptions } pluginOptions
 */
exports.createPages = async function createPages(args, pluginOptions) {
  try {
    const { actions, cache, graphql } = args
    const { createPage } = actions

    const {
      data: { allNoodlPage },
      errors,
    } = await graphql(`
      {
        allNoodlPage {
          nodes {
            name
            slug
            content
            isPreload
            id
          }
        }
      }
    `)

    if (errors) {
      throw new Error(errors)
    } else {
      log.info(`Creating ${data?.allNoodlPage?.nodes?.length} pages`)

      const { getGoto, nui, page, pages, sdk, transform } = await getGenerator({
        configKey: data.configKey,
        on: {
          createComponent(comp, opts) {
            const path = opts.path || []
            traverse(comp.blueprint, path)
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
        use: {
          // config: data.configJson,
          appConfig: data.appConfigJson,
          pages: {
            preload: u.reduce(
              u.entries(data.pages.preload),
              (acc, [name, yml]) => {
                acc[name] = y.parse(yml)
                return acc
              },
              {},
            ),
            app: u.reduce(
              u.entries(data.pages.app),
              (acc, [name, yml]) => {
                acc[name] = y.parse(yml)
                return acc
              },
              {},
            ),
          },
          viewport: { width: 1024, height: 768 },
        },
        startPage: 'HomePage',
      })

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
       * @param { nt.ComponentObject[] } componentObjects
       */
      const generateComponents = async (componentObjects) => {
        const paths = []

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
            const transformedComponent = await transform(componentsList[index])
            components.push(transformedComponent.toJSON())
          }
          return components
        }

        const transformedComponents = await transformAllComponents(
          componentObjects,
        )

        // for (let path of paths) {
        //   let builtInKey = ''
        //   let indexOfBuiltInKey = path.indexOf('builtIn')

        //   if (indexOfBuiltInKey > -1) {
        //     builtInKey = path.substring(indexOfBuiltInKey)
        //     path = path.substring(0, indexOfBuiltInKey - 1)
        //   }

        // path = [
        //   ...path.split('.'),
        //   ...(builtInKey ? [`${BUILTIN_EVAL_TOKEN}${builtInKey}`] : []),
        // ]

        // log.debug(has(components, path), path)
        // log.debug(get(components, path))
        // }

        log.info(`${'Components generated'}`)
        return transformedComponents
      }

      await Promise.all(
        u.entries(pages)?.map(async ([pageName, pageObject]) => {
          if (pageName in data.pages.app) {
            pageObject.components = await generateComponents(
              pageObject.components,
            )

            createPage({
              path: node.slug,
              component: pluginOptions.pageTemplate,
              context: {
                pageName: node.name,
                pageObject,
                slug: node.slug,
                isPreload: node.isPreload,
              },
            })
          }
        }) || [],
      )

      // await Promise.all(
      //   allNoodlPage?.nodes?.map(async (node) => {
      //     if (node.name in data.pages.app) {
      //       const pageObject = JSON.parse(node.content)?.[node.name] || {}

      //       pageObject.components = await generateComponents(
      //         pageObject.components,
      //       )

      //       createPage({
      //         path: node.slug,
      //         component: pluginOptions.pageTemplate,
      //         context: {
      //           pageName: node.name,
      //           pageObject,
      //           slug: node.slug,
      //           isPreload: node.isPreload,
      //         },
      //       })
      //     }
      //   }) || [],
      // )
    }
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

  // if (page.path === '/') {
  //   page.
  //   log.info({ page })
  //   page.
  //   deletePage(page)
  //   createPage({
  //     ...page,
  //     context: {
  //       ...page.context,
  //       components: await fs.readJson(
  //         path.join(
  //           __dirname,
  //           '../homepage/src/resources/data/homepage-components.json',
  //         ),
  //       ),
  //     },
  //   })
  // }
}
