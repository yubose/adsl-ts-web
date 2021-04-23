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
import App from '../App'

const log = Logger.create('meeting(handlers).ts')

const createMeetingHandlers = function _createMeetingHandlers(app: App) {
  function onConnected(room: Meeting['room']) {
    room.on('participantConnected', app.meeting.addRemoteParticipant)
    room.on('participantDisconnected', app.meeting.removeRemoteParticipant)
    room.once('disconnected', () => {
      const disconnect = () => {
        room?.disconnect?.()
        app.meeting.calledOnConnected = false
      }
      const unpublishTracks = (
        publication: LocalVideoTrackPublication | LocalAudioTrackPublication,
      ) => {
        publication?.track?.stop?.()
        publication?.unpublish?.()
      }
      room.localParticipant.videoTracks.forEach(unpublishTracks)
      room.localParticipant.audioTracks.forEach(unpublishTracks)
      removeEventListener('beforeunload', disconnect)
      if (isMobile()) removeEventListener('pagehide', disconnect)
    })
    /* -------------------------------------------------------
      ---- INITIATING REMOTE PARTICIPANT TRACKS / LOCAL selfStream
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
        args: {
          name: 'twilioOnPeopleJoin',
          params: { room: app.meeting.room },
        },
      })
    }
  }

  function onRemoveRemoteParticipant() {
    app.setSdkParticipants(
      app.meeting.removeFalseParticipants(app.getSdkParticipants()),
    )
    if (!app.getRoomParticipants().size) {
      app.meeting.showWaitingOthersMessage()
      app.nui.emit({
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
