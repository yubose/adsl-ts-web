import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import { Draft, isDraft, original } from 'immer'
import { isAction } from 'noodl-action-chain'
import {
  findListDataObject,
  findIteratorVar,
  getDataValues,
  NUI,
  NUIComponent,
  Store,
  Viewport as VP,
  isListConsumer,
} from 'noodl-ui'
import {
  eventId as ndomEventId,
  findByViewTag,
  findByUX,
  findWindow,
  getByDataUX,
  getFirstByElementId,
  isPageConsumer,
} from 'noodl-ui-dom'
import { BuiltInActionObject, Identify } from 'noodl-types'
import {
  LocalAudioTrack,
  LocalAudioTrackPublication,
  LocalVideoTrack,
  LocalVideoTrackPublication,
  Room,
} from 'twilio-video'
import { parse } from 'noodl-utils'
import Logger from 'logsnap'
import { isVisible, toast, hide, show, scrollToElem } from '../utils/dom'
import App from '../App'
import * as u from '../utils/common'

const log = Logger.create('builtIns.ts')

const createBuiltInActions = function createBuiltInActions(app: App) {
  function _toggleMeetingDevice(kind: 'audio' | 'video') {
    log.func(`(${kind}) toggleDevice`)
    log.grey(`Toggling ${kind}`)
    let devicePath = `VideoChat.${kind === 'audio' ? 'micOn' : 'cameraOn'}`
    let localParticipant = app.meeting.localParticipant
    let localTrack: LocalAudioTrack | LocalVideoTrack | undefined
    if (localParticipant) {
      for (const publication of localParticipant.tracks.values()) {
        if (publication.track.kind === kind) localTrack = publication.track
      }
      app.updateRoot((draft) => {
        if (localTrack) {
          if (localTrack.isEnabled) {
            localTrack.disable()
            set(draft, devicePath, false)
            log.grey(`Toggled ${kind} off`, localParticipant)
          } else {
            localTrack.enable()
            set(draft, devicePath, true)
            log.grey(`Toggled ${kind} on`, localParticipant)
          }
        } else {
          log.red(
            `Tried to toggle ${kind} track on/off for LocalParticipant but a ${kind} ` +
              `track was not available`,
            app.meeting.localParticipant,
          )
        }
      })
    }
  }

  const checkField: Store.BuiltInObject['fn'] = async function onCheckField(
    action,
  ) {
    log.func('checkField')
    log.grey('', action)
    const delay: number | boolean = action.original?.wait || action.wait || 0
    const onCheckField = () => {
      const node = findByUX(
        action.original?.contentType || action?.contentType || '',
      )
      u.array(node).forEach((n) => n && show(n))
    }
    if (delay > 0) setTimeout(() => onCheckField(), delay as any)
    else onCheckField()
  }

  const disconnectMeeting: Store.BuiltInObject['fn'] = async function onDisconnectMeeting(
    action,
  ) {
    log.func('disconnectMeeting')
    log.grey('', { action, room: app.meeting.room })
    app.meeting.leave()
  }

  const goBack: Store.BuiltInObject['fn'] = async function onGoBack(action) {
    log.func('goBack')
    log.grey('', action)
    if (u.isBool(action.original?.reload)) {
      app.mainPage.requesting = app.mainPage
        .getPreviousPage(app.noodl.cadlEndpoint.startPage || '')
        .trim()
      app.mainPage.setModifier(app.mainPage.requesting, {
        reload: action.original?.reload,
      })
    }
    window.history.back()
  }

  const hideAction: Store.BuiltInObject['fn'] = async function onHide(action) {
    log.func('hide')
    log.grey('', action)
    const viewTag = action.original?.viewTag || ''
    const onElem = (node: HTMLElement) => {
      if (VP.isNil(node.style.top, 'px')) {
        node.style.display !== 'none' && (node.style.display = 'none')
      } else {
        node.style.display === 'none' && (node.style.display = 'block')
      }
    }
    const elemCount = hide(findByViewTag(viewTag), onElem)
    !elemCount && log.red(`Cannot find a DOM node for viewTag "${viewTag}"`)
  }

  const showAction: Store.BuiltInObject['fn'] = async function onShow(
    action,
    options,
  ) {
    log.func('show')
    log.grey('', action)

    const viewTag = action.original?.viewTag || ''
    const onElem = (node: HTMLElement) => {
      const component = options.component
      if (component && VP.isNil(node.style.top)) {
        !isVisible(node) && (node.style.visibility = 'visible')
        node.style.display === 'none' && (node.style.display = 'block')
      }
    }
    const elemCount = show(findByViewTag(viewTag), onElem)
    !elemCount && log.red(`Cannot find a DOM node for viewTag "${viewTag}"`)
  }

  const toggleCameraOnOff: Store.BuiltInObject['fn'] = async function onToggleCameraOnOff(
    action,
  ) {
    log.func('toggleCameraOnOff')
    log.green('', action)
    _toggleMeetingDevice('video')
  }

  const toggleMicrophoneOnOff: Store.BuiltInObject['fn'] = async function onToggleMicrophoneOnOff(
    action,
  ) {
    log.func('toggleMicrophoneOnOff')
    log.green('', action)
    _toggleMeetingDevice('audio')
  }

  const toggleFlag: Store.BuiltInObject['fn'] = async function onToggleFlag(
    action,
    options,
  ) {
    log.func('toggleFlag')
    log.grey('', action)
    try {
      const { component, getAssetsUrl } = options
      const { dataKey = '' } = action.original || {}
      const iteratorVar = findIteratorVar(component)
      const node = getFirstByElementId(component)
      const pageName = app.mainPage.page || ''
      let path = component?.get('path')

      let dataValue: any
      let dataObject: any
      let previousDataValue: boolean | undefined
      let nextDataValue: boolean | undefined
      let newSrc = ''

      if (isDraft(path)) path = original(path)

      if (dataKey?.startsWith(iteratorVar)) {
        let parts = dataKey.split('.').slice(1)
        dataObject = findListDataObject(component)
        previousDataValue = get(dataObject, parts)
        dataValue = previousDataValue
        if (Identify.isBoolean(dataValue)) {
          // true -> false / false -> true
          nextDataValue = !Identify.isBooleanTrue(dataValue)
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
          if (Identify.isBoolean(previousValue)) {
            nextValue = !Identify.isBooleanTrue(previousValue)
          }
          nextValue = !previousValue
          if (updateDraft) {
            app.noodl.editDraft((draft: Draft<Record<string, any>>) => {
              set(draft, updateDraft.path, nextValue)
            })
          }
          // Propagate the changes to to UI if there is a path "if" object that
          // references the value as well
          if (node && u.isObj(path)) {
            let valEvaluating = path?.if?.[0]
            // If the dataKey is the same as the the value we are evaluating we can
            // just re-use the nextDataValue
            if (valEvaluating === dataKey) {
              valEvaluating = nextValue
            } else {
              valEvaluating =
                get(app.noodl.root, valEvaluating) ||
                get(app.noodl.root[pageName], valEvaluating)
            }
            node.setAttribute(
              'src',
              getAssetsUrl() + valEvaluating ? path?.if?.[1] : path?.if?.[2],
            )
          }
          return nextValue
        }

        dataObject = app.noodl.root

        if (has(app.noodl.root, dataKey)) {
          dataObject = app.noodl.root
          previousDataValue = get(dataObject, dataKey)
          onNextValue(previousDataValue, { updateDraft: { path: dataKey } })
        } else if (has(app.noodl.root[pageName], dataKey)) {
          dataObject = app.noodl.root[pageName]
          previousDataValue = get(dataObject, dataKey)
          onNextValue(previousDataValue, {
            updateDraft: {
              path: `${dataKey}${pageName ? `.${pageName}` : ''}`,
            },
          })
        } else {
          log.red(
            `${dataKey} is not a path of the data object. ` +
              `Defaulting to attaching ${dataKey} as a path to the root object`,
            { dataObject, dataKey },
          )
          dataObject = app.noodl.root
          previousDataValue = undefined
          nextDataValue = false
          onNextValue(previousDataValue, {
            updateDraft: { path: `${dataKey}.${app.mainPage.page || ''}` },
          })
        }
      }

      if (/mic/i.test(dataKey)) {
        await app.ndom.builtIns
          .get('toggleMicrophoneOnOff')
          ?.find(Boolean)
          ?.fn?.(action, options)
      } else if (/camera/i.test(dataKey)) {
        await app.ndom.builtIns
          .get('toggleCameraOnOff')
          ?.find(Boolean)
          ?.fn?.(action, options)
      }

      log.grey('', {
        component,
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
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const lockApplication: Store.BuiltInObject['fn'] = async function onLockApplication(
    action,
    options,
  ) {
    const result = await _onLockLogout()
    if (result === 'abort') options?.ref?.abort?.()
    await (await import('@aitmed/cadl')).Account.logout(false)
    window.location.reload()
  }

  const logOutOfApplication: Store.BuiltInObject['fn'] = async function onLogOutOfApplication(
    action,
    options,
  ) {
    if ((await _onLockLogout()) === 'abort') options?.ref?.abort?.()
    await (await import('@aitmed/cadl')).Account.logout(true)
    window.location.reload()
  }

  const logout: Store.BuiltInObject['fn'] = async function onLogout(
    action,
    options,
  ) {
    if ((await _onLockLogout()) === 'abort') options?.ref?.abort?.()
    ;(await import('@aitmed/cadl')).Account.logout(true)
    window.location.reload()
  }

  const goto: Store.BuiltInObject['fn'] = async function onGoto(
    action,
    options,
  ) {
    log.func('<builtIn> goto]')
    log.red('', action)

    let destinationParam = ''
    let reload: boolean | undefined
    let pageReload: boolean | undefined // If true, gets passed to sdk initPage to disable the page object's "init" from being run
    let dataIn: any // sdk use

    // "Reload" currently is only known to be used in goto when runnning
    // an action chain and given an object like { destination, reload }
    if (u.isStr(action)) {
      destinationParam = action
    } else if (isAction(action)) {
      const gotoObj = action.original
      if (u.isStr(gotoObj)) {
        destinationParam = gotoObj
      } else if (u.isObj(gotoObj)) {
        if ('goto' in gotoObj) {
          if (u.isObj(gotoObj.goto)) {
            destinationParam = gotoObj.goto.destination
            'reload' in gotoObj.goto && (reload = gotoObj.goto.reload)
            'pageReload' in gotoObj.goto &&
              (pageReload = gotoObj.goto.pageReload)
            'dataIn' in gotoObj.goto && (dataIn = gotoObj.goto.dataIn)
          } else if (u.isStr(gotoObj.goto)) {
            destinationParam = gotoObj.goto
          }
        } else if (u.isObj(gotoObj)) {
          destinationParam = gotoObj.destination
          'reload' in gotoObj && (reload = gotoObj.reload)
          'pageReload' in gotoObj && (pageReload = gotoObj.pageReload)
          'dataIn' in gotoObj && (dataIn = gotoObj.dataIn)
        }
      }
    } else if (u.isObj(action)) {
      if ('destination' in action) {
        destinationParam = action.destination
        'reload' in action && (reload = action.reload)
        'pageReload' in action && (pageReload = action.pageReload)
        'dataIn' in action && (dataIn = action.dataIn)
      }
    }
    if (!u.isUnd(reload)) {
      app.mainPage.setModifier(destinationParam, { reload })
    }
    if (!u.isUnd(pageReload)) {
      app.mainPage.setModifier(destinationParam, { pageReload })
    }
    if (!u.isUnd(dataIn)) {
      app.mainPage.setModifier(destinationParam, { ...dataIn })
    }
    let { destination, id = '', isSamePage, duration } = parse.destination(
      destinationParam,
    )
    if (destination === destinationParam) {
      app.mainPage.requesting = destination
    }

    log.grey(`Goto info`, {
      destination,
      destinationParam,
      duration,
      id,
      isSamePage,
      reload,
      pageReload,
    })

    if (id) {
      const isInsidePageComponent = isPageConsumer(options.component)
      const node = findByViewTag(id) || getFirstByElementId(id)

      if (node) {
        let win: Window | undefined | null
        let doc: Document | null | undefined
        if (document.contains?.(node as HTMLElement)) {
          win = window
          doc = window.document
        } else {
          win = findWindow((w: any) => {
            if (w) {
              if ('contentDocument' in w) {
                doc = (w as any).contentDocument
              } else {
                doc = w.document
              }
              return doc?.contains?.(node as HTMLElement)
            }
            return false
          })
        }
        const scroll = () => {
          if (isInsidePageComponent) {
            scrollToElem(node, { win, doc, duration })
          } else {
            ;(node as HTMLElement).scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center',
            })
          }
        }
        if (isSamePage) {
          scroll()
        } else {
          app.mainPage.once(ndomEventId.page.on.ON_COMPONENTS_RENDERED, scroll)
        }
      } else {
        log.red(`Could not search for a DOM node with an identity of "${id}"`, {
          node,
          id,
          destination,
          isSamePage,
          duration,
          action,
          options,
        })
      }
    }

    if (!destinationParam.startsWith('http')) {
      app.mainPage.pageUrl = u.resolvePageUrl({
        destination,
        pageUrl: app.mainPage.pageUrl,
        startPage: app.noodl.cadlEndpoint.startPage,
      })
    } else {
      destination = destinationParam
    }

    if (!isSamePage) {
      if (reload) {
        let urlToGoToInstead = ''
        const parts = app.mainPage.pageUrl.split('-')
        if (parts.length > 1) {
          if (!parts[0].startsWith('index.html')) {
            parts.unshift('index.html?')
            parts.push(destination)
            urlToGoToInstead = parts.join('-')
          }
        } else {
          urlToGoToInstead = 'index.html?' + destination
        }

        window.location.href = urlToGoToInstead
      } else {
        await app.navigate(destination)
      }

      if (!destination) {
        log.func('builtIn')
        log.red(
          'Tried to go to a page but could not find information on the whereabouts',
          { action, ...options },
        )
      }
    }
  }

  const redraw: Store.BuiltInObject['fn'] = async function onRedraw(
    action,
    options,
  ) {
    log.func('redraw')
    log.red('', { action, options })

    const viewTag = action?.original?.viewTag || ''
    const components = [] as NUIComponent.Instance[]
    const { component } = options

    for (const c of NUI.cache.component.get().values()) {
      c && c.get('viewTag') === viewTag && components.push(c)
    }

    try {
      if (
        viewTag &&
        (component?.get('data-viewtag') === viewTag ||
          component?.get('viewTag') === viewTag) &&
        !components.includes(component as NUIComponent.Instance)
      ) {
        components.push(component as NUIComponent.Instance)
      }

      if (!components.length) {
        log.red(`Could not find any components to redraw`, {
          action,
          ...options,
          component,
        })
      } else {
        log.grey(`Redrawing ${components.length} components`, components)
      }

      let startCount = 0

      while (startCount < components.length) {
        const viewTagComponent = components[startCount]
        const node = getFirstByElementId(viewTagComponent)
        const ctx = {} as any
        if (isListConsumer(viewTagComponent)) {
          const dataObject = findListDataObject(viewTagComponent)
          if (dataObject) ctx.dataObject = dataObject
        }
        const [newNode, newComponent] = app.ndom.redraw(
          node as HTMLElement,
          viewTagComponent,
          app.mainPage,
          { context: ctx },
        )
        NUI.cache.component.add(newComponent)
        startCount++
      }
    } catch (error) {
      console.error(error)
      toast(error.message, { type: 'error' })
      throw error
    }
    log.red(`COMPONENT CACHE SIZE: ${NUI.cache.component.length}`)
  }

  const builtIns = {
    checkField,
    disconnectMeeting,
    goBack,
    hide: hideAction,
    show: showAction,
    toggleCameraOnOff,
    toggleMicrophoneOnOff,
    toggleFlag,
    lockApplication,
    logOutOfApplication,
    logout,
    goto,
    redraw,
  }

  /** Shared common logic for both lock/logout logic */
  async function _onLockLogout() {
    const dataValues = getDataValues() as { password: string }
    const hiddenPwLabel = getByDataUX('passwordHidden') as HTMLDivElement
    const password = dataValues.password || ''
    // Reset the visible status since this is a new attempt
    if (hiddenPwLabel) {
      const isVisible = hiddenPwLabel.style.visibility === 'visible'
      if (isVisible) hiddenPwLabel.style.visibility = 'hidden'
    }
    // Validate if their password is correct or not
    const isValid = (
      await import('@aitmed/cadl')
    ).Account?.verifyUserPassword?.(password)
    if (!isValid) {
      console.log(`%cisValid ?`, 'color:#e74c3c;font-weight:bold;', isValid)
      if (hiddenPwLabel) hiddenPwLabel.style.visibility = 'visible'
      else window.alert('Password is incorrect')
      return 'abort'
    }
    if (hiddenPwLabel) hiddenPwLabel.style.visibility = 'hidden'
  }

  return builtIns as Record<keyof typeof builtIns, Store.BuiltInObject['fn']>
}

/* -------------------------------------------------------
  ---- Built in funcs below are for the SDK
-------------------------------------------------------- */

// This goes on the SDK
export function createVideoChatBuiltIn(app: App) {
  return async function onVideoChat(
    action: BuiltInActionObject & {
      roomId: string
      accessToken: string
    },
  ) {
    log.func('onVideoChat')
    log.grey('', action)
    try {
      if (action) {
        let msg = ''
        if (action.accessToken) msg += 'Received access token '
        if (action.roomId) msg += 'and room id'
        log.grey(msg, action)
      } else {
        log.red(
          'Expected an action object but the value passed in was null or undefined',
          action,
        )
      }

      let newRoom: Room | null = null
      // Disconnect from the room if for some reason we
      // are still connected to one
      // if (room.state === 'connected' || room.state === 'reconnecting') {
      //   room?.disconnect?.()
      //   if (connecting) setConnecting(false)
      // }

      log.func('onVideoChat')
      // Reuse the existing room
      console.log(app.meeting.room)
      if (app.meeting.room?.state === 'connected') {
        newRoom = await app.meeting.rejoin()
        log.green(
          `Reusing existent room that you are already connected to`,
          newRoom,
        )
      } else {
        log.grey(`Connecting to room id: ${action?.roomId}`)
        newRoom = (await app.meeting.join(action.accessToken)) as Room
        newRoom && log.green(`Connected to room: ${newRoom.name}`, newRoom)
      }
      if (newRoom) {
        // TODO - read VideoChat.micOn and VideoChat.cameraOn and use those values
        // to initiate the default values for audio/video default enabled/disabled state
        const { cameraOn, micOn } = app.noodl.root.VideoChat || {}
        const { localParticipant } = newRoom

        const toggle = (state: 'enable' | 'disable') => (
          tracks: Map<
            string,
            LocalVideoTrackPublication | LocalAudioTrackPublication
          >,
        ) => {
          tracks.forEach((publication) => publication?.track?.[state]?.())
        }

        const enable = toggle('enable')
        const disable = toggle('disable')

        if (Identify.isBoolean(cameraOn)) {
          if (Identify.isBooleanTrue(cameraOn)) {
            enable(localParticipant?.videoTracks)
          } else if (Identify.isBooleanFalse(cameraOn)) {
            disable(localParticipant?.videoTracks)
          }
        } else {
          // Automatically disable by default
          disable(localParticipant?.videoTracks)
        }
        if (Identify.isBoolean(micOn)) {
          if (Identify.isBooleanTrue(micOn)) {
            enable(localParticipant?.audioTracks)
          } else if (Identify.isBooleanFalse(micOn)) {
            disable(localParticipant?.audioTracks)
          }
        } else {
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
      toast(error.message, { type: 'error' })
    }
  }
}

export default createBuiltInActions
