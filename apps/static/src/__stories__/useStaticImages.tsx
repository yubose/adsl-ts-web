import React from 'react'
// import { graphql, getR } from 'gatsby'
// import type { IGatsbyImageData } from 'gatsby-plugin-image'

function useStaticImages() {
  return null
  // const { allFile: staticImages } = getR<{
  //   allFile: {
  //     edges: {
  //       node: {
  //         base: string
  //         publicURL: string
  //         childImageSharp: {
  //           gatsbyImageData: IGatsbyImageData
  //         }
  //       }
  //     }[]
  //   }
  // }>(graphql`
  //   {
  //     allFile(
  //       filter: {
  //         sourceInstanceName: { eq: "assets" }
  //         extension: { ne: "svg" }
  //       }
  //     ) {
  //       edges {
  //         node {
  //           base
  //           publicURL
  //           childImageSharp {
  //             gatsbyImageData(placeholder: TRACED_SVG)
  //           }
  //         }
  //       }
  //     }
  //   }
  // `)
  // return staticImages
}

export default useStaticImages
