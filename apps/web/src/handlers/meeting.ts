/* eslint-disable @typescript-eslint/no-unused-vars */
import * as u from '@jsmanifest/utils'
import has from 'lodash/has'
import log from '../log'
import { findByUX, isComponent } from 'noodl-ui'
import type { NuiComponent } from 'noodl-ui'
import Stream from '../meeting/Stream'
import { Meeting, MeetingPages } from '../app/types'
import { RemoteParticipant } from '../app/types'
import { isVisible, parseCssText, toast } from '../utils/dom'
import is from '../utils/is'
import App from '../App'
import { get, set } from 'lodash'

type RemoteParticipantConnectionChangeEvent =
  | 'participantConnected'
  | 'participantDisconnected'
  | 'participantReconnecting'
  | 'participantReconnected'

const createMeetingHandlers = function _createMeetingHandlers(app: App) {
  function _attachOnRemoteParticipantConnectionChangeAlerter(
    event: RemoteParticipantConnectionChangeEvent,
  ) {
    function onConnectionChange(participant: RemoteParticipant) {
      log.debug(`${event} "${participant.sid}",participant`)
      if (event === 'participantConnected') {
        app.meeting.room.state === 'connected' &&
          app.register.extendVideoFunction('twilioOnPeopleJoin')
        // app.meeting.getMainStreamElement()
        toast(`A participant connected`, { type: 'default' })
      } else if (event === 'participantDisconnected') {
        const participantsNumber = app.meeting.room.participants.size
        if (participantsNumber == 0 && app.meeting.room.state === 'connected') {
          app.register.extendVideoFunction('onDisconnect')
        }
        // toast(`A participant disconnected`, { type: 'error' })
        const videoNode = app.meeting.mainStream.getVideoElement()
        videoNode && (videoNode.style.display = 'none')
      } else if (event === 'participantReconnecting') {
        toast(`A participant is reconnecting`, { type: 'default' })
      } else if (event === 'participantReconnected') {
        // app.meeting.room.state === 'connected' && app.register.extendVideoFunction('twilioOnPeopleJoin')
        toast(`A participant reconnected`, { type: 'success' })
      }
    }
    return onConnectionChange
  }

  const onRoomEvent = {
    participantConnected: u.callAll(
      _attachOnRemoteParticipantConnectionChangeAlerter('participantConnected'),
      app.meeting.addRemoteParticipant,
    ),
    participantDisconnected: u.callAll(
      _attachOnRemoteParticipantConnectionChangeAlerter(
        'participantDisconnected',
      ),
      app.meeting.removeRemoteParticipant,
    ),
    participantReconnecting: _attachOnRemoteParticipantConnectionChangeAlerter(
      'participantReconnecting',
    ),
    participantReconnected: _attachOnRemoteParticipantConnectionChangeAlerter(
      'participantReconnected',
    ),
  } as const

  async function onConnected(room: Meeting['room'], type?: string) {
    const page = app.initPage ? app.initPage : 'VideoChat'

    room.on('user-updated', (payload) => {
      console.log('user-updated', payload)
      // user updated, like unmuting and muting
    })

    room.on('user-removed', (payload) => {
      console.log('user-removed', payload)
      // user left
    })

    room.on('connection-change', (payload) => {
      // session ended by host
      console.log('connection-change', payload)
    })
    room.on('peer-video-state-change', async (payload) => {
      // const page = app.initPage ? app.initPage : 'VideoChat'
    })

    room.on('video-active-change', async (payload) => {
      console.log('video-active-change', payload)
      await app.mainStream.toggleRemoteCamera(payload)
    })

    room.on('device-change', (payload) => {
      console.log('device-change', payload)
    })

    /* -------------------------------------------------------
      ---- INITIATING REMOTE PARTICIPANT TRACKS / LOCAL selfStream
    -------------------------------------------------------- */
    const zoomSession = room.stream
    const selfUser = room.getCurrentUserInfo()

    const mainStreamEl = app.mainStream.getElement()
    const mask = app.mainStream.getMaskElement()
    const users = room.getAllUser()
    for (const user of users) {
      if (user.userId !== selfUser.userId && user.bVideoOn) {
        const canvas = app.mainStream.getVideoElement()
        app.mainStream.setParticipant(room.getUser(user.userId))
        // await zoomSession.startVideo({ videoElement: canvas })
        if (canvas?.id?.indexOf('ZOOM') === -1) {
          await zoomSession.renderVideo(
            canvas,
            user.userId,
            parseInt(mainStreamEl.style.width),
            parseInt(mainStreamEl.style.height),
            0,
            0,
            3,
          )
        }
        mask && (mask.style.display = 'none')
      }
    }

    // const mask = app.selfStream.getMaskElement()
    // mask && (mask.style.visibility = 'hidden')
    // self video started and rendered
  }

  /**
   * Callback invoked when a new participant was added either as a mainStream
   * or into the subStreams collection
   * @param { RemoteParticipant } participant
   * @param { Stream } stream - mainStream or a subStream
   */
  function onAddRemoteParticipant(
    participant: RemoteParticipant,
    stream: Stream,
  ) {
    log.debug(`Bound remote participant to ${stream.type}`, {
      participant,
      stream,
    })
    const isInSdk = app
      .getSdkParticipants()
      ?.some((p) => p.sid === participant.sid)
    if (!isInSdk) {
      app.setSdkParticipants(
        app.meeting.removeFalseParticipants([
          ...(app.getSdkParticipants() || []),
          participant,
        ]),
      )
      if (!has(app.root, app.getPathToRemoteParticipantsInRoot())) {
        log.error(
          'Could not find a path to remote participants in the VideoChat page! Path: ' +
            app.getPathToRemoteParticipantsInRoot(),
          app.root,
        )
      }
      // app.nui.emit({
      //   type: 'register',
      //   event: 'twilioOnPeopleJoin',
      //   params: { room: app.meeting.room },
      // })
    }
  }

  function onRemoveRemoteParticipant() {
    app.setSdkParticipants(
      app.meeting.removeFalseParticipants(app.getSdkParticipants()),
    )
    if (!app.getRoomParticipants().size || !app.getSdkParticipants()?.length) {
      // app.meeting.showWaitingOthersMessage()
      void app.nui.emit({
        type: 'register',
        event: 'twilioOnNoParticipant',
        params: { room: app.meeting.room },
      })
    }
  }

  /**
   * Binds DOM nodes that are rendering to the global selfStream
   * @param { NuiComponent.Instance } component
   */
  function createElementBinding(component: NuiComponent.Instance) {
    if (!isComponent(component)) {
      log.error(`The "component" is not a Component!`, component)
      return component
    }

    if (is.isGlobalStreamComponent(component)) {
      const selfStream = app.meeting.streams?.selfStream
      // Nodes in this stream will be inserted from the Stream instance
      // These are considered "new" and will be used to replace the current stream nodes later
      const streamNodes = [] as HTMLElement[]

      // This new node will be used in noodl-ui-dom when returned from this function
      let node = document.createElement('div')
      let viewTag = component.blueprint?.viewTag || ''

      if (viewTag === 'selfStream') {
        log.debug(`Entered element binding resolver for selfStream`, {
          component,
          selfStream: selfStream.snapshot(),
        })

        // if (
        //   app.mainPage.page === 'VideoChat' ||
        //   app.mainPage.page === 'MeetingPage'
        // ) {
        //   // If the selfStream already has an element, re-use it and reload the
        //   // media tracks on it
        //   if (selfStream.hasElement()) {
        //     node = selfStream.getElement() as HTMLDivElement
        //     if (
        //       !selfStream.hasAudioElement() &&
        //       !selfStream.hasVideoElement()
        //     ) {
        //       selfStream.reloadTracks()
        //     }
        //   } else {
        //     log.debug(
        //       `The selfStream instance does not have any DOM elements. Will ` +
        //         `assume the "join" function will load the tracks`,
        //     )
        //   }
        // } else {
        //   // TODO - Implement remote participant stream
        // }
      }

      // Substream
      else if (viewTag !== 'selfStream') {
        const isAudioStreamBinding = component.get('audioStream')
        const isVideoStreamBinding = component.get('videoStream')
        const observer = new MutationObserver(onMutation)

        observer.observe(node, {
          attributes: true,
          attributeFilter: ['style'],
          attributeOldValue: true,
        })

        // Currently used for the popUp in the VideoChat page that have global: true
        function onMutation(mutations: Parameters<MutationCallback>[0]) {
          if (node.querySelector('canvas') || node.querySelector('video')) {
            log.debug(`Mutation in current Page`, mutations)
            return
          }
          log.debug(`Mutation change`, mutations)
          const currentPage = app.initPage
          //Jumping to other pages of the meeting is still timed
          const timerNode = findByUX('videoTimer') as HTMLElement
          if (
            timerNode &&
            !(currentPage && ['VideoChat', 'MeetingPage'].includes(currentPage))
          ) {
            let dataKey = timerNode.getAttribute('data-key') || 0
            const Interval = setInterval(() => {
              app.updateRoot((draft) => {
                const seconds = get(draft, dataKey, 0)
                set(draft, dataKey, seconds + 1)
              })
            }, 1000)
            app.ndom.global.intervals.set('VideoChatTimer', Interval)
          } else {
            const interval = app.ndom.global.intervals.get('VideoChatTimer')
            if (interval) {
              clearInterval(interval)
            }
          }

          //determine if drag is available
          if (isAudioStreamBinding || isVideoStreamBinding) {
            let isDragging: boolean = false
            let offset = {
              x: 0,
              y: 0,
            }
            const dragStartEvent = function (event) {
              isDragging = true
              offset.x = event.clientX - node.getBoundingClientRect().left
              offset.y = event.clientY - node.getBoundingClientRect().top
            }
            const dragEndEvent = function (event) {
              isDragging = false
              let newX = event.clientX - offset.x
              let newY = event.clientY - offset.y
              node.style.left = newX + 'px'
              node.style.top = newY + 'px'
            }
            node.setAttribute('draggable', 'true')
            node.addEventListener('dragstart', dragStartEvent)
            node.addEventListener('dragend', dragEndEvent)
            component.addEventListeners({
              event: 'drag',
              callback: () => {
                node.removeEventListener('dragstart', dragStartEvent)
                node.removeEventListener('dragend', dragEndEvent)
              },
            })
          }
          if (isVisible(node)) {
            const userInfo = app.mainStream.getParticipant()
            const mask = node.querySelector('div') as HTMLDivElement
            const videoEl =
              app.meeting.mainStream.getVideoElement() as HTMLCanvasElement
            node.appendChild(videoEl)
            if (userInfo?.bVideoOn) {
              videoEl.style.display = 'block'
              mask.style.display = 'none'
            }
            node.addEventListener('click', async () => {
              app.selfStream.setVideoElement(app.selfStream.getVideoElement())
              app.mainStream.setVideoElement(videoEl)
            })
          } else if (node) {
            log.debug(
              `Element is hidden. Checking and removing audio or video elements if present...`,
            )
            for (const type of ['canvas', 'video']) {
              const el = node.querySelector(type)
              if (el) {
                log.debug(`Removing ${type} element`)
                try {
                  node.removeChild(el)
                  el.remove()
                } catch (error) {
                  log.error(
                    error instanceof Error ? error : new Error(String(error)),
                  )
                }
              } else {
                log.debug(
                  `Did not need to delete any ${type} elements because none were present`,
                )
              }
            }
          }
        }
      }
      return node
    }
  }

  return {
    createElementBinding,
    onConnected,
    onAddRemoteParticipant,
    onRemoveRemoteParticipant,
  }
}

export default createMeetingHandlers
