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
import { forEachParticipant } from '../utils/twilio'
import { array, isMobile } from '../utils/common'
import { PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT } from '../constants'
import { Meeting } from '../app/types'
import App from '../App'

const log = Logger.create('builtIns.ts')

const createMeetingHandlers = function _createMeetingHandlers(app: App) {
  function _getDisconnectFns(room: Meeting['room']) {
    function _disconnect() {
      room?.disconnect?.()
    }
    return {
      disconnect: _disconnect,
      disconnected() {
        // Unpublish local tracks
        room.localParticipant.videoTracks.forEach(_unpublishTracks)
        room.localParticipant.audioTracks.forEach(_unpublishTracks)
        // Clean up listeners
        removeEventListener('beforeunload', _disconnect)
        if (isMobile()) removeEventListener('pagehide', _disconnect)
      },
    }
  }

  function _unpublishTracks(
    trackPublication: LocalVideoTrackPublication | LocalAudioTrackPublication,
  ) {
    trackPublication?.track?.stop?.()
    trackPublication?.unpublish?.()
  }

  function _attachDebugUtilsToWindow(room: Meeting['room']) {
    const duplicatedParticipants = [] as any[]
    // @ts-expect-error
    window.l = room.localParticipant
    /**
     * Forcefully adds a participant to the screen to test the UI
     * @param { RemoteParticipant | undefined } participant
     */
    // @ts-expect-error
    window.duplicateRemoteParticipant = function duplicateRemoteParticipant(
      participant?: RemoteParticipant,
    ) {
      if (!participant) {
        const participants = Array.from(room?.participants || [])
        if (participants.length) {
          participant = participants[0]?.[1]
        }
      }
      // We spread the participant to duplicate the reference since we have
      // a guard somewhere in the code to detect duplicate references
      if (room) {
        try {
          if (participant || room.localParticipant) {
            const ac = NUI.createActionChain('onChange', [
              {
                actionType: 'builtIn',
                funcName: 'hide',
                viewTag: 'waitForOtherTag',
              },
            ]) as ActionChain
            ac.execute()
          }
          const duplicatedParticipant = {
            ...(participant || room.localParticipant),
          }
          duplicatedParticipants.push(duplicatedParticipant)
          app.meeting.addRemoteParticipant(duplicatedParticipant as any, {
            force: '',
          })
          log.func('duplicateRemoteParticipant')
          log.grey(`Forcefully added remote participant`)
        } catch (error) {}
      }
    }

    // @ts-expect-error
    window.removeDuplicatedRemoteParticipant = function _removeDuplicatedRemoteParticipant(
      participant?: RemoteParticipant,
    ) {
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
    }

    return {
      participantConnected() {
        Array.from(room.participants || {}).forEach?.(
          // @ts-expect-error
          (p, index) => (window[`p${index}`] = p),
        )
      },
    }
  }

  function onConnected(room: Meeting['room']) {
    /* -------------------------------------------------------
      ---- LISTEN FOR INCOMING MEDIA PUBLISH/SUBSCRIBE EVENTS
    -------------------------------------------------------- */
    const { disconnected } = _getDisconnectFns(room)
    room.on(
      'participantConnected',
      _attachDebugUtilsToWindow(room).participantConnected,
    )
    room.on('participantConnected', app.meeting.addRemoteParticipant)
    room.on('participantDisconnected', app.meeting.removeRemoteParticipant)
    room.once('disconnected', disconnected)
    // window.addEventListener('beforeunload', disconnect)
    // isMobile() && addEventListener('pagehide', disconnect)
    /* -------------------------------------------------------
      ---- INITIATING MEDIA TRACKS / STREAMS 
    -------------------------------------------------------- */
    const { localParticipant } = room
    const selfStream = app.meeting.getStreams().getSelfStream()
    if (!selfStream.isSameParticipant(localParticipant)) {
      selfStream.setParticipant(localParticipant)
      if (selfStream.isSameParticipant(localParticipant)) {
        log.func('onConnected')
        log.grey(`Bound local participant to selfStream`, selfStream)
      }
    }
    forEachParticipant(room.participants, app.meeting.addRemoteParticipant)
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
    log.func('Meeting.onAddRemoteParticipant')
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
      app.noodl.editDraft(function editDraft(
        draft: Draft<typeof app.noodl.root>,
      ) {
        const participants = app.meeting
          .removeFalseyParticipants(
            draft?.VideoChat?.listData?.participants || [],
          )
          .concat(participant)
        if (!has(draft, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT)) {
          log.func('editDraft')
          log.red(
            'Could not find a path to remote participants in the VideoChat page! Path: ' +
              PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
            isDraft(draft) ? current(draft) : draft,
          )
        }
        set(draft, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT, participants)
      })
    }

    NUI.emit({
      type: 'register',
      args: {
        name: 'twilioOnPeopleJoin',
        params: { room: app.meeting.room },
      },
    })
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
    app.noodl.editDraft(function editDraft(
      draft: Draft<typeof app.noodl.root>,
    ) {
      set(
        draft,
        PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
        app.meeting.removeFalseyParticipants(
          draft?.VideoChat?.listData?.participants ||
            [].filter((p) => p !== participant),
        ),
      )
    })
    if (!app.meeting.room.participants.size) {
      app.meeting.getWaitingMessageElements().forEach((waitingElem) => {
        waitingElem && (waitingElem.style.visibility = 'visible')
      })

      NUI.emit({
        type: 'register',
        args: {
          name: 'twilioOnNoParticipant',
          params: { room: app.meeting.room },
        },
      })
    }
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
