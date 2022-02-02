import React from 'react'
import { Helmet } from 'react-helmet'
import AppProvider from './src/AppProvider'
import favicon from './src/resources/favicon.ico'

export default function ({ element, headComponents }) {
  return (
    <>
      <Helmet htmlAttributes={{ lang: 'en' }}>
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {headComponents}
        <link rel="icon" type="image/png" href={favicon} sizes="32x32" />
      </Helmet>
      <AppProvider>{element}</AppProvider>
    </>
  )
}
