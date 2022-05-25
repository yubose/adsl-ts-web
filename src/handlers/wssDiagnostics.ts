import * as u from '@jsmanifest/utils'
import App from '../App'

function createWssDiagnosticsObserver(appProp: App | ((fn: WebSocket) => App)) {
  let tag = `[wsClient]`

  let app: App
  let ws: WebSocket | undefined

  const wsClient = new WebSocket('ws://127.0.0.1:3020')

  wsClient.addEventListener('open', () => {
    console.log(`${tag} Opened`)
  })
  wsClient.addEventListener('message', (data) => {
    console.log(`${tag} Message`, data)
  })
  wsClient.addEventListener('error', (evt) => {
    console.log(`${tag} Error`, evt)
  })
  wsClient.addEventListener('close', (evt) => {
    console.log(`${tag} Closed`, evt)
  })
}

export default createWssDiagnosticsObserver
