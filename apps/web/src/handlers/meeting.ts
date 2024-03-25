/* eslint-disable @typescript-eslint/no-unused-vars */
import * as u from '@jsmanifest/utils'
import has from 'lodash/has'
import log from '../log'
import { findByUX, isComponent } from 'noodl-ui'
import type { NuiComponent } from 'noodl-ui'
import Stream from '../meeting/Stream'
import { Meeting, MeetingPages, SelfUserInfo } from '../app/types'
import { isVisible, toast } from '../utils/dom'
import is from '../utils/is'
import App from '../App'
import { get, set } from 'lodash'

type RemoteParticipantConnectionChangeEvent = 'user-added' | 'user-removed'

const createMeetingHandlers = function _createMeetingHandlers(app: App) {
  function _attachOnRemoteParticipantConnectionChangeAlerter(
    event: RemoteParticipantConnectionChangeEvent,
  ) {
    function onConnectionChange(participant: SelfUserInfo) {
      log.debug(`${event} "${participant.userId}",participant`)
      if (event === 'user-added') {
        app.register.extendVideoFunction('twilioOnPeopleJoin')
        toast(`A participant connected`, { type: 'default' })
      } else if (event === 'user-removed') {
        toast(`A participant disconnected`, { type: 'default' })
      }
    }
    return onConnectionChange
  }

  async function onConnected(room: Meeting['room']) {
    // const zoomSession = room.stream
    // const cloudRecording = room.getRecordingClient()
    function userAdded(payload) {
      log.debug('user-added', payload)
      const user = payload[0]
      const commandChannel = room.getCommandClient()
      commandChannel.send(app.root.Global.timer, user.userId)
    }
    function userRemoved(payload) {
      log.debug('user-removed', payload)
      // user left
      const users = room.getAllUser()
      if (users.length === 1) {
        app.register.extendVideoFunction('onDisconnect')
      }
    }
    function userUpdated(payload) {
      log.debug('user-updated', payload)
    }

    function commandChannelMessage(payload) {
      console.log(payload)
      console.log(`Command from ${payload.senderName} is ${payload.text}`)
      app.root.Global.timer = parseInt(payload.text)
    }

    function recordingChange(payload) {
      log.debug('recording-change', payload)
      if (payload.state === 'Stopped') {
        app.register.extendVideoFunction('recordingStopped')
      } else if (payload.state === 'Recording') {
        app.register.extendVideoFunction('recordingStarted')
      }
    }
    function connectionChange(payload) {
      log.debug('connection-change', payload)
      room.off('user-updated', onRoomEvent.userUpdated)
      room.off('user-removed', onRoomEvent.userRemoved)
      room.off('user-added', onRoomEvent.userAdded)
      room.off('peer-video-state-change', onRoomEvent.peerVideoStateChange)
      room.off('connection-change', onRoomEvent.connectionChange)
      room.off('recording-change', onRoomEvent.recordingChange)
      room.off('command-channel-message', onRoomEvent.commandChannelMessage)
    }
    async function peerVideoStateChange(payload) {
      log.debug('peer-video-state-change', payload)
      if (payload.action === 'Start') {
        await app.mainStream.toggleRemoteCamera({
          state: 'Active',
          userId: payload.userId,
        })
      } else if (payload.action === 'Stop') {
        await app.mainStream.toggleRemoteCamera({
          state: 'Inactive',
          userId: payload.userId,
        })
      }
    }

    const onRoomEvent = {
      userAdded: u.callAll(
        _attachOnRemoteParticipantConnectionChangeAlerter('user-added'),
        userAdded,
      ),
      userRemoved: u.callAll(
        _attachOnRemoteParticipantConnectionChangeAlerter('user-removed'),
        userRemoved,
      ),
      userUpdated,
      connectionChange,
      peerVideoStateChange,
      recordingChange,
      commandChannelMessage,
    } as const

    room.off('user-updated', onRoomEvent.userUpdated)
    room.off('user-removed', onRoomEvent.userRemoved)
    room.off('user-added', onRoomEvent.userAdded)
    room.off('peer-video-state-change', onRoomEvent.peerVideoStateChange)
    room.off('connection-change', onRoomEvent.connectionChange)
    room.off('recording-change', onRoomEvent.recordingChange)
    room.off('command-channel-message', onRoomEvent.commandChannelMessage)

    room.on('user-updated', onRoomEvent.userUpdated)
    room.on('user-removed', onRoomEvent.userRemoved)
    room.on('user-added', onRoomEvent.userAdded)
    room.on('peer-video-state-change', onRoomEvent.peerVideoStateChange)
    room.on('connection-change', onRoomEvent.connectionChange)
    room.on('recording-change', onRoomEvent.recordingChange)
    room.on('command-channel-message', onRoomEvent.commandChannelMessage)

    /* -------------------------------------------------------
      ---- INITIATING REMOTE PARTICIPANT TRACKS / LOCAL selfStream
    -------------------------------------------------------- */
    const userList = room.getAllUser()
    if (userList.length <= 1) {
      app.register.extendVideoFunction('twilioOnPeopleShowRoom')
    }
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

      // This new node will be used in noodl-ui-dom when returned from this function
      let node = document.createElement('div')
      let viewTag = component.blueprint?.viewTag ?? ''

      if (viewTag === 'selfStream') {
        log.debug(`Entered element binding resolver for selfStream`, {
          component,
          selfStream: selfStream.snapshot(),
        })
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
            !(currentPage && MeetingPages.includes(currentPage))
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
              app.selfStream.getElement().style.visibility = 'hidden'
            }
            node.addEventListener('click', async () => {
              if (app.selfStream.isRenderSelfViewWithVideoElement) {
                await app.meeting.room.stream.stopRenderVideo(
                  videoEl,
                  app.selfStream.getParticipant()?.userId,
                )
              }
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
