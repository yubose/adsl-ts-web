import React from 'react'
import Layout from '../layout'
import Seo from '../components/Seo'

const NotFoundPage = () => (
  <Layout>
    <Seo title="404: Not found" />
    <main>
      <h1>404: Not Found</h1>
      <p>You just hit a route that doesn&#39;t exist</p>
    </main>
  </Layout>
)

export default NotFoundPage
