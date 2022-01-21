const siteTitle = 'AiTmed: Start your E-health Journey Anywhere, Anytime'
const siteDescription = `Anyone, Anywhere, Anytime Start Your E-health Journey With Us`
const siteUrl = `https://aitmed.com/`
const siteKeywords = [
  'aitmed',
  'noodl',
  'telemedicine',
  'telehealth',
  'blockchain Telemedicine',
  'Fast, Private, Secure',
  'Blockchain Telehealth Platform',
  'HIPAA Compliance',
  'Pandemic',
  'Covid19',
  'Wellness and illness',
  'Telemedicine clinic',
  'Telemedicine Pediatric',
  'Telemedicine Urgent Care',
  'Telemedicine dermatology',
  'Telemedicine Senior House',
  'Telemedicine Hospital',
  'Telemedicine RADIOLOGY',
  'Telemedicine Neurology',
  'Telehealth Lab',
  'Telehealth Pandemic',
  'Telehealth Covid19',
  'Telehealth clinic',
  'Telehealth Pediatric',
  'Telehealth Urgent Care',
  'Telehealth dermatology',
  'Telehealth Senior House',
  'Telehealth Hospital',
  'Telehealth RADIOLOGY',
  'Telehealth Neurology',
  'Telehealth Lab',
  'Doctor Virtual Platform',
  'Telemedicine Imaging',
  'Online Medical Practice',
  'Online schedule',
  'E-prescription',
  'Virtual Meeting Room',
  'Virtual platform',
  'Secure Platform',
  'Virtual Visit',
  'Private Visit',
  'doctor',
  'patient',
  'chronic illness',
  'Medical clinic',
  'medical platform',
  'Medical knowledge',
  'telecommunication',
  'virtual',
  'Vital Sign',
]

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
      resolve: require.resolve(`../gatsby-noodl-plugin`),
      options: {
        configPrefix: `https://public.aitmed.com/config/`,
        config: 'www',
        loglevel: 'debug',
        path: `${__dirname}/output`,
      },
    },
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
