/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 * https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/
 */
const axios = require('axios').default
const u = require('@jsmanifest/utils')
const { publish } = require('noodl-ui')
const log = require('loglevel')
const fs = require('fs-extra')
const nt = require('noodl-types')
const get = require('lodash/get')
const set = require('lodash/set')
const path = require('path')
const n = require('noodl')
const y = require('yaml')
const getGenerator = require('./generator')
const GatsbyPluginNoodlCache = require('./Cache')
const utils = require('./utils')

const DEFAULT_BUILD_SOURCE = 'remote'
const DEFAULT_CONFIG = 'aitmed'
const DEFAULT_DEVICE_TYPE = 'web'
const DEFAULT_ECOS_ENV = 'stable'
const DEFAULT_LOG_LEVEL = 'INFO'
const DEFAULT_OUTPUT_PATH = 'output'
const DEFAULT_SRC_PATH = './src'
const DEFAULT_TEMPLATE_PATH = path.join(DEFAULT_SRC_PATH, 'resources/assets')
const DEFAULT_VIEWPORT_WIDTH = 1024
const DEFAULT_VIEWPORT_HEIGHT = 768
const NOODL_PAGE_NODE_TYPE = 'NoodlPage'

log.setDefaultLevel(DEFAULT_LOG_LEVEL)

/**
 * @typedef GatsbyNoodlPluginOptions
 * @type { import('./types').GatsbyNoodlPluginOptions }
 */

const BASE_CONFIG_URL = `https://public.aitmed.com/config/`
const LOGLEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent']

/** @type { GatsbyPluginNoodlCache } */
let cache
/** @type { n.Loader } */
let loader

const data = {
  _assets_: [],
  cwd: '',
  _context_: {},
  _loggedAssets_: [],
  _preloadKeys_: [],
  _pageKeys_: [],
  _pages_: {
    json: {},
    serialized: {},
  },
  _paths_: {
    output: '',
    src: '',
    template: '',
  },
  appKey: '',
  buildSource: '',
  configKey: '',
  configUrl: '',
  deviceType: '',
  loglevel: DEFAULT_LOG_LEVEL,
  ecosEnv: '',
  startPage: '',
  template: '',
}

let isFileSystemOutput = false

const resolvedPaths = {
  assetsDir: '',
  configFile: '',
  appConfigFile: '',
  outputNamespacedWithConfig: '',
}

/**
 * https://www.gatsbyjs.com/docs/node-apis/
 */

/**
 * @argument { import('gatsby').NodePluginArgs } _
 * @argument { GatsbyNoodlPluginOptions } pluginOptions
 */
exports.onPreInit = (_, pluginOptions) => {
  u.newline()
  const loglevel = pluginOptions?.loglevel

  if (
    u.isStr(loglevel) &&
    loglevel !== DEFAULT_LOG_LEVEL &&
    LOGLEVELS.includes(loglevel)
  ) {
    log.setLevel(loglevel)
  }

  // Replaces backlashes for windows support
  for (const key of ['path', 'template']) {
    if (pluginOptions[key]) {
      pluginOptions[key] = pluginOptions[key].replace(/\\/g, '/')
    }
  }

  console.log('hello1')
}

/**
 * @param { import('gatsby').NodePluginArgs } args
 * @param { GatsbyNoodlPluginOptions } pluginOptions
 */
exports.onPluginInit = async function onPluginInit(args, pluginOptions) {
  console.log('hello2')
  cache = new GatsbyPluginNoodlCache(args.cache)

  const {
    buildSource = DEFAULT_BUILD_SOURCE,
    cwd = process.cwd(),
    config = DEFAULT_CONFIG,
    deviceType = DEFAULT_DEVICE_TYPE,
    ecosEnv = DEFAULT_ECOS_ENV,
    loglevel = DEFAULT_LOG_LEVEL,
    paths,
    version = 'latest',
  } = pluginOptions || {}

  let outputPath = paths?.output

  const {
    src: srcPath = DEFAULT_SRC_PATH,
    template: templatePath = DEFAULT_TEMPLATE_PATH,
  } = paths || {}

  if (outputPath) isFileSystemOutput = true
  else outputPath = DEFAULT_OUTPUT_PATH

  data.cwd = cwd
  data.configKey = config
  data.configUrl = utils.ensureExt(`${BASE_CONFIG_URL}${config}`, 'yml')
  data.deviceType = deviceType
  data.ecosEnv = ecosEnv

  data._paths_.output = outputPath
  data._paths_.src = srcPath
  data._paths_.template = templatePath

  if (data.loglevel !== loglevel) data.loglevel = loglevel

  log.debug(`Build source: ${u.yellow(buildSource)}`)
  log.debug(`Current working directory: ${u.yellow(data.cwd)}`)
  log.debug(`Config key: ${u.yellow(data.configKey)}`)
  log.debug(`Config url: ${u.yellow(data.configUrl)}`)
  log.debug(`Device type: ${u.yellow(data.deviceType)}`)
  log.debug(`Ecos environment: ${u.yellow(data.ecosEnv)}`)
  log.debug(`Log level set to: ${u.yellow(data.loglevel)}`)
  log.debug(`Template path: ${u.yellow(data._paths_.template)}`)

  resolvedPaths.outputNamespacedWithConfig = utils.getConfigDir(
    data._paths_.output,
    data.configKey,
  )
  resolvedPaths.assetsDir = path.join(
    resolvedPaths.outputNamespacedWithConfig,
    'assets',
  )
  resolvedPaths.configFile = path.join(
    resolvedPaths.outputNamespacedWithConfig,
    utils.ensureExt(data.configKey, 'yml'),
  )

  // TODO - Implementing build caching
  // await cache.set('configKey', data.configKey)
  // await cache.set('configUrl', data.configUrl)
  // if (version && version !== 'latest') await cache.set('configVersion', version)

  if (isFileSystemOutput) {
    if (!fs.existsSync(data._paths_.output)) {
      await fs.ensureDir(data._paths_.output)
      log.debug(`Created output directory at ${u.yellow(data._paths_.output)}`)
    } else {
      log.debug(`Output path: ${u.yellow(data._paths_.output)}`)
    }

    log.debug(
      `Yaml files will be located at ${u.yellow(
        resolvedPaths.outputNamespacedWithConfig,
      )}`,
    )
  }

  if (!fs.existsSync(resolvedPaths.assetsDir)) {
    await fs.ensureDir(resolvedPaths.assetsDir)
    log.debug(`Created assets directory`)
  }

  log.debug(`Assets will be located at ${u.yellow(resolvedPaths.assetsDir)}`)

  if (!fs.existsSync(resolvedPaths.configFile)) {
    const url = utils.getConfigUrl(data.configKey)

    log.info(
      `You are missing the config file ${u.yellow(
        utils.ensureExt(data.configKey),
      )}. It will be downloaded to ${resolvedPaths.configFile}`,
    )

    log.debug(`Fetching config from ${u.yellow(url)}`)

    const yml = await utils.fetchYml(url)
    n.writeFileSync(resolvedPaths.configFile, yml)
  }

  const rootConfig = y.parse(n.readFileSync(resolvedPaths.configFile))

  data.appKey = rootConfig?.cadlMain || ''

  if (!rootConfig) {
    throw new Error(`Could not load a config file both locally and remotely`)
  }

  resolvedPaths.appConfigFile = path.join(
    resolvedPaths.outputNamespacedWithConfig,
    data.appKey,
  )

  loader = new n.Loader({
    config: data.configKey,
    dataType: 'object',
    deviceType: data.deviceType,
    // TODO - This option is not working
    env: data.ecosEnv,
    loglevel: data.loglevel || 'verbose',
    version,
  })

  loader.env = data.ecosEnv

  await loader.loadRootConfig({
    dir: resolvedPaths.outputNamespacedWithConfig,
    config: data.configKey,
  })

  log.debug(
    `Loaded root config. Loading app config using key: ${u.yellow(
      data.appKey,
    )} at ${u.yellow(loader.appConfigUrl)}`,
  )

  const appConfigYml = await utils.fetchYml(loader.appConfigUrl)
  data._pages_.json[data.appKey] = y.parse(appConfigYml)

  if (!fs.existsSync(resolvedPaths.appConfigFile)) {
    n.writeFileSync(resolvedPaths.appConfigFile, appConfigYml)
    log.debug(`Saved app config to ${u.yellow(resolvedPaths.appConfigFile)}`)
  }

  for (const key of ['preload', 'page']) {
    if (u.isArr(data._pages_.json[data.appKey]?.[key])) {
      const property = key === 'preload' ? '_preloadKeys_' : '_pageKeys_'
      data[property]?.push?.(...data._pages_.json[data.appKey][key])
    }
  }

  const filesDir = resolvedPaths.outputNamespacedWithConfig
  const { appConfigUrl } = loader

  // TODO - Check if we still need this part
  for (const filepath of [
    resolvedPaths.configFile,
    resolvedPaths.appConfigFile,
  ]) {
    const type = filepath === resolvedPaths.configFile ? 'root' : 'app'
    if (!fs.existsSync(filepath)) {
      const msg = `The ${u.magenta(type)} config file at ${u.yellow(
        filepath,
      )} does not exist`
      log.error(msg)
      process.exit(0)
    }

    if (!loader.hasInRoot(data.appKey)) {
      await loader.loadAppConfig({
        dir: filesDir,
        fallback: () =>
          utils.downloadFile(
            log,
            appConfigUrl,
            utils.ensureExt(data.appKey, 'yml'),
            resolvedPaths.outputNamespacedWithConfig,
          ),
      })
    }
  }

  log.debug(`Checking directory for page files`)

  const getPageUrl = (s) =>
    loader.appConfigUrl.replace(
      'cadlEndpoint.yml',
      utils.ensureExt(s.includes('_en') ? s.concat('_en') : s, 'yml'),
    )

  const regexStr = `(${data._preloadKeys_.concat(data._pageKeys_).join('|')})`
  const filesList = await fs.readdir(filesDir)
  const expectedFilesRegex = new RegExp(regexStr)

  log.debug(`Constructed regular expression: ${u.yellow(regexStr)}`)

  for (const filename of filesList) {
    const name = utils.removeExt(filename, 'yml')
    const filepath = path.join(filesDir, filename)

    try {
      const stat = await fs.stat(filepath)

      if (stat.isFile()) {
        if (filename.endsWith('.yml')) {
          if (expectedFilesRegex.test(name)) {
            // Exists
          } else {
            const pageUrl = getPageUrl(name)
            log.debug(`Downloading missing page ${u.yellow(pageUrl)}`)
            await utils.downloadFile(log, pageUrl, filename, filesDir)
          }

          const pageYml = n.loadFile(filepath)
          const pageObject = y.parse(pageYml)
          data._pages_.json[name] = pageObject
          log.debug(`Loaded ${u.yellow(name)}`)
        }
      } else if (stat.isDirectory()) {
        if (/assets/i.test(filename)) {
          // log.debug(`Checking assets...`)
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      log.error(
        `Error occurring loading ${u.yellow(filepath)}: ${u.red(err.message)}`,
        err.stack,
      )
    }
  }

  const loadTo_pages_ = (name, obj) => {
    data._pages_.json[name] = obj
    loader.setInRoot(name, obj)
  }

  /** @type { { pageName: string; filename: string; filepath: string }[] } */

  const appKey = utils.removeExt(rootConfig.cadlMain, 'yml')
  const missingFiles = []
  const allYmlPageNames =
    loader.root[appKey]?.preload?.concat?.(loader.root[appKey]?.page) || []

  // await loader.init({
  //   dir: resolvedPaths.outputNamespacedWithConfig,
  //   spread: ['BaseCSS', 'BasePage', 'BaseDataModel', 'BaseMessage'],
  //   loadPages: true,
  //   loadPreloadPages: true,
  // })

  allYmlPageNames.forEach((name) => {
    const filename = `${name}_en.yml`
    const filepath = path.join(
      resolvedPaths.outputNamespacedWithConfig,
      filename,
    )
    if (!fs.existsSync(filepath)) {
      missingFiles.push({ pageName: name, filename, filepath })
    } else {
      loadTo_pages_(name, n.loadFile(filepath, 'json'))
    }
  })

  const baseUrl = loader.appConfigUrl.replace('cadlEndpoint.yml', '')

  log.debug(`Downloading ${u.yellow(missingFiles.length)} missing pages...`)
  log.debug(`Using this endpoint for missing files: ${u.yellow(baseUrl)}`)

  await Promise.all(
    missingFiles.map(({ pageName, filename }) => {
      return new Promise((resolve) => {
        const url = `${baseUrl}${filename}`
        try {
          const destination = path.join(
            resolvedPaths.outputNamespacedWithConfig,
            filename,
          )
          log.debug(
            `Downloading ${u.yellow(filename)} to: ${u.yellow(destination)}`,
          )
          utils
            .downloadFile(
              log,
              url,
              filename,
              resolvedPaths.outputNamespacedWithConfig,
            )
            .then((yml) => {
              loadTo_pages_(pageName, y.parse(yml))
              resolve()
            })
        } catch (error) {
          log.debug(error instanceof Error ? error : new Error(String(error)))
          resolve()
        }
      })
    }),
  )

  /** @type { import('noodl').LinkStructure[] } */
  let assets

  try {
    assets = await loader.extractAssets()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    log.error(
      `[${u.yellow(err?.name)}] Error while extracting assets: ${u.red(
        err.message,
      )}`,
    )
  }

  log.debug(`Found ${u.yellow(assets?.length || 0)} assets`)

  // TEMPORARY - This is here to bypass the build failing when using geolocation in lvl3
  global.window = {
    location: { href: 'http://127.0.0.1:3000' },
    navigator: {
      geolocation: {
        getCurrentPosition: () => ({
          coords: { latitude: 0, longitude: 0, altitude: null, accuracy: 11 },
          timestamp: Date.now(),
        }),
      },
    },
  }

  // if (buildSource === 'local' || isFileSystemOutput) {
  await Promise.all(
    assets.map(async (asset) => {
      const filename = `${asset.raw}`
      const assetFilePath = path.join(resolvedPaths.assetsDir, filename)
      if (fs.existsSync(assetFilePath)) return

      try {
        // TODO - Redo this ugly part
        let fullDir = path.parse(assetFilePath).dir
        if (fullDir.startsWith('https:/') && !fullDir.startsWith('https://')) {
          fullDir = fullDir.replace('https:/', 'https://')
        }
        if (!fs.existsSync(fullDir)) await fs.ensureDir(fullDir)
        const url = `${loader.appConfigUrl.replace(
          'cadlEndpoint.yml',
          '',
        )}assets/${filename}`
        if (!fs.existsSync(assetFilePath)) {
          if (!data._loggedAssets_.includes(url)) {
            data._loggedAssets_.push(url)
            log.info(
              `Downloading ${u.yellow(filename)} to ${u.yellow(assetFilePath)}`,
            )
          }
          await utils.downloadFile(log, url, filename, resolvedPaths.assetsDir)
          if (!data._assets_.includes(assetFilePath)) {
            data._assets_.push(assetFilePath)
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            log.warn(
              `The asset "${asset.url}" returned a ${u.red(
                `404 Not Found`,
              )} error`,
            )
          }
        } else {
          log.debug(error instanceof Error ? error : new Error(String(error)))
        }
      }
    }),
  )
  // }
  // }
}

/**
 * @param { import('gatsby').SourceNodesArgs } args
 * @param { GatsbyNoodlPluginOptions } pluginOptions
 */
exports.sourceNodes = async function sourceNodes(args, pluginOptions) {
  const { actions, createContentDigest, createNodeId } = args
  const { createNode } = actions
  const {
    paths,
    viewport = {
      width: DEFAULT_VIEWPORT_WIDTH,
      height: DEFAULT_VIEWPORT_HEIGHT,
    },
  } = pluginOptions

  const { page, pages, sdk, transform } = await getGenerator({
    configKey: data.configKey,
    on: {
      /**
       * Proxy the addEventListener and removeEventListener to the JSDOM events so lvl3 doesn't give the IllegalInvocation error from mismatching instance shapes
       */
      patch: u.reduce(
        ['addEventListener', 'removeEventListener'],
        (acc, evtName) => {
          /**
           * @argument { object } args
           * @param { boolean } args.wasPatched
           */
          acc[evtName] = function onPatch({ wasPatched } = {}) {
            let label = ''
            label += u.yellow('EventTarget')
            label += u.magenta('#')
            label += u.white(evtName)
            if (wasPatched) {
              log.debug(`${label} is already patched.`)
            } else {
              log.debug(`${label} ${u.green('patched!')}`)
            }
          }
          return acc
        },
        {},
      ),
    },
    use: {
      config: loader?.getInRoot?.(data.configKey),
      cadlEndpoint: loader?.getInRoot?.(loader.appKey),
      log,
      preload: {
        BaseCSS: loader?.getInRoot?.('BaseCSS'),
        BaseDataModel: loader?.getInRoot?.('BaseDataModel'),
        BasePage: loader?.getInRoot?.('BasePage'),
        Resource: loader?.getInRoot?.('Resource'),
      },
      /**
       * The generator will be mutating this so ensure that this reference will be stay persistent
       */
      pages: data._pages_,
      viewport,
    },
  })

  // TODO - Link src/pages/index.tsx to load using this as a source
  data.startPage = (sdk.cadlEndpoint || {}).startPage

  // TODO - Figure out a way to pre-generate component dimensions using the runtime/client's viewport
  page.viewport.width = viewport.width
  page.viewport.height = viewport.height

  const _testIntrospectionDir_ = path.join(paths.output, '_testIntrospections_')

  if (!fs.existsSync()) await fs.ensureDir(_testIntrospectionDir_)

  /**
   * Transform parsed json components from lvl3 to Component instances in noodl-ui so the props can be consumed in expected formats in the UI
   * @param { string } pageName
   * @param { nt.ComponentObject[] } componentObjects
   */
  async function generateComponents(pageName, componentObjects) {
    const resolvedPageComponents = []

    /**
     * @param { nt.ComponentObject | nt.ComponentObject[] } value
     * @returns { Promise<import('./generator').NuiComponent[] }
     */
    async function transformAllComponents(value) {
      const components = []
      const componentsList = u.filter(Boolean, u.array(value))
      const numComponents = componentsList.length

      for (let index = 0; index < numComponents; index++) {
        let before
        const transformedComponent = await transform(componentsList[index], {
          context: {
            path: [index],
          },
          keepVpUnit: true,
          on: {
            /** Called for every component creation (depth-first) */
            createComponent(comp, opts) {
              before = u.omit(comp.toJSON(), ['children'])

              const { path: componentPath } = opts || {}
              if (!data._context_[pageName]) data._context_[pageName] = {}

              if (nt.Identify.component.list(comp)) {
                let listObjectPath
                const listObject = comp.get('listObject') || []
                // Path to component from the page object as opposed to from the "components" list
                const absolutePath = [pageName, 'components', ...componentPath]

                /**
                 * This gets passed to props.pageContext inside NoodlPageTemplate
                 */
                set(data._context_, `${pageName}.lists.${comp.id}`, {
                  id: comp.id,
                  // Descendant component ids will be inserted here later
                  children: [],
                  iteratorVar: comp.blueprint.iteratorVar,
                  listObject,
                  listObjectPath,
                  // This path is used to map list objects to their reference getters in the client
                  path: absolutePath,
                })
              } else if (nt.Identify.component.image(comp)) {
                // This is mapped to the client side to pick up the static image
                comp.set('_path_', comp.get('path'))
              }

              // if (
              //   u.isStr(comp?.style?.fontSize) &&
              //   comp.style.fontSize.endsWith('px')
              // ) {
              //   const rounded = String(
              //     parseInt(
              //       comp?.style?.fontSize.replace(/[a-zA-Z]+/gi, ''),
              //       10,
              //     ),
              //   )
              //   if (utils.fontSize[rounded]) {
              //     comp.style.fontSize = utils.fontSize[rounded]
              //   }
              // }
            },
            // async resolved(opts) {
            //   resolvedPageComponents.push({
            //     before,
            //     after: u.omit(opts.component.toJSON(), ['children']),
            //   })
            // },
          },
        })

        resolvedPageComponents.push({
          before,
          after: transformedComponent.toJSON(),
        })

        // Serialize the noodl-ui components before they get sent to
        // bootstrap the server-side rendering
        components.push(transformedComponent.toJSON())
      }
      return components
    }

    const transformedComponents = await transformAllComponents(componentObjects)

    pageName && log.info(`${u.yellow(pageName)} Components generated`)

    await fs.writeJson(
      path.join(_testIntrospectionDir_, `${pageName}.json`),
      resolvedPageComponents,
      { spaces: 2 },
    )

    return transformedComponents
  }

  /**
   * Create GraphQL nodes for "preload" pages so they can be queried in the client side
   */
  for (const [name = '', obj] of u.entries(
    u.omit(sdk.root, sdk.cadlEndpoint.page || []),
  )) {
    if (obj) {
      createNode({
        name,
        id: createNodeId(name),
        isPreload: true,
        content: JSON.stringify(obj),
        children: [],
        internal: {
          contentDigest: createContentDigest(name),
          type: NOODL_PAGE_NODE_TYPE,
        },
      })
    }
  }

  /**
   * Create GraphQL nodes for app pages so they can be queried in the client side
   */
  for (const [name, pageObject] of u.entries(pages)) {
    page.page = name
    const { components } = pageObject
    pageObject.components = await generateComponents(name, components)

    const lists = data._context_[name]?.lists

    // Insert all descendants id's to the list component's children list.
    // This enables the mapping in the client side
    pageObject.components.forEach((component) => {
      publish(component, (comp) => {
        if (nt.Identify.component.list(comp)) {
          const ctx = lists[comp.id]
          if (!ctx.children) ctx.children = []

          comp.children.forEach((child, index) => {
            if (!ctx.children[index]) ctx.children[index] = []
            if (!ctx.children[index].includes(child.id)) {
              ctx.children[index].push(child.id)
            }
            publish(child, (c) => {
              if (!ctx.children[index].includes(c.id)) {
                ctx.children[index].push(c.id)
              }
            })
          })
        }
      })
    })

    data._pages_.serialized[name] = u.isStr(pageObject)
      ? pageObject
      : JSON.stringify(u.omit(pageObject, 'components'))
    data._pages_.json[name] = pageObject

    /**
     * Create the GraphQL nodes for page objects
     * These will be merged and eventually form the noodl root object that wraps our react app so they can be available to page routes to work with
     */
    createNode({
      name,
      slug: `/${name}/`,
      id: createNodeId(name),
      content: data._pages_.serialized[name],
      isPreload: false,
      children: [],
      internal: {
        contentDigest: createContentDigest(data._pages_.serialized[name]),
        type: NOODL_PAGE_NODE_TYPE,
      },
    })
  }

  /**
   * @param {{ [page: string]: { componentPath: string[]; path: string[] } }} acc
   */
  if (pluginOptions.introspection) {
    await fs.writeJson(
      path.join(data._paths_.output, `./${data.configKey}_introspection.json`),
      pages,
      { spaces: 2 },
    )
  }
}

/**
 * @param { import('gatsby').CreatePagesArgs } args
 * @param { GatsbyNoodlPluginOptions } pluginOptions
 */
exports.createPages = async function createPages(args) {
  try {
    const { actions, graphql } = args
    const { createPage } = actions

    /**
     * Query the created GraphQL nodes from app pages
     */
    const {
      data: { allNoodlPage },
      errors,
    } = await graphql(`
      {
        allNoodlPage(filter: { isPreload: { eq: false } }) {
          nodes {
            name
            content
            slug
            isPreload
          }
        }
      }
    `)

    if (errors) {
      throw new Error(errors)
    } else {
      const numNoodlPages = allNoodlPage.nodes.length || 0

      log.info(`Creating ${numNoodlPages} pages`)

      /**
       * Creates the page route
       * "context" will be available in the NoodlPageTemplate component as props.pageContext (to ensure we only have the data we care about, we only pick "components" from the page object only.
       * The rest of the page object props (init, etc) are located into the root noodl object instead)
       */
      for (const pageName of u.keys(data._pages_.json)) {
        // Becomes the page route
        const slug = `/${pageName}/`
        createPage({
          path: slug,
          // NoodlPageTemplate
          component: data._paths_.template,
          context: {
            _context_: get(data._context_, pageName) || {},
            isPreload: false,
            pageName,
            // Intentionally leaving out other props from the page object since they are provided in the root object (available in the React context that wraps our app)
            pageObject: {
              components:
                data._pages_.json?.[pageName]?.components ||
                data._pages_.json?.[pageName]?.components?.components ||
                [],
            },
            slug,
          },
        })
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(
      `[Error-createPages][${u.yellow(err?.name)}] ${u.red(err.message)}`,
      err.stack,
    )
  }
}

/**
 * @argument { import('gatsby').CreatePageArgs } opts
 */
exports.onCreatePage = async function onCreatePage(opts) {
  const { actions, page } = opts
  const { createPage, deletePage } = actions

  // Binds homepage to startPage
  if (page.path === '/') {
    const oldPage = u.assign({}, page)
    const pageName = data.startPage
    const slug = `/${pageName}/`
    page.context = {
      _context_: get(data._context_, pageName) || {},
      isPreload: false,
      pageName,
      pageObject: {
        components:
          data._pages_.json?.[pageName]?.components ||
          data._pages_.json?.[pageName]?.components?.components ||
          [],
      },
      slug,
    }
    log.info(`Home route '${u.cyan('/')}' is bound to ${u.yellow(pageName)}`)
    deletePage(oldPage)
    createPage(page)
  }
}
