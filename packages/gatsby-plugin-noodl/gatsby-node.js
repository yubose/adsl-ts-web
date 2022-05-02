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
// const GatsbyPluginNoodlCache = require('./Cache')
const utils = require('./utils')

const DEFAULT_BUILD_SOURCE = 'remote'
const DEFAULT_CONFIG = 'aitmed'
const DEFAULT_DEVICE_TYPE = 'web'
const DEFAULT_ECOS_ENV = 'stable'
const DEFAULT_LOG_LEVEL = 'INFO'
const DEFAULT_OUTPUT_PATH = 'output'
const DEFAULT_SRC_PATH = './src'
const DEFAULT_TEMPLATE_PATH = path.join(DEFAULT_SRC_PATH, 'templates/page.tsx')
const DEFAULT_VIEWPORT_WIDTH = 1024
const DEFAULT_VIEWPORT_HEIGHT = 768
const NOODL_PAGE_NODE_TYPE = 'NoodlPage'

log.setDefaultLevel(DEFAULT_LOG_LEVEL)

/**
 * @typedef GatsbyNoodlPluginOptions
 * @type { import('./types').GatsbyNoodlPluginOptions }
 *
 * @typedef InternalData
 * @type { import('./types')['InternalData'] }
 */

const BASE_CONFIG_URL = `https://public.aitmed.com/config/`
const LOGLEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent']
const { cyan, yellow, red, newline } = u
const { debug, info, warn } = log

/** @type { import('@aitmed/cadl').cache } */
let _sdkCache

/** @type { n.Loader } */
let _loader

let _appKey = ''
let _assetsUrl = ''
let _baseUrl = ''
let _buildSource = ''
let _cwd = ''
let _configKey = ''
let _configUrl = ''
let _deviceType = ''
let _loglevel = DEFAULT_LOG_LEVEL
let _ecosEnv = ''
let _startPage = ''

const _pages = {
  json: {},
  serialized: {},
}

const _paths = {
  output: '',
  src: '',
  template: '',
}

/** @type { string[] } */
const _savedAssets = []

/** @type { string[] } */
const _loggedAssets = []

/** @type { string[] } */
const _preloadKeys = []

/** @type { string[] } */
const _pageKeys = []

const _context_ = {
  //
}

let isFileSystemOutput = false
let resolvedAssetsDir = ''
let resolvedConfigsDir = ''
let resolvedAppConfigFile = ''
let resolvedOutputNamespacedWithConfig = ''

const getPageRefs = (pageName) => _sdkCache?.refs?.[pageName] || {}

const dumpMetadata = async ({ paths: pathsProp, ...other } = {}) => {
  const withoutCwd = (s = '') => String(s).replace(_cwd, '')
  await fs.writeJson(
    path.join(_paths.output, './metadata.json'),
    {
      appKey: _appKey,
      assetsUrl: _assetsUrl,
      baseUrl: _baseUrl,
      buildSource: _buildSource,
      configKey: _configKey,
      configUrl: _configUrl,
      deviceType: _deviceType,
      ecosEnv: _ecosEnv,
      loglevel: _loglevel,
      isFileSystemOutput,
      startPage: _startPage,
      ...other,
      paths: {
        cwd: _cwd,
        output: withoutCwd(_paths.output),
        resolvedAssetsDir: withoutCwd(resolvedAssetsDir),
        resolvedConfigsDir: withoutCwd(resolvedConfigsDir),
        resolvedAppConfigFile: withoutCwd(resolvedAppConfigFile),
        resolvedOutputNamespacedWithConfig: withoutCwd(
          resolvedOutputNamespacedWithConfig,
        ),
        src: withoutCwd(_paths.src),
        template: withoutCwd(_paths.template),
        ...u
          .entries(pathsProp)
          .reduce((acc, [k, v]) => u.assign(acc, { [k]: withoutCwd(v) }), {}),
      },
      timestamp: new Date().toLocaleString(),
    },
    { spaces: 2 },
  )
}

/**
 * https://www.gatsbyjs.com/docs/node-apis/
 */

/**
 * @argument { import('gatsby').NodePluginArgs } _
 * @argument { GatsbyNoodlPluginOptions } pluginOpts
 */
exports.onPreInit = (_, pluginOpts) => {
  newline()
  const loglevel = pluginOpts?.loglevel

  if (
    loglevel &&
    loglevel !== DEFAULT_LOG_LEVEL &&
    LOGLEVELS.includes(loglevel)
  ) {
    log.setLevel(loglevel)
  }

  for (const key of ['path', 'template']) {
    if (pluginOpts[key]) {
      pluginOpts[key] = utils.normalizePath(pluginOpts[key])
    }
  }
}

/**
 * @param { import('gatsby').NodePluginArgs } args
 * @param { GatsbyNoodlPluginOptions } pluginOpts
 */
exports.onPluginInit = async function onPluginInit(args, pluginOpts = {}) {
  const outputPath = pluginOpts.paths?.output || DEFAULT_OUTPUT_PATH
  isFileSystemOutput = !!pluginOpts.paths?.output

  _buildSource = pluginOpts.buildSource || DEFAULT_BUILD_SOURCE
  _cwd = pluginOpts.cwd || process.cwd()
  _configKey = pluginOpts.config || DEFAULT_CONFIG
  _configUrl = utils.ensureExt(`${BASE_CONFIG_URL}${_configKey}`, 'yml')
  _deviceType = pluginOpts.deviceType || DEFAULT_DEVICE_TYPE
  _ecosEnv = pluginOpts.ecosEnv || DEFAULT_ECOS_ENV
  _loglevel = pluginOpts.loglevel || DEFAULT_LOG_LEVEL

  _paths.output = outputPath
  _paths.src = pluginOpts.paths.src || DEFAULT_SRC_PATH
  _paths.template = pluginOpts.paths.template || DEFAULT_TEMPLATE_PATH

  debug(`Build source: ${yellow(_buildSource)}`)
  debug(`Current working directory: ${yellow(_cwd)}`)
  debug(`Config key: ${yellow(_configKey)}`)
  debug(`Config url: ${yellow(_configUrl)}`)
  debug(`Device type: ${yellow(_deviceType)}`)
  debug(`Ecos environment: ${yellow(_ecosEnv)}`)
  debug(`Log level set to: ${yellow(_loglevel)}`)
  debug(`Template path: ${yellow(_paths.template)}`)

  resolvedOutputNamespacedWithConfig = utils.getConfigDir(
    _paths.output,
    _configKey,
  )
  resolvedAssetsDir = path.join(resolvedOutputNamespacedWithConfig, 'assets')
  resolvedConfigsDir = path.join(
    resolvedOutputNamespacedWithConfig,
    utils.ensureExt(_configKey, 'yml'),
  )

  debug(
    `Resolved outputNamespacedWithConfig: ${yellow(
      resolvedOutputNamespacedWithConfig,
    )}`,
  )
  debug(`Resolved assetsDir: ${yellow(resolvedAssetsDir)}`)
  debug(`Resolved configFile: ${yellow(resolvedConfigsDir)}`)

  // TODO - Implementing build caching
  // await cache.set('configKey', _configKey)
  // await cache.set('configUrl', _configUrl)
  // if (version && version !== 'latest') await cache.set('configVersion', version)

  if (isFileSystemOutput) {
    if (!fs.existsSync(_paths.output)) {
      await fs.ensureDir(_paths.output)
      debug(`Created output directory at ${yellow(_paths.output)}`)
    } else {
      debug(`Output path: ${yellow(_paths.output)}`)
    }

    debug(
      `Yaml files will be located at ${yellow(
        resolvedOutputNamespacedWithConfig,
      )}`,
    )
  }

  if (!fs.existsSync(resolvedAssetsDir)) {
    await fs.ensureDir(resolvedAssetsDir)
    debug(`Created assets directory`)
  }

  debug(`Assets will be located at ${yellow(resolvedAssetsDir)}`)

  if (!fs.existsSync(resolvedConfigsDir)) {
    const url = utils.getConfigUrl(_configKey)

    info(
      `You are missing the config file ${yellow(
        utils.ensureExt(_configKey),
      )}. It will be downloaded to ${resolvedConfigsDir}`,
    )

    debug(`Fetching config from ${yellow(url)}`)

    const yml = await utils.fetchYml(url)
    n.writeFileSync(resolvedConfigsDir, yml)
  }

  const rootConfig = y.parse(n.readFileSync(resolvedConfigsDir))

  _appKey = rootConfig?.cadlMain || ''

  if (!rootConfig) {
    throw new Error(`Could not load a config file both locally and remotely`)
  }

  resolvedAppConfigFile = path.join(resolvedOutputNamespacedWithConfig, _appKey)

  _loader = new n.Loader({
    config: _configKey,
    dataType: 'object',
    deviceType: _deviceType,
    // TODO - This option is not working
    env: _ecosEnv,
    loglevel: _loglevel || 'verbose',
    version: pluginOpts.version || 'latest',
  })

  _loader.env = _ecosEnv

  await _loader.loadRootConfig({
    dir: resolvedOutputNamespacedWithConfig,
    config: _configKey,
  })

  debug(
    `Loaded root config. Loading app config using key: ${yellow(
      _appKey,
    )} at ${yellow(_loader.appConfigUrl)}`,
  )

  const appConfigYml = await utils.fetchYml(_loader.appConfigUrl)
  _pages.json[_appKey] = y.parse(appConfigYml)

  if (!fs.existsSync(resolvedAppConfigFile)) {
    n.writeFileSync(resolvedAppConfigFile, appConfigYml)
    debug(`Saved app config to ${yellow(resolvedAppConfigFile)}`)
  }

  for (const key of ['preload', 'page']) {
    const _path_ = `${_appKey}.${key}`
    if (!u.isArr(_pages.json[_appKey]?.[key])) {
      set(_pages.json, _path_, [])
    }
    const keysList = key === 'preload' ? _preloadKeys : _pageKeys
    keysList.push(...get(_pages.json, _path_, []))
  }

  const appConfigUrl = _loader.appConfigUrl
  const filesDir = resolvedOutputNamespacedWithConfig

  // TODO - Check if we still need this part
  for (const filepath of [resolvedConfigsDir, resolvedAppConfigFile]) {
    const type = filepath === resolvedConfigsDir ? 'root' : 'app'
    if (!fs.existsSync(filepath)) {
      const msg = `The ${u.magenta(type)} config file at ${yellow(
        filepath,
      )} does not exist`
      log.error(msg)
      process.exit(0)
    }

    if (!_loader.hasInRoot(_appKey)) {
      await _loader.loadAppConfig({
        dir: filesDir,
        // eslint-disable-next-line
        fallback: () =>
          utils.downloadFile(
            log,
            appConfigUrl,
            utils.ensureExt(_appKey, 'yml'),
            resolvedOutputNamespacedWithConfig,
          ),
      })
    }
  }

  debug(`Checking directory for page files`)

  const getPageUrl = (s) =>
    _loader.appConfigUrl.replace(
      'cadlEndpoint.yml',
      utils.ensureExt(s.includes('_en') ? s.concat('_en') : s, 'yml'),
    )

  const regexStr = `(${_preloadKeys.concat(_pageKeys).join('|')})`
  const filesList = await fs.readdir(filesDir)
  const expectedFilesRegex = new RegExp(regexStr)

  debug(`Constructed regular expression: ${yellow(regexStr)}`)

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
            debug(`Downloading missing page ${yellow(pageUrl)}`)
            await utils.downloadFile(log, pageUrl, filename, filesDir)
          }

          const pageYml = n.loadFile(filepath)
          const pageObject = y.parse(pageYml)
          _pages.json[name] = pageObject
          debug(`Loaded ${yellow(name)}`)
        }
      } else if (stat.isDirectory()) {
        if (/assets/i.test(filename)) {
          // debug(`Checking assets...`)
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      log.error(
        `Error occurring loading ${yellow(filepath)}: ${red(err.message)}`,
        err.stack,
      )
    }
  }

  const loadTo_pages_ = (name, obj) => {
    _pages.json[name] = obj
    _loader.setInRoot(name, obj)
  }

  /** @type { { pageName: string; filename: string; filepath: string }[] } */

  const appKey = utils.removeExt(rootConfig.cadlMain, 'yml')
  const missingFiles = []
  const allYmlPageNames =
    _loader.root[appKey]?.preload?.concat?.(_loader.root[appKey]?.page) || []

  allYmlPageNames.forEach((name) => {
    const filename = `${name}_en.yml`
    const filepath = path.join(resolvedOutputNamespacedWithConfig, filename)
    if (!fs.existsSync(filepath)) {
      missingFiles.push({ pageName: name, filename, filepath })
    } else {
      loadTo_pages_(name, n.loadFile(filepath, 'json'))
    }
  })

  const baseUrl = _loader.appConfigUrl.replace('cadlEndpoint.yml', '')

  debug(`Downloading ${yellow(missingFiles.length)} missing pages...`)
  debug(`Using this endpoint for missing files: ${yellow(baseUrl)}`)

  await Promise.all(
    missingFiles.map(({ pageName, filename }) => {
      return new Promise((resolve) => {
        const url = `${baseUrl}${filename}`
        try {
          const destination = path.join(
            resolvedOutputNamespacedWithConfig,
            filename,
          )
          debug(`Downloading ${yellow(filename)} to: ${yellow(destination)}`)
          utils
            .downloadFile(
              log,
              url,
              filename,
              resolvedOutputNamespacedWithConfig,
            )
            .then((yml) => {
              loadTo_pages_(pageName, y.parse(yml))
              resolve()
            })
        } catch (error) {
          debug(error instanceof Error ? error : new Error(String(error)))
          resolve()
        }
      })
    }),
  )

  /** @type { import('noodl').LinkStructure[] } */
  let assets

  try {
    assets = await _loader.extractAssets()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    log.error(
      `[${yellow(err?.name)}] Error while extracting assets: ${red(
        err.message,
      )}`,
    )
  }

  debug(`Found ${yellow(assets?.length || 0)} assets`)

  // TEMPORARY - This is here to bypass the build failing when using geolocation in lvl3

  if (!global.window) global.window = {}
  const win = global.window
  if (!win.document) win.document = { createElement: () => ({}) }
  if (!win.location) win.location = { href: 'http://127.0.0.1:3000' }
  if (!win.navigator) {
    win.navigator = {
      geolocation: {
        getCurrentPosition: () => ({
          coords: { latitude: 0, longitude: 0, altitude: null, accuracy: 11 },
          timestamp: Date.now(),
        }),
      },
    }
  }

  const isAssetSaved = (filepath) => _savedAssets.includes(filepath)
  const isAssetLogged = (url) => _loggedAssets.includes(url)

  // if (buildSource === 'local' || isFileSystemOutput) {
  await Promise.all(
    assets.map(async (asset) => {
      const filename = `${asset.raw}`
      const assetFilePath = path.join(resolvedAssetsDir, filename)
      if (fs.existsSync(assetFilePath)) return

      try {
        // TODO - Redo this ugly part
        let fullDir = path.parse(assetFilePath).dir
        if (fullDir.startsWith('https:/') && !fullDir.startsWith('https://')) {
          fullDir = fullDir.replace('https:/', 'https://')
        }

        if (!fs.existsSync(fullDir)) await fs.ensureDir(fullDir)

        let url = `${_loader.appConfigUrl}`.replace('cadlEndpoint.yml', '')
        url += `assets/${filename}`

        if (!fs.existsSync(assetFilePath)) {
          if (!isAssetLogged(url)) {
            _loggedAssets.push(url)
            info(`Downloading ${yellow(filename)} to ${yellow(assetFilePath)}`)
          }
          await utils.downloadFile(log, url, filename, resolvedAssetsDir)
          if (!isAssetSaved(assetFilePath)) _savedAssets.push(assetFilePath)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            const logMsg = `The asset "${asset.url}" `
            warn(logMsg + `returned a ${red(`404 Not Found`)} error`)
          }
        } else {
          debug(error instanceof Error ? error : new Error(String(error)))
        }
      }
    }),
  )
}

/**
 * @param { import('gatsby').SourceNodesArgs } args
 * @param { GatsbyNoodlPluginOptions } pluginOpts
 */
exports.sourceNodes = async function sourceNodes(args, pluginOpts) {
  const { actions, createContentDigest, createNodeId } = args
  const { createNode } = actions
  const {
    viewport = {
      width: DEFAULT_VIEWPORT_WIDTH,
      height: DEFAULT_VIEWPORT_HEIGHT,
    },
  } = pluginOpts

  const {
    cache: sdkCache,
    page,
    pages,
    sdk,
    transform,
  } = await getGenerator({
    configKey: _configKey,
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
            label += yellow('EventTarget')
            label += u.magenta('#')
            label += u.white(evtName)
            if (wasPatched) {
              debug(`${label} is already patched.`)
            } else {
              debug(`${label} ${u.green('patched!')}`)
            }
          }
          return acc
        },
        {},
      ),
    },
    use: {
      config: _loader?.getInRoot?.(_configKey),
      cadlEndpoint: _loader?.getInRoot?.(_loader.appKey),
      log,
      preload: {
        BaseCSS: _loader?.getInRoot?.('BaseCSS'),
        BaseDataModel: _loader?.getInRoot?.('BaseDataModel'),
        BasePage: _loader?.getInRoot?.('BasePage'),
        Resource: _loader?.getInRoot?.('Resource'),
      },
      /**
       * The generator will be mutating this so ensure that this reference will be stay persistent
       */
      pages: _pages,
      viewport,
    },
  })

  // TODO - Link src/pages/index.tsx to load using this as a source
  _startPage = (sdk.cadlEndpoint || {}).startPage
  _assetsUrl = sdk.assetsUrl
  _baseUrl = sdk.baseUrl

  // TODO - Figure out a way to pre-generate component dimensions using the runtime/client's viewport
  page.viewport.width = viewport.width
  page.viewport.height = viewport.height

  _sdkCache = sdkCache

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
          context: { path: [index] },
          keepVpUnit: true,
          on: {
            /** Called for every component creation (depth-first) */
            createComponent(comp, opts) {
              before = u.omit(comp.toJSON(), ['children'])
              const { path: componentPath } = opts || {}
              if (!_context_[pageName]) _context_[pageName] = {}

              if (nt.Identify.component.list(comp)) {
                const iteratorVar = comp.blueprint?.iteratorVar || ''
                const refs = getPageRefs(pageName)
                const currListObjectPath = [pageName, 'components']
                  .concat(componentPath)
                  .concat('listObject')
                  .reduce((acc, strOrIndex, i) => {
                    if (
                      u.isNum(Number(strOrIndex)) &&
                      !Number.isNaN(Number(strOrIndex))
                    ) {
                      acc += `[${strOrIndex}]`
                    } else {
                      acc += i === 0 ? strOrIndex : `.${strOrIndex}`
                    }
                    return acc
                  }, '')
                const listObject = comp.get('listObject') || []
                const refObject = u
                  .values(refs)
                  .find((refObj) => refObj.path === currListObjectPath)
                /**
                 * This gets passed to props.pageContext inside NoodlPageTemplate
                 */
                set(_context_, `${pageName}.lists.${comp.id}`, {
                  // Descendant component ids will be inserted here later
                  children: [],
                  componentPath,
                  id: comp.id,
                  iteratorVar,
                  listObject: refObject?.ref || listObject,
                })
              } else if (nt.Identify.component.image(comp)) {
                // This is mapped to the client side to pick up the static image
                // TODO - Is this still being used?
                comp.set('_path_', comp.get('path'))
              }
            },
          },
        })
        const after = transformedComponent.toJSON()
        resolvedPageComponents.push({ before, after })
        // Serialize the noodl-ui components before they get sent to
        // bootstrap the server-side rendering
        components.push(transformedComponent.toJSON())
      }
      return components
    }

    const transformedComponents = await transformAllComponents(componentObjects)
    if (pageName) info(`${yellow(pageName)} Components generated`)
    return transformedComponents
  }

  /**
   * Create GraphQL nodes for app pages so they can be queried in the client side
   */
  for (const [name, pageObject] of u.entries(pages)) {
    page.page = name
    const { components } = pageObject
    pageObject.components = await generateComponents(name, components)
    if (!_context_[name]) _context_[name] = {}
    _context_[name].refs = getPageRefs(name)

    const lists = _context_[name]?.lists

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

    _pages.serialized[name] = u.isStr(pageObject)
      ? pageObject
      : JSON.stringify(u.omit(pageObject, 'components'))
    _pages.json[name] = pageObject

    /**
     * Create the GraphQL nodes for page objects
     * These will be merged and eventually form the noodl root object that wraps our react app so they can be available to page routes to work with
     */
    createNode({
      name,
      slug: `/${name}/`,
      id: createNodeId(name),
      content: _pages.serialized[name],
      children: [],
      internal: {
        contentDigest: createContentDigest(_pages.serialized[name]),
        type: NOODL_PAGE_NODE_TYPE,
      },
    })
  }

  /**
   * @param {{ [page: string]: { componentPath: string[]; path: string[] } }} acc
   */
  if (pluginOpts.introspection) {
    await fs.writeJson(
      path.join(_paths.output, `./${_configKey}_introspection.json`),
      pages,
      { spaces: 2 },
    )
    await dumpMetadata()
  }
}

/**
 * @param { import('gatsby').CreatePagesArgs } args
 * @param { GatsbyNoodlPluginOptions } pluginOpts
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
        allNoodlPage {
          nodes {
            name
            content
            slug
          }
        }
      }
    `)

    if (errors) {
      throw new Error(errors)
    } else {
      const numNoodlPages = allNoodlPage.nodes.length || 0
      info(`Creating ${numNoodlPages} pages`)
      /**
       * Creates the page route
       *
       * "context" will be available in the NoodlPageTemplate component as props.pageContext (to ensure we only have the data we care about, we only pick "components" from the page object only.
       *
       * The rest of the page object props (init, etc) are located into the root noodl object instead)
       */
      for (const pageName of u.keys(_pages.json)) {
        // Becomes the page route
        const slug = `/${pageName}/`
        createPage({
          path: slug,
          // NoodlPageTemplate
          component: _paths.template,
          context: {
            assetsUrl: _assetsUrl,
            baseUrl: _baseUrl,
            lists: _context_?.[pageName]?.lists,
            refs: getPageRefs(pageName) || {},
            name: pageName,
            // Intentionally leaving out other props from the page object since they are provided in the root object (available in the React context that wraps our app)
            components:
              _pages.json?.[pageName]?.components ||
              _pages.json?.[pageName]?.components?.components ||
              [],
            slug,
          },
        })
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(
      `[Error-createPages][${yellow(err?.name)}] ${red(err.message)}`,
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
    const _ctx_ = get(_context_, 'name') || {}
    const oldPage = u.assign({}, page)
    const pageName = _startPage
    const slug = `/${pageName}/`
    page.context = {
      assetsUrl: _assetsUrl,
      baseUrl: _baseUrl,
      lists: _ctx_.lists || {},
      refs: _ctx_.refs || {},
      name: pageName,
      components:
        _pages.json?.[pageName]?.components ||
        _pages.json?.[pageName]?.components?.components ||
        [],

      slug,
    }
    info(`Home route '${cyan('/')}' is bound to ${yellow(pageName)}`)
    deletePage(oldPage)
    createPage(page)
  }
}
