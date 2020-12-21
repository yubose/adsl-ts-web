import get from 'lodash/get'
import Logger from 'logsnap'
import { isBooleanTrue, isEmitObj } from 'noodl-utils'
import { contentTypes } from '../constants'
import { ResolverFn } from '../types'
import { isPromise } from '../utils/common'
import isReference from '../utils/isReference'

const log = Logger.create('getTransformedAliases')

/**
 * Renames some keywords to align more with html/css/etc
 *  ex: resource --> src (for images)
 */
const getTransformedAliases: ResolverFn = (
  component,
  { context, createSrc, getPageObject, getRoot },
) => {
  const {
    type,
    contentType,
    options,
    path,
    resource,
    required,
    poster,
    controls,
  } = component.get([
    'type',
    'contentType',
    'options',
    'path',
    'resource',
    'required',
    'poster',
    'controls',
  ])

  // Input (textfield) components
  if (contentType) {
    if (contentTypes.includes(contentType)) {
      // Label components currently also have a contentType property.
      //    We don't want to cause any confusions when resolving text/select fields
      if (type !== 'label') {
        const inputType =
          contentType === 'phone'
            ? 'tel'
            : contentType === 'countryCode'
            ? 'select'
            : contentType

        component.set('inputType', inputType)
      }
    } else {
      log.red(
        `None of the content (input) types matched. Perhaps it needs to be ` +
          `supported? NOODL content type: ${contentType}`,
      )
    }
  }

  if (required) component.set('required', isBooleanTrue(required))
  if (typeof controls === 'boolean') component.set('controls', controls)
  if (poster) component.set('poster', createSrc(poster))

  if (path || resource) {
    let src = path || resource || ''
    if (isEmitObj(src)) {
      src = createSrc(src)
      if (isPromise(src)) {
        src
          .then((result: string) => {
            src = result
            component.set('src', createSrc(result))
          })
          .catch((err: Error) => {
            throw new Error(err.message)
          })
          .finally(() => {
            if (isPromise(src)) {
              src.then((r) => {
                console.log('Received src', r)
                component.set(
                  'src',
                  isPromise(r)
                    ? '<Path_emit_failed_in_getTransformedAliases>'
                    : createSrc(r),
                )
              })
            } else {
              component.set('src', createSrc(src))
            }
          })
      } else {
        component.set('src', createSrc(src))
      }
    } else {
      component.set('src', createSrc(src))
    }
  }

  if (component.type === 'video') {
    const videoFormat = component.get('videoFormat')
    if (videoFormat) {
      component.set('videoType', `video/${videoFormat}`)
    } else {
      log.red(
        'Encountered a video component with an invalid "videoFormat" attribute',
        { component: component.snapshot(), videoFormat },
      )
    }
  }

  if (poster) {
    component.set('poster', createSrc(poster as string))
  }

  if (isBooleanTrue(controls)) {
    component.set('controls', true)
  }

  if (component.type === 'video') {
    const videoFormat = component.get('videoFormat')
    if (videoFormat) {
      component.set('videoType', `video/${videoFormat}`)
    } else {
      log.red(
        'Encountered a video component with an invalid "videoFormat" attribute',
        { component: component.snapshot(), videoFormat },
      )
    }
  }

  // Select components
  if (options) {
    const toOption = (option: any, index: number) =>
      typeof option === 'string' || typeof option === 'number'
        ? {
            index,
            key: option,
            value: option,
            label: option,
          }
        : option
    if (Array.isArray(options)) {
      component.set('options', options.map(toOption))
    } else if (isReference(options)) {
      const optionsPath = options.startsWith('.')
        ? options.replace(/(..|.)/, '')
        : options
      const dataOptions =
        get(getPageObject(context.page), optionsPath) ||
        get(getRoot(), optionsPath) ||
        []
      component.set('options', dataOptions.map(toOption))
    }
  }
}

export default getTransformedAliases
