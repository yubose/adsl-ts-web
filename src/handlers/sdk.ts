import App from '../App'
import { onVideoChatBuiltIn } from './builtIns'

export const createSdkBuiltIns = (app: App) => {
  const o = {
    FCMOnTokenReceive: app.registers.fn.FCMOnTokenReceive,
    FCMOnTokenRefresh: app.registers.fn.FCMOnTokenRefresh,
    get checkField() {
      return app.noodlui.getBuiltIns()?.checkField?.find?.(Boolean)?.fn
    },
    get goto() {
      return app.noodlui.getBuiltIns()?.goto?.find?.(Boolean)?.fn
    },
    onNewMessageDisplay: app.getEnabledServices().firebase
      ? app.messaging?.onMessage.bind(app.messaging)
      : undefined,
    videoChat: onVideoChatBuiltIn({ joinRoom: app.meeting.join }),
  }

  return o
}
