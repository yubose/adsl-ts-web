import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import useStaticImages from '@/hooks/useStaticImages'

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

  const { allStaticImageFile } = useStaticImages()

  return {
    allNoodlPage,
    allStaticImageFile,
  }
}

export default useGetNoodlPages
