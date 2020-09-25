import {
  LocalTrackPublication,
  RemoteTrackPublication,
  Track,
} from 'twilio-video'

function makeTrack(
  publication: LocalTrackPublication | RemoteTrackPublication,
  from: string = '',
) {
  let _track: Track | undefined

  function _set(track: Track | undefined) {
    _track = track
  }

  const o = {
    get() {
      return _track
    },
    set(track: Track | undefined) {
      console.log(
        `%c[${from}][makeTrack.ts][${publication?.kind}][set] ` +
          'Set track (${name}) triggered',
        `color:cyan;font-weight:bold;`,
        track,
      )
      _set(track)
      console.log(
        `%c[${from}][makeTrack.ts][${publication?.kind}][set] Listener count`,
        `color:cyan;font-weight:bold;`,
        {
          subscribed: publication?.listenerCount('subscribed'),
          trackSid: publication?.trackSid,
        },
      )
    },
    remove() {
      this.set(undefined)
    },
    listen() {
      publication.on('subscribed', this.set)
      publication.on('unsubscribed', this.remove)
    },
    unlisten() {
      publication.off('subscribed', this.set)
      publication.off('unsubscribed', this.remove)
    },
  }

  return o
}

export default makeTrack
