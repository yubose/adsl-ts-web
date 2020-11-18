import NOODLBaseComponent from './Base'
import { INOODLImage } from '../types'

class NOODLImage extends NOODLBaseComponent implements INOODLImage {
  type: 'image' = 'image'

  constructor() {
    super()
  }
}

export default NOODLImage
