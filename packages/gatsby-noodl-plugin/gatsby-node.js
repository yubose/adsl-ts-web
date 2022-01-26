/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 * https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/
 */
const u = require('@jsmanifest/utils')
const log = require('loglevel')
const attempt = require('lodash/attempt')
const curry = require('lodash/curry')
const fs = require('fs-extra')
const nt = require('noodl-types')
const nu = require('noodl-utils')
const has = require('lodash/has')
const get = require('lodash/get')
const set = require('lodash/set')
const path = require('path')
const y = require('yaml')
const { getGenerator, monkeyPatchAddEventListener } = require('./generator')
const utils = require('./utils')

log.setDefaultLevel('INFO')

const NOODL_PAGE_NODE_TYPE = 'NoodlPage'

function unstable_shouldOnCreateNode({ node }) {
  if (node.internal.mediaType === `text/yaml`) {
    return true
  }
  return false
}

/**
 * @typedef PluginOptions
 * @property { import('../homepage/node_modules/gatsby').PluginOptions['plugins'] } options.plugins
 * @property { string } [options.config]
 * @property { string } [options.template]
 * @property { 'error' | 'debug' | 'info' | 'silent' | 'trace' | 'warn' } [options.loglevel]
 */

const BUILTIN_EVAL_TOKEN = '=.'
const BASE_CONFIG_URL = `https://public.aitmed.com/config/`
const LOGLEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent']

const data = {
  _components_: {},
  cadlBaseUrl: '',
  configKey: '',
  configUrl: '',
  myBaseUrl: '',
  pages: {
    json: {},
    serialized: {},
  },
  template: '',
}

let createNode
/** @type { import('noodl-ui').Transformer['transform'] } */
let transformComponent

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
  for (const key of ['path', 'template']) {
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
  const { config = 'aitmed', path, template } = pluginOptions || {}

  log.debug(`Config key: ${config}`)
  log.debug(`Output path: ${path}`)
  log.debug(`Template path: ${template}`)

  data.configKey = config
  data.configUrl = utils.ensureYmlExt(`${BASE_CONFIG_URL}${config}`)
  data.template = template

  await cache.set('configKey', data.configKey)
  await cache.set('configUrl', data.configUrl)
}

/**
 * @param { import('gatsby').CreateNodeArgs } args
 * @param { PluginOptions } pluginOptions
 */
exports.onCreateNode = async function onCreateNode(args, pluginOptions) {}

/**
 * @param { import('gatsby').SourceNodesArgs } args
 * @param { PluginOptions } pluginOptions
 */
exports.sourceNodes = async (args, pluginOptions) => {
  const { actions, createContentDigest, createNodeId } = args
  createNode = actions.createNode

  const getTraverse = curry(
    /**
     * @param { (key: string, value: any, parent: Record<string, any>) => void } cb
     * @param { import('noodl-types').ComponentObject } bp
     */
    (cb, bp, componentPath = []) => {
      if (u.isObj(bp)) {
        const entries = u.entries(bp)
        const numEntries = entries.length
        for (let index = 0; index < numEntries; index++) {
          const [key, value] = entries[index]
          cb(key, value, bp, componentPath.concat(key))
          getTraverse(cb, value, componentPath.concat(key))
        }
      } else if (u.isArr(bp)) {
        bp.forEach((b, i) => getTraverse(cb, b, componentPath.concat(i)))
      }
    },
  )

  const paths = []

  const traverse = getTraverse((key, _, __, componentPath) => {
    if (key.startsWith('=.builtIn')) {
      componentPath[componentPath.length - 1] = key.replace(
        BUILTIN_EVAL_TOKEN,
        '',
      )
      paths.push(componentPath.join('.'))
    }
  })

  const { nui, page, pages, sdk, transform } = await getGenerator({
    configKey: data.configKey,
    on: {
      createComponent(comp, opts) {
        const componentId = comp.id || ''
        const blueprint = u.omit(comp.blueprint, ['children'])
        const pageName = get(opts, 'page.page', '')
        const parentId = get(comp, 'parent.id', null)
        const componentPath = opts.path || []

        if (!data.componentsByPage[pageName]) {
          data.componentsByPage[pageName] = {}
        }

        set(data, ['componentsByPage', pageName, componentId], {
          context: u.assign({}, { opts, page: pageName, parent: parentId }),
          blueprint,
        })

        traverse(blueprint, componentPath)
      },
      patch: u.reduce(
        ['addEventListener', 'removeEventListener'],
        (acc, evtName) => {
          /**
           * @argument { object } args
           * @param { boolean } args.wasPatched
           */
          acc[evtName] = function ({ wasPatched } = {}) {
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
      pages: data.pages,
    },
  })

  transformComponent = transform

  // TODO - Remove when official release
  {
    fs.writeJson(path.join(__dirname, './pages-output.json'), pages, {
      spaces: 2,
    })
  }

  data.startPage = (sdk.cadlEndpoint || {}).startPage || 'HomePage'

  page.viewport.width = 1024
  page.viewport.height = 768

  for (const [name, pageObject] of u.entries(pages)) {
    data.pages.json[name] = pageObject
    data.pages.serialized[name] = JSON.stringify(pageObject)

    createNode({
      name,
      slug: `/${name}/`,
      content: data.pages.serialized[name],
      isPreload: false,
      id: createNodeId(name),
      children: [],
      internal: {
        contentDigest: createContentDigest(data.pages.serialized[name]),
        type: NOODL_PAGE_NODE_TYPE,
      },
    })
  }
}

/**
 * @param { import('gatsby').CreatePagesArgs } args
 * @param { PluginOptions } pluginOptions
 */
exports.createPages = async function createPages(args, pluginOptions) {
  try {
    const { actions, graphql } = args
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
       * @param { nt.ComponentObject[] } componentObjects
       */
      const generateComponents = async (componentObjects) => {
        /**
         * @param { nt.ComponentObject | nt.ComponentObject[] } value
         * @returns { Promise<import('./generator').NuiComponent[] }
         */
        async function transformAllComponents(value) {
          const components = []
          const componentsList = u.filter(Boolean, u.array(value))
          const numComponents = componentsList.length
          for (let index = 0; index < numComponents; index++) {
            const transformedComponent = await transformComponent(
              componentsList[index],
            )
            components.push(transformedComponent.toJSON())
          }
          return components
        }

        const transformedComponents = await transformAllComponents(
          componentObjects,
        )

        log.info(`${'Components generated'}`)
        return transformedComponents
      }

      await Promise.all(
        u.entries(data.pages.json).map(async ([pageName, pageObject]) => {
          pageObject.components = await generateComponents(
            pageName,
            pageObject.components,
          )

          const slug = `/${pageName}/`

          createPage({
            path: slug,
            component: pluginOptions.template,
            context: {
              pageName,
              pageObject: JSON.parse(data.pages.serialized[pageName]),
              componentMap: get(data, ['componentsByPage', pageName]) || {},
              slug,
              isPreload: false,
            },
          })
        }) || [],
      )
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

/** @argument { import('gatsby').CreatePageArgs } args */
exports.onCreatePage = async (args) => {}
