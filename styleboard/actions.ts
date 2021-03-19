import isObjectLike from 'lodash/isObjectLike'
import omit from 'lodash/omit'
import has from 'lodash/has'
import set from 'lodash/set'
import get from 'lodash/get'
import isPlainObject from 'lodash/isPlainObject'
import NOODLOM, { eventId, getByDataUX } from 'noodl-ui-dom'
import {
  Action,
  ActionConsumerCallbackOptions,
  AnonymousObject,
  EmitAction,
  EmitObject,
  findListDataObject,
  findParent,
  getDataValues,
  IfObject,
  isReference,
  NOODL as NOODLUI,
  parseReference,
  EmitActionObject,
  GotoActionObject,
  ToastActionObject,
} from 'noodl-ui'
import {
  createEmitDataKey,
  evalIf,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isPossiblyDataKey,
  parse,
} from 'noodl-utils'
import Logger from 'logsnap'
import {
  EvalActionObject,
  PageJumpActionObject,
  PopupActionObject,
  PopupDismissActionObject,
  RefreshActionObject,
  SaveActionObject,
  UpdateActionObject,
} from 'noodl-types'
import { isStable, resolvePageUrl } from './utils/common'
import { onSelectFile, scrollToElem, toast } from './utils/dom'

const log = Logger.create('actions.ts')
const stable = isStable()

const createActions = function createActions({
  noodl,
  noodlui,
  ndom,
}: {
  noodl: any
  noodlui: NOODLUI
  ndom: NOODLOM
}) {
  ndom.register({
    actionType: 'anonymous',
    fn: async function onAnonymousAction(
      action: Action<AnonymousObject>,
      options: ActionConsumerCallbackOptions,
    ) {
      const { fn } = action.original || {}
      if (options?.component) {
        if (stable) {
          log.func('anonymous')
          log.cyan(`Calling anonymous action`, { action, options })
        }
        fn?.()
      }
    },
  })

  /** DATA KEY EMIT --- CURRENTLY NOT USED IN THE NOODL YML */
  ndom.register({
    actionType: 'emit',
    fn: async function onDataKeyEmit(
      action: EmitAction<EmitActionObject>,
      options: ActionConsumerCallbackOptions,
      { noodl },
    ) {
      const emitParams = {
        actions: action.actions,
        dataKey: action.dataKey,
        pageName: noodlui.page,
      } as any

      log.func('emit [dataKey]')
      log.gold('Emitting', { action, emitParams, ...options })

      const emitResult = await noodl.emitCall(emitParams)

      log.grey(`Emitted`, {
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
  ndom.register({
    actionType: 'emit',
    fn: async function onDataValueEmit(
      action: EmitAction<EmitActionObject>,
      options: ActionConsumerCallbackOptions,
      { noodl },
    ) {
      const emitParams = {
        actions: action.actions,
        pageName: noodlui.page,
      } as any

      if ('dataKey' in action.original.emit || {}) {
        emitParams.dataKey = action.dataKey
      }

      log.func('emit [dataValue]')
      log.grey('Emitting', { action, emitParams, options })

      const emitResult = await noodl.emitCall(emitParams)

      log.grey('Emitted [dataValue]', {
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

  /** onBlur EMIT */
  ndom.register({
    actionType: 'emit',
    fn: async function onBlurEmit(
      action: EmitAction<EmitActionObject>,
      options: ActionConsumerCallbackOptions,
      { noodl },
    ) {
      const emitParams = {
        actions: action.actions,
        pageName: noodlui.page,
      } as any

      if ('dataKey' in action.original.emit || {}) {
        emitParams.dataKey = action.dataKey
      }

      log.func('emit [onBlur]')
      log.grey('Emitting', { action, emitParams, options })

      const emitResult = await noodl.emitCall(emitParams)

      log.grey('Emitted', {
        action,
        actionChain: options.ref,
        component: options.component,
        emitParams,
        emitResult,
        options,
      })

      return emitResult
    },
    trigger: 'onBlur',
  })

  /** onClick EMIT */
  ndom.register({
    actionType: 'emit',
    fn: async function onClickEmit(
      action: EmitAction<EmitActionObject>,
      options: ActionConsumerCallbackOptions,
      { noodl },
    ) {
      const emitParams = {
        actions: action.actions,
        pageName: options?.page,
      } as any

      if (action.original.emit.dataKey) {
        emitParams.dataKey = action.dataKey
      }

      log.func('emit [onClick]')
      log.gold('Emitting', { action, emitParams, noodl, noodlui, ...options })

      const emitResult = await noodl.emitCall(emitParams)

      log.gold(`Emitted [onClick]`, {
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

  /** onChange EMIT */
  ndom.register({
    actionType: 'emit',
    fn: async function onChangeEmit(
      action: EmitAction<EmitActionObject>,
      options: ActionConsumerCallbackOptions,
      { noodl },
    ) {
      const emitParams = {
        actions: action.actions,
        pageName: noodlui.page,
      } as any

      if ('dataKey' in action.original.emit || {}) {
        emitParams.dataKey = action.dataKey
      }

      log.func('emit [onChange]')
      log.grey('Emitting', { action, emitParams, options })

      const emitResult = await noodl.emitCall(emitParams)

      log.grey('Emitted', {
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

  /** PATH EMIT */
  ndom.register({
    actionType: 'emit',
    fn: async function onPathEmit(
      action: EmitAction<EmitActionObject>,
      options: ActionConsumerCallbackOptions & { path: EmitObject },
      // { noodl },
    ) {
      const { component, context, getRoot, getPageObject, path } = options
      const page = context.page || ''
      const dataObject = findListDataObject(component)
      const iteratorVar =
        component.get('iteratorVar') ||
        findParent(component, (p: any) => !!p?.get?.('iteratorVar'))?.get?.(
          'iteratorVar',
        ) ||
        ''
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

      log.func('emit [path]')
      log.grey('Emitting', { action, emitParams, options })

      const result = await noodl.emitCall(emitParams)

      log.grey(`Emitted: ${result === '' ? '(empty string)' : result}`)

      return Array.isArray(result) ? result[0] : result
    },
    trigger: 'path',
  })

  /** PLACEHOLDER EMIT */
  ndom.register({
    actionType: 'emit',
    fn: async function onPlaceholderEmit(
      action: EmitAction<EmitActionObject>,
      options: ActionConsumerCallbackOptions & { path: EmitObject },
      { noodl },
    ) {
      const {
        component,
        context,
        getRoot,
        getPageObject,
        placeholder,
      } = options
      const page = context.page || ''
      const dataObject = findListDataObject(component)
      const iteratorVar =
        component.get('iteratorVar') ||
        findParent(component, (p: any) => !!p?.get?.('iteratorVar'))?.get?.(
          'iteratorVar',
        ) ||
        ''
      const emitParams = {
        actions: placeholder.emit.actions,
        pageName: page,
      } as any

      if (action.original.emit.dataKey) {
        emitParams.dataKey = createEmitDataKey(
          action.original.emit.dataKey,
          [dataObject, () => getPageObject(page), () => getRoot()],
          { iteratorVar },
        )
      }

      log.func('emit [placeholder]')
      log.grey('Emitting', { action, emitParams, ...options })

      const result = await noodl.emitCall(emitParams)

      log.grey(`Emitted: ${result === '' ? '(empty string)' : result}`, action)

      return Array.isArray(result) ? result[0] : result
    },
    trigger: 'placeholder',
  })

  /** REGISTER EMIT */
  ndom.register({
    actionType: 'emit',
    fn: async function onRegisterEmit(
      action: EmitAction<EmitActionObject>,
      options: ActionConsumerCallbackOptions,
      { noodl },
    ) {
      // noodl-ui should have prefilled the instance with the data at this point
      const { context } = options
      const page = context.page || ''

      const emitParams = {
        actions: action.original.emit.actions,
        pageName: page,
      } as any

      if (action.original.emit.dataKey) {
        emitParams.dataKey = action.dataKey
      }

      log.func('emit [register]')
      log.grey('Emitting', { action, emitParams, ...options })

      const emitResult = await noodl.emitCall(emitParams)

      log.func('emit [register]')
      log.grey('Emitted', { action, emitParams, emitResult, ...options })

      log.grey(`Emitted: ${emitResult === '' ? '(empty string)' : emitResult}`)

      return Array.isArray(emitResult) ? emitResult[0] : emitResult
    },
    trigger: 'register',
  })

  ndom.register({
    actionType: 'evalObject',
    fn: async function onEvalObject(
      action: Action<EvalActionObject>,
      options: ActionConsumerCallbackOptions,
    ) {
      log.func('evalObject')
      try {
        if (typeof action?.original?.object === 'function') {
          const result = await action.original?.object()
          if (result) {
            const { ref } = options
            const newAction = ref?.insertIntermediaryAction.call(ref, result)
            if (isPlainObject(result) && 'wait' in result) {
              // await ref.abort()
              throw new Error('aborted')
            } else {
              log.grey(`An evalObject action is injecting a new action`, {
                action: newAction,
                queue: ref?.getQueue(),
              })
            }
            // return newAction.execute(options)
          }
        } else if ('if' in (action.original.object || {})) {
          const ifObj = action.original.object as IfObject
          if (Array.isArray(ifObj)) {
            const pageName = noodlui.page || ''
            const pageObject = noodl.root[noodlui.page]
            const object = evalIf((valEvaluating) => {
              let value
              if (isNOODLBoolean(valEvaluating)) {
                return isBooleanTrue(valEvaluating)
              }
              if (typeof valEvaluating === 'string') {
                if (isPossiblyDataKey(valEvaluating)) {
                  if (has(noodl.root, valEvaluating)) {
                    value = get(noodl.root[pageName], valEvaluating)
                  } else if (has(pageObject, valEvaluating)) {
                    value = get(pageObject, valEvaluating)
                  }
                }
                if (isNOODLBoolean(value)) return isBooleanTrue(value)
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
  })

  ndom.register({
    actionType: 'goto',
    fn: async function onGoto(
      action: Action<GotoActionObject>,
      options: ActionConsumerCallbackOptions,
      actionsContext,
    ) {
      log.func('goto')
      log.grey(action.original?.goto || action?.goto || 'goto', {
        action,
        options,
        ...actionsContext,
      })

      const {
        findWindow,
        findByElementId,
        findByViewTag,
        isPageConsumer,
        noodl,
      } = actionsContext

      const destinationParam =
        (typeof action.original.goto === 'string'
          ? action.original.goto
          : isPlainObject(action.original.goto)
          ? action.original.destination || action.original.goto
          : '') || ''

      let { destination, id = '', isSamePage, duration } = parse.destination(
        destinationParam,
      )

      if (destination === destinationParam) {
        ndom.page.setRequestingPage(destination)
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
            ndom.page.once(eventId.page.on.ON_COMPONENTS_RENDERED, scroll)
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
              actionsContext,
            },
          )
        }
      }

      if (!destinationParam?.startsWith?.('http')) {
        ndom.page.pageUrl = resolvePageUrl({
          destination,
          pageUrl: ndom.page.pageUrl,
          startPage: noodl.cadlEndpoint.startPage,
        })
        stable && log.cyan(`Page URL evaluates to: ${ndom.page.pageUrl}`)
      } else {
        destination = destinationParam
      }

      if (!isSamePage) {
        stable &&
          log.cyan(`Sending a page request to page "${destination}" ndom...`)
        await ndom.page.requestPageChange(destination)

        if (!destination) {
          log.func('goto')
          log.red(
            'Tried to go to a page but could not find information on the whereabouts',
            { action, ...options },
          )
        }
      }
    },
  })

  ndom.register({
    actionType: 'pageJump',
    fn: async function onPageJump(
      action: Action<PageJumpActionObject>,
      options: ActionConsumerCallbackOptions,
    ) {
      log.func('pageJump')
      log.grey('', { action, ...options })
      stable &&
        log.cyan(
          `Sending a page request to page "${action.original.destination}" ndom...`,
        )
      await ndom.page.requestPageChange(action.original.destination)
    },
  })

  ndom.register({
    actionType: 'popUp',
    fn: async function onPopUp(
      action: Action<PopupActionObject | PopupDismissActionObject>,
      options: ActionConsumerCallbackOptions,
    ) {
      log.func(action.actionType)
      log.grey('', { action, ...options })
      const { ref } = options
      const elem = getByDataUX(action.original.popUpView) as HTMLElement
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

        // If popUp has wait: true, the action chain should pause until a response
        // is received from something (ex: waiting on user confirming their password)
        if (action.original.wait) {
          if (isNOODLBoolean(action.original.wait)) {
            if (isBooleanTrue(action.original.wait)) {
              log.grey(
                `Popup action for popUpView "${popUpView}" is ` +
                  `waiting on a response. Aborting now...`,
                { action, ...options },
              )
              await ref?.abort?.()
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
              const pageName = noodlui?.page || ''
              const pathToTage = 'verificationCode.response.edge.tage'
              let vcode = get(noodl.root?.[pageName], pathToTage, '')
              if (vcode) {
                vcode = String(vcode)
                vcodeInput.value = vcode
                vcodeInput.dataset.value = vcode
                noodl.editDraft((draft: any) => {
                  set(
                    draft[pageName],
                    (vcodeInput.dataset.key as string) || 'formData.code',
                    vcode,
                  )
                })
              }
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
  })

  ndom.register({
    actionType: 'popUpDismiss',
    fn: async function onPopUpDismiss(
      action: Action<PopupDismissActionObject>,
      options: ActionConsumerCallbackOptions,
      actionsContext,
    ) {
      await Promise.all(
        ndom.actions.popUp.map((obj) =>
          obj.fn(action, options, actionsContext),
        ),
      )
    },
  })

  ndom.register({
    actionType: 'refresh',
    fn: function onRefresh(
      action: Action<RefreshActionObject>,
      options: ActionConsumerCallbackOptions,
    ) {
      log.func('refresh')
      log.grey(action.actionType, { action, ...options })
      window.location.reload()
    },
  })

  ndom.register({
    actionType: 'saveObject',
    fn: async function onSaveObject(
      action: Action<SaveActionObject>,
      options: ActionConsumerCallbackOptions,
    ) {
      log.func('saveObject')
      log.grey('', { action, ...options })
      const { abort, getRoot, getPageObject, page } = options

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

                  if (isReference(nameFieldPath)) {
                    stable &&
                      log.cyan(`Found reference: ${nameFieldPath}`, action)
                    nameField = parseReference(nameFieldPath, {
                      page: noodlui.page,
                      root: getRoot(),
                    })
                    stable && log.cyan(`Parsed reference: ${nameField}`, action)
                  } else {
                    nameField =
                      get(noodl?.root, nameFieldPath, null) ||
                      get(noodl?.root?.[noodlui?.page], nameFieldPath, {})
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
        return abort?.()
      }
    },
  })

  ndom.register({
    actionType: 'toast',
    fn: async function onToast(
      action: Action<ToastActionObject>,
      options: ActionConsumerCallbackOptions,
    ) {
      try {
        log.func('toast')
        log.gold('', { action, options })
        toast(action.original?.message || '')
      } catch (error) {
        throw new Error(error)
      }
    },
  })

  ndom.register({
    actionType: 'updateObject',
    fn: async function onUpdateObject(
      action: Action<UpdateActionObject>,
      options: ActionConsumerCallbackOptions,
      { noodl },
    ) {
      const { abort, component } = options
      log.func('updateObject')
      log.grey('', { action, ...options })

      const callObjectOptions = { action, ...options } as any

      try {
        if (action.original?.dataObject === 'BLOB') {
          const { files, status } = await onSelectFile()
          if (status === 'selected' && files?.[0]) {
            log.grey(`File selected`, files[0])
            callObjectOptions.file = files[0]
          } else if (status === 'canceled') {
            log.red('File was not selected and the operation was aborted')
            await abort?.('File input window was closed')
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
          opts: ActionConsumerCallbackOptions & {
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
            const iteratorVar = component.get('iteratorVar') || ''

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
              const result = await noodl.updateObject(params)
              log.cyan(`Called updateObject: `, { params, resultIfAny: result })
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
        // await abort?.(error.message)
      }
    },
  })

  stable && log.cyan(`Initiated action funcs`)
}

export default createActions
