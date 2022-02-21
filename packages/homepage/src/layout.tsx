import React from 'react'
import { injectGlobal } from '@emotion/css'

injectGlobal`
  * {
    box-sizing: border-box;
    top: 0px;
  }
  html {
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
  }
  body {
    padding: 0px;
    margin: 0px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: hsla(0, 0%, 0%, 0.8);
    font-family: Arial, serif;
    font-size: 16px;
    font-weight: normal;
    font-kerning: normal;
  }
`

const Layout = ({ children }) => {
  return <>{children}</>
}

export default Layout
