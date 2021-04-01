import isObjectLike from 'lodash/isObjectLike'
import omit from 'lodash/omit'
import has from 'lodash/has'
import set from 'lodash/set'
import get from 'lodash/get'
import isPlainObject from 'lodash/isPlainObject'
import {
  findByUX,
  findWindow,
  findByElementId,
  findByViewTag,
  isPageConsumer,
} from 'noodl-ui-dom'
import {
  actionTypes as nuiActionTypes,
  ConsumerOptions,
  EmitAction,
  findListDataObject,
  findIteratorVar,
  getDataValues,
  NUIComponent,
  parseReference,
  Store,
  NOODLUIActionType,
  trigger,
} from 'noodl-ui'
import { createEmitDataKey, evalIf, parse } from 'noodl-utils'
import Logger from 'logsnap'
import { EmitObject, IfObject, Identify } from 'noodl-types'
import { pageEvent } from '../constants'
import { getVcodeElem, onSelectFile, scrollToElem, toast } from '../utils/dom'
import App from '../App'
import * as T from '../app/types'
import * as u from '../utils/common'

const log = Logger.create('actions.ts')
const stable = u.isStable()

const createActions = function createActions(app: App) {
  const actions: Record<
    Exclude<NOODLUIActionType, 'builtIn' | 'register'>,
    | Omit<Store.ActionObject, 'actionType'>
    | Store.ActionObject['fn']
    | (Omit<Store.ActionObject, 'actionType'> | Store.ActionObject['fn'])[]
  > = {
    anonymous: (action) => action.original?.fn?.(),
    emit: [
      {
        // DATA KEY EMIT --- CURRENTLY NOT USED IN THE NOODL YML
        fn: async function onDataKeyEmit(action: EmitAction, options) {
          const emitParams = {
            actions: action.actions,
            dataKey: action.dataKey,
            pageName: app.mainPage.page,
          } as T.EmitCallParams
          log.func('emit [dataKey]')
          log.gold('Emitting', { action, emitParams, options })
          const emitResult = await app.noodl.emitCall(emitParams)
          log.grey(`Emit result`, { emitParams, emitResult })
          return emitResult
        },
        trigger: trigger.DATA_VALUE,
      },
      {
        // DATA VALUE EMIT
        fn: async function onDataValueEmit(action: EmitAction, options) {
          const emitParams = {
            actions: action.actions,
            pageName: app.mainPage.page,
          } as T.EmitCallParams

          if ('dataKey' in action.original.emit || {}) {
            emitParams.dataKey = action.dataKey
          }
          log.func('emit [dataValue]')
          log.grey('Emitting', { action, emitParams, options })
          const emitResult = await app.noodl.emitCall(emitParams)
          log.grey('Emit result', { emitParams, emitResult })
          return emitResult
        },
        trigger: trigger.DATA_VALUE,
      },
      // onBlur EMIT
      {
        fn: async function onBlurEmit(action: EmitAction, options) {
          const emitParams = {
            actions: action.actions,
            pageName: app.mainPage.page,
          } as any
          if ('dataKey' in action.original.emit || {}) {
            emitParams.dataKey = action.dataKey
          }
          log.func('emit [onBlur]')
          log.grey('Emitting', { action, emitParams, options })
          const emitResult = await app.noodl.emitCall(emitParams)
          log.grey('Emit result', { emitParams, emitResult })
          return emitResult
        },
        trigger: 'onBlur',
      },
      // onClick EMIT
      {
        fn: async function onClickEmit(action: EmitAction, options) {
          const emitParams = {
            actions: action.actions,
            pageName: options.page?.page,
          } as any
          if (action.original.emit.dataKey) {
            emitParams.dataKey = action.dataKey
          }
          log.func('emit [onClick]')
          log.gold('Emitting', { action, emitParams, ...options })
          const emitResult = await app.noodl.emitCall(emitParams)
          log.grey('Emit result', { emitParams, emitResult })
          return emitResult
        },
        trigger: 'onClick',
      },
      // onChange EMIT
      {
        fn: async function onChangeEmit(action: EmitAction, options) {
          const emitParams = {
            actions: action.actions,
            pageName: app.mainPage.page,
          } as any
          if ('dataKey' in action.original.emit || {}) {
            emitParams.dataKey = action.dataKey
          }
          log.func('emit [onChange]')
          log.grey('Emitting', { action, emitParams, options })
          const emitResult = await app.noodl.emitCall(emitParams)
          log.grey('Emit result', { emitParams, emitResult })
          return emitResult
        },
        trigger: 'onChange',
      },
      // Path EMIT
      {
        fn: async function onPathEmit(action: EmitAction, options) {
          const { component, getRoot } = options
          const page = app.mainPage.page || ''
          const dataObject = findListDataObject(
            component as NUIComponent.Instance,
          )
          const iteratorVar = findIteratorVar(component)
          const emitParams = {
            actions: action.original.emit.actions,
            pageName: page,
          } as any

          if (action.original.emit.dataKey) {
            emitParams.dataKey = createEmitDataKey(
              action.original.emit.dataKey,
              [dataObject, () => getRoot()[page], () => getRoot()],
              { iteratorVar },
            )
          }

          log.func('emit [path]')
          log.grey('Emitting', { action, emitParams, options })
          const emitResult = await app.noodl.emitCall(emitParams)
          log.grey('Emit result', { emitParams, emitResult })

          return Array.isArray(emitResult) ? emitResult[0] : emitResult
        },
        trigger: 'path',
      },
      // Placeholder EMIT
      {
        fn: async function onPlaceholderEmit(
          action: EmitAction,
          options: ConsumerOptions & { placeholder: EmitObject },
        ) {
          const { component, getRoot, placeholder } = options
          const page = app.mainPage.page
          const dataObject = findListDataObject(component)
          const iteratorVar = findIteratorVar(component)
          const emitParams = {
            actions: placeholder.emit.actions,
            pageName: page,
          } as any

          if (action.original.emit.dataKey) {
            emitParams.dataKey = createEmitDataKey(
              action.original.emit.dataKey,
              [dataObject, () => getRoot()[page], () => getRoot()],
              { iteratorVar },
            )
          }

          log.func('emit [placeholder]')
          log.grey('Emitting', { action, emitParams, ...options })
          const result = await app.noodl.emitCall(emitParams)
          log.grey(`Emitted`, { action, result })

          return Array.isArray(result) ? result[0] : result
        },
        trigger: 'placeholder',
      },
      // Register EMIT
      {
        fn: async function onRegisterEmit(action: EmitAction, options) {
          const page = app.mainPage.page

          const emitParams = {
            actions: action.original.emit.actions,
            pageName: page,
          } as any

          if (action.original.emit.dataKey) {
            emitParams.dataKey = action.dataKey
          }

          log.func('emit [register]')
          log.grey('Emitting', { action, emitParams, ...options })
          const emitResult = await app.noodl.emitCall(emitParams)
          log.grey('Emitted', { action, emitParams, emitResult, ...options })

          return Array.isArray(emitResult) ? emitResult[0] : emitResult
        },
        trigger: 'register',
      },
    ],
    async evalObject(action, options) {
      log.func('evalObject')
      try {
        if (typeof action?.original?.object === 'function') {
          const result = await action.original?.object()
          if (result) {
            const { ref } = options
            if (isPlainObject(result)) {
              log.grey(
                `An evalObject action is injecting a new object to the chain`,
                {
                  instance: ref?.inject.call(ref, result),
                  object: result,
                  queue: ref?.queue.slice(),
                },
              )
              if ('wait' in result) {
                // await ref.abort()
                // throw new Error('aborted')
              }
            }
          }
        } else if ('if' in (action.original.object || {})) {
          const ifObj = action.original.object as IfObject
          if (Array.isArray(ifObj)) {
            const { default: noodl } = await import('../app/noodl')
            const pageName = app.mainPage.page || ''
            const pageObject = noodl.root[app.mainPage.page]
            const object = evalIf((valEvaluating) => {
              let value
              if (Identify.isBoolean(valEvaluating)) {
                return Identify.isBooleanTrue(valEvaluating)
              }
              if (typeof valEvaluating === 'string') {
                if (valEvaluating.includes('.')) {
                  if (has(noodl.root, valEvaluating)) {
                    value = get(noodl.root[pageName], valEvaluating)
                  } else if (has(pageObject, valEvaluating)) {
                    value = get(pageObject, valEvaluating)
                  }
                }
                if (Identify.isBoolean(value))
                  return Identify.isBooleanTrue(value)
                return !!value
              }
              return !!value
            }, ifObj)
            if (typeof object === 'function') {
              stable &&
                log.cyan(
                  `The "object" if evalObject is a function. Invoking it ` +
                    `without parameters now..`,
                )
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
    async goto(action, options) {
      log.func('goto')
      log.grey(action.original?.goto || action?.goto || 'goto', {
        action,
        options,
      })

      let allProps = {} as any // Temp used for debugging/logging
      let gotoObject = { goto: action.original.goto } as any
      let pageModifiers = {} as any

      const noodl = app.noodl

      const destinationParam =
        (typeof action.original.goto === 'string'
          ? action.original.goto
          : isPlainObject(action.original.goto)
          ? action.original.goto.destination ||
            action.original.goto.dataIn?.destination ||
            action.original.goto
          : '') || ''

      let computedDestinationProps = parse.destination(destinationParam)

      const {
        destination,
        id = '',
        isSamePage,
        duration,
      } = computedDestinationProps

      if (destination === destinationParam) {
        app.mainPage.requesting = destination
      }

      if (isPlainObject(gotoObject.goto?.dataIn)) {
        const dataIn = gotoObject.goto.dataIn
        'reload' in dataIn && (pageModifiers.reload = dataIn.reload)
        'pageReload' in dataIn && (pageModifiers.pageReload = dataIn.pageReload)
      } else if (isPlainObject(gotoObject)) {
        'reload' in gotoObject && (pageModifiers.reload = gotoObject.reload)
        'pageReload' in gotoObject &&
          (pageModifiers.pageReload = gotoObject.pageReload)
      }

      stable &&
        log.cyan(`Evaluated goto information`, {
          destinationParam,
          destination,
          duration,
          id,
          isSamePage,
        })

      if (id) {
        const isInsidePageComponent = isPageConsumer(options.component)
        const node = findByViewTag(id) || findByElementId(id)

        stable &&
          log.cyan(
            `The destination of ${destinationParam} is ${
              isInsidePageComponent ? '' : 'NOT '
            }inside this page`,
          )

        if (node) {
          let win: Window | undefined | null
          let doc: Document | null | undefined
          if (document.contains?.(node)) {
            win = window
            doc = window.document
          } else {
            win = findWindow((w) => {
              if (w) {
                if ('contentDocument' in w) {
                  doc = (w as any).contentDocument
                } else {
                  doc = w.document
                }
                return doc?.contains?.(node)
              }
              return false
            })
          }
          function scroll() {
            if (isInsidePageComponent) {
              scrollToElem(node, { win, doc, duration })
            } else {
              node?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
              })
            }
          }
          if (isSamePage) {
            scroll()
          } else {
            app.mainPage.once(pageEvent.ON_COMPONENTS_RENDERED, scroll)
          }
        } else {
          log.red(
            `Could not search for a DOM node with an identity of "${id}"`,
            {
              node,
              id,
              destination,
              isSamePage,
              duration,
              action,
              options,
            },
          )
        }
      }

      if (!destinationParam.startsWith('http')) {
        app.mainPage.pageUrl = u.resolvePageUrl({
          destination,
          pageUrl: app.mainPage.pageUrl,
          startPage: noodl.cadlEndpoint.startPage,
        })
        stable && log.cyan(`Page URL evaluates to: ${app.mainPage.pageUrl}`)
      } else {
        destination = destinationParam
      }

      allProps = {
        gotoObject,
        computedDestinationProps,
        destinationParam,
        isSamePage,
        pageModifiers,
        updatedQueryString: app.mainPage.pageUrl,
      }

      log.grey(`Computed [action] goto props`, allProps)

      if (!isSamePage) {
        stable &&
          log.cyan(
            `Sending a page request to page "${destination}" app.ndom...`,
          )
        await app.navigate(destination)

        if (!destination) {
          log.func('goto')
          log.red(
            'Tried to go to a page but could not find information on the whereabouts',
            { action, ...options },
          )
        }
      }
    },
    async pageJump(action, options) {
      log.func('pageJump')
      log.grey('', { action, ...options })
      stable &&
        log.cyan(
          `Sending a page request to page "${action.original.destination}" app.ndom...`,
        )
      await app.navigate(action.original.destination)
    },
    async popUp(action, options) {
      log.func(action.actionType)
      log.grey('', { action, ...options })
      const { ref } = options
      const elem = findByUX(action.original.popUpView) as HTMLElement
      const popUpView = action.original.popUpView || ''
      if (action.original.dismissOnTouchOutside) {
        const onTouchOutside = function onTouchOutside(
          this: HTMLDivElement,
          e: Event,
        ) {
          e.preventDefault()
          elem.style.visibility = 'hidden'
          document.body.removeEventListener('click', onTouchOutside)
          stable &&
            log.cyan(`Removed the "dismissOnTouchOutside" func listener`)
        }
        document.body.addEventListener('click', onTouchOutside)
        stable && log.cyan(`Attached a "dismissOnTouchOutside" func listener`)
      }
      if (elem?.style) {
        if (action.actionType === 'popUp') {
          elem.style.visibility = 'visible'
        } else if (action.actionType === 'popUpDismiss') {
          elem.style.visibility = 'hidden'
        }
        // Some popup components render values using the dataKey. There is a bug
        // where an action returns a popUp action from an evalObject action. At
        // this moment the popup is not aware that it needs to read the dataKey if
        // it is not triggered by some NOODLDOMDataValueElement. So we need to do a check here

        // Auto prefills the verification code when ECOS_ENV === 'test'
        // and when the entered phone number starts with 888
        if (process.env.ECOS_ENV === 'test') {
          const vcodeInput = getVcodeElem()
          if (String(vcodeInput?.value).startsWith('888')) {
            const pageName = app.mainPage?.page || ''
            const pathToTage = /settings/i.test(pageName)
              ? 'formData.code'
              : 'verificationCode.response.edge.tage'
            let vcode = get(app.noodl.root?.[pageName], pathToTage, '')
            if (!pageName) {
              log.red(
                `Could not determine the page to query the verification code for`,
              )
            }
            if (vcode) {
              vcode = String(vcode)
              vcodeInput.value = vcode
              vcodeInput.dataset.value = vcode
              app.noodl.editDraft((draft: any) => {
                set(
                  draft[pageName],
                  vcodeInput.dataset.key || 'formData.code',
                  vcode,
                )
              })
            } else {
              log.orange(
                `Could not find a verification code at path "${pathToTage}"`,
              )
            }
          }
        }

        // If popUp has wait: true, the action chain should pause until a response
        // is received from something (ex: waiting on user confirming their password)
        if (action.original.wait) {
          if (Identify.isBoolean(action.original.wait)) {
            if (Identify.isBooleanTrue(action.original.wait)) {
              log.grey(
                `Popup action for popUpView "${popUpView}" is ` +
                  `waiting on a response. Aborting now...`,
                { action, ...options },
              )
              await ref?.abort?.()
            }
          }
        }
      } else {
        let msg = 'Tried to '

        if (action.actionType === 'popUp') msg += 'show'
        else if (action.actionType === 'popUpDismiss') msg += 'hide'

        log.func(action.actionType)
        log.red(
          `${msg} a ${action.actionType} element but the element ` +
            `was null or undefined`,
          { action, popUpView, ...options },
        )
      }
    },
    async popUpDismiss(action, options) {
      await Promise.all(
        app.ndom.actions.popUp.map((obj) => obj.fn(action, options)),
      )
    },
    async refresh(action, options) {
      log.func('refresh')
      log.grey(action.actionType, { action, ...options })
      window.location.reload()
    },
    async saveObject(action, options) {
      log.func('saveObject')
      log.grey('', { action, ...options })
      const { default: noodl } = await import('../app/noodl')
      const { getRoot, ref } = options

      try {
        const { object } = action.original
        if (typeof object === 'function') {
          log.func('saveObject')
          log.grey(
            `Directly invoking the object function with no parameters`,
            action,
          )
          await object()
          log.grey(`Invoked`, action)
        } else if (Array.isArray(object)) {
          const numObjects = object.length
          for (let index = 0; index < numObjects; index++) {
            const obj = object[index]
            if (Array.isArray(obj)) {
              // Assuming this a tuple where the first item is the path to the "name" field
              // and the second item is the actual function that takes in values from using
              // the name field to retrieve values
              if (obj.length === 2) {
                const [nameFieldPath, save] = obj

                if (
                  typeof nameFieldPath === 'string' &&
                  typeof save === 'function'
                ) {
                  let nameField

                  if (Identify.reference(nameFieldPath)) {
                    stable &&
                      log.cyan(`Found reference: ${nameFieldPath}`, action)
                    nameField = parseReference(nameFieldPath, {
                      page: app.mainPage.page,
                      root: getRoot(),
                    })
                    stable && log.cyan(`Parsed reference: ${nameField}`, action)
                  } else {
                    nameField =
                      get(noodl?.root, nameFieldPath, null) ||
                      get(noodl?.root?.[app.mainPage?.page], nameFieldPath, {})
                    stable && log.cyan(`Name field: ${nameField}`, action)
                  }

                  const params = { ...nameField }

                  if ('verificationCode' in params) {
                    delete params.verificationCode
                  }

                  await save(params)
                  log.func('saveObject')
                  log.grey(`Invoked saveObject with these parameters`, params)
                }
              }
            }
          }
        } else if (typeof object === 'string') {
          log.func('saveObject')
          log.red(
            `The "object" property in the saveObject action is a string which ` +
              `is in the incorrect format. Possibly a parsing error?`,
            { action, ...options },
          )
        }
      } catch (error) {
        console.error(error)
        toast(error.message)
        ref?.abort?.()
      }
    },
    async toast(action, options) {
      try {
        log.func('toast')
        log.gold('', { action, options })
        toast(action.original?.message || '')
      } catch (error) {
        throw new Error(error)
      }
    },
    async updateObject(action, options) {
      const { component, ref } = options
      log.func('updateObject')
      log.grey('', { action, ...options })

      const callObjectOptions = { action, ...options } as any

      try {
        if (action.original?.dataObject === 'BLOB') {
          const { files, status } = await onSelectFile()
          if (status === 'selected' && files?.[0]) {
            log.grey(`File selected`, files[0])
            callObjectOptions.file = files[0]
            // @ts-expect-error
          } else if (status === 'canceled') {
            log.red('File was not selected and the operation was aborted')
            await ref?.abort?.('File input window was closed')
          }
        }

        // This is the more older version of the updateObject action object where it used
        // the "object" property
        if (isPlainObject(action.original) && 'object' in action.original) {
          await callObject(action.original.object, callObjectOptions)
        }

        // This is the more newer version that is more descriptive, utilizing the data key
        // action = { actionType: 'updateObject', dataKey, dataObject }
        else if (action.original?.dataKey || action.original?.dataObject) {
          const object = omit(action.original, 'actionType')
          await callObject(object, callObjectOptions)
        }

        async function callObject(
          object: any,
          opts: ConsumerOptions & {
            action: any
            file?: File
          },
        ) {
          if (typeof object === 'function') {
            if (stable) {
              log.func('callObject')
              log.cyan(
                `Calling the object func on an updateObject with no parameters`,
                { object, ...opts },
              )
            }
            const result = await object()
            stable &&
              log.cyan(`Called`, { object, resultIfAny: result, ...opts })
          } else if (typeof object === 'string') {
            log.red(
              `Received a string as an object property of updateObject. ` +
                `Possibly parsed incorrectly?`,
              { object, ...options, ...opts, action },
            )
          } else if (Array.isArray(object)) {
            for (let index = 0; index < object.length; index++) {
              const obj = object[index]
              if (typeof obj === 'function') {
                // Handle promises/functions separately because they need to be
                // awaited in this line for control flow
                stable && log.cyan(`Calling obj function`)
                await obj()
                stable && log.cyan(`obj function called`)
              } else {
                await callObject(obj, opts)
              }
            }
          } else if (isObjectLike(object)) {
            let { dataKey, dataObject } = object
            const iteratorVar = findIteratorVar(component)

            if (/(file|blob)/i.test(dataObject)) {
              const name = dataObject
              stable && log.cyan(`The data object is requesting a "${name}"`)
              dataObject = opts.file || dataObject
              stable && log.cyan(`Attached the "${name}"`, dataObject)
            }

            // TODO - Replace this hardcoded "itemObject" string with iteratorVar
            if (
              typeof dataObject === 'string' &&
              dataObject.startsWith(iteratorVar)
            ) {
              dataObject = findListDataObject(component)
              if (!dataObject) dataObject = (options as any)?.file
              else
                stable &&
                  log.cyan(
                    `Found a dataObject for this list related component`,
                    dataObject,
                  )
            }
            if (dataObject) {
              const params = { dataKey, dataObject }
              log.func('updateObject')
              log.cyan(`Calling updateObject with params: `, params)
              const result = await app.noodl.updateObject(params)
              log.cyan(`Called updateObject: `, {
                params,
                resultIfAny: result,
              })
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
        toast(error.message)
      }
    },
  }

  const insert = (
    type: keyof typeof actions,
    obj: typeof actions[keyof typeof actions],
  ) => {
    const action = { actionType: type } as Store.ActionObject

    if (u.isFnc(obj)) {
      action.fn = obj
    } else if (u.isArr(obj)) {
      obj.forEach((o) => {
        if (u.isFnc(o)) {
          action.fn = o
        } else if (u.isObj(o)) {
          u.assign(action, o)
        }
      })
    } else {
      u.assign(action, obj)
    }

    return action
  }

  return u.entries(actions).reduce((acc, [type, obj]) => {
    const objs = [] as Store.ActionObject[]
    if (u.isArr(obj)) {
      obj.forEach((o) => objs.push(insert(type as keyof typeof actions, o)))
    } else {
      objs.push(insert(type as keyof typeof actions, obj))
    }
    return acc.concat(objs)
  }, [] as Store.ActionObject[])
}

export default createActions
