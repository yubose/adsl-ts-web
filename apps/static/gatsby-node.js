/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 * https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/
 */
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

/** @argument { import('gatsby').CreateWebpackConfigArgs } */
exports.onCreateWebpackConfig = ({ actions, stage }) => {
  actions.setWebpackConfig({
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
    },
  })

  if (stage === `build-javascript`) {
    // Comment to disable source maps (decreases file size)
    actions.setWebpackConfig({
      devtool: false,
    })
  }
}

exports.onPostBuild = ({ reporter }) => {
  reporter.info(`Your AiTmed static web application has been built`)
}
