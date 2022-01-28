const fs = require('fs-extra')
const path = require('path')
const { parse, traverse, types } = require('@babel/core')

let siteTitle = ''
let siteDescription = ``
let siteKeywords = []
let siteUrl = `https://aitmed.com/`

const webAppWebpackConfigAST = parse(
  fs.readFileSync(path.join(__dirname, '../../webpack.config.js'), 'utf8'),
)

traverse(webAppWebpackConfigAST, {
  enter(path) {
    if (
      path.isVariableDeclarator() &&
      /(TITLE|DESCRIPTION|KEYWORDS)/.test(path.node.id.name)
    ) {
      let name = path.node.id.name
      let value
      if (path.node.init) {
        if (types.isLiteral(path.node.init)) {
          if (path.node.init.type === 'TemplateLiteral') {
            const quasis = path.node.init.quasis
            const elem = quasis.find((elem) => !!elem.value.raw)
            value = elem?.value?.raw || ''
          } else if (path.node.init.type === 'StringLiteral') {
            value = path.node.init.value
          }
          if (value) {
            if (name === 'TITLE') siteTitle = value
            else if (name === 'DESCRIPTION') siteDescription = value
          }
        } else if (types.isArrayExpression(path.node.init)) {
          path.node.init.elements.forEach((elem) => {
            if (types.isLiteral(elem)) {
              if (
                elem.value &&
                typeof elem.value === 'string' &&
                !siteKeywords.includes(elem.value)
              ) {
                siteKeywords.push(elem.value)
              }
            }
          })
        }
      }
    }
  },
})

for (const titleOrDesc of [siteTitle, siteDescription]) {
  if (!titleOrDesc) {
    throw new Error(
      `Missing site title and/or site description. Check gatsby-config.js`,
    )
  }
}

/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 * @type { import('gatsby').GatsbyConfig }
 */
module.exports = {
  siteMetadata: {
    siteTitle,
    siteDescription,
    siteUrl,
    siteKeywords,
  },
  plugins: [
    `gatsby-transformer-json`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-image`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-emotion`,
    {
      resolve: `gatsby-plugin-layout`,
      options: {
        component: require.resolve(`./src/layout.tsx`),
      },
    },
    {
      resolve: require.resolve(`../gatsby-plugin-noodl`),
      options: {
        // If we provide this assets will be downloaded to this path.
        // Doing this will enable us to cache images and references/use them statically which can allow fancy UX features like traced SVG placeholders without affecting performance or load times
        // NOTE: If we do this we need to point to this path via `gatsby-source-filesystem` (look below for src/resources/images for an example)
        assets: `${__dirname}/src/resources/assets`,
        config: 'web',
        loglevel: 'debug',
        // If we provide this path the yml files/assets will be made available
        //          path: `${__dirname}/output`,
        template: path.resolve(`src/templates/page.tsx`),
        viewport: {
          width: 1024,
          height: 768,
        },
      },
    },
    {
      // Needed if "assets" option is provided to gatsby-plugin-noodl
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `assets`,
        path: `${__dirname}/src/resources/assets`,
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
        icon: `src/resources/images/logo.png`,
      },
    },
    `gatsby-plugin-offline`,
  ],
}
