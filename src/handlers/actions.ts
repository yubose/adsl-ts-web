import _ from 'lodash'
import {
  Action,
  ActionChainActionCallback,
  ActionChainActionCallbackOptions,
  getByDataUX,
  getDataValues,
  isReference,
  NOODLActionType,
  NOODLEmitObject,
  NOODLEvalObject,
  NOODLIfObject,
  NOODLPopupBaseObject,
  NOODLPopupDismissObject,
  NOODLRefreshObject,
  NOODLSaveObject,
  NOODLUpdateObject,
} from 'noodl-ui'
import { findParent } from 'noodl-utils'
import Logger from 'logsnap'
import { IPage } from 'app/types'
import {
  evalIf,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isPossiblyDataKey,
} from 'noodl-utils'
import { onSelectFile } from 'utils/dom'

const log = Logger.create('actions.ts')

const createActions = function ({ page }: { page: IPage }) {
  const _actions = {} as Record<NOODLActionType, ActionChainActionCallback<any>>

  _actions.emit = async (action: Action<NOODLEmitObject>, options) => {
    log.func('emit')
    log.grey('', { action, ...options })
    let { component, context } = options
    let { emit } = action.original
    let { actions, dataKey } = emit
    let originalDataKey = _.isString(dataKey) ? dataKey : { ...dataKey }
    dataKey = _.isObject(dataKey)
      ? _.reduce(
          _.entries(dataKey),
          (acc, [k, v]) => {
            const parent = findParent(component, (p) => {
              log.grey('Parent?', {
                component: component.toJS(),
                actions,
                dataKey,
                parent: p,
              })
              return p?.noodlType === 'listItem'
            })
            acc[k as typeof acc] = parent?.getDataObject?.()
            return acc
          },
          {} as typeof emit['dataKey'],
        )
      : dataKey

    log.gold(`Emit action results`, {
      component: component.toJS(),
      actions,
      originalDataKey,
      resolvedDataKey: dataKey,
    })

    const { default: noodl } = await import('app/noodl')

    noodl.emitCall({ dataKey: dataKey as any, actions, pageName: context.page })
  }

  _actions.evalObject = async (action: Action<NOODLEvalObject>, options) => {
    log.func('evalObject')
    if (_.isFunction(action?.original?.object)) {
      const result = await action.original?.object()
      log.orange(`Result from evalObject [action.object()]`, {
        result,
        action,
        options,
      })
      if (result) {
        const logArgs = { result, action, ...options }
        log.grey(`Received a ${typeof result} from an evalObject`, logArgs)
        return result
      }
    } else if ('if' in (action.original.object || {})) {
      const ifObj = action.original.object as NOODLIfObject
      if (_.isArray(ifObj)) {
        const { default: noodl } = await import('app/noodl')
        const { context } = options
        const pageName = context.page || ''
        const pageObject = noodl.root[pageName]
        const object = evalIf((valEvaluating) => {
          let value
          if (isNOODLBoolean(valEvaluating)) {
            return isBooleanTrue(valEvaluating)
          } else {
            if (_.isString(valEvaluating)) {
              if (isPossiblyDataKey(valEvaluating)) {
                if (_.has(noodl.root, valEvaluating)) {
                  value = _.get(noodl.root[pageName], valEvaluating)
                } else if (_.has(pageObject, valEvaluating)) {
                  value = _.get(pageObject, valEvaluating)
                }
              }
              if (isNOODLBoolean(value)) return isBooleanTrue(value)
              return !!value
            } else {
              return !!value
            }
          }
        }, ifObj)
        log.orange(`Result from evalObject [action.object.if[]]`, {
          result: object,
          action,
          options,
        })
        if (_.isFunction(object)) {
          const result = await object()
          if (result) {
            log.hotpink(
              `Received a value from evalObject's "if" evaluation. ` +
                `Returning it back to the action chain now`,
              { action, ...options, result },
            )
            return result
          }
        } else {
          log.red(
            `Evaluated an "object" from an "if" object but it did not return a ` +
              `function`,
            { action, ...options, result: object },
          )
          return object
        }
      } else {
        log.grey(
          `Received an "if" object but it was not in the form --> if [value, value, value]`,
          { action, ...options },
        )
      }
    } else {
      log.grey(
        `Expected to receive the "object" as a function but it was "${typeof action?.original}" instead`,
        { action, ...options },
      )
    }
  }

  _actions.goto = async (action: any, options) => {
    // URL
    if (_.isString(action)) {
      await page.requestPageChange(action)
    } else if (_.isPlainObject(action)) {
      // Currently don't know of any known properties the goto syntax has.
      // We will support a "destination" key since it exists on goto which will
      // soon be deprecated by this goto action
      if (action.original.destination || _.isString(action.original.goto)) {
        const url = action.original.destination || action.original.goto
        await page.requestPageChange(url)
      } else {
        log.func('goto')
        log.red(
          'Tried to go to a page but could not find information on the whereabouts',
          { action, ...options },
        )
      }
    }
  }

  _actions.pageJump = async (action: any, options) => {
    log.func('pageJump')
    log.grey('', { action, ...options })
    await page.requestPageChange(action.original.destination)
  }

  _actions.popUp = async (
    action: Action<NOODLPopupBaseObject | NOODLPopupDismissObject>,
    options,
  ) => {
    log.func('popUp')
    log.grey('', { action, ...options })
    const { abort, component, context } = options
    const elem = getByDataUX(action.original.popUpView) as HTMLElement
    log.gold('popUp action', { action, ...options, elem })
    if (elem) {
      if (action.original.actionType === 'popUp') {
        elem.style.visibility = 'visible'
      } else if (action.original.actionType === 'popUpDismiss') {
        elem.style.visibility = 'hidden'
      }
      // Some popup components render values using the dataKey. There is a bug
      // where an action returns a popUp action from an evalObject action. At
      // this moment the popup is not aware that it needs to read the dataKey if
      // it is not triggered by some NOODLDOMDataValueElement. So we need to do a check here

      // If popUp has wait: true, the action chain should pause until a response
      // is received from something (ex: waiting on user confirming their password)
      if (action.original.wait) {
        if (isNOODLBoolean(action.original.wait)) {
          if (isBooleanTrue(action.original.wait)) {
            log.grey(
              `Popup action for popUpView "${action.original.popUpView}" is ` +
                `waiting on a response. Aborting now...`,
              { action, ...options },
            )
            abort?.()
          }
        }
      }
      // Auto prefills the verification code when ECOS_ENV === 'test'
      // and when the entered phone number starts with 888
      if (process.env.ECOS_ENV === 'test') {
        const vcodeInput = document.querySelector(
          `input[data-key="formData.code"]`,
        ) as HTMLInputElement
        if (vcodeInput) {
          const dataValues = getDataValues<
            { phoneNumber?: string },
            'phoneNumber'
          >()
          if (String(dataValues?.phoneNumber).startsWith('888')) {
            import('app/noodl').then(({ default: noodl }) => {
              const pageName = context?.page || ''
              console.info(pageName)
              const pathToTage = 'verificationCode.response.edge.tage'
              let vcode = _.get(noodl.root?.[pageName], pathToTage, '')
              if (vcode) {
                vcode = String(vcode)
                vcodeInput.value = vcode
                _.set(vcodeInput.dataset, 'value', vcode)
                noodl.editDraft((draft: any) => {
                  _.set(
                    draft[pageName],
                    (vcodeInput.dataset.key as string) || 'formData.code',
                    vcode,
                  )
                })
              }
            })
          }
        }
      } else {
        log.func('popUp')
        log.red(
          `Tried to render a ${action.original.actionType} element but the element was null or undefined`,
          { action, ...options },
        )
      }
    }
  }

  _actions.popUpDismiss = async (action: any, options) => {
    log.func('popUpDismiss')
    log.grey('', { action, ...options })
    await _actions.popUp(action, options)
    return
  }

  _actions.refresh = (action: Action<NOODLRefreshObject>, options) => {
    log.func('refresh')
    log.grey(action.original.actionType, { action, ...options })
    window.location.reload()
  }

  _actions.saveObject = async (action: Action<NOODLSaveObject>, options) => {
    const { default: noodl } = await import('app/noodl')
    const { context, abort, parser } = options as any

    try {
      const { object } = action.original

      if (_.isFunction(object)) {
        log.func('saveObject')
        log.grey(`Directly invoking the object function with no parameters`, {
          action,
          ...options,
        })
        await object()
      } else if (_.isArray(object)) {
        const numObjects = object.length
        for (let index = 0; index < numObjects; index++) {
          const obj = object[index]
          if (_.isArray(obj)) {
            // Assuming this a tuple where the first item is the path to the "name" field
            // and the second item is the actual function that takes in values from using
            // the name field to retrieve values
            if (obj.length === 2) {
              const [nameFieldPath, save] = obj

              if (_.isString(nameFieldPath) && _.isFunction(save)) {
                parser.setLocalKey(context?.page)

                let nameField

                if (isReference(nameFieldPath)) {
                  nameField = parser.get(nameFieldPath)
                } else {
                  nameField =
                    _.get(noodl?.root, nameFieldPath, null) ||
                    _.get(noodl?.root?.[context?.page], nameFieldPath, {})
                }

                const params = { ...nameField }

                if ('verificationCode' in params) {
                  delete params.verificationCode
                }

                await save(params)
                log.func('saveObject')
                log.green(`Invoked saveObject with these parameters`, params)
              }
            }
          }
        }
      } else if (_.isString(object)) {
        log.func('saveObject')
        log.red(
          `The "object" property in the saveObject action is a string which ` +
            `is in the incorrect format. Possibly a parsing error?`,
          { action, ...options },
        )
      }
    } catch (error) {
      console.error(error)
      window.alert(error.message)
      return abort()
    }
  }

  _actions.updateObject = async (
    action: Action<NOODLUpdateObject>,
    options,
  ) => {
    const { abort, component, stateHelpers } = options
    const { default: noodl } = await import('app/noodl')
    log.func('updateObject')

    const callObjectOptions = { action, ...options } as any

    try {
      if (action.original?.dataObject === 'BLOB') {
        const { files, status } = await onSelectFile()
        if (status === 'selected' && files?.[0]) {
          log.green(`File selected`, files[0])
          callObjectOptions['file'] = files[0]
        } else if (status === 'canceled') {
          log.red('File was not selected and the operation was aborted')
          await abort?.('File input window was closed')
        }
      }

      log.grey(`uploadObject callback options`, callObjectOptions)

      // This is the more older version of the updateObject action object where it used
      // the "object" property
      if ('object' in action.original) {
        await callObject(action.original.object, callObjectOptions)
      }
      // This is the more newer version that is more descriptive, utilizing the data key
      // action = { actionType: 'updateObject', dataKey, dataObject }
      else {
        if (action.original?.dataKey || action.original?.dataObject) {
          const object = _.omit(action.original, 'actionType')
          await callObject(object, callObjectOptions)
        }
      }

      async function callObject(
        object: any,
        opts: ActionChainActionCallbackOptions & {
          action: any
          file?: File
        },
      ) {
        if (_.isFunction(object)) {
          await object()
        } else if (_.isString(object)) {
          log.red(
            `Received a string as an object property of updateObject. ` +
              `Possibly parsed incorrectly?`,
            { object, ...options, ...opts, action },
          )
        } else if (_.isArray(object)) {
          for (let index = 0; index < object.length; index++) {
            const obj = object[index]
            if (_.isFunction(obj)) {
              // Handle promises/functions separately because they need to be
              // awaited in this line for control flow
              await obj()
            } else {
              await callObject(obj, opts)
            }
          }
        } else if (_.isObjectLike(object)) {
          let { dataKey, dataObject } = object
          if (/(file|blob)/i.test(dataObject)) {
            dataObject = opts.file || dataObject
          }
          // TODO - Replace this hardcoded "itemObject" string with iteratorVar
          if (dataObject === 'itemObject') {
            if (stateHelpers) {
              const { getList } = stateHelpers
              const listId = component.get('listId')
              const listItemIndex = component.get('listItemIndex')
              const list = getList(listId) || []
              const listItem = list[listItemIndex]
              if (listItem) dataObject = listItem
              log.salmon('', {
                listId,
                listItemIndex,
                list,
                listItem,
              })
            }
            if (!dataObject) dataObject = options?.file
          }
          if (dataObject) {
            const params = { dataKey, dataObject }
            log.func('updateObject')
            log.green(`Parameters`, params)
            await noodl.updateObject(params)
          } else {
            log.red(`dataObject is null or undefined`, {
              action,
              ...options,
            })
          }
        }
      }
    } catch (error) {
      console.error(error)
      // window.alert(error.message)
      // await abort?.(error.message)
    }
  }

  return _actions
}

export default createActions
