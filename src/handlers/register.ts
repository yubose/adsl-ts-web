// These callbacks are to handle components of type "register"
// TEMP: "Register" components that operate with "emit" objects
// are currently handled in App.ts

import { RemoteParticipant } from 'twilio-video'
import { ComponentInstance, NOODL as NOODLUI } from 'noodl-ui'
import Logger from 'logsnap'
import NOODLUIDOM from 'noodl-ui-dom'
import AppMeeting from '../meeting/Meeting'
import Stream from '../meeting/Stream'

const log = Logger.create('src/handlers/register.ts')

interface Options {
  noodl: any
  noodlui: NOODLUI
  noodluidom: NOODLUIDOM
  Meeting: typeof AppMeeting
}

function registerCallbacks({ noodl, noodlui, noodluidom, Meeting }: Options) {
  noodlui.register({
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
      component?: ComponentInstance
    }) {
      log.func('twilioOnPeopleJoin')
      log.grey('', arguments[0])
      next?.()
    },
  })

  noodlui.register({
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
      component?: ComponentInstance
    }) {
      log.func('twilioOnNoParticipant')
      log.grey('', arguments[0])
      next?.()
    },
  })
}

export default registerCallbacks
