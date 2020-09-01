import { Viewport } from 'noodl-ui'
import { AppStore } from 'app/types'
import Page from '../Page'
import makeDominantSpeaker, { DominantSpeaker } from './makeDominantSpeaker'
import makeLocalTracks from './makeLocalTracks'
import makeParticipants from './makeParticipants'
import makeRoom, { MeetingRoom } from './makeRoom'
import makePublications from './makePublications'
import makeTrack from './makeTrack'

export interface MakeMeetingOptions {
  store: AppStore
  page: Page
  viewport: Viewport
}

const makeMeeting = function ({ store, page, viewport }: MakeMeetingOptions) {
  const _room = makeRoom({ page, viewport })
  const _localTracks = makeLocalTracks({ room, viewport })
  const _participants = makeParticipants({ room })
  const _dominantSpeaker = makeDominantSpeaker({ room })

  const o = {
    
  }

  return o
}

class Meeting {
  public isRoomEnvironment: boolean
  public store: AppStore
  public page: Page
  public viewport: Viewport
  public room: MeetingRoom
  public dominantSpeaker: DominantSpeaker

  constructor({ store, page, viewport }: MakeMeetingOptions) {
    this.store = store
    this.page = page
    this.viewport = viewport
    this.room = makeRoom({ page, viewport })
    this.localTracks = makeLocalTracks({ room, viewport })
    this.participants = makeParticipants({ room })
    this.dominantSpeaker = makeDominantSpeaker({ room })
  }

  async joinRoom(token: string) {
    try {
      const room = 
    } catch (error) {
      console.error(error)
    }
  }
}

export default Meeting
