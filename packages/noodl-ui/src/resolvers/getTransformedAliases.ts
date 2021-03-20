import { contentTypes } from 'noodl-types'
import { createEmitDataKey, isBooleanTrue, isEmitObj } from 'noodl-utils'
import get from 'lodash/get'
import Logger from 'logsnap'
import EmitAction from '../Action/EmitAction'
import getStore from '../store'
import isReference from '../utils/isReference'
import { EmitActionObject, ResolverFn, StoreActionObject } from '../types'
import { isPromise } from '../utils/common'
import { findListDataObject } from '../utils/noodl'

const log = Logger.create('getTransformedAliases')

/**
 * Renames some keywords to align more with html/css/etc
 *  ex: resource --> src (for images)
 */
const getTransformedAliases: ResolverFn = (component, consumerOptions) => {
  const { context, createSrc, getPageObject, getRoot } = consumerOptions
  const {
    type,
    contentType,
    options,
    path,
    resource,
    required,
    placeholder,
    poster,
    controls,
  } = component.props()

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
      src = createSrc(src as any)
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

  if (isEmitObj(placeholder)) {
    const obj = getStore().actions.emit?.find?.(
      (o) => o.trigger === 'placeholder',
    )

    if (typeof obj?.fn === 'function') {
      const emitObj = { ...placeholder, actionType: 'emit' } as EmitActionObject
      const emitAction = new EmitAction(emitObj, {
        iteratorVar: component?.get('iteratorVar'),
        trigger: 'placeholder',
      })
      if ('dataKey' in (emitAction.original.emit || {})) {
        emitAction.setDataKey(
          createEmitDataKey(
            emitObj.emit.dataKey,
            [
              findListDataObject(component),
              () => getPageObject(context.page),
              () => getRoot(),
            ],
            { iteratorVar: emitAction.iteratorVar },
          ),
        )
      }

      emitAction['callback'] = async (snapshot) => {
        log.grey(`Executing emit [placeholder] action callback`, snapshot)
        const callbacks = (getStore().actions.emit || []).reduce(
          (acc, obj) =>
            obj?.trigger === 'placeholder' ? acc.concat(obj) : acc,
          [],
        )

        if (!callbacks.length) return ''

        const result = await Promise.all(
          callbacks.map((obj: StoreActionObject) =>
            obj?.fn?.(
              emitAction,
              { ...consumerOptions, placeholder },
              context.actionsContext,
            ),
          ),
        )

        return (Array.isArray(result) ? result[0] : result) || ''
      }

      const result = emitAction.execute(placeholder) as string | Promise<string>

      log.grey(`Result received from emit [placeholder] action`, {
        action: emitAction,
        result,
      })

      if (isPromise(result)) {
        result
          .then((res) => {
            component.set('placeholder', res).emit('placeholder', res)
          })
          .catch((err) => Promise.reject(err))
      } else if (result) {
        component.set('placeholder', result).emit('placeholder', result)
      }
    }
  }
}

export default getTransformedAliases
