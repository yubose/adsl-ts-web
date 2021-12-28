/**
 * Layout component that queries for data with Gatsby's useStaticQuery component
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import React from 'react'
import { injectGlobal } from '@emotion/css'
import { useStaticQuery, graphql } from 'gatsby'

injectGlobal`
  * {
    box-sizing: border-box;
  }
  html {
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    box-sizing: border-box;
    overflow-y: scroll;
  }
  body {
    margin: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: hsla(0, 0%, 0%, 0.8);
    font-family: Arial, serif;
    font-weight: normal;
    font-kerning: normal;
  }
`

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <>
      {/* <Header siteTitle={data.site.siteMetadata?.title || `Title`} /> */}
      <main>{children}</main>
    </>
  )
}

export default Layout
