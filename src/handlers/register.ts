// These callbacks are to handle components of type "register"
// TEMP: "Register" components that operate with "emit" objects
// are currently handled in App.ts

import { RemoteParticipant, Room } from 'twilio-video'
import { Register } from 'noodl-ui'
import { noodlEvent } from '../constants'
import App from '../App'
import * as u from '../utils/common'

function registerCallbacks(app: App) {
  const registers: Record<
    string,
    Omit<Partial<Register.Object>, 'name'> | Register.Object['callback']
  > = {
    async [noodlEvent.TWILIO_ON_PEOPLE_JOIN](
      obj,
      params: { room: Room; participant: RemoteParticipant },
    ) {
      console.log(`%c[${noodlEvent.TWILIO_ON_PEOPLE_JOIN}]`, `color:#95a5a6;`, {
        obj,
        params,
      })
    },
    async [noodlEvent.TWILIO_ON_NO_PARTICIPANT](obj, params: { room: Room }) {
      console.log(
        `%c[${noodlEvent.TWILIO_ON_NO_PARTICIPANT}]`,
        `color:#95a5a6;`,
        { obj, params },
      )
    },
  }

  return u.entries(registers).reduce((acc, [name, obj]) => {
    const register = { name } as Register.Object

    if (u.isFnc(obj)) {
      register.callback = obj
    } else u.assign(register, obj)

    return acc.concat(register)
  }, [] as Register.Object[])
}

export default registerCallbacks
