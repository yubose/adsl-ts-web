import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import NOODLUIDOM from 'noodl-ui-dom'
import Logger from 'logsnap'
import { current, Draft } from 'immer'
import { Action, ActionChain, NOODL as NOODLUI } from 'noodl-ui'
import {
  LocalAudioTrackPublication,
  LocalVideoTrackPublication,
  RemoteParticipant,
} from 'twilio-video'
import Stream from '../meeting/Stream'
import { forEachParticipant } from '../utils/twilio'
import { isMobile } from '../utils/common'
import { IMeeting } from '../meeting'
import { PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT, noodlEvent } from '../constants'

const log = Logger.create('builtIns.ts')

const createMeetingHandlers = function _createMeetingHandlers({
  Meeting,
  noodl,
  noodlui,
  noodluidom,
}: {
  Meeting: IMeeting
  noodl: any
  noodlui: NOODLUI
  noodluidom: NOODLUIDOM
}) {
  function _getDisconnectFns(room: IMeeting['room']) {
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

  function _attachDebugUtilsToWindow(room: IMeeting['room']) {
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
            const execute = noodlui.createActionChainHandler(
              [
                {
                  actionType: 'builtIn',
                  funcName: 'hide',
                  viewTag: 'waitForOtherTag',
                },
              ],
              { trigger: 'onChange' },
            ) as ActionChain
            execute()
          }
          const duplicatedParticipant = {
            ...(participant || room.localParticipant),
          }
          duplicatedParticipants.push(duplicatedParticipant)
          Meeting.addRemoteParticipant(duplicatedParticipant as any, {
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
      Meeting.removeRemoteParticipant(participant as RemoteParticipant)
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

  function onConnected(room: IMeeting['room']) {
    /* -------------------------------------------------------
      ---- LISTEN FOR INCOMING MEDIA PUBLISH/SUBSCRIBE EVENTS
    -------------------------------------------------------- */
    const { disconnect, disconnected } = _getDisconnectFns(room)
    room.on(
      'participantConnected',
      _attachDebugUtilsToWindow(room).participantConnected,
    )
    room.on('participantConnected', Meeting.addRemoteParticipant)
    room.on('participantDisconnected', Meeting.removeRemoteParticipant)
    room.once('disconnected', disconnected)
    // window.addEventListener('beforeunload', disconnect)
    // isMobile() && addEventListener('pagehide', disconnect)
    /* -------------------------------------------------------
      ---- INITIATING MEDIA TRACKS / STREAMS 
    -------------------------------------------------------- */
    const { localParticipant } = room
    const selfStream = Meeting.getStreams().getSelfStream()
    if (!selfStream.isSameParticipant(localParticipant)) {
      selfStream.setParticipant(localParticipant)
      if (selfStream.isSameParticipant(localParticipant)) {
        log.func('onConnected')
        log.grey(`Bound local participant to selfStream`, selfStream)
      }
    }
    forEachParticipant(room.participants, Meeting.addRemoteParticipant)
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
    const participants = get(noodl.root, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT)
    const isInSdk = participants?.some(function _isInSdk(p: RemoteParticipant) {
      return p.sid === participant.sid
    })
    if (!isInSdk) {
      /**
       * Updates the participants list in the sdk. This will also force the value
       * to be an array if it's not already an array
       * @param { RemoteParticipant } participant
       */
      noodl.editDraft(function editDraft(draft: Draft<typeof noodl.root>) {
        const participants = Meeting.removeFalseyParticipants(
          draft?.VideoChat?.listData?.participants || [],
        ).concat(participant)
        if (!has(draft, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT)) {
          log.func('editDraft')
          log.red(
            'Could not find a path to remote participants in the VideoChat page! Path: ' +
              PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
            current(draft),
          )
        }
        set(draft, PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT, participants)
      })
    }

    const waitingElem = Meeting.getWaitingMessageElement()
    waitingElem && (waitingElem.style.visibility = 'hidden')

    noodlui.emit('register', {
      id: noodlEvent.TWILIO_ON_PEOPLE_JOIN,
      key: noodlEvent.TWILIO_ON_PEOPLE_JOIN,
      prop: 'onEvent',
      participant,
      stream,
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
    noodl.editDraft(function editDraft(draft: Draft<typeof noodl.root>) {
      set(
        draft,
        PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
        Meeting.removeFalseyParticipants(
          draft?.VideoChat?.listData?.participants ||
            [].filter((p) => p !== participant),
        ),
      )
    })
    if (!Meeting.room.participants.size) {
      let waitingElem = Meeting.getWaitingMessageElement()
      waitingElem && (waitingElem.style.visibility = 'visible')
      noodlui.emit('register', {
        id: noodlEvent.TWILIO_ON_NO_PARTICIPANT,
        key: noodlEvent.TWILIO_ON_NO_PARTICIPANT,
        prop: 'onEvent',
        data: { room: Meeting.room },
      })
    }
  }

  Meeting.onConnected = onConnected
  Meeting.onAddRemoteParticipant = onAddRemoteParticipant
  Meeting.onRemoveRemoteParticipant = onRemoveRemoteParticipant

  return {
    onConnected,
    onAddRemoteParticipant,
    onRemoveRemoteParticipant,
  }
}

export default createMeetingHandlers
