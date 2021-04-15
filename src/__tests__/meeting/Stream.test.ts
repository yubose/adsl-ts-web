import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import * as mock from 'noodl-ui-test-utils'

const getVidElem = () => document.createElement('video')
const logElemState = (node: HTMLVideoElement) =>
  console.info({
    ended: node.ended,
    hidden: node.hidden,
    isConnected: node.isConnected,
    localName: node.localName,
    muted: node.muted,
    networkState: node.networkState,
    paused: node.paused,
    seeking: node.seeking,
    seekable: node.seeking,
    volume: node.volume,
  })

describe(coolGold(`Stream`), () => {
  describe(italic(`isActivelyStreaming`), () => {
    it(italic(`should return true `), () => {
      const node = getVidElem()
      logElemState(node)
    })
  })
})
