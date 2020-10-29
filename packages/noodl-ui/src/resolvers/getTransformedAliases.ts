import _ from 'lodash'
import Logger from 'logsnap'
import { isBoolean, isBooleanFalse, isBooleanTrue } from 'noodl-utils'
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
  { context, getListItem, createSrc },
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

    if (_.isString(src)) {
      component.set('src', createSrc(src))
    } else if (!_.isArray(path) && _.isObject(path)) {
      log.yellow('', {
        if: path.if,
        component: component.snapshot(),
        componentJS: component.toJS(),
      })
      const [valEvaluating, valOnTrue, valOnFalse] = path?.if || []
      if (_.isString(valEvaluating)) {
        /**
         * Attempt #1 --> Find on root
         * Attempt #2 --> Find on local root
         * Attempt #3 --> Find on list data
         */
        const { page, roots } = context
        let value: any
        if (_.has(roots, valEvaluating)) {
          value = _.get(roots, valEvaluating)
        } else if (_.has(page.object, valEvaluating)) {
          value = _.get(page.object, valEvaluating)
        } else {
          // TODO - Check on iteratorVar
          // Assuming this is for list items if the code gets here
          // If the value possibly leads somewhere, continue with walking the
          // root/localroot/list objects that are available, if any
          // Proceed to check the list data
          const { listId, listItemIndex } = component.get([
            'listId',
            'listItemIndex',
          ])
          if (listId) {
            const listItem = getListItem(
              listId as string,
              listItemIndex as number,
            )
            value = _.get(
              listItem,
              valEvaluating.startsWith('itemObject')
                ? valEvaluating.split('.').slice(1)
                : valEvaluating,
            )
          }
        }
        if (isBoolean(value)) {
          component.set(
            'src',
            createSrc(isBooleanTrue(value) ? valOnTrue : valOnFalse),
          )
        } else {
          component.set('src', createSrc(value ? valOnTrue : valOnFalse))
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
