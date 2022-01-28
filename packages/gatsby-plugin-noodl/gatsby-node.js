const { createRemoteFileNode } = require('gatsby-source-filesystem')

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
const { getGenerator } = require('./generator')
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
 * @typedef GatsbyNoodlPluginOptions
 * @type { import('./types').GatsbyNoodlPluginOptions }
 */

const BASE_CONFIG_URL = `https://public.aitmed.com/config/`
const LOGLEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent']

const data = {
  _assets_: [],
  _context_: {},
  _pages_: {
    json: {},
    serialized: {},
  },
  configKey: '',
  configUrl: '',
  template: '',
}

exports.unstable_shouldOnCreateNode = unstable_shouldOnCreateNode

/**
 * https://www.gatsbyjs.com/docs/node-apis/
 */

/**
 * @argument { import('gatsby').NodePluginArgs } args
 * @argument { GatsbyNoodlPluginOptions } pluginOptions
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
 * @param { GatsbyNoodlPluginOptions } pluginOptions
 */
exports.onPluginInit = async function onPluginInit(args, pluginOptions) {
  const { cache } = args
  const {
    assets: assetsPath,
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

  /**
   * Saves config files to an output folder
   * NOTE: This is a temporary and might be removed
   */
  if (process.env.NODE_ENV !== 'test' && (outputPath || assetsPath)) {
    if (outputPath) await fs.ensureDir(outputPath)
    if (assetsPath) await fs.ensureDir(assetsPath)
    const { Loader } = require('noodl')
    const loader = new Loader({
      config: data.configKey,
      dataType: 'map',
      deviceType: 'web',
      env: 'stable',
      loglevel: 'verbose',
      version: 'latest',
    })
    await loader.init({
      spread: ['BaseCSS', 'BasePage', 'BaseDataModel', 'BaseMessage'],
    })

    const assets = await loader.extractAssets()

    if (outputPath) {
      await fs.ensureDir(path.join(outputPath, `./${data.configKey}`))
      for (const [name, doc] of loader.root.entries()) {
        const filepath = path.join(
          outputPath,
          `./${data.configKey}/${name}.yml`,
        )
        await fs.writeFile(filepath, doc.toString(), 'utf8')
      }
    }

    if (assetsPath) {
      await Promise.all(
        assets.map(async (asset) => {
          try {
            log.info(`Downloading: ${asset.url}`)
            const resp = await axios.get(asset.url, {
              responseType: 'stream',
            })
            const filepath = path.join(
              assetsPath,
              `./${asset.filename}${asset.ext}`,
            )
            resp.data.pipe(fs.createWriteStream(filepath, { autoClose: true }))
            !data._assets_.includes(filepath) && data._assets_.push(filepath)
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error))
            if (axios.isAxiosError(err)) {
              if (err.response.status === 404) {
                log.warn(
                  `The asset "${asset.url}" returned a ${u.red(
                    '404 Not Found',
                  )} error`,
                )
              }
            } else {
              log.debug(
                error instanceof Error ? error : new Error(String(error)),
              )
            }
          }
        }),
      )
    }
  }
}

/**
 * @param { import('gatsby').SourceNodesArgs } args
 * @param { GatsbyNoodlPluginOptions } pluginOptions
 */
exports.sourceNodes = async function sourceNodes(args, pluginOptions) {
  const { actions, createContentDigest, createNodeId } = args
  const { createNode } = actions
  const { viewport = { width: 1024, height: 768 } } = pluginOptions

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
      /**
       * The generator will be mutating this so ensure that this reference will be stay persistent
       */
      pages: data._pages_,
    },
  })

  // TODO - Link src/pages/index.tsx to load using this as a source
  data.startPage = (sdk.cadlEndpoint || {}).startPage || 'HomePage'

  // TODO - Figure out a way to pre-generate component dimensions using the runtime/client's viewport
  page.viewport.width = viewport.width
  page.viewport.height = viewport.height

  /**
   * Transform parsed json components from lvl3 to Component instances in noodl-ui so the props can be consumed in expected formats in the UI
   * @param { string } pageName
   * @param { nt.ComponentObject[] } componentObjects
   */
  async function generateComponents(pageName, componentObjects) {
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
            /**
             * Called for every component creation (depth-first)
             */
            createComponent(comp, opts) {
              const { path: componentPath, page } = opts || {}
              if (!data._context_[pageName]) data._context_[pageName] = {}

              if (nt.Identify.component.list(comp)) {
                const listObject = comp.get('listObject') || []

                /**
                 * This gets passed to props.pageContext inside NoodlPageTemplate
                 */
                set(data._context_, `${pageName}.lists.${comp.id}`, {
                  id: comp.id,
                  // Descendant component ids will be inserted here later
                  children: [],
                  iteratorVar: comp.blueprint.iteratorVar,
                  listObject,
                  path: componentPath,
                })
              } else if (
                [nt.Identify.component.image, nt.Identify.component.popUp].some(
                  (fn) => fn(comp),
                )
              ) {
                if (comp.type === 'image' && !u.isStr(comp.blueprint.path)) {
                  return
                }

                const props = comp.toJSON()
                const serialized = JSON.stringify(props)

                const nodeProps = {
                  type: comp.type,
                  pageName,
                  componentId: comp.id,
                  componentPath: opts.path.join('.'),
                  parentId: comp.parent?.id || null,
                  id: createNodeId(serialized),
                  internal: {
                    contentDigest: createContentDigest(serialized),
                    type: 'NoodlComponent',
                  },
                }

                if (comp.type === 'image') {
                  nodeProps.src = comp.blueprint.path
                } else if (comp.type === 'popUp') {
                  nodeProps.popUpView = comp.blueprint.popUpView
                }

                createNode(nodeProps)
              }
            },
          },
        })

        // Serialize the noodl-ui components before they get sent to bootstrap the server-side rendering
        components.push(transformedComponent.toJSON())
      }
      return components
    }

    const transformedComponents = await transformAllComponents(componentObjects)

    pageName && log.info(`${u.yellow(pageName)} Components generated`)
    return transformedComponents
  }

  /**
   * Create GraphQL nodes for "preload" pages so they can be queried in the client side
   */
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
  /**
   * Create GraphQL nodes for app pages so they can be queried in the client side
   */
  for (const [name, pageObject] of u.entries(pages)) {
    page.page = name
    pageObject.components = await generateComponents(
      name,
      pageObject.components,
    )

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

    data._pages_.serialized[name] = JSON.stringify(pageObject)
    data._pages_.json[name] = JSON.parse(data._pages_.serialized[name])

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

  if (pluginOptions.introspection) {
    await fs.writeJson(
      path.join(pluginOptions.path, `./${data.configKey}_introspection.json`),
      pages,
      { spaces: 2 },
    )
  }
}

/**
 * @param { import('gatsby').CreatePagesArgs } args
 * @param { GatsbyNoodlPluginOptions } pluginOptions
 */
exports.createPages = async function createPages(args, pluginOptions) {
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

/**
 *
 * @param { import('gatsby').CreateSchemaCustomizationArgs } args
 */
exports.createSchemaCustomization = ({ actions, schema }) => {
  const { createTypes } = actions
  const typeDefs = [
    schema.buildObjectType({
      name: 'NoodlComponent',
      fields: {
        type: 'String!',
        pageName: 'String',
        componentId: 'String',
        componentPath: 'String',
        parentId: 'String',
        popUpView: 'String',
        src: {
          type: 'String',
          resolve: (source, a, b, c) => {
            log.info({ source, a, b, c })
            return source.src
          },
        },
      },
      interfaces: ['Node'],
    }),
  ]

  createTypes(typeDefs)
}

/**
 *
 * @param { import('gatsby').CreateNodeArgs } args
 */
exports.onCreateNode = async ({
  node,
  actions: { createNode, createNodeField },
  createNodeId,
  getCache,
}) => {
  if (node.internal.type === 'File' && node.sourceInstanceName === 'assets') {
    // const imageNode =
    // const fileNode = await createRemoteFileNode({
    //   url: node.frontmatter.featuredImgUrl, // string that points to the URL of the image
    //   parentNodeId: node.id, // id of the parent node of the fileNode you are going to create
    //   createNode, // helper function in gatsby-node to generate the node
    //   createNodeId, // helper function in gatsby-node to generate the node id
    //   getCache,
    // })
    // if the file was created, extend the node with "localFile"
    // if (fileNode) {
    //   createNodeField({ node, name: 'localFile', value: fileNode.id })
    // }
  }
}
