import _ from 'lodash'
import { isDraft, original } from 'immer'
import {
  ActionConsumerCallbackOptions,
  BuiltInObject,
  Component,
  EmitAction,
  getByDataUX,
  getDataValues,
  GotoURL,
  GotoObject,
} from 'noodl-ui'
import {
  LocalAudioTrack,
  LocalAudioTrackPublication,
  LocalVideoTrack,
  LocalVideoTrackPublication,
  Room,
} from 'twilio-video'
import {
  findListDataObject,
  findParent,
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isBooleanFalse,
} from 'noodl-utils'
import Logger from 'logsnap'
import validate from '../utils/validate'
import Page from '../Page'
import { toggleVisibility } from '../utils/dom'
import { BuiltInActions } from '../app/types'
import { NOODLBuiltInCheckFieldObject } from '../app/types/libExtensionTypes'
import Meeting from '../meeting'

const log = Logger.create('builtIns.ts')

const createBuiltInActions = function ({ page }: { page: Page }) {
  const builtInActions: BuiltInActions = {}

  builtInActions.checkField = (action, options) => {
    log.func('checkField')
    const { contentType } = action.original as NOODLBuiltInCheckFieldObject
    const node = getByDataUX(contentType)
    console.groupCollapsed({ action, options, node })
    console.trace()
    console.groupEnd()
    if (node) {
      toggleVisibility(_.isArray(node) ? node[0] : node, ({ isHidden }) => {
        const result = isHidden ? 'visible' : 'hidden'
        log.hotpink(`Toggling visibility to ${result.toUpperCase()}`, {
          action,
          ...options,
          node,
          result,
        })
        return result
      })
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

  builtInActions.goBack = async (action, options) => {
    log.func('goBack')
    log.grey('', { action, ...options })
    if (typeof action.original?.reload === 'boolean') {
      page.requestingPageModifiers.reload = action.original.reload
    }
    window.history.back()
  }

  builtInActions.goto = async (
    action: GotoURL | GotoObject,
    options,
    { noodl },
  ) => {
    log.func('goto')
    log.red('', _.assign({ action }, options))
    // URL
    if (_.isString(action)) {
      var pre = page.pageUrl.startsWith('index.html?') ? '' : 'index.html?'
      page.pageUrl += pre
      var parse = page.pageUrl.endsWith('?') ? '' : '-'
      if (action !== noodl.cadlEndpoint.startPage) {
        var check1 = '?' + action
        var check2 = '-' + action
        var check1Idx = page.pageUrl.indexOf(check1)
        var check2Idx = page.pageUrl.indexOf(check2)
        if (check1Idx !== -1) {
          page.pageUrl = page.pageUrl.substring(0, check1Idx + 1)
          parse = page.pageUrl.endsWith('?') ? '' : '-'
          page.pageUrl += parse
          page.pageUrl += action
        } else if (check2Idx !== -1) {
          page.pageUrl = page.pageUrl.substring(0, check2Idx)
          parse = page.pageUrl.endsWith('?') ? '' : '-'
          page.pageUrl += parse
          page.pageUrl += action
        } else {
          page.pageUrl += parse
          page.pageUrl += action
        }
      } else {
        page.pageUrl = 'index.html?'
      }

      await page.requestPageChange(action)
    } else if (_.isPlainObject(action)) {
      if (action.destination) {
        var pre = page.pageUrl.startsWith('index.html?') ? '' : 'index.html?'
        page.pageUrl += pre
        var parse = page.pageUrl.endsWith('?') ? '' : '-'
        if (action.destination !== noodl.cadlEndpoint.startPage) {
          var check1 = '?' + action.destination
          var check2 = '-' + action.destination
          var check1Idx = page.pageUrl.indexOf(check1)
          var check2Idx = page.pageUrl.indexOf(check2)
          if (check1Idx !== -1) {
            page.pageUrl = page.pageUrl.substring(0, check1Idx + 1)
            parse = page.pageUrl.endsWith('?') ? '' : '-'
            page.pageUrl += parse
            page.pageUrl += action.destination
          } else if (check2Idx !== -1) {
            page.pageUrl = page.pageUrl.substring(0, check2Idx)
            parse = page.pageUrl.endsWith('?') ? '' : '-'
            page.pageUrl += parse
            page.pageUrl += action.destination
          } else {
            page.pageUrl += parse
            page.pageUrl += action.destination
          }
        } else {
          page.pageUrl = 'index.html?'
        }

        await page.requestPageChange(action.destination)
      } else {
        log.func('goto')
        log.red(
          'Tried to go to a page but could not find information on the whereabouts',
          _.assign({ action }, options),
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
    // Validate the syntax of their password first
    const errMsg = validate.password(password)
    if (errMsg) {
      window.alert(errMsg)
      return 'abort'
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

  builtInActions.redraw = async (action: EmitAction, options) => {
    log.func('redraw')
    log.red('', { action, options })

    const { default: noodluidom } = await import('../app/noodl-ui-dom')
    const { default: noodlui } = await import('../app/noodl-ui')

    const viewTag = action?.original?.viewTag || ''

    let components =
      (viewTag &&
        findParent(options.component, (p) => p?.get?.('viewTag') === viewTag)
          ?.parent?.()
          ?.children?.()
          ?.filter?.((c) => c?.get?.('viewTag') === viewTag)) ||
      []

    const { component } = options

    if (
      viewTag &&
      component.get('viewTag') === viewTag &&
      !components.includes(component)
    ) {
      components.push(component)
    }

    if (component?.id in window.ac) delete window.ac[component?.id]

    const redraw = (node: HTMLElement, child: Component, dataObject?: any) => {
      log.grey(`Found dataObject for ${child?.noodlType}`, dataObject)
      return noodluidom.redraw(node, child, {
        dataObject,
        resolver: (c: any) => {
          if (c && c?.id in window.ac) delete window.ac[c.id]
          return noodlui.resolveComponents(c)
        },
        viewTag,
      })
    }

    let startCount = 0

    while (startCount < components.length) {
      const viewTagComponent = components[startCount]
      const node = document.getElementById(viewTagComponent.id)
      log.grey(
        '[Redrawing] ' + node
          ? `Found node for viewTag component`
          : `Could not find a node associated with the viewTag component`,
        { node, component: viewTagComponent },
      )
      const dataObject = findListDataObject(viewTagComponent)
      const [newNode, newComponent] = redraw(
        node as HTMLElement,
        viewTagComponent,
        dataObject,
      )
      log.grey('Resolved redrawed component/node', {
        newNode,
        newComponent,
        dataObject,
      })
      window[`r${startCount}`] = {
        n: newNode,
        c: newComponent,
        d: dataObject,
        origNode: node,
        origComponent: viewTagComponent,
        index: startCount,
      }
      startCount++
    }
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
            _.set(draft, path, false)
            log.grey(`Toggled video OFF for LocalParticipant`, localParticipant)
          } else {
            videoTrack.enable()
            _.set(draft, path, true)
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
            _.set(draft, path, false)
            log.grey(`Toggled audio OFF for LocalParticipant`, localParticipant)
          } else {
            log.grey(`Toggled audio ON for LocalParticipant`, localParticipant)
            audioTrack.enable()
            _.set(draft, path, true)
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

    if (dataKey.startsWith(iteratorVar)) {
      let parts = dataKey.split('.').slice(1)
      dataObject = findListDataObject(component)
      previousDataValue = _.get(dataObject, parts)
      // previousDataValueInSdk = _.get(noodl.root[context.page])
      dataValue = previousDataValue
      if (isNOODLBoolean(dataValue)) {
        // true -> false / false -> true
        nextDataValue = !isBooleanTrue(dataValue)
      } else {
        // Set to true if am item exists
        nextDataValue = !dataValue
      }
      _.set(dataObject, parts, nextDataValue)
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
            _.set(draft, updateDraft.path, nextValue)
          })
        }
        // Propagate the changes to to UI if there is a path "if" object that
        // references the value as well
        if (node && _.isObjectLike(path)) {
          let valEvaluating = path.if?.[0]
          // If the dataKey is the same as the the value we are evaluating we can
          // just re-use the nextDataValue
          if (valEvaluating === dataKey) {
            valEvaluating = nextValue
          } else {
            valEvaluating =
              _.get(noodl.root, valEvaluating) ||
              _.get(noodl.root[page || ''], valEvaluating)
          }
          newSrc = noodlui.createSrc(
            valEvaluating ? path.if?.[1] : path.if?.[2],
            component,
          )
          node.setAttribute('src', newSrc)
        }
        return nextValue
      }

      dataObject = noodl.root

      if (_.has(noodl.root, dataKey)) {
        dataObject = noodl.root
        previousDataValue = _.get(dataObject, dataKey)
        onNextValue(previousDataValue, { updateDraft: { path: dataKey } })
      } else if (_.has(noodl.root[page], dataKey)) {
        dataObject = noodl.root[page]
        previousDataValue = _.get(dataObject, dataKey)
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
