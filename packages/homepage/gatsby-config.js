const fs = require('fs-extra')
const path = require('path')
const webpackConfig = require('../../webpack.config')

const siteTitle = 'AiTmed'
const siteDescription = `Anyone, Anywhere, Anytime Start Your E-health Journey With Us! A full-service healthcare solution`
const siteUrl = `https://aitmed.com/`

/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 * @type { import('gatsby').GatsbyConfig }
 */
module.exports = {
  siteMetadata: {
    siteTitle: webpackConfig.TITLE,
    siteDescription: webpackConfig.DESCRIPTION,
    siteUrl,
    siteKeywords: webpackConfig.KEYWORDS,
  },
  plugins: [
    `gatsby-transformer-json`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-image`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-emotion`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `assets`,
        path: `${__dirname}/src/resources/assets`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `data`,
        path: `${__dirname}/src/resources/data`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/resources/images`,
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `AiTmed Homepage`,
        short_name: `AiTmed`,
        start_url: `/`,
        background_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/resources/images/logo.png`, // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
