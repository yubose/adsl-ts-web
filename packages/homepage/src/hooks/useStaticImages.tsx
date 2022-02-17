import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'

function useStaticImages() {
  const { allFile: allStaticImageFile } = useStaticQuery<{
    allFile: {
      nodes: {
        base: string
        id: string
        childImageSharp: {
          gatsbyImageData: {
            backgroundColor: string
            layout: string
            images: {
              fallback: {
                src: string
                srcset: string
                sizes: string
              }
              sources: any[]
            }
            placeholder: {
              fallback: string
            }
            width: number
            height: number
          }
        }
      }[]
    }
  }>(graphql`
    query NoodlStaticImageQuery {
      allFile(
        filter: { sourceInstanceName: { eq: "assets" }, ext: { ne: "svg" } }
      ) {
        nodes {
          id
          base
          childImageSharp {
            gatsbyImageData(
              formats: WEBP
              placeholder: TRACED_SVG
              layout: FULL_WIDTH
            )
          }
        }
        totalCount
      }
    }
  `)
  return { allStaticImageFile }
}

export default useStaticImages
