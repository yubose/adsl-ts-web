/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 * https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/
 */
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')

/** @argument { import('gatsby').CreateWebpackConfigArgs } args */
exports.onCreateWebpackConfig = (args) => {
  args.actions.setWebpackConfig({
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
    },
  })
}
