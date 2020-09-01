import _ from 'lodash'
import { getByDataUX, Viewport } from 'noodl-ui'
import { AppStore } from 'app/types'
import * as T from 'app/types/meeting'
import { forEachParticipant, forEachParticipantTrack } from 'utils/twilio'
import Page from '../Page'
import makeDominantSpeaker, {
  AppDominantSpeaker,
  DominantSpeaker,
} from './makeDominantSpeaker'
import makeLocalTracks, { AppLocalTracks } from './makeLocalTracks'
import makeParticipants, { AppParticipants } from './makeParticipants'
import makeRoom, { AppRoom } from './makeRoom'
import { LocalParticipant, Room } from 'twilio-video'
// import makePublications from './makePublications'
// import makeTrack from './makeTrack'

export interface MakeMeetingOptions {
  store: AppStore
  page: Page
  viewport: Viewport
}

class Meeting {
  #isRoomEnvironment: boolean = false
  #store: AppStore
  #page: Page
  #viewport: Viewport
  #room: AppRoom
  #dominantSpeaker: AppDominantSpeaker
  #localTracks: AppLocalTracks
  #participants: AppParticipants
  room: Room

  constructor({ store, page, viewport }: MakeMeetingOptions) {
    this.#store = store
    this.#page = page
    this.#viewport = viewport
    this.#room = makeRoom({ page, viewport })
    this.#localTracks = makeLocalTracks({ room, viewport })
    this.#participants = makeParticipants({ room })
    this.#dominantSpeaker = makeDominantSpeaker({ room })
    this.room = this.#room.get('room') as Room
  }

  /**
   * Joins and returns the room using the token
   * @param { string } token - Room token
   */
  async joinRoom(token: string) {
    const room = await this.#room.connect(token)
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
    publication.on('subscribed', _.partialRight(this.attachTrack, participant))
    publication.on(
      'unsubscribed',
      _.partialRight(this.detachTrack, participant),
    )
  }
  attachTrack(
    track: T.RoomParticipantTrackPublication,
    participant: T.RoomParticipant,
  ) {
    const dominantSpeaker = this.#dominantSpeaker.get()

    if (this.isLocalParticipant(participant)) {
      // TODO: attach to selfStream element
      const selfStreamElem = this.getSelfStreamElement()
    } else {
      // TODO: attach to subStream elements
      //
    }
  }
  detachTrack(
    track: T.RoomParticipantTrackPublication,
    participant: T.RoomParticipant,
  ) {
    const dominantSpeaker = this.#dominantSpeaker.get()

    if (this.isLocalParticipant(participant)) {
      // TODO: detach from selfStream element
      const selfStreamElem = this.getSelfStreamElement()
    } else {
      // TODO: detach from subStream elements
      //
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
