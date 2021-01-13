import Logger from 'logsnap'
import isObjectLike from 'lodash/isObjectLike'
import isPlainObject from 'lodash/isPlainObject'
import { LocalAudioTrack, LocalVideoTrack } from 'twilio-video'
import { isDraft, original } from 'immer'
import omit from 'lodash/omit'
import has from 'lodash/has'
import get from 'lodash/get'
import set from 'lodash/set'
import {
  Action,
  ActionConsumerCallbackOptions,
  AnonymousObject,
  ComponentInstance,
  EmitAction,
  EmitActionObject,
  findListDataObject,
  findParent,
  getDataValues,
  GotoActionObject,
  NOODL as NOODLUI,
  parseReference,
  ToastActionObject,
} from 'noodl-ui'
import NOODLUIDOM, {
  getByDataUX,
  isTextFieldLike,
  NOODLDOMElement,
} from 'noodl-ui-dom'
import {
  BuiltInActionObject,
  EmitObject,
  EvalActionObject,
  IfObject,
  PageJumpActionObject,
  PopupActionObject,
  PopupDismissActionObject,
  RefreshActionObject,
  SaveActionObject,
  UpdateActionObject,
} from 'noodl-types'
import {
  createEmitDataKey,
  evalIf,
  getByDataViewTag,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isPossiblyDataKey,
  isReference,
  parse,
} from 'noodl-utils'
import {
  onSelectFile,
  scrollToElem,
  toast,
  toggleVisibility,
} from '../utils/dom'
import { pageEvent } from '../constants'
import { resolvePageUrl } from '../utils/common'
import Meeting from '../meeting'

const log = Logger.create('src/app/noodl-ui-dom.ts')
const noodluidom = new NOODLUIDOM()

export const listen = ({
  noodl, // @aitmed/cadl SDK
  noodlui,
}: {
  noodl: any
  noodlui: NOODLUI
}) => {
  noodluidom.use(noodlui)
  /* -------------------------------------------------------
    ---- ACTIONS (non-builtIn)
  -------------------------------------------------------- */
  noodluidom
    .register({
      actionType: 'anonymous',
      fn: async (
        action: Action<AnonymousObject>,
        options: ActionConsumerCallbackOptions,
      ) => {
        const { fn } = action.original || {}
        if (options?.component) fn?.()
      },
    })
    /** DATA KEY EMIT --- CURRENTLY NOT USED IN THE NOODL YML */
    .register({
      actionType: 'emit',
      fn: async (
        action: EmitAction<EmitActionObject>,
        options: ActionConsumerCallbackOptions,
        { noodl },
      ) => {
        log.func('emit [dataKey]')
        log.gold('Emitting', { action, ...options })

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
    .register({
      actionType: 'emit',
      fn: async (
        action: EmitAction<EmitActionObject>,
        options: ActionConsumerCallbackOptions,
        { noodl },
      ) => {
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
    /** onBlur EMIT */
    .register({
      actionType: 'emit',
      fn: async (
        action: EmitAction<EmitActionObject>,
        options: ActionConsumerCallbackOptions,
        { noodl },
      ) => {
        log.func('emit [onBlur]')
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
      trigger: 'onBlur',
    })
    /** onClick EMIT */
    .register({
      actionType: 'emit',
      fn: async (
        action: EmitAction<EmitActionObject>,
        options: ActionConsumerCallbackOptions,
        { noodl },
      ) => {
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
    /** onChange EMIT */
    .register({
      actionType: 'emit',
      fn: async (
        action: EmitAction<EmitActionObject>,
        options: ActionConsumerCallbackOptions,
        { noodl },
      ) => {
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
    /** PATH EMIT */
    .register({
      actionType: 'emit',
      fn: async (
        action: EmitAction<EmitActionObject>,
        options: ActionConsumerCallbackOptions & { path: EmitObject },
        { noodl },
      ) => {
        log.func('emit [path]')
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
        const result = await noodl.emitCall(emitParams)

        log.grey(
          `emitCall call result: ${result === '' ? '(empty string)' : result}`,
        )

        return Array.isArray(result) ? result[0] : result
      },
      trigger: 'path',
    })
    .register({
      actionType: 'evalObject',
      fn: async (
        action: Action<EvalActionObject>,
        options: ActionConsumerCallbackOptions,
      ) => {
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
              } else
                log.grey('newAction', { newAction, queue: ref?.getQueue() })
              // return newAction.execute(options)
            }
          } else if ('if' in (action.original.object || {})) {
            const ifObj = action.original.object as IfObject
            if (Array.isArray(ifObj)) {
              const { default: noodl } = await import('../app/noodl')
              const pageName = noodlui.page || ''
              const pageObject = noodl.root[noodlui.page]
              const object = evalIf((valEvaluating) => {
                let value
                if (isNOODLBoolean(valEvaluating)) {
                  return isBooleanTrue(valEvaluating)
                } else {
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
                  } else {
                    return !!value
                  }
                }
              }, ifObj)
              if (typeof object === 'function') {
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
    .register({
      actionType: 'goto',
      fn: async (
        action: Action<GotoActionObject>,
        options: ActionConsumerCallbackOptions,
        actionsContext,
      ) => {
        log.func('goto')
        log.red('goto action', { action, options, ...actionsContext })
        const {
          findWindow,
          findByElementId,
          findByViewTag,
          noodl,
        } = actionsContext
        const { component } = options

        const destinationParam =
          (typeof action.original.goto === 'string'
            ? action.original.goto
            : isPlainObject(action.original.goto)
            ? action.original.destination || action.original.goto
            : '') || ''

        let { destination, id = '', isSamePage, duration } = parse.destination(
          destinationParam,
        )

        log.grey('', {
          destinationParam,
          destination,
          duration,
          id,
          isSamePage,
        })

        if (id) {
          const node = findByViewTag(id) || findByElementId(component.id)

          if (node) {
            let win = findWindow((w) => {
              if (w) {
                if ('contentDocument' in w) {
                  return (w as any).contentDocument.contains?.(node)
                }
                return w.document?.contains?.(node)
              } else return false
            })
            if (isSamePage) {
              scrollToElem(node, { win, duration })
            } else {
              noodluidom.page.once(pageEvent.ON_COMPONENTS_RENDERED, () => {
                scrollToElem(node, { win, duration })
              })
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
          noodluidom.page.pageUrl = resolvePageUrl({
            destination,
            pageUrl: noodluidom.page.pageUrl,
            startPage: noodl.cadlEndpoint.startPage,
          })
        } else {
          destination = destinationParam
        }

        await noodluidom.page.requestPageChange(destination)
        if (!destination) {
          log.func('goto')
          log.red(
            'Tried to go to a page but could not find information on the whereabouts',
            { action, ...options },
          )
        }
      },
    })
    .register({
      actionType: 'pageJump',
      fn: async (
        action: Action<PageJumpActionObject>,
        options: ActionConsumerCallbackOptions,
      ) => {
        log.func('pageJump')
        log.grey('', { action, ...options })
        await noodluidom.page.requestPageChange(action.original.destination)
      },
    })
    .register({
      actionType: 'popUp',
      fn: async (
        action: Action<PopupActionObject | PopupDismissActionObject>,
        options: ActionConsumerCallbackOptions,
      ) => {
        log.func('popUp')
        log.grey('', { action, ...options })
        const { ref } = options
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
                import('../app/noodl').then(({ default: noodl }) => {
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
    .register({
      actionType: 'popUpDismiss',
      fn: async (
        action: Action<PopupDismissActionObject>,
        options: ActionConsumerCallbackOptions,
        actionsContext,
      ) => {
        log.func('popUpDismiss')
        log.grey('', { action, ...options })
        await Promise.all(
          noodluidom.actions.popUp.map((obj) =>
            obj.fn(action, options, actionsContext),
          ),
        )
        return
      },
    })
    .register({
      actionType: 'refresh',
      fn: (
        action: Action<RefreshActionObject>,
        options: ActionConsumerCallbackOptions,
      ) => {
        log.func('refresh')
        log.grey(action.original.actionType, { action, ...options })
        window.location.reload()
      },
    })
    .register({
      actionType: 'saveObject',
      fn: async (
        action: Action<SaveActionObject>,
        options: ActionConsumerCallbackOptions,
      ) => {
        const { default: noodl } = await import('../app/noodl')
        const { abort, getRoot, getPageObject, page } = options

        try {
          const { object } = action.original
          if (typeof object === 'function') {
            log.func('saveObject')
            log.grey(
              `Directly invoking the object function with no parameters`,
              {
                action,
                ...options,
              },
            )
            await object()
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
                      nameField = parseReference(nameFieldPath, {
                        page: noodlui.page,
                        root: getRoot(),
                      })
                    } else {
                      nameField =
                        get(noodl?.root, nameFieldPath, null) ||
                        get(noodl?.root?.[noodlui?.page], nameFieldPath, {})
                    }

                    const params = { ...nameField }

                    if ('verificationCode' in params) {
                      delete params.verificationCode
                    }

                    await save(params)
                    log.func('saveObject')
                    log.green(
                      `Invoked saveObject with these parameters`,
                      params,
                    )
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
          return abort()
        }
      },
    })
    .register({
      actionType: 'toast',
      fn: async (
        action: Action<ToastActionObject>,
        options: ActionConsumerCallbackOptions,
      ) => {
        try {
          log.func('toast')
          log.gold('', { action, options })
          toast(action.original?.message || '')
        } catch (error) {
          throw new Error(error)
        }
      },
    })
    .register({
      actionType: 'updateObject',
      fn: async (
        action: Action<UpdateActionObject>,
        options: ActionConsumerCallbackOptions,
        { noodl },
      ) => {
        const { abort, component } = options
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
              const object = omit(action.original, 'actionType')
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
            if (typeof object === 'function') {
              await object()
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
                  await obj()
                } else {
                  await callObject(obj, opts)
                }
              }
            } else if (isObjectLike(object)) {
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
                if (!dataObject) dataObject = (options as any)?.file
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
          toast(error.message)
          // await abort?.(error.message)
        }
      },
    })
    /* -------------------------------------------------------
    ---- ACTIONS (builtIn)
  -------------------------------------------------------- */
    .register({
      actionType: 'builtIn',
      funcName: 'checkField',
      async fn(
        action: Action<BuiltInActionObject>,
        options: ActionConsumerCallbackOptions,
      ) {
        log.func('checkField')
        log.grey('checkField', { action, options })
        let contentType: string = '',
          delay: number | boolean = 0

        if (action instanceof Action) {
          contentType = action.original?.contentType || ''
          delay = action.original?.wait || 0
        } else {
          contentType = (action as any).contentType || ''
          delay = (action as any).wait || 0
        }

        const onCheckField = () => {
          const node = getByDataUX(contentType)
          if (node) {
            toggleVisibility(
              Array.isArray(node) ? node[0] : node,
              ({ isHidden }) => (isHidden ? 'visible' : 'hidden'),
            )
          }
        }

        if (delay > 0) {
          setTimeout(() => onCheckField(), delay as any)
        } else {
          onCheckField()
        }
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'goBack',
      async fn(
        action: Action<BuiltInActionObject>,
        options: ActionConsumerCallbackOptions,
      ) {
        log.func('goBack')
        log.grey('', { action, ...options })
        if (typeof action.original?.reload === 'boolean') {
          noodluidom.page.setModifier(
            noodluidom.page
              .getPreviousPage(noodl.cadlEndpoint.startPage || '')
              .trim(),
            { reload: action.original.reload },
          )
        }
        window.history.back()
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'toggleCameraOnOff',
      async fn(
        action: Action<BuiltInActionObject>,
        options: ActionConsumerCallbackOptions,
        actionsContext,
      ) {
        log.func('toggleCameraOnOff')
        const path = 'VideoChat.cameraOn'

        let localParticipant = Meeting.localParticipant
        let videoTrack: LocalVideoTrack | undefined

        if (localParticipant) {
          videoTrack = Array.from(localParticipant.tracks.values()).find(
            (trackPublication) => trackPublication.kind === 'video',
          )?.track as LocalVideoTrack

          const { default: noodl } = await import('../app/noodl')
          noodl.editDraft((draft: any) => {
            if (videoTrack) {
              if (videoTrack.isEnabled) {
                videoTrack.disable()
                set(draft, path, false)
                log.grey(
                  `Toggled video OFF for LocalParticipant`,
                  localParticipant,
                )
              } else {
                videoTrack.enable()
                set(draft, path, true)
                log.grey(
                  `Toggled video ON for LocalParticipant`,
                  localParticipant,
                )
              }
            } else {
              log.red(
                `Tried to toggle video track on/off for LocalParticipant but a video track was not available`,
                { localParticipant, room: Meeting.room },
              )
            }
          })
        }
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'toggleMicrophoneOnOff',
      async fn(
        action: Action<BuiltInActionObject>,
        options: ActionConsumerCallbackOptions,
        actionsContext,
      ) {
        log.func('toggleMicrophoneOnOff')
        const path = 'VideoChat.micOn'

        let localParticipant = Meeting.localParticipant
        let audioTrack: LocalAudioTrack | undefined

        if (localParticipant) {
          audioTrack = Array.from(localParticipant.tracks.values()).find(
            (trackPublication) => trackPublication.kind === 'audio',
          )?.track as LocalAudioTrack

          const { default: noodl } = await import('../app/noodl')
          noodl.editDraft((draft: any) => {
            if (audioTrack) {
              if (audioTrack.isEnabled) {
                audioTrack.disable()
                set(draft, path, false)
                log.grey(
                  `Toggled audio OFF for LocalParticipant`,
                  localParticipant,
                )
              } else {
                log.grey(
                  `Toggled audio ON for LocalParticipant`,
                  localParticipant,
                )
                audioTrack.enable()
                set(draft, path, true)
              }
            }
          })
        }
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'toggleFlag',
      async fn(
        action: Action<BuiltInActionObject>,
        options: ActionConsumerCallbackOptions,
        actionsContext,
      ) {
        log.func('toggleFlag')
        console.log({ action, ...options })
        const { findByElementId } = actionsContext
        const { component } = options
        const page = noodlui.page
        const { dataKey = '' } = action.original || {}
        let { iteratorVar, path } = component.get(['iteratorVar', 'path'])
        const node = findByElementId(component)

        let dataValue: any
        let dataObject: any
        let previousDataValue: boolean | undefined = undefined
        let nextDataValue: boolean | undefined = undefined
        let newSrc = ''

        if (isDraft(path)) path = original(path)

        log.gold(`iteratorVar: ${iteratorVar} | dataKey: ${dataKey}`)

        if (dataKey?.startsWith(iteratorVar)) {
          let parts = dataKey.split('.').slice(1)
          dataObject = findListDataObject(component)
          previousDataValue = get(dataObject, parts)
          // previousDataValueInSdk = _.get(noodl.root[context.page])
          dataValue = previousDataValue
          if (isNOODLBoolean(dataValue)) {
            // true -> false / false -> true
            nextDataValue = !isBooleanTrue(dataValue)
          } else {
            // Set to true if am item exists
            nextDataValue = !dataValue
          }
          set(dataObject, parts, nextDataValue)
        } else {
          const onNextValue = (
            previousValue: any,
            { updateDraft }: { updateDraft?: { path: string } } = {},
          ) => {
            let nextValue: any
            if (isNOODLBoolean(previousValue)) {
              nextValue = isBooleanTrue(previousValue) ? false : true
            }
            nextValue = !previousValue
            if (updateDraft) {
              noodl.editDraft((draft: any) => {
                set(draft, updateDraft.path, nextValue)
              })
            }
            // Propagate the changes to to UI if there is a path "if" object that
            // references the value as well
            if (node && isObjectLike(path)) {
              let valEvaluating = path?.if?.[0]
              // If the dataKey is the same as the the value we are evaluating we can
              // just re-use the nextDataValue
              if (valEvaluating === dataKey) {
                valEvaluating = nextValue
              } else {
                valEvaluating =
                  get(noodl.root, valEvaluating) ||
                  get(noodl.root[page || ''], valEvaluating)
              }
              newSrc = noodlui.createSrc(
                valEvaluating ? path?.if?.[1] : path?.if?.[2],
                component,
              ) as string
              node.setAttribute('src', newSrc)
            }
            return nextValue
          }

          dataObject = noodl.root

          if (has(noodl.root, dataKey)) {
            dataObject = noodl.root
            previousDataValue = get(dataObject, dataKey)
            onNextValue(previousDataValue, { updateDraft: { path: dataKey } })
          } else if (has(noodl.root[page], dataKey)) {
            dataObject = noodl.root[page]
            previousDataValue = get(dataObject, dataKey)
            onNextValue(previousDataValue, {
              updateDraft: {
                path: `${dataKey}${page ? `.${page}` : ''}`,
              },
            })
          } else {
            log.red(
              `${dataKey} is not a path of the data object. ` +
                `Defaulting to attaching ${dataKey} as a path to the root object`,
              { context: noodlui.getContext?.(), dataObject, dataKey },
            )
            dataObject = noodl.root
            previousDataValue = undefined
            nextDataValue = false
            onNextValue(previousDataValue, {
              updateDraft: { path: `${dataKey}.${page || ''}` },
            })
          }

          if (/mic/i.test(dataKey)) {
            noodluidom.builtIns.toggleMicrophoneOnOff
              .find(Boolean)
              ?.fn?.(action, options, actionsContext)
          } else if (/camera/i.test(dataKey)) {
            noodluidom.builtIns.toggleCameraOnOff
              .find(Boolean)
              ?.fn?.(action, options, actionsContext)
          }
        }

        log.grey('', {
          component: component.toJS(),
          componentInst: component,
          context: noodlui.getContext?.(),
          dataKey,
          dataValue,
          dataObject,
          previousDataValue,
          nextDataValue,
          previousDataValueInSdk: newSrc,
          node,
          path,
          options,
        })
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'lockApplication',
      async fn(
        action: Action<BuiltInActionObject>,
        options: ActionConsumerCallbackOptions,
      ) {
        const result = await _onLockLogout()
        if (result === 'abort') return 'abort'
        const { Account } = await import('@aitmed/cadl')
        await Account.logout(false)
        window.location.reload()
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'logOutOfApplication',
      async fn(
        action: Action<BuiltInActionObject>,
        options: ActionConsumerCallbackOptions,
      ) {
        const result = await _onLockLogout()
        if (result === 'abort') return 'abort'
        const { Account } = await import('@aitmed/cadl')
        await Account.logout(true)
        window.location.reload()
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'logout',
      async fn(
        action: Action<BuiltInActionObject>,
        options: ActionConsumerCallbackOptions,
      ) {
        const result = await _onLockLogout()
        if (result === 'abort') return 'abort'
        const { Account } = await import('@aitmed/cadl')
        await Account.logout(true)
        window.location.reload()
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'goto',
      async fn(action: Action<any>, options: ActionConsumerCallbackOptions) {
        log.func('goto')
        log.red('', { action, ...options })
        noodl = noodl || (await import('../app/noodl')).default
        const destinationParam =
          (typeof action === 'string'
            ? action
            : isPlainObject(action)
            ? (action as any).destination
            : '') || ''
        let { destination, id = '', isSamePage, duration } = parse.destination(
          destinationParam,
        )
        if (isSamePage) {
          scrollToElem(getByDataViewTag(id), { duration })
        } else {
          if (!destinationParam?.startsWith?.('http')) {
            if (id) {
              noodluidom.page.once(pageEvent.ON_COMPONENTS_RENDERED, () => {
                scrollToElem(getByDataViewTag(id), { duration })
              })
            }
            noodluidom.page.pageUrl = resolvePageUrl({
              destination,
              pageUrl: noodluidom.page.pageUrl,
              startPage: noodl.cadlEndpoint.startPage,
            })
          } else {
            destination = destinationParam
          }
          await noodluidom.page.requestPageChange(destination)
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
    .register({
      actionType: 'builtIn',
      funcName: 'redraw',
      async fn(
        action: Action<BuiltInActionObject>,
        options: ActionConsumerCallbackOptions,
        { findByViewTag },
      ) {
        log.func('redraw')
        log.red('', { action, options })

        const viewTag = action?.original?.viewTag || ''

        let components = Object.values(
          noodlui.componentCache().state() || {},
        ).reduce((acc: ComponentInstance[], c: any) => {
          if (c && c.get('viewTag') === viewTag) return acc.concat(c)
          return acc
        }, [])

        const { component } = options

        if (
          viewTag &&
          component.get('viewTag') === viewTag &&
          !components.includes(component)
        ) {
          components.push(component)
        }

        let startCount = 0

        while (startCount < components.length) {
          const viewTagComponent = components[startCount] as ComponentInstance
          const node = findByViewTag(viewTagComponent)
          const dataObject = findListDataObject(viewTagComponent)
          const [newNode, newComponent] = noodluidom.redraw(
            node as HTMLElement,
            viewTagComponent,
            { dataObject },
          )
          log.grey('Resolved redrawed component/node', {
            newNode,
            newComponent,
            dataObject,
          })
          noodlui.componentCache().set(newComponent)
          startCount++
        }

        componentCacheSize = getComponentCacheSize(noodlui)
        log.red(`COMPONENT CACHE SIZE: ${componentCacheSize}`)
      },
    })
  /* -------------------------------------------------------
    ---- NODE RESOLVERS
  -------------------------------------------------------- */
  noodluidom
    .register({
      name: 'data-value (sync with sdk)',
      cond: (node) => isTextFieldLike(node),
      resolve(node, component) {
        // Attach an additional listener for data-value elements that are expected
        // to change values on the fly by some "on change" logic (ex: input/select elements)
        return import('../utils/sdkHelpers').then(
          ({ createOnDataValueChangeFn }) => {
            ;(node as NOODLDOMElement)?.addEventListener(
              'change',
              createOnDataValueChangeFn(node, component, {
                onChange: component.get('onChange'),
                eventName: 'onchange',
              }),
            )
            if (component.get('onBlur')) {
              ;(node as NOODLDOMElement)?.addEventListener(
                'blur',
                createOnDataValueChangeFn(node, component, {
                  onBlur: component.get('onBlur'),
                  eventName: 'onblur',
                }),
              )
            }
          },
        )
      },
    })
    .register({
      name: 'image',
      cond: 'image',
      async resolve(node, component, { findByElementId }) {
        const { default: noodlui } = await import('../app/noodl-ui')
        const img = node as HTMLImageElement
        const parent = component.parent()
        const context = noodlui.getContext()
        const pageObject = noodlui.root[context?.page || ''] || {}
        if (
          img?.src === pageObject?.docDetail?.document?.name?.data &&
          pageObject?.docDetail?.document?.name?.type == 'application/pdf'
        ) {
          img.style.visibility = 'hidden'
          const parentNode = findByElementId(parent)
          const iframeEl = document.createElement('iframe')
          iframeEl.setAttribute('src', img.src)
          if (isPlainObject(component.style)) {
            Object.entries(component.style).forEach(
              ([k, v]) => (iframeEl.style[k as any] = v),
            )
          }
          parentNode?.appendChild(iframeEl)
        }
      },
    })
    .register({
      name: 'plugin',
      cond: 'plugin',
      async resolve(node, component: any) {
        const src = component?.get?.('src')
        if (typeof src === 'string') {
          if (src.startsWith('http')) {
            if (src.endsWith('.js')) {
              const { default: axios } = await import('../app/axios')
              const { data } = await axios.get(src)
              /**
               * TODO - Check the ext of the filename
               * TODO - If its js, run eval on it
               */
              try {
                eval(data)
              } catch (error) {
                console.error(error)
              }
            }
          } else {
            console.error(
              `Received a src from a "plugin" component that did not start with an http(s) protocol`,
              { component: component.toJS(), src },
            )
          }
        }
      },
    })
    .register({
      name: 'textField (password + non password)',
      cond: 'textField',
      resolve(node: any, component: any) {
        // Password inputs
        if (component.get('contentType') === 'password') {
          if (!node?.dataset.mods?.includes('[password.eye.toggle]')) {
            import('../app/noodl-ui').then(({ default: noodlui }) => {
              const assetsUrl = noodlui.assetsUrl || ''
              const eyeOpened = assetsUrl + 'makePasswordVisiable.png'
              const eyeClosed = assetsUrl + 'makePasswordInvisible.png'
              const originalParent = node?.parentNode as HTMLDivElement
              const newParent = document.createElement('div')
              const eyeContainer = document.createElement('button')
              const eyeIcon = document.createElement('img')

              // Transfering the positioning/sizing attrs to the parent so we can customize with icons and others
              const dividedStyleKeys = [
                'position',
                'left',
                'top',
                'right',
                'bottom',
                'width',
                'height',
              ] as const

              // Transfer styles to the new parent to position our custom elements
              dividedStyleKeys.forEach((styleKey) => {
                newParent.style[styleKey] = component.style?.[styleKey]
                // Remove the transfered styles from the original input element
                node && (node.style[styleKey] = '')
              })

              newParent.style['display'] = 'flex'
              newParent.style['alignItems'] = 'center'
              newParent.style['background'] = 'none'

              node && (node.style['width'] = '100%')
              node && (node.style['height'] = '100%')

              eyeContainer.style['top'] = '0px'
              eyeContainer.style['bottom'] = '0px'
              eyeContainer.style['right'] = '6px'
              eyeContainer.style['width'] = '42px'
              eyeContainer.style['background'] = 'none'
              eyeContainer.style['border'] = '0px'
              eyeContainer.style['outline'] = 'none'

              eyeIcon.style['width'] = '100%'
              eyeIcon.style['height'] = '100%'
              eyeIcon.style['userSelect'] = 'none'

              eyeIcon.setAttribute('src', eyeClosed)
              eyeContainer.setAttribute(
                'title',
                'Click here to reveal your password',
              )
              node && node.setAttribute('type', 'password')
              node && node.setAttribute('data-testid', 'password')

              // Restructing the node structure to match our custom effects with the
              // toggling of the eye iconsf

              if (originalParent) {
                if (originalParent.contains(node))
                  originalParent.removeChild(node)
                originalParent.appendChild(newParent)
              }
              eyeContainer.appendChild(eyeIcon)
              newParent.appendChild(node)
              newParent.appendChild(eyeContainer)

              let selected = false

              eyeIcon.dataset.mods = ''
              eyeIcon.dataset.mods += '[password.eye.toggle]'
              eyeContainer.onclick = () => {
                if (selected) {
                  eyeIcon.setAttribute('src', eyeOpened)
                  node?.setAttribute('type', 'text')
                } else {
                  eyeIcon.setAttribute('src', eyeClosed)
                  node?.setAttribute('type', 'password')
                }
                selected = !selected
                eyeContainer['title'] = !selected
                  ? 'Click here to hide your password'
                  : 'Click here to reveal your password'
              }
            })
          }
        } else {
          // Set to "text" by default
          node.setAttribute('type', 'text')
        }
      },
    })

  console.log(`%cRegistered noodl-ui-dom listeners`, `color:#95a5a6;`)

  return noodluidom
}

let componentCacheSize = 0

function getComponentCacheSize(noodlui: NOODLUI) {
  return Object.keys(noodlui.componentCache().state()).length
}

/** Shared common logic for both lock/logout logic */
async function _onLockLogout() {
  const dataValues = getDataValues() as { password: string }
  const hiddenPwLabel = getByDataUX('passwordHidden') as HTMLDivElement
  let password = dataValues.password || ''
  // Reset the visible status since this is a new attempt
  if (hiddenPwLabel) {
    const isVisible = hiddenPwLabel.style.visibility === 'visible'
    if (isVisible) hiddenPwLabel.style.visibility = 'hidden'
  }
  // Validate if their password is correct or not
  const { Account } = await import('@aitmed/cadl')
  const isValid = Account.verifyUserPassword(password)
  if (!isValid) {
    console.log(`%cisValid ?`, 'color:#e74c3c;font-weight:bold;', isValid)
    if (hiddenPwLabel) hiddenPwLabel.style.visibility = 'visible'
    else window.alert('Password is incorrect')
    return 'abort'
  } else {
    if (hiddenPwLabel) hiddenPwLabel.style.visibility = 'hidden'
  }
}

export default noodluidom
