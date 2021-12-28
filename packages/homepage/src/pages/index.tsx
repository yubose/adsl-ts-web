import React from 'react'
import { Link } from 'gatsby'
import { StaticImage } from 'gatsby-plugin-image'
import { css } from '@emotion/css'
import Layout from '../layout'
import Seo from '../components/Seo'

const IndexPage = () => (
  <Layout>
    <Seo title="Home" />
    <main>
      <h1>Homepage</h1>
    </main>
  </Layout>
)

export default IndexPage
