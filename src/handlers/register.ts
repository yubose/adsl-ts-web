// These callbacks are to handle components of type "register"
// TEMP: "Register" components that operate with "emit" objects
// are currently handled in App.ts

import { RemoteParticipant } from 'twilio-video'
import { NUIComponent, NOODLUI as NUI } from 'noodl-ui'
import Logger from 'logsnap'
import Stream from '../meeting/Stream'
import App from '../App'

const log = Logger.create('src/handlers/register.ts')

function registerCallbacks(app: App) {
  NUI.cache.register.set('_global', 'twilioOnPeopleJoin', {
    component: null,
    key: 'twilioOnPeopleJoin',
    prop: 'onEvent',
    fn({
      participant,
      stream,
      id,
      prop,
      eventName,
      component,
      next,
    }: {
      participant: RemoteParticipant
      stream: Stream
      id: string
      prop: string
      eventName: string
      component?: NUIComponent.Instance
      next?(): void
    }) {
      log.func('twilioOnPeopleJoin')
      log.grey('', arguments[0])
      next?.()
    },
  })

  NUI.cache.register.set('_global', 'twilioOnNoParticipant', {
    component: null,
    key: 'twilioOnNoParticipant',
    prop: 'onEvent',
    fn({
      id,
      prop,
      eventName,
      component,
      next,
    }: {
      id: string
      prop: string
      eventName: string
      component?: NUIComponent.Instance
      next?(): void
    }) {
      log.func('twilioOnNoParticipant')
      log.grey('', arguments[0])
      next?.()
    },
  })
}

export default registerCallbacks
