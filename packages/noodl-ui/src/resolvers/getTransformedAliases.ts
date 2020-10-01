import _ from 'lodash'
import Logger from 'logsnap'
import { noodlContentTypes } from '../constants'
import { Resolver } from '../types'

const log = Logger.create('getTransformedAliases')

/**
 * Renames some keywords to align more with html/css/etc
 * ex: resource --> src (for images)
 * @param { Component } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 */
const getTransformedAliases: Resolver = (component, { context, createSrc }) => {
  const type = component.get('type')
  const contentType = component.get('contentType')
  const options = component.get('options')
  const path = component.get('path')
  const resource = component.get('resource')
  const required = component.get('required')
  const poster = component.get('poster')
  const controls = component.get('controls')

  // Input (textfield) components
  if (contentType) {
    if (noodlContentTypes.includes(contentType)) {
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

  if (!_.isUndefined(path) || !_.isUndefined(resource)) {
    let src = path || resource || ''

    if (src && _.isString(src)) {
      component.set('src', createSrc(src))
    } else {
      log.red(
        'Encountered a component with an invalid "path" or "resource". It ' +
          'will not display correctly',
        { component: component.snapshot(), computedSrc: src, path, resource },
      )
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
  }

  if (poster) {
    component.set('poster', createSrc(poster))
  }

  if (_.isBoolean(controls)) {
    component.set('controls', controls)
  }

  if (_.isString(required)) {
    if (required === 'true') {
      component.set('required', true)
    } else if (required === 'false') {
      component.set('required', false)
    }
  }

  // Select components
  if (_.isArray(options)) {
    const toOption = (option: any, index: number) =>
      _.isString(option)
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
