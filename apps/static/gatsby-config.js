process.stdout.write('\x1Bc')

const u = require('@jsmanifest/utils')

// CONFIG is shorter than NOODL_CONFIG. NOODL_CONFIG will be deprecated
const configKey = process.env.CONFIG || process.env.NOODL_CONFIG || 'www'
const viewport =
  process.env.MOBILE || process.env.CONFIG === 'mob'
    ? { width: 414, height: 736 } // iPhone 8 Plus
    : { width: 1024, height: 768 }

const {
  name: siteName,
  title: siteTitle,
  description: siteDescription,
  keywords: siteKeywords = [],
  logo: siteLogo,
  url: siteUrl,
  video: siteVideo,
} = getSiteMetadata('../web/webpack.config.js')

for (const titleOrDescOrName of [siteName, siteTitle, siteDescription]) {
  if (!titleOrDescOrName) {
    // throw new Error(
    //   `Missing site name, title, and/or site description. ` +
    //     `Check ${u.cyan('webpack.config.js')} at ` +
    //     `${u.yellow(path.resolve(__dirname, '../../webpack.config.js'))}`,
    // )
  }
}

/**
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 * @type { import('gatsby').GatsbyConfig }
 */
module.exports = {
  jsxRuntime: 'automatic',
  jsxImportSource: '@emotion/react',
  siteMetadata: {
    siteName,
    siteTitle,
    siteDescription,
    siteLogo,
    siteUrl,
    siteKeywords,
    siteVideo,
  },
  // pathPrefix,
  plugins: [
    `gatsby-transformer-json`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-image`,
    `gatsby-plugin-sitemap`,
    `gatsby-plugin-emotion`,
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
      resolve: 'gatsby-transformer-sharp',
    },
    {
      // resolve: 'gatsby-plugin-noodl',
      resolve: require.resolve(
        '../../../aitmed-noodl-lib/packages/gatsby-plugin-noodl',
      ),
      options: {
        // Defaults to "aitmed"
        config: {
          name: configKey,
          protocol: 'https',
          host: 'public.aitmed.com',
          pathPrefix: '/config',
        },
        cwd: __dirname,
        loglevel: 'debug',
        paths: {
          output: `output`,
          src: `src`,
          template: `src/templates/page.tsx`,
        },
        // Defaults to { width: 1024, height: 768 }
        viewport,
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
    'gatsby-plugin-remove-serviceworker',
    // {
    // https://www.gatsbyjs.com/plugins/gatsby-plugin-offline/
    // resolve: `gatsby-plugin-offline`,
    // options: {
    //   workboxConfig: {
    //     clientsClaim: true,
    //     modifyURLPrefix: {
    //       '/': `${pathPrefix}/`,
    //     },
    /**
     * This will prevent browsers from caching these types of files and
     * let the file name do the versioning to determine freshness instead
     *
     * For more info check this link:
     * https://www.gatsbyjs.com/plugins/gatsby-plugin-offline/#overriding-workbox-configuration
     */
    //       dontCacheBustURLsMatching: /(\.js$|\.css$|static\/)/,
    //       runtimeCaching: [
    //         {
    //           // Same reason as above
    //           urlPattern: /(\.js$|\.css$|static\/)/,
    //           handler: `CacheFirst`,
    //         },
    //         {
    //           urlPattern: /^https?:.*\/page-data\/.*\.json/,
    //           handler: `StaleWhileRevalidate`,
    //         },
    //         {
    //           urlPattern:
    //             /^https?:.*\.(png|jpg|jpeg|webp|svg|gif|tiff|js|woff|woff2|json|css)$/,
    //           handler: `StaleWhileRevalidate`,
    //         },
    //         {
    //           urlPattern: /^https?:\/\/fonts\.googleapis\.com\/css/,
    //           handler: `StaleWhileRevalidate`,
    //         },
    //       ],
    //       skipWaiting: true,
    //     },
    //   },
    // },
  ],
}

/**
 * @param { string } relativePathToWebAppWebpackConfig
 * @returns { { name: string; title: string; description: string; keywords: string[]; url: string }}
 */
function getSiteMetadata(relativePathToWebAppWebpackConfig) {
  const metadata = {
    // TODO - Extract name from webpack.config.js instead
    name: '',
    keywords: [],
    logo: 'https://public.aitmed.com/cadl/www3.83/assets/aitmedLogo.png',
    url: `https://aitmed.com`,
    video:
      'https://public.aitmed.com/commonRes/video/aitmed228FromBlair11192020.mp4',
  }

  const settings = require(relativePathToWebAppWebpackConfig)?.settings || {}

  metadata.name = settings?.name || 'AiTmed'
  metadata.title =
    settings.title || 'Start your E-health Journey Anywhere, Anytime'
  metadata.description =
    settings.description ||
    'Anyone, Anywhere, Anytime Start Your E-health Journey With Us'
  metadata.keywords = u.isArr(settings?.keywords) ? settings.keywords : []

  return metadata
}
