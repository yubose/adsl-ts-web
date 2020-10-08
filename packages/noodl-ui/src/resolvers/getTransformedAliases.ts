import _ from 'lodash'
import Logger from 'logsnap'
import { isPossiblyDataKey } from '../utils/noodl'
import { contentTypes } from '../constants'
import { Resolver } from '../types'

const log = Logger.create('getTransformedAliases')

/**
 * Renames some keywords to align more with html/css/etc
 * ex: resource --> src (for images)
 * @param { Component } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 */
const getTransformedAliases: Resolver = (
  component,
  { createSrc, context, getListItem },
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

  if (!_.isUndefined(path) || !_.isUndefined(resource)) {
    let src = path || resource || ''

    if (src && _.isString(src)) {
      component.set('src', createSrc(src))
    } else if (_.isPlainObject(path)) {
      const conditions = path.if
      const [valEvaluating, valOnTrue, valOnFalse] = conditions
      if (_.isString(valEvaluating)) {
        if (valEvaluating.startsWith('itemObject')) {
          const { page, roots } = context
          /**
           * Attempt #1 --> Find on root
           * Attempt #2 --> Find on local root
           * Attempt #3 --> Find on list data
           */
          let value: any
          // If the value possibly leads somewhere, continue with walking the
          // root/localroot/list objects that are available, if any
          if (isPossiblyDataKey(valEvaluating)) {
            value =
              _.get(roots, valEvaluating) || _.get(page.object, valEvaluating)
          }
          if (!value) {
            // Proceed to check the list data
            const { listId, listItemIndex } = component.get([
              'listId',
              'listItemIndex',
            ])
            if (listId) {
              const listItem = getListItem(listId, listItemIndex)
              if (listItem) {
                value = _.get(listItem, valEvaluating)
                if (value) {
                  component.set('src', createSrc(valOnTrue))
                } else {
                  component.set('src', createSrc(valOnFalse))
                }
              } else {
                component.set('src', createSrc(valOnFalse))
              }
            } else {
              component.set('src', createSrc(valOnFalse))
              // log.red(`Attempted to evaluate a "path" using a possible data key but no listId or listItemIndex was available`, {
              //   component: component.snapshot(),
              //   path,
              //   lists: getState().lists,
              //   listId,
              //   listItemIndex,
              //   ...context,
              // })
            }
          }
        } else if (valEvaluating) {
          component.set('src', createSrc(valOnTrue))
        }
      } else if (valEvaluating) {
        // What can we get here?
        component.set('src', createSrc(valOnTrue))
      } else {
        component.set('src', createSrc(valOnFalse))
      }
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
