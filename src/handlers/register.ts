// These callbacks are to handle components of type "register"
// TEMP: "Register" components that operate with "emit" objects
// are currently handled in App.ts

import { RemoteParticipant, Room } from 'twilio-video'
import { noodlEvent } from '../constants'
import App from '../App'

function registerCallbacks(app: App) {
  app.ndom.use({
    register: {
      name: noodlEvent.TWILIO_ON_PEOPLE_JOIN,
      page: '_global',
      async callback(
        obj,
        params: { room: Room; participant: RemoteParticipant },
      ) {
        console.log(
          `%c[${noodlEvent.TWILIO_ON_PEOPLE_JOIN}]`,
          `color:#95a5a6;`,
          { obj, params },
        )
      },
    },
  })

  app.ndom.use({
    register: {
      name: noodlEvent.TWILIO_ON_NO_PARTICIPANT,
      page: '_global',
      async callback(obj, params: { room: Room }) {
        console.log(
          `%c[${noodlEvent.TWILIO_ON_NO_PARTICIPANT}]`,
          `color:#95a5a6;`,
          { obj, params },
        )
      },
    },
  })
}

export default registerCallbacks
