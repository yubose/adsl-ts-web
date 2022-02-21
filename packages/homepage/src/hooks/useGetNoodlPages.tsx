import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'

function useGetNoodlPages() {
  const { allNoodlPage } = useStaticQuery<{
    allNoodlPage: {
      nodes: {
        name: string
        content: string
        slug: string
        isPreload: boolean
      }[]
    }
  }>(
    graphql`
      {
        allNoodlPage {
          nodes {
            name
            content
            slug
            isPreload
          }
        }
      }
    `,
  )
  return allNoodlPage
}

export default useGetNoodlPages
