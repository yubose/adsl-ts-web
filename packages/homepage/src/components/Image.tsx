/**
 * Optimized Noodl Image component aimed to use advanced loading techniques like tracedSVG or blurred image placeholders (without affecting performance)
 */
import React from 'react'
import {
  GatsbyImage,
  IGatsbyImageData,
  GatsbyImageProps,
  getImage,
} from 'gatsby-plugin-image'

export interface NoodlImageProps extends GatsbyImageProps {
  data: IGatsbyImageData
}

function NoodlImage({ data, title, alt = title, ...rest }: NoodlImageProps) {
  const image = getImage(data)
  return <GatsbyImage image={image} alt={alt} title={title} {...rest} />
}

export default NoodlImage
