import * as u from '@jsmanifest/utils'
/**
 * https://www.gatsbyjs.com/docs/use-static-query/
 */
import React from 'react'
import { Helmet } from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'

export interface SeoProps {
  title?: string
  description?: string
  canonical?: string
  lang?: string
  url?: string
  allowIndex?: boolean
  allowFollow?: boolean
  og?: {
    title?: string
    description?: string
    type?: string
    image?:
      | string
      | {
          alt?: string
          url: string
          width: number
          height: number
        }
    locale?: string
    siteName?: string
    url?: string
    video?:
      | string
      | {
          url: string
          width: number
          height: number
        }
  }
  twitter?: {
    // Defaults to "app"
    card?: 'app' | 'player' | 'summary' | 'summary_large_image'
    creator?: string
    site?: string
    title?: string
    description?: string
    type?: string
    url?: string
  }
}

const socialMedia = {
  facebook: 'https://www.facebook.com/AITMEDinc',
  pinterest: 'https://www.pinterest.com/aitmedinc/_created/',
  linkedin: 'https://www.linkedin.com/company/aitmed',
  twitter: 'https://www.twitter.com/AITmedInc',
  tiktok: 'https://www.tiktok.com/@aitmedinc?lang=en',
  youtube: 'https://www.youtube.com/channel/UC1su9VCcj8-Ml02W9g35kpw',
} as const

function renderMediaMetaTag(
  type = 'og' as 'og' | 'twitter',
  assetType: 'image' | 'video',
  value:
    | string
    | {
        url: string
        width: string | number
        height: string | number
        alt?: string
      },
) {
  const prefix = type === 'twitter' ? 'twitter' : 'og'
  const property = `${prefix}:${assetType}`

  if (u.isStr(value)) {
    return <meta property={property} content={value} />
  }

  if (value && u.isObj(value)) {
    return (
      <>
        {assetType === 'image' && value.alt && (
          <meta property="og:image:alt" content={value.alt} />
        )}
        <meta property={`${property}:width`} content={String(value.width)} />
        <meta property={`${property}:height`} content={String(value.height)} />
      </>
    )
  }

  return null
}

function Seo({
  title = '',
  description = '',
  canonical = '',
  lang = 'en',
  og = {},
  twitter = {},
  url = '',
  allowIndex = true,
  allowFollow = true,
}: SeoProps) {
  const {
    site: {
      siteMetadata: {
        siteName,
        siteTitle,
        siteDescription,
        siteLogo,
        siteUrl,
        siteKeywords,
        siteVideo,
      },
    },
  } = useStaticQuery<{
    site: {
      siteMetadata: {
        siteName: string
        siteTitle: string
        siteDescription: string
        siteLogo: string
        siteUrl: string
        siteKeywords: string[]
        siteVideo: string
      }
    }
  }>(
    graphql`
      query {
        site {
          siteMetadata {
            siteName
            siteTitle
            siteDescription
            siteLogo
            siteUrl
            siteKeywords
            siteVideo
          }
        }
      }
    `,
  )

  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{title || siteTitle}</title>
      <meta name="description" content={description || siteDescription} />
      <meta name="keywords" content={siteKeywords.join(',')} />
      <meta name="image" content={siteLogo} />
      <meta
        name="robots"
        content={`${allowIndex ? 'index' : 'noindex'}, ${
          allowFollow ? 'follow' : 'nofollow'
        }`}
      />
      <meta property="og:title" content={og.title || title || siteTitle} />
      <meta
        property="og:description"
        content={og.description || description || siteDescription}
      />
      {renderMediaMetaTag('og', 'image', og.image)}
      <meta property="og:locale" content={og.locale || 'en_US'} />
      <meta property="og:site_name" content={og.siteName || siteName} />
      <meta property="og:type" content={og.type || 'website'} />
      <meta property="og:url" content={og.url || url || siteUrl} />
      {renderMediaMetaTag('og', 'video', og.video || siteVideo)}
      <meta name="twitter:card" content={twitter.card || 'app'} />
      <meta name="twitter:creator" content={twitter.creator || 'AITmedInc'} />
      <meta name="twitter:site" content={twitter.site || siteName} />
      <meta name="twitter:title" content={twitter.title || title} />
      <meta
        name="twitter:description"
        content={twitter.description || description}
      />
      <link rel="canonical" href={canonical || siteUrl} />
      <script type="application/ld+json">
        {`
          {
            "@context": "http://www.schema.org",
            "@type": "Corporation",
            "name": "${siteName}",
            "url": "${siteUrl}",
            "sameAs": [
              "https://www.aitmed.com"
            ],
            "logo": "${siteLogo}",
            "description": "${siteDescription}",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "1000 S ANAHEIM BLVD",
              "addressLocality": "ANAHEIM",
              "addressRegion": "CA",
              "postalCode": "92802",
              "addressCountry": "United States"
            },
           "geo": {
              "@type": "GeoCoordinates",
              "latitude": "33.8207313",
              "longitude": "-117.9108458"
            },
            "hasMap": "https://www.google.com/maps/place/1000+S+Anaheim+Blvd,+Anaheim,+CA+92805/@33.8207313,-117.9108458,17z/data=!3m1!4b1!4m5!3m4!1s0x80dcd7cc94f51025:0x29eea80f7e954c82!8m2!3d33.8207269!4d-117.9086518"
          }
        `}
      </script>
      <script type="application/ld+json">
        {`{
            "@context" : "https://schema.org",
            "@type" : "Organization",
            "name" : "${siteName}",
            "url" : "${siteUrl}",
            "sameAs" : [${u.values(socialMedia).map((s) => `${s}`)}]
          }
        `}
      </script>
      <script type="application/ld+json">
        {`{
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": "What is ${siteName}? Welcome to the only organic Telehealth platform",
            "description": "${siteName} is the most secure, private, and fast Blockchain-based telehealth platform. ${siteName} Telehealth platform is for everyone’s illness and wellness. If you are a provider. Whether solo practice/clinics/nursing home/lab/image center or hospitals. You can immediately enjoy the highest secure, fast virtual medical office for ONE MONTH FREE",
            "thumbnailUrl": "https://public.aitmed.com/cadl/www3.83/assets/backgroundBlack.png",
            "uploadDate": "2020-11-19T00:00:00+00:00",
            "duration": "PT2M27S",
            "contentUrl": "${siteVideo}",
            "embedUrl": "https://www.youtube.com/embed/75IblRuw3ow",
            "interactionCount": "9231"
        }`}
      </script>
    </Helmet>
  )
}

export default Seo
