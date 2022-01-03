/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 * https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/
 */
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const fs = require('fs-extra')
const path = require('path')

/** @argument { import('gatsby').CreateWebpackConfigArgs } args */
exports.onCreateWebpackConfig = (args) => {
  args.actions.setWebpackConfig({
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
    },
  })
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
          './src/resources/data/homepage-components.json',
        ),
      },
    })
  }
}

/** @argument { import('gatsby').SourceNodesArgs } args */
// exports.sourceNodes = async (args) => {
//   const { actions, createNodeId, createContentDigest } = args
//   const { createNode } = actions
// }

/** @argument { import('gatsby').CreatePagesArgs } args */
exports.createPages = async ({ actions }) => {
  const { createPage } = actions
  createPage({
    path: '/using-dsg',
    component: require.resolve('./src/templates/using-dsg.tsx'),
    context: {},
    defer: true,
  })
}
