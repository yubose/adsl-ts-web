import type { LiteralUnion } from 'type-fest'
import type { EcosDocument } from 'noodl-types'
import type NoodlString from './String'
import type { EcosDocPreset } from './types'
import NoodlObject from './Object'

class EcosDocBuilder extends NoodlObject<EcosDocument> {
  createProperty(
    property:
      | LiteralUnion<keyof EcosDocument<any, any>, string>
      | NoodlString<string>,
    value?: any,
  ): this {
    super.createProperty(property, value)
    return this
  }

  usePreset(preset: EcosDocPreset) {
    const dataUri = 'blob:http://a'
    const nameProps = { title: undefined, data: dataUri, tags: undefined }

    switch (preset) {
      case 'audio':
        return this.createProperty('name', {
          ...nameProps,
          data: dataUri,
          type: 'audio/wav',
        }).createProperty('subtype', { mediaType: 2 })
      case 'docx':
        return this.createProperty('name', {
          ...nameProps,
          data: dataUri,
          type: 'application/vnl.',
        }).createProperty('subtype', { mediaType: 1 })
      case 'image':
        return this.createProperty('name', {
          ...nameProps,
          type: 'image/png',
        })
          .createProperty('subtype', { mediaType: 4 })
          .createProperty('type', 1025)
      case 'message':
        return this.createProperty('subtype', { mediaType: 5 })
      case 'note':
        return this.createProperty('name', {
          ...nameProps,
        }).createProperty('subtype', { mediaType: 8 })
      case 'pdf':
        return this.createProperty('name', { ...nameProps }).createProperty(
          'subtype',
          { mediaType: 1 },
        )
      case 'text':
        return this.createProperty('name', {
          ...nameProps,
          content: undefined,
        }).createProperty('subtype', { mediaType: 0 })
      case 'video':
        return this.createProperty('name', {
          ...nameProps,
          type: 'video/mp4',
        }).createProperty('subtype', { mediaType: 9 })
    }
    return this
  }
}

export default EcosDocBuilder
