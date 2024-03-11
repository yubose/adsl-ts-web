import * as u from '@jsmanifest/utils'
import type App from '../App'
import log from '../log'

const ADD_DIR = 'ADD_DIR'
const ADD_FILE = 'ADD_FILE'
const DIR_REMOVED = 'DIR_REMOVED'
const FILE_CHANGED = 'FILE_CHANGED'
const FILE_REMOVED = 'FILE_REMOVED'
const WATCH_ERROR = 'WATCH_ERROR'

function createWssDiagnosticsClient(
  appProp: App | ((ws: WebSocket, address: string) => App),
  port = 3020,
): {
  address: string
  port: number
  start(): void
  ws: WebSocket
} {
  let tag = `[diagnostics]`
  let address = `ws://127.0.0.1:${port}`

  let ws = new WebSocket(address)

  if (u.isFnc(appProp)) {
    return createWssDiagnosticsClient(appProp(ws, address), port)
  }

  const app = appProp

  const isEnabled = !!process.env.ANALYSIS_APP

  function sendForDiagnostics() {
    ws?.send?.(
      JSON.stringify({
        type: 'RUN_DIAGNOSTICS',
        root: app.root,
        preload: app.noodl?.cadlEndpoint?.preload ?? [],
        pages: app.noodl?.cadlEndpoint?.page ?? [],
      }),
    )
  }

  function start() {
    if (isEnabled) {
      ws.addEventListener('open', () => {
        sendForDiagnostics()
      })

      ws.addEventListener('message', (msg) => {
        let data

        try {
          data = u.isStr(msg.data) ? JSON.parse(msg.data) : msg.data
        } catch (error) {
          log.error(
            error instanceof Error ? error : new Error(String(error)),
          )
        }

        switch (data?.type) {
          case 'PUBLISHING_DIAGNOSTICS': {
            return sendForDiagnostics()
          }
        }
      })

      ws.addEventListener('error', (evt) => {
        log.log(`%c${tag} Error`, `color:#ec0000;`, evt)
      })
    }
  }

  const o = {
    address,
    port,
    start,
    ws,
  }

  return o
}

export default createWssDiagnosticsClient

/**
 * import * as u from '@jsmanifest/utils'
import type App from '../App'

const ADD_DIR = 'ADD_DIR'
const ADD_FILE = 'ADD_FILE'
const DIR_REMOVED = 'DIR_REMOVED'
const FILE_CHANGED = 'FILE_CHANGED'
const FILE_REMOVED = 'FILE_REMOVED'
const WATCH_ERROR = 'WATCH_ERROR'

async function createWssDiagnosticsClient(
  appProp: App | ((ws: WebSocket, address: string) => App),
  port = 3020,
): {
  address: string
  port: number
  start(): void
  ws: WebSocket
} {
  let tag = `[diagnostics]`

  let app: App
  let address = `ws://127.0.0.1:${port}`
  let ws = new WebSocket(address)

  if (u.isFnc(appProp)) {
    return createWssDiagnosticsClient(appProp(ws, address), port)
  }

  let connectBtn = document.getElementById('connectButton')
  let disconnectBtn = document.getElementById('disconnectButton')
  let sendBtn = document.getElementById('sendButton')
  let messageInput = document.getElementById('message')

  const color = {
    lpeer: 'gold',
    channel: 'navajowhite',
    peer: '#019cc4',
  }

  const lpeer = new RTCPeerConnection()
  const peer = new RTCPeerConnection()

  const channel = lpeer.createDataChannel('myChannel')

  window['lpeer'] = lpeer
  window['peer'] = peer
  window['channel'] = channel

  lpeer.addEventListener(
    'icecandidate',
    async function onLocalIceCandidate(event) {
      log.log(`%c[lpeer] Ice candidate`, `color:${color.lpeer};`, {
        thisValue: this,
        event,
      })
      if (event.candidate) {
        try {
          await peer.addIceCandidate(event.candidate)
        } catch (error) {
          log.error(
            error instanceof Error ? error : new Error(String(error)),
          )
        }
      } else {
        log.log(
          `%c[lpeer-icecandidate] No candidate`,
          `color:${color.lpeer};`,
        )
      }
    },
  )

  lpeer.addEventListener('datachannel', function onLocalPeerDataChannel(event) {
    log.log(`%c[lpeer] Data channel`, `color:${color.lpeer};`, event)
    const channel = event.channel
    window['lchannel'] = channel

    channel.addEventListener('open', function onLocalPeerChannelOpened(event) {
      log.log(`%c[lpeer] Opened`, `color:${color.lpeer};`, event)
      channel.send('Hi back!')
      channel.send('Hi back2!')
      channel.send('Hi back2!')
      channel.send('Hi back2!')
      channel.send('Hi back2!')
    })
    channel.addEventListener(
      'bufferedamountlow',
      function onLocalPeerChannelOpened(event) {
        log.log(
          `%c[lpeer] Buffered amount low`,
          `color:${color.lpeer};`,
          event,
        )
      },
    )
    channel.addEventListener('error', function onLocalPeerChannelError(event) {
      log.log(`%c[lpeer] Error`, `color:${color.lpeer};`, event)
    })
    channel.addEventListener(
      'message',
      function onLocalPeerChannelMessage(event) {
        event.log.log(`%c[lpeer] Message`, `color:${color.lpeer};`, event)
      },
    )
  })

  peer.addEventListener(
    'icecandidate',
    async function onPeerIceCandidate(event) {
      if (event.candidate) {
        try {
          await lpeer.addIceCandidate(event.candidate)
        } catch (error) {
          log.error(
            error instanceof Error ? error : new Error(String(error)),
          )
        }
      } else {
        log.log(
          `%c[peer-icecandidate] No candidate`,
          `color:${color.peer};`,
        )
      }
    },
  )

  channel.addEventListener('open', function onChannelOpen(event) {
    log.log(`%c[channel] Opened`, `color:${color.channel};`, {
      thisValue: this,
      event,
    })
    this.send('HELLO!')
  })
  channel.addEventListener('message', function onChannelMessage(event) {
    log.log(`%c[channel] Message`, `color:${color.channel};`, {
      thisValue: this,
      event,
    })
  })
  channel.addEventListener('close', function onChannelClose(event) {
    log.log(`%c[channel] Closed`, `color:${color.channel};`, {
      thisValue: this,
      event,
    })
  })
  channel.addEventListener('error', function onChannelError(event) {
    log.log(`%c[channel] Error`, `color:${color.channel};`, {
      thisValue: this,
      event,
    })
  })
  channel.addEventListener(
    'bufferedamountlow',
    function onChannelBufferedAmountFlow(event) {
      log.log(
        `%c[channel] Buffered amount flow`,
        `color:${color.channel};`,
        {
          thisValue: this,
          event,
        },
      )
    },
  )

  peer.addEventListener(
    'connectionstatechange',
    function onPeerStateChange(event) {
      log.log(`%c[peer] Connection state changed`, `color:${color.peer};`, {
        thisValue: this,
        event,
      })
      if (this.connectionState === 'connected') {
        //
      }
    },
  )
  peer.addEventListener('datachannel', function onPeerDataChannel(event) {
    log.log(`%c[peer] Data channel`, `color:${color.peer};`, event)
    const channel = event.channel
    window['pchannel'] = channel

    channel.addEventListener('open', function onRemotePeerChannelOpened(event) {
      log.log(`%c[peer] Opened`, `color:${color.peer};`, event)
      channel.send('Hi back!')
      channel.send('Hi back2!')
      channel.send('Hi back2!')
      channel.send('Hi back2!')
      channel.send('Hi back2!')
    })
    channel.addEventListener(
      'bufferedamountlow',
      function onRemotePeerChannelOpened(event) {
        log.log(
          `%c[peer] Buffered amount low`,
          `color:${color.peer};`,
          event,
        )
      },
    )
    channel.addEventListener('error', function onRemotePeerChannelError(event) {
      log.log(`%c[peer] Error`, `color:${color.peer};`, event)
    })
    channel.addEventListener(
      'message',
      function onRemotePeerChannelMessage(event) {
        log.log(`%c[peer] Message`, `color:${color.peer};`, event)
      },
    )
  })
  peer.addEventListener('icecandidate', function onPeerIceCandidate(evt) {
    log.log(`%c[peer] Ice candidate`, `color:${color.peer};`, evt)
  })
  peer.addEventListener('icecandidateerror', function onPeerError(evt) {
    log.log(`%c[peer] Ice candidate error`, `color:${color.peer};`, evt)
  })
  peer.addEventListener(
    'iceconnectionstatechange',
    function onPeerIceConnectionStateChange(evt) {
      log.log(
        `%c[peer] Ice candidate state change`,
        `color:${color.peer};`,
        evt,
      )
    },
  )
  peer.addEventListener(
    'icegatheringstatechange',
    function onPeerIceGatheringStateChange(evt) {
      log.log(
        `%c[peer] Ice gathering state changed`,
        `color:${color.peer};`,
        evt,
      )
    },
  )
  peer.addEventListener(
    'negotiationneeded',
    async function onPeerNegotiationNeeded(evt) {
      log.log(`%c[peer] Negotiation needed`, `color:${color.peer};`, evt)
      const offer = await this.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      log.log({ offer })
      this.getSenders().forEach((sender) => {
        log.log(sender)
      })
    },
  )
  peer.addEventListener(
    'signalingstatechange',
    function onPeerSignalingStateChange(evt) {
      log.log(
        `%c[peer] Signaling state change`,
        `color:${color.peer};`,
        evt,
      )
    },
  )
  peer.addEventListener('track', function onPeerTrack(evt) {
    log.log(`%c[peer] Track`, `color:${color.peer};`, evt)
  })

  try {
    const loffer = await lpeer.createOffer()
    await lpeer.setLocalDescription(loffer)
    await peer.setRemoteDescription(lpeer.localDescription)
    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)
    await lpeer.setRemoteDescription(peer.localDescription)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    log.error(err)
  }

  // const track = new MediaStreamTrack()
  const videoEl = document.createElement('video')
  const srcEl = document.createElement('source')
  videoEl.appendChild(srcEl)
  const rootEl = document.getElementById('root') as HTMLDivElement

  setTimeout(() => {
    let streamEl = document.getElementById('stream')
    const trackGenerator = new MediaStreamTrackGenerator({ kind: 'video' })
    trackGenerator.
    const mediaStream = new MediaStream([trackGenerator])
    const source = new MediaSource()
    videoEl.srcObject = mediaStream
    source.addEventListener('sourceopen', function (evt) {
      const sourceBuffer = 'video/mp4; codecs="avc1.4D401F"'
      this.addSourceBuffer(sourceBuffer)
      this.duration = 10
    })

    const src = window.URL.createObjectURL(source)
    // videoEl.style.top = '100px'
    // videoEl.style.zIndex = '99999'
    videoEl.style.width = '100%'
    videoEl.style.height = '100%'
    videoEl.style.border = '1px dashed red'
    // srcEl.style.top = '100px'
    // srcEl.style.zIndex = '99999'
    srcEl.style.width = '100%'
    srcEl.style.height = '100%'
    srcEl.style.border = '1px dashed red'
    videoEl.src = src
    srcEl.src = src
    videoEl.height = 300

    streamEl?.appendChild(videoEl)
    rootEl.appendChild(streamEl)
  }, 500)

  app = appProp

  function start() {
    ws.addEventListener('open', () => {
      log.log(`%c${tag} Opened`, `color:#00b406;`)
      ws.send(JSON.stringify({ type: 'LOADED' }))
    })
    ws.addEventListener('message', (data) => {
      log.log(`%c${tag} Message`, `color:#e50087;`, data)
    })
    ws.addEventListener('error', (evt) => {
      log.log(`%c${tag} Error`, `color:#ec0000;`, evt)
    })
    ws.addEventListener('close', (evt) => {
      log.log(`%c${tag} Closed`, `color:#FF5722;`, evt)
    })
  }

  const o = {
    address,
    port,
    start,
    ws,
  }

  return o
}

export default createWssDiagnosticsClient

 */
