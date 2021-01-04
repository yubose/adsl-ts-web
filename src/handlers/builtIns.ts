import isPlainObject from 'lodash/isPlainObject'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import isObjectLike from 'lodash/isObjectLike'
import { isDraft, original } from 'immer'
import {
  Action,
  ActionConsumerCallbackOptions,
  BuiltInObject,
  Component,
  ComponentInstance,
  EmitAction,
  findListDataObject,
  getDataValues,
  GotoURL,
  GotoObject,
  publish,
} from 'noodl-ui'
import { getByDataUX } from 'noodl-ui-dom'
import {
  LocalAudioTrack,
  LocalAudioTrackPublication,
  LocalVideoTrack,
  LocalVideoTrackPublication,
  Room,
} from 'twilio-video'
import {
  getByDataViewTag,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isBooleanFalse,
  parse,
} from 'noodl-utils'
import Logger from 'logsnap'
import Page from '../Page'
import { resolvePageUrl } from '../utils/common'
import { scrollToElem, toggleVisibility } from '../utils/dom'
import { BuiltInActions } from '../app/types'
import { pageEvent } from '../constants'
import Meeting from '../meeting'

const log = Logger.create('builtIns.ts')

const createBuiltInActions = function ({ page }: { page: Page }) {
  const builtInActions: BuiltInActions = {}

  builtInActions.checkField = (action, options) => {
    log.func('checkField')
    log.grey('checkField', { action, options })
    let contentType: string = '',
      delay: number = 0

    if (action instanceof Action) {
      contentType = action.original?.contentType || ''
      delay = action.original?.wait || 0
    } else {
      contentType = action.contentType || ''
      delay = action.wait || 0
    }

    const onCheckField = () => {
      const node = getByDataUX(contentType)
      if (node) {
        toggleVisibility(Array.isArray(node) ? node[0] : node, ({ isHidden }) =>
          isHidden ? 'visible' : 'hidden',
        )
      }
    }

    if (delay > 0) {
      setTimeout(() => onCheckField(), delay)
    } else {
      onCheckField()
    }
  }

  // Called after uaser fills out the form in CreateNewAccount and presses Submit
  builtInActions.checkUsernamePassword = (action, { abort }: any) => {
    // dispatchRedux(mergeCacheAuthValues(dataValues))
    const { password, confirmPassword } = getDataValues()
    if (password !== confirmPassword) {
      window.alert('Your passwords do not match')
      abort('Passwords do not match')
    }
    abort('Creating account')
  }

  builtInActions.cleanLocalStorage = () => window.localStorage.clear()

  builtInActions.goBack = async (action, options, { noodl }) => {
    log.func('goBack')
    log.grey('', { action, ...options })
    if (typeof action.original?.reload === 'boolean') {
      page.setModifier(
        page.getPreviousPage(noodl.cadlEndpoint.startPage || '').trim(),
        { reload: action.original.reload },
      )
    }
    window.history.back()
  }

  // Currently, goto can be invoked from the "init" in a page object, resulting
  // in options and noodl to be undefined.
  // TODO - wrap and autoconvert non-action instances
  // @ts-expect-error
  builtInActions.goto = async (
    action: GotoURL | GotoObject,
    options,
    // @ts-expect-error
    { noodl } = {},
  ) => {
    log.func('goto')
    log.red('', { action, ...options })
    noodl = noodl || (await import('../app/noodl')).default
    const { destination, id = '', isSamePage, duration } = parse.destination(
      (typeof action === 'string'
        ? action
        : isPlainObject(action)
        ? action.destination
        : '') || '',
    )
    if (isSamePage) {
      scrollToElem(getByDataViewTag(id), { duration })
    } else {
      if (id) {
        page.once(pageEvent.ON_COMPONENTS_RENDERED, () => {
          scrollToElem(getByDataViewTag(id), { duration })
        })
      }
      page.pageUrl = resolvePageUrl({
        destination,
        pageUrl: page.pageUrl,
        startPage: noodl.cadlEndpoint.startPage,
      })
      await page.requestPageChange(destination)
      if (!destination) {
        log.func('builtIn:goto')
        log.red(
          'Tried to go to a page but could not find information on the whereabouts',
          { action, ...options },
        )
      }
    }
  }

  /** Shared common logic for both lock/logout logic */
  const _onLockLogout = async () => {
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

  builtInActions.lockApplication = async (action, options) => {
    const result = await _onLockLogout()
    if (result === 'abort') return 'abort'
    const { Account } = await import('@aitmed/cadl')
    await Account.logout(false)
    window.location.reload()
  }

  builtInActions.logOutOfApplication = async (action, options) => {
    const result = await _onLockLogout()
    if (result === 'abort') return 'abort'
    const { Account } = await import('@aitmed/cadl')
    await Account.logout(true)
    window.location.reload()
  }

  builtInActions.logout = async () => {
    const { Account } = await import('@aitmed/cadl')
    await Account.logout(true)
    window.location.reload()
  }

  let componentCacheSize = 0

  const getComponentCacheSize = (noodlui: any) => {
    return Object.keys(noodlui.componentCache().state()).length
  }

  builtInActions.redraw = async function redraw(
    action: EmitAction,
    options,
    { noodlui, noodluidom },
  ) {
    log.func('redraw')
    log.red('', { action, options })

    // @ts-expect-error
    const viewTag = action?.original?.viewTag || ''

    let components = Object.values(
      noodlui.componentCache().state() || {},
    ).reduce((acc: ComponentInstance[], c: any) => {
      if (c && c.get('viewTag') === viewTag) return acc.concat(c)
      return acc
    }, [])

    log.gold('viewTaggedComponents', {
      viewtagged: components?.reduce((acc, c) => {
        // @ts-expect-error
        acc[c.id] = {
          component: c,
          node: document.getElementById(c.id),
        } as any
        return acc
      }, {}),
    })

    const cleanup = (component: ComponentInstance) => {
      publish(component, (c) => {
        if (c) {
          log.func('redraw [cleanup]')
          log.grey(`Cleaning component ${component.id} from the cache`, c)
          noodlui.componentCache().remove(c)
        }
      })
      noodlui.componentCache().remove(component)
    }

    const { component } = options

    if (
      viewTag &&
      component.get('viewTag') === viewTag &&
      !components.includes(component)
    ) {
      components.push(component)
    }

    log.grey(
      `# of components with viewTag "${viewTag}": ${components.length}`,
      components,
    )

    const redraw = (node: HTMLElement, child: Component, dataObject?: any) => {
      return noodluidom.redraw(node, child, {
        dataObject,
        resolver: (c: any) => {
          noodlui.componentCache().set(c)
          return noodlui.resolveComponents(c)
        },
        viewTag,
      })
    }

    let startCount = 0

    while (startCount < components.length) {
      const viewTagComponent = components[startCount] as ComponentInstance
      const node = document.getElementById(viewTagComponent.id)
      cleanup(viewTagComponent)
      log.grey(
        '[Redrawing] ' + node
          ? `Found node for viewTag component`
          : `Could not find a node associated with the viewTag component`,
        { node, component: viewTagComponent },
      )
      const dataObject = findListDataObject(viewTagComponent)
      const [newNode, newComponent] = redraw(
        node as HTMLElement,
        // @ts-expect-error
        viewTagComponent,
        dataObject,
      )

      log.grey('Resolved redrawed component/node', {
        newNode,
        newComponent,
        dataObject,
      })
      noodlui.componentCache().remove(viewTagComponent).set(newComponent)
      startCount++
    }

    componentCacheSize = getComponentCacheSize(noodlui)
    log.red(`COMPONENT CACHE SIZE: ${componentCacheSize}`)
  }

  builtInActions.toggleCameraOnOff = async () => {
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
            log.grey(`Toggled video OFF for LocalParticipant`, localParticipant)
          } else {
            videoTrack.enable()
            set(draft, path, true)
            log.grey(`Toggled video ON for LocalParticipant`, localParticipant)
          }
        } else {
          log.red(
            `Tried to toggle video track on/off for LocalParticipant but a video track was not available`,
            { localParticipant, room: Meeting.room },
          )
        }
      })
    }
  }

  builtInActions.toggleMicrophoneOnOff = async () => {
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
            log.grey(`Toggled audio OFF for LocalParticipant`, localParticipant)
          } else {
            log.grey(`Toggled audio ON for LocalParticipant`, localParticipant)
            audioTrack.enable()
            set(draft, path, true)
          }
        }
      })
    }
  }

  builtInActions.toggleFlag = async (action, options, actionsContext) => {
    log.func('toggleFlag')
    console.log({ action, ...options })
    const { default: noodlui } = await import('../app/noodl-ui')
    const { default: noodl } = await import('../app/noodl')
    const { component } = options
    const page = noodlui.page
    // @ts-expect-error
    const { dataKey = '' } = action.original || {}
    let { iteratorVar, path } = component.get(['iteratorVar', 'path'])
    const node = document.getElementById(component?.id)

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
          // @ts-expect-error
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
            // @ts-expect-error
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
        builtInActions.toggleMicrophoneOnOff?.(action, options, actionsContext)
      } else if (/camera/i.test(dataKey)) {
        builtInActions.toggleCameraOnOff?.(action, options, actionsContext)
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
  }

  return builtInActions

  // Wrapper that converts action objects to their action instances.
  // This is to allow these built in funcs to be executed outside of
  // components like during the "init" phase of page objects
  // return Object.entries(builtInActions).reduce((acc, [funcName, fn]) => {
  //   acc[funcName as keyof typeof acc] = async (
  //     ...[
  //       action,
  //       options,

  //       actionsContext,
  //     ]: Parameters<ActionChainActionCallback>
  //   ) => {
  //     if (!(action instanceof Action) && _.isPlainObject(action)) {
  //       const actionObj = action as ActionObject
  //       const { default: noodl } = await import('../app/noodl')
  //       const { default: noodlui } = await import('../app/noodl-ui')
  //       const consumerArgs = getActionConsumerOptions(
  //         noodlui,
  //       ) as ActionConsumerCallbackOptions & {
  //         trigger: any
  //       }
  //       actionsContext = actionsContext ||
  //         noodlui.actionsContext || { noodl, noodlui }
  //       const ref = new ActionChain(
  //         [actionObj],
  //         {
  //           ...consumerArgs,
  //           component: options?.component || consumerArgs.component,
  //         },
  //         actionsContext,
  //       )
  //       if (actionObj.actionType === 'builtIn') {
  //         ref.useBuiltIn({
  //           actionType: actionObj.actionType,
  //           funcName: actionObj.funcName,
  //           fn:
  //             builtInActions[actionObj.funcName as keyof typeof builtInActions],
  //         })
  //       } else {
  //         const { default: createActions } = await import('./actions')
  //         const actionHandlers = createActions({ page })
  //         actionHandlers[actionObj.actionType]?.forEach?.((o) =>
  //           ref.useAction({
  //             actionType: actionObj.actionType,
  //             fn: o.fn,
  //             trigger: o.trigger,
  //           }),
  //         )
  //       }
  //       action = (ref.createAction as any)?.[actionObj.actionType]?.(action)
  //       console.info(action)
  //     }
  //     return fn?.(action, options, actionsContext)
  //   }
  //   return acc
  // }, {} as typeof builtInActions)
}

/* -------------------------------------------------------
  ---- Built in funcs below are for the SDK
-------------------------------------------------------- */

// This goes on the SDK
export function onVideoChatBuiltIn({
  joinRoom,
}: {
  joinRoom: (token: string) => Promise<any>
}) {
  return async function onVideoChat(
    action: BuiltInObject & {
      roomId: string
      accessToken: string
    },
  ) {
    try {
      if (action) {
        let msg = ''
        if (action.accessToken) msg += 'Received access token '
        if (action.roomId) msg += 'and room id'
        log.func('onVideoChat').grey(msg, action)
      } else {
        log.func('onVideoChat')
        log.red(
          'Expected an action object but the value passed in was null or undefined',
          action,
        )
      }

      // Disconnect from the room if for some reason we
      // are still connected to one
      // if (room.state === 'connected' || room.state === 'reconnecting') {
      //   room?.disconnect?.()
      //   if (connecting) setConnecting(false)
      // }
      if (action?.roomId) log.grey(`Connecting to room id: ${action.roomId}`)
      const newRoom = (await joinRoom(action.accessToken)) as Room
      if (newRoom) {
        log.func('onVideoChat')
        log.green(`Connected to room: ${newRoom.name}`, newRoom)
        // TODO - read VideoChat.micOn and VideoChat.cameraOn and use those values
        // to initiate the default values for audio/video default enabled/disabled state
        const { default: noodl } = await import('../app/noodl')
        const { cameraOn, micOn } = noodl.root.VideoChat || {}
        const { localParticipant } = newRoom

        const toggle = (state: 'enable' | 'disable') => (
          tracks: Map<
            string,
            LocalVideoTrackPublication | LocalAudioTrackPublication
          >,
        ) => {
          tracks.forEach((publication) => {
            publication?.track?.[state]?.()
          })
        }
        const enable = toggle('enable')
        const disable = toggle('disable')

        if (isNOODLBoolean(cameraOn)) {
          if (isBooleanTrue(cameraOn)) {
            enable(localParticipant?.videoTracks)
          } else if (isBooleanFalse(cameraOn)) {
            disable(localParticipant?.videoTracks)
          }
        } else {
          // Automatically disable by default
          disable(localParticipant?.videoTracks)
        }
        if (isNOODLBoolean(micOn)) {
          if (isBooleanTrue(micOn)) {
            enable(localParticipant?.audioTracks)
          } else if (isBooleanFalse(micOn)) {
            disable(localParticipant?.audioTracks)
          }
        } else {
          // Automatically disable by default
          disable(localParticipant?.audioTracks)
        }
      } else {
        log.func('onVideoChat')
        log.red(
          `Expected a room instance to be returned but received null or undefined instead`,
          newRoom,
        )
      }
    } catch (error) {
      console.error(error)
      window.alert(`[${error.name}]: ${error.message}`)
    }
  }
}

export function onBuiltinMissing(
  action: BuiltInObject,
  options: ActionConsumerCallbackOptions,
) {
  window.alert(`The button "${action.funcName}" is not available to use yet`)
}

export default createBuiltInActions
