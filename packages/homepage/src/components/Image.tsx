/**
 * Optimized Noodl Image component aimed to use advanced loading techniques like tracedSVG or blurred image placeholders (without affecting performance)
 */
import React from 'react'
import { graphql } from 'gatsby'
import { GatsbyImage, GatsbyImageProps, getImage } from 'gatsby-plugin-image'

export interface NoodlImageProps extends GatsbyImageProps {
  src: string
}

function NoodlImage({
  data,
  src,
  title,
  alt = title,
  ...rest
}: NoodlImageProps) {
  const image = getImage(data?.NoodlComponent?.Image)

  return <GatsbyImage image={image} alt={alt} title={title} {...rest} />
}

// export const componentImageQuery = graphql`
//   query {
//     blogPost(id: { eq: $Id }) {
//       title
//       body
//       author
//       avatar {
//         childImageSharp {
//           gatsbyImageData(
//             width: 200
//             placeholder: BLURRED
//             formats: [AUTO, WEBP, AVIF]
//           )
//         }
//       }
//     }
//   }
// `

export default NoodlImage
