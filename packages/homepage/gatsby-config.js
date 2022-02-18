const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')
const { parse, traverse, types } = require('@babel/core')

//const pathPrefix = `static/web/latest` // if deployed not to root directory
const pathPrefix = `` // deployed to root directory
// CONFIG is shorter than NOODL_CONFIG. NOODL_CONFIG will be deprecated
const configKey = process.env.CONFIG || process.env.NOODL_CONFIG || 'mob'

const {
  name: siteName,
  title: siteTitle = '',
  description: siteDescription = '',
  keywords: siteKeywords,
  logo: siteLogo,
  url: siteUrl,
  video: siteVideo,
} = getSiteMetadata('../../webpack.config.js')

for (const titleOrDescOrName of [siteName, siteTitle, siteDescription]) {
  if (!titleOrDescOrName) {
    throw new Error(
      `Missing site name, title, and/or site description. ` +
        `Check ${u.cyan('webpack.config.js')} at ` +
        `${u.yellow(path.resolve(__dirname, '../../webpack.config.js'))}`,
    )
  }
}

/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 * @type { import('gatsby').GatsbyConfig }
 */
module.exports = {
  siteMetadata: {
    siteName,
    siteTitle,
    siteDescription,
    siteLogo,
    siteUrl,
    siteKeywords,
    siteVideo,
  },
  pathPrefix,
  plugins: [
    `gatsby-transformer-json`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-image`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-emotion`,
    `gatsby-plugin-sitemap`,
    {
      resolve: `gatsby-plugin-sharp`,
      options: {
        defaults: {
          avifOptions: {},
          backgroundColor: 'transparent',
          blurredOptions: {},
          breakpoints: [480, 720, 1024, 1920],
          formats: ['auto', 'webp'],
          jpgOptions: {},
          pngOptions: {},
          quality: 50,
          tracedSVGOptions: {
            color: '#d6ede4',
          },
          webpOptions: {},
        },
        defaultQuality: 50,
        failOnError: true,
      },
    },
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
        config: configKey,
        loglevel: 'debug',
        // This will be used in the plugin to grab the version in the config object
        deviceType: 'web',
        // If introspection is true, it will dump all of the TRANSFORMED noodl
        // pages in json to the output path specified below as
        //  "<outputPath>/<config>.introspection.json"
        introspection: true,
        // If we provide this path the yml files/assets will be made available
        path: `${__dirname}/output`,
        // If we don't provide this, it will use the startPage in cadlEndpoint in the yaml. If it is not in cadlEndpoint, the fallback is 'HomePage'
        // startPage: 'MobHomePage',
        template: path.resolve(`src/templates/page.tsx`),
        viewport: {
          width: 520,
          height: 740,
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
    // {
    //   resolve: `gatsby-plugin-feed`,
    //   options: {
    //     query: `
    //       {
    //         site {
    //           siteMetadata {
    //             siteName,
    //             title: siteTitle
    //             description: siteDescription
    //             siteLogo
    //             siteUrl
    //             site_url: siteUrl
    //             siteVideo
    //           }
    //         }
    //       }
    //     `,
    //     feeds: [
    //       {
    //         serialize: ({ query: { site, allNoodlPage } }) => {
    //           return allNoodlPage.nodes.map((node) => {
    //             return Object.assign({}, node, {
    //               name: node.name,
    //               id: node.id,
    //               url: site.siteMetadata.siteUrl + node.slug,
    //               custom_elements: [{ 'content:encoded': node.content }],
    //             })
    //           })
    //         },
    //         query: `
    //           {
    //             allNoodlPage {
    //               nodes {
    //                 id
    //                 name
    //                 content
    //                 slug
    //               }
    //             }
    //           }
    //         `,
    //         output: '/rss.xml',
    //         title: 'AiTmed RSS Feed',
    //       },
    //     ],
    //   },
    // },
    // {
    //   resolve: 'gatsby-plugin-webpack-bundle-analyser-v2',
    //   options: {
    //     analyzerMode: 'server',
    //     analyzerPort: '3003',
    //     defaultSizes: 'gzip',
    //     disable: true,
    //   },
    // },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `${siteName} Homepage`,
        short_name: siteName,
        start_url: `/`,
        background_color: `#2596be`,
        display: `minimal-ui`,
        icon: `${__dirname}/src/resources/images/logo.png`,
      },
    },
    // 'gatsby-plugin-remove-serviceworker',
    {
      // https://www.gatsbyjs.com/plugins/gatsby-plugin-offline/
      resolve: `gatsby-plugin-offline`,
      options: {
        workboxConfig: {
          clientsClaim: true,
          modifyURLPrefix: {
            '/': `${pathPrefix}/`,
          },
          /**
           * This will prevent browsers from caching these types of files and
           * let the file name do the versioning to determine freshness instead
           *
           * For more info check this link:
           * https://www.gatsbyjs.com/plugins/gatsby-plugin-offline/#overriding-workbox-configuration
           */
          dontCacheBustURLsMatching: /(\.js$|\.css$|static\/)/,
          runtimeCaching: [
            {
              // Same reason as above
              urlPattern: /(\.js$|\.css$|static\/)/,
              handler: `CacheFirst`,
            },
            {
              urlPattern: /^https?:.*\/page-data\/.*\.json/,
              handler: `StaleWhileRevalidate`,
            },
            {
              urlPattern:
                /^https?:.*\.(png|jpg|jpeg|webp|svg|gif|tiff|js|woff|woff2|json|css)$/,
              handler: `StaleWhileRevalidate`,
            },
            {
              urlPattern: /^https?:\/\/fonts\.googleapis\.com\/css/,
              handler: `StaleWhileRevalidate`,
            },
          ],
          skipWaiting: true,
        },
      },
    },
  ],
}

/**
 * @param { string } relativePathToWebAppWebpackConfig
 * @returns { { name: string; title: string; description: string; keywords: string[]; url: string }}
 */
function getSiteMetadata(relativePathToWebAppWebpackConfig) {
  const metadata = {
    // TODO - Extract name from webpack.config.js instead
    name: 'AiTmed',
    keywords: [],
    logo: 'https://public.aitmed.com/cadl/www3.83/assets/aitmedLogo.png',
    url: `https://aitmed.com`,
    video:
      'https://public.aitmed.com/commonRes/video/aitmed228FromBlair11192020.mp4',
  }

  const webAppWebpackConfigAST = parse(
    fs.readFileSync(
      path.join(__dirname, relativePathToWebAppWebpackConfig),
      'utf8',
    ),
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
              if (name === 'TITLE') metadata.title = value
              else if (name === 'DESCRIPTION') metadata.description = value
            }
          } else if (types.isArrayExpression(path.node.init)) {
            path.node.init.elements.forEach((elem) => {
              if (types.isLiteral(elem)) {
                if (
                  elem.value &&
                  typeof elem.value === 'string' &&
                  !metadata.keywords.includes(elem.value)
                ) {
                  metadata.keywords.push(elem.value)
                }
              }
            })
          }
        }
      }
    },
  })

  return metadata
}
