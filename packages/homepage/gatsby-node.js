/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 * https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/
 */
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

/** @argument { import('gatsby').CreateWebpackConfigArgs } args */
exports.onCreateWebpackConfig = (args) => {
  args.actions.setWebpackConfig({
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
    },
  })
}
