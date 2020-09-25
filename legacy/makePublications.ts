import _ from 'lodash'
import {
  LocalTrackPublication,
  Participant,
  RemoteTrackPublication,
  RemoteTrack,
} from 'twilio-video'

export type TrackPublication = LocalTrackPublication | RemoteTrackPublication

function makePublications(participant: Participant, from: string) {
  let _publications: TrackPublication[] = []

  function _set(
    publications:
      | TrackPublication[]
      | ((prevPublications: TrackPublication[]) => TrackPublication[]),
  ) {
    if (_.isFunction(publications)) {
      const result = publications(_publications)
      if (result !== _publications) {
        _publications = result
      }
    } else {
      _publications = publications
    }
  }

  function _onPublicationAdded(publication: TrackPublication) {
    console.log(
      `%c[${from}][makePublications.ts][_onPublicationAdded][${publication?.kind}] ` +
        'Track published',
      `color:cyan;font-weight:bold;`,
      { publication, participantSid: participant?.sid },
    )
    _set((prev) => [...prev, publication])
  }

  function _onPublicationRemoved(publication: TrackPublication) {
    console.log(
      `%c[${from}][makePublications.ts][_onPublicationRemoved][${publication?.kind}] ` +
        'Track unpublished',
      `color:cyan;font-weight:bold;`,
      { publication, participantSid: participant?.sid },
    )
    _set((prev) => _.filter(prev, (p) => p !== publication))
  }

  function _onPublicationSubscribed(
    track: RemoteTrack,
    publication: RemoteTrackPublication,
  ) {
    console.log(
      `%c[${from}][makePublications.ts][_onPublicationSubscribed][${publication?.kind}] ` +
        `Track subscribed`,
      `color:cyan;font-weight:bold;`,
      { participantSid: participant?.sid, publication, track },
    )
    _set((prev) =>
      _.map(prev, (pub) => {
        console.log(
          `%c[${from}][makePublications.ts][_onPublicationSubscribed]`,
          `color:#3498db;font-weight:bold;`,
          { newPublication: prev, publicationInLoop: pub },
        )
        return pub.trackSid === publication.trackSid ? publication : pub
      }),
    )
  }

  function _onPublicationUnsubscribed(
    track: RemoteTrack,
    publication: RemoteTrackPublication,
  ) {
    console.log(
      `%c[${from}][makePublications.ts][_onPublicationUnsubscribed][${publication?.kind}] ` +
        `Track unsubscribed`,
      `color:cyan;font-weight:bold;`,
      { participantSid: participant?.sid, publication, track },
    )
    _set((prevPublications) =>
      _.filter(prevPublications, (p) => p !== publication),
    )
  }

  const o = {
    get() {
      return _publications
    },
    set(publications: TrackPublication[]) {
      _set(publications)
      return this
    },
    listen() {
      participant.on('trackPublished', _onPublicationAdded)
      participant.on('trackUnpublished', _onPublicationRemoved)
      participant.on('trackSubscribed', _onPublicationSubscribed)
      participant.on('trackUnsubscribed', _onPublicationUnsubscribed)
    },
    unlisten() {
      participant.off('trackPublished', _onPublicationAdded)
      participant.off('trackUnpublished', _onPublicationRemoved)
      participant.off('trackSubscribed', _onPublicationSubscribed)
      participant.off('trackUnsubscribed', _onPublicationUnsubscribed)
    },
  }

  return o
}

export default makePublications
