import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import type { IGatsbyImageData } from 'gatsby-plugin-image'

function useStaticImages() {
  const { allFile: staticImages } = useStaticQuery<{
    allFile: {
      edges: {
        node: {
          base: string
          publicURL: string
          childImageSharp: {
            gatsbyImageData: IGatsbyImageData
          }
        }
      }[]
    }
  }>(graphql`
    {
      allFile(
        filter: {
          sourceInstanceName: { eq: "assets" }
          extension: { ne: "svg" }
        }
      ) {
        edges {
          node {
            base
            publicURL
            childImageSharp {
              gatsbyImageData
            }
          }
        }
      }
    }
  `)
  return staticImages
}

export default useStaticImages
