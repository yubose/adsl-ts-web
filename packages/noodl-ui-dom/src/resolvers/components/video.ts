import { isBooleanTrue } from 'noodl-utils'
import { RegisterOptions } from '../../types'

export default {
  name: '[noodl-ui-dom] video',
  cond: (node, component) => !!(node && component?.type === 'video'),
  resolve(node, component) {
    const { controls, poster, src, videoType } = component.get([
      'controls',
      'poster',
      'src',
      'videoType',
    ])
    if (node) {
      const videoEl = node as HTMLVideoElement
      let sourceEl: HTMLSourceElement
      let notSupportedEl: HTMLParagraphElement
      videoEl['controls'] = isBooleanTrue(controls) ? true : false
      if (poster) videoEl.setAttribute('poster', poster)
      if (src) {
        sourceEl = document.createElement('source')
        notSupportedEl = document.createElement('p')
        if (videoType) sourceEl.setAttribute('type', videoType)
        sourceEl.setAttribute('src', src)
        notSupportedEl.style['textAlign'] = 'center'
        // This text will not appear unless the browser isn't able to play the video
        notSupportedEl.innerHTML =
          "Sorry, your browser doesn's support embedded videos."
        videoEl.appendChild(sourceEl)
        videoEl.appendChild(notSupportedEl)
      }
    }
  },
} as RegisterOptions
