import { isDraft, original } from 'immer'
import _ from 'lodash'
import Logger from 'logsnap'
import { isBooleanTrue, isEmitObj } from 'noodl-utils'
import { contentTypes } from '../constants'
import { ResolverFn } from '../types'
import { isPromise } from '../utils/common'

const log = Logger.create('getTransformedAliases')

/**
 * Renames some keywords to align more with html/css/etc
 *  ex: resource --> src (for images)
 */
const getTransformedAliases: ResolverFn = (component, { createSrc }) => {
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
  if (_.isBoolean(controls)) component.set('controls', controls)
  if (poster) component.set('poster', createSrc(poster))

  if (path || resource) {
    let src = path || resource || ''
    if (isDraft(src)) src = original(src)
    if (isEmitObj(src)) {
      src = createSrc(src)
      if (isPromise(src)) {
        src
          .then((result: string) => {
            src = result
            return component.set('src', result)
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
              component.set(createSrc(src))
            }
          })
      } else {
        component.set('src', src)
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
  if (_.isArray(options)) {
    const toOption = (option: any, index: number) =>
      _.isString(option) || _.isNumber(option)
        ? {
            index,
            key: option,
            value: option,
            label: option,
          }
        : option
    component.set('options', _.map(options, toOption))
  }
}

export default getTransformedAliases
