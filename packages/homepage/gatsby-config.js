/**
 * @type { import('gatsby').GatsbyConfig }
 */
module.exports = {
  siteMetadata: {
    title: `AiTmed`,
    description: `Anyone, Anywhere, Anytime Start Your E-health Journey With Us! A full-service healthcare solution`,
    siteUrl: `https://aitmed.com/`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-image`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-emotion`,
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
