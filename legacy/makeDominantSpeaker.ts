import _ from 'lodash'
import { RemoteParticipant, LocalParticipant, Room } from 'twilio-video'

export type AppDominantSpeaker = ReturnType<typeof makeDominantSpeaker>

export type DominantSpeaker = LocalParticipant | RemoteParticipant | null

function makeDominantSpeaker({ room }: { room: Room }) {
  const _state: { dominantSpeaker: DominantSpeaker } = {
    dominantSpeaker: null,
  }

  let _consumerOnChange:
    | ((
        prevDominantSpeaker: DominantSpeaker,
        nextDominantSpeaker: DominantSpeaker,
      ) => void)
    | undefined

  function _set(dominantSpeaker: DominantSpeaker) {
    const prevDominantSpeaker = _state.dominantSpeaker
    _state.dominantSpeaker = dominantSpeaker
    _consumerOnChange?.(prevDominantSpeaker, _state.dominantSpeaker)
  }

  /**
   * Sets the new dominant speaker
   * @param { DominantSpeaker } dominantSpeaker
   */
  function _onChange(dominantSpeaker: DominantSpeaker) {
    console.log(
      `%c[makeDominantSpeaker.ts][onChange]`,
      `color:#3498db;font-weight:bold;`,
      { dominantSpeaker, room },
    )
    if (dominantSpeaker !== null) {
      _set(dominantSpeaker)
    }
  }

  /**
    Since null values are ignored, we will need to listen for the 'participantDisconnected'
    event, so we can set the dominantSpeaker to 'null' when they disconnect.
  */
  function _onParticipantDisconnected(participant: RemoteParticipant) {
    if (_state.dominantSpeaker === participant) {
      _state.dominantSpeaker = null
    }
  }

  const o = {
    get() {
      return _state.dominantSpeaker
    },
    set(dominantSpeaker: DominantSpeaker) {
      _set(dominantSpeaker)
      return this
    },
    on(eventName: 'onChange', onChange: typeof _consumerOnChange) {
      if (eventName === 'onChange') {
        _consumerOnChange = onChange
      }
      return this
    },
    off(eventName: 'onChange') {
      if (eventName === 'onChange') {
        _consumerOnChange = undefined
      }
      return this
    },
    listen() {
      room.on('dominantSpeakerChanged', _onChange)
      room.on('participantDisconnected', _onParticipantDisconnected)
      return this
    },
    unlisten() {
      room.off('dominantSpeakerChanged', _onChange)
      room.off('participantDisconnected', _onParticipantDisconnected)
      return this
    },
  }

  return o
}

export default makeDominantSpeaker
