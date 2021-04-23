import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import Logger from 'logsnap'
import { ActionChain } from 'noodl-action-chain'
import { current, Draft, isDraft } from 'immer'
import { NUI } from 'noodl-ui'
import {
  LocalAudioTrackPublication,
  LocalVideoTrackPublication,
  RemoteParticipant,
} from 'twilio-video'
import Stream from '../meeting/Stream'
import { isMobile } from '../utils/common'
import { PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT } from '../constants'
import { Meeting } from '../app/types'
import App from '../App'

const log = Logger.create('builtIns.ts')

const createMeetingHandlers = function _createMeetingHandlers(app: App) {
  const getRoom = () => app.meeting.room

  const _attachWindowUtils = (function () {
    const duplicatedParticipants = [] as any[]

    Object.defineProperties(window, {
      l: {
        get: () => app.meeting.localParticipant,
      },
      duplicateRemoteParticipant: {
        get: () => (participant?: RemoteParticipant) => {
          if (!participant) {
            const participants = Array.from(
              app.meeting.room?.participants || [],
            )
            participants.length && (participant = participants[0]?.[1])
          }
          // We spread the participant to duplicate the reference since we have
          // a guard somewhere in the code to detect duplicate references
          try {
            if (participant || app.meeting.localParticipant) {
              app.nui
                .createActionChain('onChange', [
                  {
                    actionType: 'builtIn',
                    funcName: 'hide',
                    viewTag: 'waitForOtherTag',
                  },
                ])
                .execute()
            }
            const duplicatedParticipant =
              participant || app.meeting.localParticipant
            duplicatedParticipants.push(duplicatedParticipant)
            app.meeting.addRemoteParticipant(duplicatedParticipant, {
              force: true,
            })
          } catch (error) {}
        },
      },
      removeDuplicatedRemoteParticipant: {
        get: () => (participant?: RemoteParticipant) => {
          if (!participant) {
            if (duplicatedParticipants.length) {
              participant =
                duplicatedParticipants[duplicatedParticipants.length - 1]
            }
          }
          app.meeting.removeRemoteParticipant(participant as RemoteParticipant)
          if (duplicatedParticipants.includes(participant)) {
            duplicatedParticipants.splice(
              duplicatedParticipants.indexOf(participant),
              1,
            )
          }
        },
      },
    })

    /**
     * Forcefully adds a participant to the screen to test the UI
     * @param { RemoteParticipant | undefined } participant
     */

    return {}
  })()

  function _getDisconnectFns(room: Meeting['room']) {
    function _disconnect() {
      room?.disconnect?.()
      app.meeting.calledOnConnected = false
    }
    return {
      disconnect: _disconnect,
      disconnected() {
        // Unpublish local tracks
        room.localParticipant.videoTracks.forEach(_unpublishTracks)
        room.localParticipant.audioTracks.forEach(_unpublishTracks)
        removeEventListener('beforeunload', _disconnect)
        if (isMobile()) removeEventListener('pagehide', _disconnect)
      },
    }
  }

  function _unpublishTracks(
    publication: LocalVideoTrackPublication | LocalAudioTrackPublication,
  ) {
    publication?.track?.stop?.()
    publication?.unpublish?.()
  }

  function onConnected(room: Meeting['room']) {
    /* -------------------------------------------------------
      ---- LISTEN FOR INCOMING MEDIA PUBLISH/SUBSCRIBE EVENTS
    -------------------------------------------------------- */
    const { disconnected } = _getDisconnectFns(room)
    room.on('participantConnected', app.meeting.addRemoteParticipant)
    room.on('participantDisconnected', app.meeting.removeRemoteParticipant)
    room.once('disconnected', disconnected)
    /* -------------------------------------------------------
      ---- INITIATING MEDIA TRACKS / STREAMS 
    -------------------------------------------------------- */
    const selfStream = app.meeting.streams.selfStream
    if (!selfStream.isParticipant(room.localParticipant)) {
      selfStream.setParticipant(room.localParticipant)
      log.func('onConnected')
      log.grey(`Bound local participant to selfStream`, selfStream)
    }
    for (const participant of room.participants.values()) {
      app.meeting.addRemoteParticipant(participant)
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
    const participants = get(
      app.noodl.root,
      PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
    )
    const isInSdk = participants?.some(
      (p: RemoteParticipant) => p.sid === participant.sid,
    )
    if (!isInSdk) {
      /**
       * Updates the participants list in the sdk. This will also force the value
       * to be an array if it's not already an array
       * @param { RemoteParticipant } participant
       */

      app.updateRoot(
        PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
        app.meeting.removeFalseParticipants([
          ...get(app.noodl.root, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT, []),
          participant,
        ]),
        (root) => {
          if (!has(root, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT)) {
            log.red(
              'Could not find a path to remote participants in the VideoChat page! Path: ' +
                PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
              root,
            )
          }
          NUI.emit({
            type: 'register',
            args: {
              name: 'twilioOnPeopleJoin',
              params: { room: app.meeting.room },
            },
          })
        },
      )
    }
  }

  function onRemoveRemoteParticipant(
    participant: RemoteParticipant,
    stream: Stream,
  ) {
    /**
     * Updates the participants list in the sdk. This will also force the value
     * to be an array if it's not already an array
     * @param { RemoteParticipant } participant
     */
    app.updateRoot(
      PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
      app.meeting.removeFalseParticipants(
        get(app.noodl.root, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT),
      ),
      () => {
        if (!app.meeting.room.participants.size) {
          app.meeting.showWaitingOthersMessage()
          NUI.emit({
            type: 'register',
            args: {
              name: 'twilioOnNoParticipant',
              params: { room: app.meeting.room },
            },
          })
        }
      },
    )
  }

  app.meeting.onConnected = onConnected
  app.meeting.onAddRemoteParticipant = onAddRemoteParticipant
  app.meeting.onRemoveRemoteParticipant = onRemoveRemoteParticipant

  return {
    onConnected,
    onAddRemoteParticipant,
    onRemoveRemoteParticipant,
  }
}

export default createMeetingHandlers
