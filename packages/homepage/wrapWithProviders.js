import React from 'react'
import { Helmet } from 'react-helmet'
import { css, Global, ThemeProvider } from '@emotion/react'
import AppProvider from './src/AppProvider'
import favicon from './src/resources/favicon.ico'

export default function ({ element, headComponents }) {
  return (
    <>
      <Helmet htmlAttributes={{ lang: 'en' }}>
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {headComponents}
        <link rel="icon" type="image/png" href={favicon} sizes="32x32" />
        <link rel="icon" type="image/png" href={favicon} sizes="42x42" />
        <meta name="build-timestamp" content={new Date().toISOString()} />
        <meta
          name="google-site-verification"
          content="ftZTuRqMUQ4uHXtPrSeyqxtArLLI3q9BvqvVVo9pfdc"
        />
      </Helmet>
      <ThemeProvider>
        <Global
          styles={css({
            ':root': {
              boxSizing: 'border-box',
              top: 0,
            },
            html: {
              textSizeAdjust: '100%',
            },
            body: {
              padding: 0,
              margin: 0,
              fontSmoothing: 'antialiased',
              color: '#333',
              fontFamily: 'Arial, sans-serif',
              fontKerning: 'normal',
            },
          })}
        />
      </ThemeProvider>
      <AppProvider>{element}</AppProvider>
    </>
  )
}
