/**
 * https://www.gatsbyjs.com/docs/use-static-query/
 */
import React from 'react'
import { Helmet } from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'

export interface SeoProps {
  title: string
  description?: string
  lang?: string
  meta?: Record<string, any>[]
}

function Seo({
  title = '',
  description = '',
  canonical = '',
  lang = 'en',
  meta = [],
}) {
  const {
    site: {
      siteMetadata: { siteTitle, siteDescription, siteUrl, siteKeywords },
    },
  } = useStaticQuery<{
    site: {
      siteMetadata: {
        siteTitle: string
        siteDescription: string
        siteUrl: string
        siteKeywords: string[]
      }
    }
  }>(
    graphql`
      query {
        site {
          siteMetadata {
            siteTitle
            siteDescription
            siteUrl
            siteKeywords
          }
        }
      }
    `,
  )

  return (
    <Helmet
      htmlAttributes={{ lang }}
      title={siteTitle}
      meta={[
        {
          name: `description`,
          content: siteDescription,
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: siteDescription,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        {
          name: `twitter:card`,
          content: `summary`,
        },
        // {
        //   name: `twitter:creator`,
        //   content: site.siteMetadata?.author || ``,
        // },
        {
          name: `twitter:title`,
          content: title,
        },
        {
          name: `twitter:description`,
          content: siteDescription,
        },
      ].concat(meta)}
    />
  )
}

export default Seo
