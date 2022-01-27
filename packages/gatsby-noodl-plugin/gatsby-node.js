/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 * https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/
 */
const u = require('@jsmanifest/utils')
const { publish } = require('noodl-ui')
const log = require('loglevel')
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
  _context_: {},
  _pages_: {
    json: {},
    serialized: {},
  },
  cadlBaseUrl: '',
  configKey: '',
  configUrl: '',
  myBaseUrl: '',
  template: '',
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
  for (const key of ['path', 'template']) {
    if (pluginOptions[key]) {
      pluginOptions[key] = pluginOptions[key].replace(/\\/g, '/')
    }
  }
}

/**
 * @param { import('gatsby').NodePluginArgs } args
 * @param { PluginOptions } pluginOptions
 */
exports.onPluginInit = async function onPluginInit(args, pluginOptions) {
  const { cache } = args
  const {
    config = 'aitmed',
    path: outputPath,
    template: templatePath,
  } = pluginOptions || {}

  log.debug(`Config key: ${config}`)
  log.debug(`Output path: ${outputPath}`)
  log.debug(`Template path: ${templatePath}`)

  data.configKey = config
  data.configUrl = utils.ensureYmlExt(`${BASE_CONFIG_URL}${config}`)
  data.template = templatePath

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
  const { createNode } = actions
  const { viewport = { width: 1024, height: 768 } } = pluginOptions

  /**
   * @param { import('noodl-ui').NuiComponent.Instance[] } comp
   * @param { string[] } [_path]
   */

  function collectChildren(component, _path, index) {
    return component.children.reduce((acc, child, i) => {
      const listIndex = u.isNum(index) ? index : i
      if (!acc[listIndex]) acc[listIndex] = []
      acc[listIndex].push(component.id)
      acc[listIndex].push(
        ...collectChildren(child, _path.concat('children', i), i),
      )
      return acc
    }, [])
  }

  const { nui, page, pages, sdk, transform } = await getGenerator({
    configKey: data.configKey,
    on: {
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
      pages: data._pages_,
    },
  })

  // TODO - Remove when done
  {
    fs.writeJson(path.join(__dirname, './pages-output.json'), pages, {
      spaces: 2,
    })
  }

  data.startPage = (sdk.cadlEndpoint || {}).startPage || 'HomePage'

  page.viewport.width = viewport.width
  page.viewport.height = viewport.height

  /**
   * @param { string } pageName
   * @param { nt.ComponentObject[] } componentObjects
   */
  const generateComponents = async (pageName, componentObjects) => {
    /**
     * @param { nt.ComponentObject | nt.ComponentObject[] } value
     * @returns { Promise<import('./generator').NuiComponent[] }
     */
    async function transformAllComponents(value) {
      const components = []
      const componentsList = u.filter(Boolean, u.array(value))
      const numComponents = componentsList.length

      for (let index = 0; index < numComponents; index++) {
        const transformedComponent = await transform(componentsList[index], {
          context: {
            path: [index],
          },
          on: {
            createComponent(comp, opts) {
              const { iteratorVar, path: componentPath } = opts || {}
              if (!data._context_[pageName]) data._context_[pageName] = {}

              if (comp.type === 'list') {
                const componentId = comp.id || ''
                const listObject = comp.get('listObject') || []

                set(data._context_, `${pageName}.lists.${componentId}`, {
                  id: componentId,
                  children: [],
                  iteratorVar: comp.blueprint.iteratorVar,
                  listObject,
                  path: componentPath,
                })
              }
            },
          },
        })

        components.push(transformedComponent.toJSON())
      }
      return components
    }

    const transformedComponents = await transformAllComponents(componentObjects)

    log.info(`[${u.yellow(pageName)}] Components generated`)
    return transformedComponents
  }

  for (const [name, obj] of u.entries(
    u.omit(sdk.root, [...sdk.cadlEndpoint.preload, ...sdk.cadlEndpoint.page]),
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

  for (const [name, pageObject] of u.entries(pages)) {
    page.page = name
    pageObject.components = await generateComponents(
      name,
      pageObject.components,
    )

    const lists = data._context_[name]?.lists

    pageObject.components.forEach((component) => {
      publish(component, (comp) => {
        if (comp.type === 'list') {
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

    data._pages_.serialized[name] = JSON.stringify(pageObject)
    data._pages_.json[name] = JSON.parse(data._pages_.serialized[name])

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

      for (const pageName of u.keys(data._pages_.json)) {
        const slug = `/${pageName}/`

        createPage({
          path: slug,
          component: pluginOptions.template,
          context: {
            pageName,
            pageObject: u.pick(data._pages_.json[pageName], 'components'),
            _context_: get(data._context_, pageName) || {},
            slug,
            isPreload: false,
          },
        })
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}
