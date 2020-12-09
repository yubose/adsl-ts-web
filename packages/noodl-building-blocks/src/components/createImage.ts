import { ImageComponentObject } from 'noodl-types'
import createComponent from './createComponent'

function createImage(
  opts?: Partial<ImageComponentObject>,
): ImageComponentObject {
  return createComponent('image', {
    ...opts,
  })
}

export default createImage
