import React from 'react'
import { Box, Heading, Text } from 'theme-ui'
// import Seo from '../components/Seo'

function NotFoundPage() {
  return (
    <>
      {/* <Seo title="404: Not found" /> */}
      <Box as="main">
        <Heading>404: Not Found</Heading>
        <Text>You just hit a route that doesn&#39;t exist</Text>
      </Box>
    </>
  )
}

export default NotFoundPage
