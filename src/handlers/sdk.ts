import axios from 'axios'
import App from '../App'
import { extendedSdkBuiltIns } from './builtIns'

export function getSdkHelpers(app: App) {
  const initPageBuiltIns = {
    EcosObj: {
      get download() {
        return extendedSdkBuiltIns.download
      },
      get exportCSV() {
        return app.builtIns.get('exportCSV')?.find(Boolean)?.fn
      },
      get exportPDF() {
        return app.builtIns.get('exportPDF')?.find(Boolean)?.fn
      },
    },
    get downloadQRCode() {
      return extendedSdkBuiltIns.downloadQRCode
    },
    async FCMOnTokenReceive(params?: any) {
      // Returns the token
      return app.nui.emit({
        type: 'register',
        event: 'FCMOnTokenReceive',
        params,
      })
    },
    get FCMOnTokenRefresh() {
      return app.notification?.supported
        ? app.notification.messaging?.onTokenRefresh.bind(
            app.notification.messaging,
          )
        : undefined
    },
    get checkField() {
      return app.builtIns.get('checkField')?.find(Boolean)?.fn
    },
    get goto() {
      return app.builtIns.get('goto')?.find(Boolean)?.fn
    },
    get hide() {
      return app.builtIns.get('hide')?.find(Boolean)?.fn
    },
    get show() {
      return app.builtIns.get('show')?.find(Boolean)?.fn
    },
    get redraw() {
      return app.builtIns.get('redraw')?.find(Boolean)?.fn
    },
    get videoChat() {
      return extendedSdkBuiltIns.videoChat.bind(app)
    },
    get initExtend() {
      return extendedSdkBuiltIns.initExtend.bind(app)
    },
    get extendMeeting() {
      return app.builtIns.get('extendMeeting')?.find(Boolean)?.fn
    },
    async request(dataIn: {
      method?: 'get' | 'post' | 'put' | 'delete'
      url?: string
    }) {
      try {
        console.log(`[request] dataIn`, dataIn)
        const response = await axios[dataIn.method as string](
          dataIn.url as string,
        )
        const { data } = response
        console.log(data)
        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        throw err
      }
    },
  }

  return {
    initPageBuiltIns,
  }
}
