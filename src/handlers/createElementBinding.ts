import Logger from 'logsnap'
import { isComponent, NuiComponent } from 'noodl-ui'
import App from '../App'
import is from '../utils/is'
import { isVisible } from '../utils/dom'

const log = Logger.create('createElementBinding')

function createElementBindingFactory(app: App) {
  function createElementBinding(component: NuiComponent.Instance) {
    if (!isComponent(component)) {
      log.red(`The "component" is not a Component!`, component)
      return component
    }

    if (
      component.blueprint?.audioStream ||
      component.blueprint?.videoStream ||
      component.blueprint?.viewTag === 'selfStream'
    ) {
      log.func('createElementBinding')

      const { selfStream } = app.meeting.streams
      const streamNodes = [] as HTMLElement[]

      let node = document.createElement('div')
      let viewTag = component.blueprint?.viewTag || ''

      if (viewTag === 'selfStream' && app.mainPage.page === 'VideoChat') {
        log.grey(`Entered element binding resolver for selfStream`, {
          component,
          selfStream: selfStream.snapshot(),
        })
        // If the selfStream already has an element, re-use it and reload the
        // media tracks on it
        if (selfStream.hasElement()) {
          node = selfStream.getElement() as HTMLDivElement
          if (!selfStream.hasAudioElement() && !selfStream.hasVideoElement()) {
            selfStream.reloadTracks()
          }
        } else {
          log.grey(
            `The selfStream instance does not have any DOM elements. Will ` +
              `assume the "join" function will load the tracks`,
          )
        }
      }

      // Substream
      else if (viewTag !== 'selfStream') {
        const isAudioStreamBinding = component.get('audioStream')
        const isVideoStreamBinding = component.get('videoStream')
        // Currently used for the popUp in the VideoChat page that have global: true
        const onMutation: MutationCallback = function _onMutation(mutations) {
          log.func(``)
          log.grey(`Mutation change`, mutations)

          if (isVisible(node)) {
            if (selfStream.hasElement()) {
              const childNodes = selfStream.getElement()?.childNodes as
                | NodeListOf<HTMLElement>
                | undefined

              if (childNodes) {
                for (const elem of childNodes) {
                  !streamNodes.includes(elem) && streamNodes.push(elem)
                }
              }
            }

            streamNodes.forEach((elem) => {
              if (elem) {
                if (elem.tagName === 'AUDIO') {
                  if (node.querySelector('audio')) {
                    node.replaceChild(
                      elem,
                      node.querySelector('audio') as HTMLAudioElement,
                    )
                    log.green(
                      `Replacing the existing audio element with the one in the loop`,
                    )
                  }
                } else if (elem.tagName === 'VIDEO') {
                  if (node.querySelector('video')) {
                    node.replaceChild(
                      elem,
                      node.querySelector('video') as HTMLVideoElement,
                    )
                    log.green(
                      `Replacing the existing video element with the one in the loop`,
                    )
                  }
                }
              }
            })

            if (is.isBoolean(isAudioStreamBinding)) {
              let previousSnapshot = selfStream.snapshot()
              let audioElem = selfStream.getAudioElement()

              if (is.isBooleanTrue(isAudioStreamBinding)) {
                log.grey(
                  `audioStream is set to true. Proceeding to turn on audio streaming now...`,
                )
                if (audioElem) {
                  log.grey(`Audio element exists. Checking if it is paused...`)
                  if (audioElem.paused) {
                    log.grey(`Audio was paused. Playing now...`)
                    audioElem.play()
                  } else {
                    log.grey(`Audio is not paused and is currently playing`)
                  }
                  if (node.querySelector('audio')) {
                    log.grey(
                      `There is already an audio element in children. Replacing it with the selfStream one...`,
                    )
                    node.replaceChild(
                      audioElem,
                      node.querySelector('audio') as HTMLAudioElement,
                    )
                  } else {
                    node.appendChild(audioElem)
                  }
                } else {
                  log.grey(
                    `Audio element does not exist on selfStream. Checking the current node now..`,
                  )
                  if (node.querySelector('audio')) {
                    log.grey(`Audio element already exists in the node`, node)
                  } else {
                    log.grey(`TODO - Create + start audio stream`, {
                      previousSnapshot,
                    })
                  }
                }
              } else {
                log.grey(
                  `audioStream is set to false. Checking the node for an audio element...`,
                  { previousSnapshot },
                )
                audioElem = node.querySelector('audio')
                if (audioElem) {
                  log.grey(`Found an audio element. Removing it now...`)
                  try {
                    node.removeChild(audioElem)
                    audioElem.remove()
                  } catch (error) {
                    console.error(error)
                  }
                } else {
                  log.grey(`Audio element is missing. It is already removed`)
                }
              }
            }

            if (is.isBoolean(isVideoStreamBinding)) {
              let videoElem = selfStream.getVideoElement()

              if (is.isBooleanTrue(isVideoStreamBinding)) {
                log.grey(
                  `videoStream is set to true. Proceeding to turn on video streaming now...`,
                )
                if (videoElem) {
                  log.grey(`Video element exists`)
                  if (videoElem.paused) {
                    log.grey(`Video was paused. Playing now...`)
                    videoElem.play()
                  } else {
                    log.grey(`Video element is already enabled`)
                  }
                  if (node.querySelector('video')) {
                    log.grey(
                      `There is already a video element in children. Replacing it with the selfStream one...`,
                    )
                    node.replaceChild(
                      videoElem,
                      node.querySelector('video') as HTMLVideoElement,
                    )
                  } else {
                    node.appendChild(videoElem)
                  }
                } else {
                  log.grey(`Video element does not exist`)
                }
              } else {
                log.grey(`Removing video stream`)
              }
            } else {
              log.grey(
                `videoStream is set to false. Checking the node for a video element...`,
              )
              let videoElem = node.querySelector('video')
              if (videoElem) {
                log.grey(`Found an video element. Removing it now...`)
                try {
                  node.removeChild(videoElem)
                  videoElem.remove()
                } catch (error) {
                  console.error(error)
                }
              } else {
                log.grey(`Video element is missing. It is already removed`)
              }
            }
          } else if (node) {
            log.grey(
              `Element is hidden. Checking and removing audio or video elements if present...`,
            )
            let audioElem = node.querySelector('audio')
            let videoElem = node.querySelector('video')

            if (audioElem) {
              log.grey(`Removing audio element`)
              try {
                node.removeChild(audioElem)
                audioElem.remove()
              } catch (error) {
                console.error(error)
              }
            } else {
              log.grey(
                `Did not need to delete any audio elements because none were present`,
              )
            }
            if (videoElem) {
              log.grey(`Removing video element`)
              try {
                node.removeChild(videoElem)
                videoElem.remove()
              } catch (error) {
                console.error(error)
              }
            } else {
              log.grey(
                `Did not need to delete any video elements because none were present`,
              )
            }
          }
        }
        const observer = new MutationObserver(onMutation)
        observer.observe(node, { attributes: true, attributeFilter: ['style'] })
      }
      return node
    }
  }

  return createElementBinding
}

export default createElementBindingFactory
