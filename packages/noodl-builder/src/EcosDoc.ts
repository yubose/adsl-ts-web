import type { LiteralUnion } from 'type-fest'
import type { EcosDocument } from 'noodl-types'
import type NoodlString from './String'
import type { EcosDocPreset } from './types'
import NoodlObject from './Object'

class EcosDocBuilder extends NoodlObject {
  createProperty(
    property: LiteralUnion<keyof EcosDocument<any, any>, string> | NoodlString,
    value?: any,
  ) {
    return super.createProperty(property, value)
  }

  usePreset(preset: EcosDocPreset) {
    const dataUri = 'blob:http://a'
    const nameProps = { title: undefined, data: dataUri, tags: undefined }

    switch (preset) {
      case 'audio':
        this.createProperty('name', {
          ...nameProps,
          data: dataUri,
          type: 'audio/wav',
        })
        this.createProperty('subtype', { mediaType: 2 })
        return this
      case 'docx':
        this.createProperty('name', {
          ...nameProps,
          data: dataUri,
          type: 'application/vnl.',
        })
        this.createProperty('subtype', { mediaType: 1 })
        return this
      case 'image':
        this.createProperty('name', {
          ...nameProps,
          type: 'image/png',
        })
        this.createProperty('subtype', { mediaType: 4 })
        this.createProperty('type', 1025)
        return this
      case 'message':
        this.createProperty('subtype', { mediaType: 5 })
        return this
      case 'note':
        this.createProperty('name', {
          ...nameProps,
        })
        this.createProperty('subtype', { mediaType: 8 })
        return this
      case 'pdf':
        this.createProperty('name', { ...nameProps })
        this.createProperty('subtype', { mediaType: 1 })
        return this
      case 'text':
        this.createProperty('name', {
          ...nameProps,
          content: undefined,
        })
        this.createProperty('subtype', { mediaType: 0 })
        return this
      case 'video':
        this.createProperty('name', {
          ...nameProps,
          type: 'video/mp4',
        })
        this.createProperty('subtype', { mediaType: 9 })
        return this
    }
    return this
  }
}

export default EcosDocBuilder
