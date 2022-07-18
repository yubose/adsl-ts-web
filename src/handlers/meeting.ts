import * as u from '@jsmanifest/utils'
import has from 'lodash/has'
import Logger from 'logsnap'
import { isComponent } from 'noodl-ui'
import type { NuiComponent } from 'noodl-ui'
import Stream from '../meeting/Stream'
import { isMobile } from '../utils/common'
import { PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT } from '../constants'
import { Meeting } from '../app/types'
import {
  RemoteParticipant,
  LocalAudioTrackPublication,
  LocalVideoTrackPublication,
} from '../app/types'
import { isVisible, parseCssText, toast } from '../utils/dom'
import is from '../utils/is'
import App from '../App'
import { LocalParticipant } from 'twilio-video'

const log = Logger.create('meeting(handlers).ts')

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
      log.func('onConnectionChange')
      log.grey(`${event} "${participant.sid}",participant`)
      if (event === 'participantConnected') {
        app.meeting.room.state === 'connected' && app.register.extendVideoFunction('twilioOnPeopleJoin')
        toast(`A participant connected`, { type: 'default' })
      } else if (event === 'participantDisconnected') {
        const participantsNumber = app.meeting.room.participants.size
        if(
          participantsNumber == 0 &&
          app.meeting.room.state === 'connected'
          ){
          app.register.extendVideoFunction('onDisconnect')
        }
        toast(`A participant disconnected`, { type: 'error' })
      } else if (event === 'participantReconnecting') {
        toast(`A participant is reconnecting`, { type: 'default' })
      } else if (event === 'participantReconnected') {
        app.meeting.room.state === 'connected' && app.register.extendVideoFunction('twilioOnPeopleJoin')
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

  async function onConnected(room: Meeting['room']) {
    room.on('participantConnected', onRoomEvent.participantConnected)
    room.on('participantDisconnected', onRoomEvent.participantDisconnected)
    room.on('participantReconnecting', onRoomEvent.participantReconnecting)
    room.on('participantReconnected', onRoomEvent.participantReconnected)
    room.once('disconnected', () => {
      function disconnect() {
        room?.disconnect?.()
        app.meeting.calledOnConnected = false
      }
      function unpublishTracks(
        publication: LocalVideoTrackPublication | LocalAudioTrackPublication,
      ) {
        publication?.track?.stop?.()
        publication?.unpublish?.()
      }
      room.localParticipant.videoTracks.forEach(unpublishTracks)
      room.localParticipant.audioTracks.forEach(unpublishTracks)
      removeEventListener('beforeunload', disconnect)
      if (isMobile()) removeEventListener('pagehide', disconnect)
      room.removeAllListeners('participantConnected')
      room.removeAllListeners('participantDisconnected')
      room.removeAllListeners('participantReconnecting')
      room.removeAllListeners('participantReconnected')
    })
    /* -------------------------------------------------------
      ---- INITIATING REMOTE PARTICIPANT TRACKS / LOCAL selfStream
    -------------------------------------------------------- */
    if (!app.selfStream.isParticipant(room.localParticipant)) {
      app.selfStream.setParticipant(room.localParticipant)
      if (app.selfStream.getElement()) {
        app.selfStream.getElement().style.zIndex = '1000'
      }
      log.func('onConnected')
      log.grey(`Bound local participant to selfStream`, app.selfStream)
    }
    for (const participant of room.participants.values()) {
      await app.meeting.addRemoteParticipant(participant)
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
    log.func('onAddRemoteParticipant')
    log.grey(`Bound remote participant to ${stream.type}`, {
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
      if (!has(app.root, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT)) {
        log.red(
          'Could not find a path to remote participants in the VideoChat page! Path: ' +
            PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
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
      app.nui.emit({
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
      log.red(`The "component" is not a Component!`, component)
      return component
    }

    if (is.isGlobalStreamComponent(component)) {
      log.func('createElementBinding')

      const selfStream = app.meeting.streams?.selfStream
      // Nodes in this stream will be inserted from the Stream instance
      // These are considered "new" and will be used to replace the current stream nodes later
      const streamNodes = [] as HTMLElement[]

      // This new node will be used in noodl-ui-dom when returned from this function
      let node = document.createElement('div')
      let viewTag = component.blueprint?.viewTag || ''

      if (viewTag === 'selfStream') {
        log.grey(`Entered element binding resolver for selfStream`, {
          component,
          selfStream: selfStream.snapshot(),
        })

        if (app.mainPage.page === 'VideoChat') {
          // If the selfStream already has an element, re-use it and reload the
          // media tracks on it
          if (selfStream.hasElement()) {
            node = selfStream.getElement() as HTMLDivElement
            if (
              !selfStream.hasAudioElement() &&
              !selfStream.hasVideoElement()
            ) {
              selfStream.reloadTracks()
            }
          } else {
            log.grey(
              `The selfStream instance does not have any DOM elements. Will ` +
                `assume the "join" function will load the tracks`,
            )
          }
        } else {
          // TODO - Implement remote participant stream
        }
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
          log.func(`onMutation`)
          log.grey(`Mutation change`, mutations)

          const prevStyle = parseCssText(mutations[0]?.oldValue || '')
          const newStyle = parseCssText(
            (mutations[0].target as HTMLDivElement)?.style?.cssText || '',
          )

          if (isVisible(node)) {
            if (selfStream.hasElement()) {
              const childNodes = selfStream.getElement()?.childNodes as
                | NodeListOf<HTMLElement>
                | undefined

              if (childNodes) {
                for (const elem of childNodes) {
                  !streamNodes.includes(elem) && streamNodes.push(elem)
                }
              }
            }

            streamNodes.forEach((elem) => {
              const type = elem?.tagName?.toLowerCase?.() || ''
              if (/audio|video/.test(type)) {
                const el = node.querySelector(type)
                if (el) {
                  log.green(
                    `Replacing the existing ${type} element with the one in the loop`,
                    node.replaceChild(elem, el),
                  )
                }
              }
            })

            const isBindings = [isAudioStreamBinding, isVideoStreamBinding]

            for (let index = 0; index < isBindings.length; index++) {
              const currentPage = app.currentPage
              const isBinding = isBindings[index]
              const type = index ? 'video' : 'audio'
              const typeLabel = type[0].toUpperCase() + type.slice(1)
              const streamLabel = `${type}Stream`
              const streamParticipant = selfStream?.getParticipant?.()

              const localParticipant = app.meeting.localParticipant
              const remoteParticipants = app.meeting.room.participants

              const isStreamingLocalParticipant =
                streamParticipant === localParticipant ||
                streamParticipant?.sid === localParticipant?.sid

              if (currentPage === 'VideoChat') {
                // Restore the self stream back to the local participant
                if (!isStreamingLocalParticipant) {
                  // debugger
                  if (selfStream.hasParticipant()) {
                    app.meeting.swapParticipantStream(
                      app.selfStream,
                      app.mainStream,
                      localParticipant,
                      app.mainStream.getParticipant() as LocalParticipant,
                    )
                  }
                }
              } else if (remoteParticipants.size) {
                // Change the stream to a remote participant so the local participant is watching them while away from the VideoChat page
                if (isStreamingLocalParticipant) {
                  if (app.mainStream.hasParticipant()) {
                    app.meeting.swapParticipantStream(
                      app.mainStream,
                      app.selfStream,
                      app.mainStream.getParticipant() as RemoteParticipant,
                      localParticipant,
                    )
                  } else {
                    // Check subStreams
                  }
                }
              } else {
                // Keep local participant on self stream
              }

              if (is.isBoolean(isBinding)) {
                let previousSnapshot = selfStream.snapshot()
                let el = selfStream?.[`get${typeLabel}Element`]?.() as
                  | HTMLVideoElement
                  | HTMLAudioElement
                  | null
              
                if (is.isBooleanTrue(isBinding)) {
                  const el = app.meeting.mainStream.getElement()
                  el.style.width = "100%"
                  el.style.height = "100%"
                  log.grey(
                    `${streamLabel} is set to true. ` +
                      `Proceeding to turn on ${type} streaming now...`,
                  )
                  
                  if (el) {
                    log.grey(
                      `${streamLabel} element exists. Checking if it is paused...`,
                    )
                    if (el.paused) {
                      log.grey(`${streamLabel} was paused. Playing now...`)
                      el.play()
                    } else {
                      log.grey(
                        `${streamLabel} is not paused and is currently playing`,
                      )
                    }
                    if (node.querySelector(type)) {
                      log.grey(
                        `There is already an ${type} element in children. Replacing it with the selfStream one...`,
                      )
                      node.replaceChild(
                        el,
                        node.querySelector(type) as
                          | HTMLAudioElement
                          | HTMLVideoElement,
                      )
                    } else {
                      node.appendChild(el)
                    }
                  } else {
                    log.grey(
                      `${streamLabel} element does not exist on selfStream. Checking the current node now..`,
                    )
                    if (node.querySelector(type)) {
                      log.grey(
                        `${streamLabel} element already exists in the node`,
                        node,
                      )
                    } else {
                      log.grey(`TODO - Create + start ${type} stream`, {
                        previousSnapshot,
                      })
                    }
                  }
                } else {
                  log.grey(
                    `${streamLabel} is set to false. Checking the node for an ${type} element...`,
                    previousSnapshot,
                  )
                  const el = node.querySelector(type)
                  if (el) {
                    log.grey(`Found an ${type} element. Removing it now...`)
                    try {
                      node.removeChild(el)
                      el.remove()
                    } catch (error) {
                      const err =
                        error instanceof Error
                          ? error
                          : new Error(String(error))
                      console.error(err)
                    }
                  } else {
                    log.grey(
                      `Did not to clean up any ${type} element because it is already removd`,
                    )
                  }
                }
              }
            }
          } else if (node) {
            log.grey(
              `Element is hidden. Checking and removing audio or video elements if present...`,
            )
            for (const type of ['audio', 'video']) {
              const el = node.querySelector(type)
              if (el) {
                log.grey(`Removing ${type} element`)
                try {
                  node.removeChild(el)
                  el.remove()
                } catch (error) {
                  console.error(
                    error instanceof Error ? error : new Error(String(error)),
                  )
                }
              } else {
                log.grey(
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
