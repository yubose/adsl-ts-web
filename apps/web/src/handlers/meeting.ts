import * as u from '@jsmanifest/utils'
import has from 'lodash/has'
import log from '../log'
import { findByUX, isComponent } from 'noodl-ui'
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
        app.meeting.room.state === 'connected' && app.register.extendVideoFunction('twilioOnPeopleJoin')
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

  async function onConnected(room: Meeting['room']) {
    //Prevents events from being listened to multiple times and causing lag
    room.removeAllListeners('participantConnected')
    room.removeAllListeners('participantDisconnected')
    room.removeAllListeners('participantReconnecting')
    room.removeAllListeners('participantReconnected')
    room.removeAllListeners('disconnected')
    room.removeAllListeners('recordingStarted')
    room.removeAllListeners('recordingStopped')
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
    room.on('recordingStarted',()=>{
      app.register.emit('recordingStarted')
    })

    room.on('recordingStopped',()=>{
      app.register.emit('recordingStopped')
    })

    /* -------------------------------------------------------
      ---- INITIATING REMOTE PARTICIPANT TRACKS / LOCAL selfStream
    -------------------------------------------------------- */
    if (!app.selfStream.isParticipant(room.localParticipant)) {
      app.selfStream.setParticipant(room.localParticipant)
      if (app.selfStream.getElement()) {
        app.selfStream.getElement().style.zIndex = '1000'
      }
      log.debug(`Bound local participant to selfStream`, app.selfStream)
    }
    const remoteParticipants = room?.participants
    if(remoteParticipants.size == 0){
      // twilioOnNoParticipant
    }else{
      // twilioOnPeopleJoin
      app.meeting.calledOnConnected && app.register.extendVideoFunction('twilioOnPeopleJoin')
    }

    if(remoteParticipants && remoteParticipants.size ==0){
      app.meeting.calledOnConnected && app.register.extendVideoFunction('twilioOnPeopleShowRoom')
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
        
        if (app.mainPage.page === 'VideoChat' || app.mainPage.page === 'MeetingPage') {
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
            log.debug(
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
          log.debug(`Mutation change`, mutations)

          const timerNode = findByUX('videoTimer') as HTMLElement
          if(timerNode && mutations.length == 2){
            let dataKey = timerNode.getAttribute('data-key') || 0
            const Interval = setInterval(()=>{
              app.updateRoot((draft) => {
                const seconds = get(draft, dataKey, 0)
                set(draft, dataKey, seconds + 1)
              })

            },1000)
            app.ndom.global.intervals.set('VideoChatTimer',Interval)
          }else{
            const interval =app.ndom.global.intervals.get('VideoChatTimer')
            if(interval){
              clearInterval(interval)
            }
          }

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
                  log.info(
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

              if (currentPage === 'VideoChat' || currentPage === 'MeetingPage') {
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
                  //Prevent duplicate windows
                  const selfStreamEl = app.meeting.selfStream.getElement()
                  selfStreamEl.style.visibility = 'hidden'
                  
                  const el = app.meeting.mainStream.getElement()
                  el.style.width = '100%'
                  el.style.height = '100%'
                  log.debug(
                    `${streamLabel} is set to true. ` +
                      `Proceeding to turn on ${type} streaming now...`,
                  )
                  const elNodes = el.childNodes
                  for(const elem  of elNodes){
                    const type = (elem as HTMLElement)?.tagName?.toLowerCase?.() || ''
                    if(!(/audio|video/.test(type))){
                      el.removeChild(elem)
                    }
                  }
                  

                  if (el) {
                    log.debug(
                      `${streamLabel} element exists. Checking if it is paused...`,
                    )
                    // @ts-expect-error
                    if (el.paused) {
                      log.debug(`${streamLabel} was paused. Playing now...`)
                      // @ts-expect-error
                      el.play()
                    } else {
                      log.debug(
                        `${streamLabel} is not paused and is currently playing`,
                      )
                    }
                    if (node.querySelector(type)) {
                      log.debug(
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
                    log.debug(
                      `${streamLabel} element does not exist on selfStream. Checking the current node now..`,
                    )
                    if (node.querySelector(type)) {
                      log.debug(
                        `${streamLabel} element already exists in the node`,
                        node,
                      )
                    } else {
                      log.debug(`TODO - Create + start ${type} stream`, {
                        previousSnapshot,
                      })
                    }
                  }
                } else {
                  log.debug(
                    `${streamLabel} is set to false. Checking the node for an ${type} element...`,
                    previousSnapshot,
                  )
                  const el = node.querySelector(type)
                  if (el) {
                    log.debug(`Found an ${type} element. Removing it now...`)
                    try {
                      node.removeChild(el)
                      el.remove()
                    } catch (error) {
                      const err =
                        error instanceof Error
                          ? error
                          : new Error(String(error))
                      log.error(err)
                    }
                  } else {
                    log.debug(
                      `Did not to clean up any ${type} element because it is already removd`,
                    )
                  }
                }
              }
            }
          } else if (node) {
            log.debug(
              `Element is hidden. Checking and removing audio or video elements if present...`,
            )
            for (const type of ['audio', 'video']) {
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
