import _ from 'lodash'
import { getByDataUX, Viewport } from 'noodl-ui'
import { AppStore } from 'app/types'
import * as T from 'app/types/meeting'
import {
  forEachParticipant,
  forEachParticipantTrack,
  isMediaTrack,
} from 'utils/twilio'
import Page from '../Page'
import makeDominantSpeaker, {
  AppDominantSpeaker,
  DominantSpeaker,
} from './makeDominantSpeaker'
import makeLocalTracks, { AppLocalTracks } from './makeLocalTracks'
import makeParticipants, { AppParticipants } from './makeParticipants'
import makeRoom, { AppRoom } from './makeRoom'
import {
  LocalAudioTrack,
  LocalParticipant,
  LocalTrack,
  RemoteTrack,
  Room,
} from 'twilio-video'
// import makePublications from './makePublications'
// import makeTrack from './makeTrack'

export interface MakeMeetingOptions {
  store: AppStore
  page: Page
  viewport: Viewport
}

class Meeting {
  private _isRoomEnvironment: boolean = false
  private _store: AppStore
  private _page: Page
  private _viewport: Viewport
  private _room: AppRoom
  private _dominantSpeaker: AppDominantSpeaker
  private _localTracks: AppLocalTracks
  private _participants: AppParticipants
  room: Room

  constructor({ store, page, viewport }: MakeMeetingOptions) {
    this._store = store
    this._page = page
    this._viewport = viewport
    this._room = makeRoom({ page, viewport })
    this.room = this._room.get('room') as Room
    this._localTracks = makeLocalTracks({ room: this.room, viewport })
    this._participants = makeParticipants({ room: this.room })
    this._dominantSpeaker = makeDominantSpeaker({ room: this.room })
  }

  /**
   * Joins and returns the room using the token
   * @param { string } token - Room token
   */
  async joinRoom(token: string) {
    const room = await this._room.connect(token)
    forEachParticipant(room.participants, this.handleTrackPublish)
  }
  /**
   * Handle tracks published as well as tracks that are going to be published
   * by the participant later
   * @param { LocalParticipant | RemoteParticipant } participant
   */
  handleTrackPublish(participant: T.RoomParticipant) {
    const onTrackPublished = _.partialRight(this.handleTrackAttach, participant)
    forEachParticipantTrack(participant.tracks, onTrackPublished)
    participant.on('trackPublished', onTrackPublished)
  }
  /**
   * Attach the published track to the DOM once it is subscribed
   * @param { RoomParticipantTrackPublication } publication - Track publication
   * @param { RoomParticipant } participant
   */
  handleTrackAttach(
    publication: T.RoomParticipantTrackPublication,
    participant: T.RoomParticipant,
  ) {
    // If the TrackPublication is already subscribed to, then attach the Track to the DOM.
    if (publication.track) {
      this.attachTrack(publication.track, participant)
    }
    // Local participant is subscribed to this remote track
    publication.on('subscribed', _.partialRight(this.attachTrack, participant))
    publication.on(
      'unsubscribed',
      _.partialRight(this.detachTrack, participant),
    )
  }
  attachTrack(track: T.RoomTrack, participant: T.RoomParticipant) {
    if (this.isLocalParticipant(participant)) {
      // TODO: attach to selfStream element
      if (track.kind !== 'data') {
        const selfStreamElem = this.getSelfStreamElement()
        if (selfStreamElem) {
          track.attach(selfStreamElem)
        } else {
          const logMsg = `%c[Meeting.ts][attachTrack] Tried to attach a ${track.kind} track to the selfStream but could not find DOM node`
          console.log(logMsg, `color:_ec0000;font-weight:bold;`, {
            track,
            participant,
          })
        }
      }
    } else {
      //
    }
  }
  detachTrack(track: T.RoomTrack, participant: T.RoomParticipant) {
    if (this.isLocalParticipant(participant)) {
      if (track.kind !== 'data') {
        const selfStreamElem = this.getSelfStreamElement()
        if (selfStreamElem) {
          track.detach(selfStreamElem)
        } else {
          const logMsg = `%c[Meeting.ts][detachTrack] Tried to detach a ${track.kind} track to the selfStream but could not find DOM node`
          console.log(logMsg, `color:_ec0000;font-weight:bold;`, {
            track,
            participant,
          })
        }
      }
    }
  }
  isLocalParticipant(
    participant: T.RoomParticipant,
  ): participant is LocalParticipant {
    return participant === this.room?.localParticipant
  }
  /** Element used for the dominant/main speaker */
  getMainStreamElement(): HTMLDivElement | null {
    return getByDataUX('mainStream') as HTMLDivElement
  }

  /** Element that the local participant uses (self mirror) */
  getSelfStreamElement(): HTMLDivElement | null {
    return getByDataUX('selfStream') as HTMLDivElement
  }

  /** Element that renders a remote participant into the participants list */
  getSubStreamElement(): HTMLDivElement | null {
    return getByDataUX('subStream') as HTMLDivElement
  }

  /** Element that toggles the camera on/off */
  getCameraElement(): HTMLDivElement | null {
    return getByDataUX('camera') as HTMLDivElement
  }

  /** Element that toggles the microphone on/off */
  getMicrophoneElement(): HTMLDivElement | null {
    return getByDataUX('microphone') as HTMLDivElement
  }

  /** Element that completes the meeting when clicked */
  getHangUpElement(): HTMLDivElement | null {
    return getByDataUX('hangUp') as HTMLDivElement
  }

  /** Element to invite other participants into the meeting */
  getInviteOthersElement(): HTMLDivElement | null {
    return getByDataUX('inviteOthers') as HTMLDivElement
  }

  /** Element that renders a list of remote participants on the bottom */
  getParticipantsListElement(): HTMLDivElement | null {
    return getByDataUX('vidoeSubStream') as HTMLDivElement
  }
}

export default Meeting
