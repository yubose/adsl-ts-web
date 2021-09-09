import get from 'lodash/get'
import { Identify } from 'noodl-types'
import { isBooleanTrue } from 'noodl-utils'
import Resolver from '../Resolver'
import * as u from '../utils/internal'

const valuesResolver = new Resolver('resolveValues')

valuesResolver.setResolver((component, options, next) => {
  const original = component.blueprint || {}
  const { contentType, required } = original
  const { getRoot, page } = options

  /* -------------------------------------------------------
    ---- CONTENT TYPE
  -------------------------------------------------------- */

  if (contentType) {
    if (!Identify.component.label(original)) {
      if (contentType === 'phone') {
        component.edit({ inputType: 'tel' })
      } else if (contentType === 'countryCode') {
        component.edit({ inputType: 'select' })
      } else {
        console.log(
          `%cNone of the content (input) types matched. Perhaps it needs to be ` +
            `supported? NOODL content type: ${contentType}`,
          `color:#ec0000;font-weight:bold;`,
          component,
        )
      }
    }
  }

  // SELECT
  function toSelectOptions(option: any, index: number) {
    return u.isStr(option) || u.isNum(option)
      ? { index, key: option, value: option, label: option }
      : option
  }
  if (u.isArr(options)) {
    component.edit('options', options.map(toSelectOptions))
  } else if (Identify.reference(options)) {
    const optionsPath = options.startsWith('.')
      ? options.replace(/(..|.)/, '')
      : options
    const dataOptions =
      get(getRoot()[page.page], optionsPath) ||
      get(getRoot(), optionsPath) ||
      []
    component.edit('options', dataOptions.map(toSelectOptions))
  }

  /* -------------------------------------------------------
    ---- MEDIA
  -------------------------------------------------------- */

  // VIDEO
  if (Identify.component.video(original)) {
    const videoFormat = original.videoFormat
    if (videoFormat) {
      component.edit('videoType', `video/${videoFormat}`)
    } else {
      console.log(
        `%cEncountered a video component with an invalid "videoFormat" attribute`,
        `color:#ec0000;font-weight:bold;`,
        { component, videoFormat },
      )
    }
  }

  required && component.edit({ required: isBooleanTrue(required) })

  next?.()
})

export default valuesResolver
