import * as u from '@jsmanifest/utils'
import has from 'lodash/has'
import Logger from 'logsnap'
import {
  LocalAudioTrackPublication,
  LocalVideoTrackPublication,
  RemoteParticipant,
} from 'twilio-video'
import Stream from '../meeting/Stream'
import { isMobile } from '../utils/common'
import { PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT } from '../constants'
import { Meeting } from '../app/types'
import { toast } from '../utils/dom'
import App from '../App'

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
        toast(`A participant connected`, { type: 'default' })
      } else if (event === 'participantDisconnected') {
        toast(`A participant disconnected`, { type: 'error' })
      } else if (event === 'participantReconnecting') {
        toast(`A participant is reconnecting`, { type: 'default' })
      } else if (event === 'participantReconnected') {
        toast(`A participant reconnected`, { type: 'success' })
      }
    }
    return onConnectionChange
  }

  window.spamToasts = () => {
    _attachOnRemoteParticipantConnectionChangeAlerter('participantConnected')({
      sid: 'abc',
    } as any)
    _attachOnRemoteParticipantConnectionChangeAlerter(
      'participantDisconnected',
    )({ sid: 'abc' } as any)
    _attachOnRemoteParticipantConnectionChangeAlerter(
      'participantReconnecting',
    )({ sid: 'abc' } as any)
    _attachOnRemoteParticipantConnectionChangeAlerter('participantReconnected')(
      { sid: 'abc' } as any,
    )
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

  function onConnected(room: Meeting['room']) {
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
      app.selfStream.getElement().style.zIndex = '1000'
      log.func('onConnected')
      log.grey(`Bound local participant to selfStream`, app.selfStream)
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
      app.nui.emit({
        type: 'register',
        event: 'twilioOnPeopleJoin',
        params: { room: app.meeting.room },
      })
    }
  }

  function onRemoveRemoteParticipant() {
    app.setSdkParticipants(
      app.meeting.removeFalseParticipants(app.getSdkParticipants()),
    )
    if (!app.getRoomParticipants().size || !app.getSdkParticipants()?.length) {
      app.meeting.showWaitingOthersMessage()
      app.nui.emit({
        type: 'register',
        event: 'twilioOnNoParticipant',
        params: { room: app.meeting.room },
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
