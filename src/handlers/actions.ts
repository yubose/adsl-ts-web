import _ from 'lodash'
import {
  Action,
  ActionConsumerCallbackOptions,
  AnonymousObject,
  EmitAction,
  EvalObject,
  getByDataUX,
  getDataValues,
  ActionChainUseObjectBase,
  IfObject,
  isReference,
  ActionType,
  PopupObject,
  PopupDismissObject,
  RefreshObject,
  SaveObject,
  UpdateObject,
  EmitObject,
} from 'noodl-ui'
import {
  createEmitDataKey,
  evalIf,
  findListDataObject,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isPossiblyDataKey,
} from 'noodl-utils'
import Logger from 'logsnap'
import { IPage } from '../app/types'
import { onSelectFile } from '../utils/dom'

const log = Logger.create('actions.ts')

const createActions = function ({ page }: { page: IPage }) {
  const _actions = {} as Record<
    ActionType,
    Omit<ActionChainUseObjectBase<any>, 'actionType'>[]
  >

  _actions['anonymous'] = []
  _actions['emit'] = []
  _actions['evalObject'] = []
  _actions['goto'] = []
  _actions['pageJump'] = []
  _actions['popUp'] = []
  _actions['popUpDismiss'] = []
  _actions['popUp'] = []
  _actions['refresh'] = []
  _actions['saveObject'] = []
  _actions['updateObject'] = []

  _actions.anonymous.push({
    fn: async (action: Action<AnonymousObject>, options) => {
      const { fn } = action.original || {}
      if (options?.component) fn?.()
    },
  })

  /** DATA KEY EMIT --- CURRENTLY NOT USED IN THE NOODL YML */
  _actions.emit.push({
    fn: async (action: EmitAction, options, { noodl, noodlui }) => {
      log.func('emit [dataKey]')
      log.gold('Emitting', { action, ...options })

      let { dataKey } = action

      const emitParams = {
        actions: action.actions,
        dataKey: action.dataKey,
        pageName: noodlui.page,
      } as any

      const emitResult = await noodl.emitCall(emitParams)

      log.grey(`Called emitCall`, {
        action,
        component: options.component,
        emitParams,
        emitResult,
        options,
        originalDataKey: action.original?.emit?.dataKey,
      })

      return emitResult
    },
    trigger: 'dataKey',
  })

  /** DATA VALUE EMIT */
  _actions.emit.push({
    fn: async (action: EmitAction, options, { noodl, noodlui }) => {
      log.func('emit [dataValue]')
      log.grey('', { action, options })

      const emitParams = {
        actions: action.actions,
        pageName: noodlui.page,
      } as any

      if ('dataKey' in action.original.emit || {}) {
        emitParams.dataKey = action.dataKey
      }

      const emitResult = await noodl.emitCall(emitParams)

      log.grey('Called emitCall [dataValue]', {
        action,
        actionChain: options.ref,
        component: options.component,
        emitParams,
        emitResult,
        options,
      })

      return emitResult
    },
    trigger: 'dataValue',
  })

  _actions.emit.push({
    fn: async (action: EmitAction, options, { noodl, noodlui }) => {
      log.func('emit [onClick]')
      log.gold('Emitting', { action, noodl, noodlui, ...options })

      const emitParams = {
        actions: action.actions,
        pageName: noodlui?.page,
      } as any

      if (action.original.emit.dataKey) {
        emitParams.dataKey = action.dataKey
      }

      const emitResult = await noodl.emitCall(emitParams)

      log.gold(`Ran emitCall [onClick]`, {
        action,
        actions: action.actions,
        component: options.component,
        emitParams,
        emitResult,
        options,
      })

      return emitResult
    },
    trigger: 'onClick',
  })

  _actions.emit.push({
    fn: async (action: EmitAction, options, { noodl, noodlui }) => {
      log.func('emit [onChange]')
      log.grey('', { action, options })

      const emitParams = {
        actions: action.actions,
        pageName: noodlui.page,
      } as any

      if ('dataKey' in action.original.emit || {}) {
        emitParams.dataKey = action.dataKey
      }

      const emitResult = await noodl.emitCall(emitParams)

      log.grey('Called emitCall', {
        action,
        actionChain: options.ref,
        component: options.component,
        emitParams,
        emitResult,
        options,
      })

      return emitResult
    },
    trigger: 'onChange',
  })

  // Emit for trigger: "path"
  // TODO - if src === assetsUrl
  // TODO - else if src endsWith
  _actions.emit.push({
    fn: async (
      action: EmitAction,
      options: ActionConsumerCallbackOptions & { path: EmitObject },
      { noodl },
    ) => {
      log.func('path [emit]')
      const { component, context, getRoot, getPageObject, path } = options

      const page = context.page || ''
      const dataObject = findListDataObject(component)
      const iteratorVar = component.get('iteratorVar') || ''
      const emitParams = {
        actions: path.emit.actions,
        pageName: page,
      } as any

      if (action.original.emit.dataKey) {
        emitParams.dataKey = createEmitDataKey(
          action.original.emit.dataKey,
          [dataObject, () => getPageObject(page), () => getRoot()],
          { iteratorVar },
        )
      }

      const logArgs = {
        action,
        actions: action.actions,
        component,
        dataObject,
        emitParams,
        iteratorVar,
        options,
      }

      const result = await noodl.emitCall(emitParams)

      log.grey(
        `emitCall call result: ${result === '' ? '(empty string)' : result}`,
        { ...logArgs, result },
      )

      return Array.isArray(result) ? result[0] : result
    },
    trigger: 'path',
  })

  _actions.evalObject.push({
    fn: async (action: Action<EvalObject>, options, { noodlui }) => {
      log.func('evalObject')
      try {
        if (_.isFunction(action?.original?.object)) {
          const result = await action.original?.object()
          log.orange(`Result from evalObject [action.object()]`, {
            result,
            action,
            options,
          })
          if (result) {
            const { ref } = options
            const logArgs = { result, action, ...options }
            log.grey(
              `Received a(n) ${typeof result} from an evalObject`,
              logArgs,
            )
            const newAction = ref.insertIntermediaryAction.call(ref, result)
            if (_.isPlainObject(result) && 'wait' in result) {
              log.red('newAction requested "WAIT"', {
                newAction: result,
                queue: ref.getQueue(),
                node: document.getElementById(options.component.id),
              })
              // await ref.abort()
              throw new Error('aborted')
            } else log.grey('newAction', { newAction, queue: ref.getQueue() })
            // return newAction.execute(options)
          }
        } else if ('if' in (action.original.object || {})) {
          const ifObj = action.original.object as IfObject
          if (_.isArray(ifObj)) {
            const { default: noodl } = await import('../app/noodl')
            const pageName = noodlui.page || ''
            const pageObject = noodl.root[noodlui.page]
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
      } catch (error) {
        console.error(error)
      }
    },
  })

  _actions.goto.push({
    fn: async (action: any, options, actionsContext) => {
      log.func('_actions.goto')
      log.red('goto action', { action, options })
      // URL
      if (_.isString(action?.original?.goto)) {
        log.gold('Requesting string destination', { action, options })

        var pre = page.pageUrl.startsWith('index.html?') ? '' : 'index.html?'
        page.pageUrl += pre
        var parse = page.pageUrl.endsWith('?') ? '' : '-'
        if (action.original.goto !== noodl.cadlEndpoint.startPage) {
          var check1 = '?' + action.original.goto
          var check2 = '-' + action.original.goto
          var check1Idx = page.pageUrl.indexOf(check1)
          var check2Idx = page.pageUrl.indexOf(check2)
          if (check1Idx !== -1) {
            page.pageUrl = page.pageUrl.substring(0, check1Idx + 1)
            parse = page.pageUrl.endsWith('?') ? '' : '-'
            page.pageUrl += parse
            page.pageUrl += action.original.goto
          } else if (check2Idx !== -1) {
            page.pageUrl = page.pageUrl.substring(0, check2Idx)
            parse = page.pageUrl.endsWith('?') ? '' : '-'
            page.pageUrl += parse
            page.pageUrl += action.original.goto
          } else {
            page.pageUrl += parse
            page.pageUrl += action.original.goto
          }
        } else {
          page.pageUrl = 'index.html?'
        }

        await page.requestPageChange(action.original.goto)
      } else if (_.isPlainObject(action?.original?.goto)) {
        // Currently don't know of any known properties the goto syntax has.
        // We will support a "destination" key since it exists on goto which will
        // soon be deprecated by this goto action
        if (action.original.destination || _.isString(action.original.goto)) {
          const url = action.original.destination || action.original.goto

          var pre = page.pageUrl.startsWith('index.html?') ? '' : 'index.html?'
          page.pageUrl += pre
          var parse = page.pageUrl.endsWith('?') ? '' : '-'
          if (url !== noodl.cadlEndpoint.startPage) {
            var check1 = '?' + url
            var check2 = '-' + url
            var check1Idx = page.pageUrl.indexOf(check1)
            var check2Idx = page.pageUrl.indexOf(check2)
            if (check1Idx !== -1) {
              page.pageUrl = page.pageUrl.substring(0, check1Idx + 1)
              parse = page.pageUrl.endsWith('?') ? '' : '-'
              page.pageUrl += parse
              page.pageUrl += url
            } else if (check2Idx !== -1) {
              page.pageUrl = page.pageUrl.substring(0, check2Idx)
              parse = page.pageUrl.endsWith('?') ? '' : '-'
              page.pageUrl += parse
              page.pageUrl += url
            } else {
              page.pageUrl += parse
              page.pageUrl += url
            }
          } else {
            page.pageUrl = 'index.html?'
          }

          log.gold('Requesting object destination', { action, options })
          await page.requestPageChange(url)
        } else {
          log.func('goto')
          log.red(
            'Tried to go to a page but could not find information on the whereabouts',
            { action, ...options },
          )
        }
      }
    },
  })

  _actions.pageJump.push({
    fn: async (action: any, options, actionsContext) => {
      log.func('pageJump')
      log.grey('', { action, ...options })
      await page.requestPageChange(action.original.destination)
    },
  })

  _actions.popUp.push({
    fn: async (
      action: Action<PopupObject | PopupDismissObject>,
      options,
      actionsContext,
    ) => {
      const { default: noodlui } = await import('app/noodl-ui')
      log.func('popUp')
      log.grey('', { action, ...options })
      const { abort, component, ref } = options
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
              await ref.abort?.()
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
              import('../app/noodl').then(({ default: noodl }) => {
                const pageName = noodlui?.page || ''
                const pathToTage = 'verificationCode.response.edge.tage'
                let vcode = _.get(noodl.root?.[pageName], pathToTage, '')
                if (vcode) {
                  vcode = String(vcode)
                  vcodeInput.value = vcode
                  vcodeInput.dataset.value = vcode
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
    },
  })

  _actions.popUpDismiss.push({
    fn: async (action: any, options, actionsContext) => {
      log.func('popUpDismiss')
      log.grey('', { action, ...options })
      await Promise.all(_actions.popUp.map((obj) => obj.fn(action, options)))
      return
    },
  })

  _actions.refresh.push({
    fn: (action: Action<RefreshObject>, options, actionsContext) => {
      log.func('refresh')
      log.grey(action.original.actionType, { action, ...options })
      window.location.reload()
    },
  })

  _actions.saveObject.push({
    fn: async (action: Action<SaveObject>, options) => {
      const { default: noodl } = await import('../app/noodl')
      const { default: noodlui } = await import('../app/noodl-ui')
      const { abort, parser } = options as any

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
                  parser?.setLocalKey(noodlui?.page)

                  let nameField

                  if (isReference(nameFieldPath)) {
                    nameField = parser.get(nameFieldPath)
                  } else {
                    nameField =
                      _.get(noodl?.root, nameFieldPath, null) ||
                      _.get(noodl?.root?.[noodlui?.page], nameFieldPath, {})
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
    },
  })

  _actions.updateObject.push({
    fn: async (action: Action<UpdateObject>, options, actionsContext) => {
      const { abort, component, stateHelpers } = options
      const { default: noodl } = await import('../app/noodl')
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
          opts: ActionConsumerCallbackOptions & {
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
            const iteratorVar = component.get('iteratorVar') || ''

            if (/(file|blob)/i.test(dataObject)) {
              dataObject = opts.file || dataObject
            }

            // TODO - Replace this hardcoded "itemObject" string with iteratorVar
            if (
              typeof dataObject === 'string' &&
              dataObject.startsWith(iteratorVar)
            ) {
              dataObject = findListDataObject(component)
              if (stateHelpers) {
                const { getList } = stateHelpers
                const listId = component.get('listId')
                const listIndex = component.get('listIndex')
                const list = getList(listId) || []
                const listItem = list[listIndex]
                if (listItem) dataObject = listItem
                log.salmon('', {
                  listId,
                  listIndex,
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
    },
  })

  return _actions
}

export default createActions
