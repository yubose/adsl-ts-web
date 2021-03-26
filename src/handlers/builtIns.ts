import isPlainObject from 'lodash/isPlainObject'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import isObjectLike from 'lodash/isObjectLike'
import { isDraft, original } from 'immer'
import { Action, isAction } from 'noodl-action-chain'
import {
  ConsumerOptions,
  findListDataObject,
  findIteratorVar,
  getDataValues,
  NOODLUI as NUI,
  NOODLUIActionChain,
  NUIComponent,
} from 'noodl-ui'
import {
  findAllByViewTag,
  findByElementId,
  findByViewTag,
  findWindow,
  getByDataUX,
  isPageConsumer,
  isTextFieldLike,
  NOODLDOMDataValueElement,
  NOODLDOMElement,
} from 'noodl-ui-dom'
import { BuiltInActionObject } from 'noodl-types'
import {
  LocalAudioTrack,
  LocalAudioTrackPublication,
  LocalVideoTrack,
  LocalVideoTrackPublication,
  Room,
} from 'twilio-video'
import {
  isBoolean as isNOODLBoolean,
  isBooleanTrue,
  isBooleanFalse,
  parse,
} from 'noodl-utils'
import Logger from 'logsnap'
import { isStable, resolvePageUrl } from '../utils/common'
import { hide, show, scrollToElem } from '../utils/dom'
import { pageEvent } from '../constants'
import App from '../App'
import Meeting from '../meeting'

const log = Logger.create('builtIns.ts')
const stable = isStable()

const createBuiltInActions = function createBuiltInActions(app: App) {
  /* -------------------------------------------------------
    ---- ACTIONS (non-builtIn)
  -------------------------------------------------------- */

  /* -------------------------------------------------------
  ---- ACTIONS (builtIn)
  -------------------------------------------------------- */
  app.ndom
    .register({
      actionType: 'builtIn',
      funcName: 'checkField',
      async fn(action: Action, options: ConsumerOptions) {
        log.func('checkField')
        log.grey('checkField', { action, options })
        let contentType =
          action.original?.contentType || (action as any)?.contentType || ''
        let delay: number | boolean =
          action.original?.wait || (action as any).wait || 0

        const onCheckField = () => {
          const node = getByDataUX(contentType)
          ;(Array.isArray(node) ? node : [node]).forEach((n) => {
            n && show(n)
          })
        }

        if (delay > 0) {
          setTimeout(() => onCheckField(), delay as any)
        } else {
          onCheckField()
        }
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'disconnectMeeting',
      async fn(action: Action, options: ConsumerOptions) {
        log.func('disconnectMeeting')
        log.grey('', { action, room: Meeting.room, options })
        Meeting.room.disconnect()
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'goBack',
      async fn(action: Action, options: ConsumerOptions) {
        log.func('goBack')
        log.grey('', { action, ...options })
        if (typeof action.original?.reload === 'boolean') {
          app.mainPage.setModifier(
            app.mainPage
              .getPreviousPage(app.noodl.cadlEndpoint.startPage || '')
              .trim(),
            { reload: action.original.reload },
          )
        }
        window.history.back()
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'hide',
      async fn(action: Action, options: ConsumerOptions) {
        const viewTag = action.original?.viewTag || ''
        const nodes = findAllByViewTag(viewTag)

        log.func('hide')

        if (nodes?.length) {
          Array.from(nodes).forEach((node) => {
            log.grey('Toggling visibility off', {
              action,
              options,
              viewTag,
              node,
              component: options.component,
            })
            node.style.visibility = 'hidden'
          })
        } else {
          log.red(`Cannot find any DOM nodes for viewTag "${viewTag}"`)
        }
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'show',
      async fn(action, options) {
        const viewTag = action.original?.viewTag || ''
        const nodes = findAllByViewTag(viewTag)

        log.func('show')

        if (nodes?.length) {
          Array.from(nodes).forEach((node) => {
            log.grey('Toggling visibility on', {
              action,
              options,
              viewTag,
              node,
              component: options.component,
            })
            node.style.visibility = 'visible'
          })
        } else {
          log.red(`Cannot find any DOM nodes for viewTag "${viewTag}"`)
        }
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'toggleCameraOnOff',
      async fn(action: Action, options: ConsumerOptions) {
        log.func('toggleCameraOnOff')
        const path = 'VideoChat.cameraOn'

        const { localParticipant } = Meeting
        let videoTrack: LocalVideoTrack | undefined

        if (localParticipant) {
          videoTrack = Array.from(localParticipant.tracks.values()).find(
            (trackPublication) => trackPublication.kind === 'video',
          )?.track as LocalVideoTrack

          const { default: noodl } = await import('../app/noodl')
          noodl.editDraft((draft: any) => {
            if (videoTrack) {
              if (videoTrack.isEnabled) {
                videoTrack.disable()
                set(draft, path, false)
                log.grey(
                  `Toggled video OFF for LocalParticipant`,
                  localParticipant,
                )
              } else {
                videoTrack.enable()
                set(draft, path, true)
                log.grey(
                  `Toggled video ON for LocalParticipant`,
                  localParticipant,
                )
              }
            } else {
              log.red(
                `Tried to toggle video track on/off for LocalParticipant but a video track was not available`,
                { localParticipant, room: Meeting.room },
              )
            }
          })
        }
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'toggleMicrophoneOnOff',
      async fn(action: Action, options: ConsumerOptions) {
        log.func('toggleMicrophoneOnOff')
        const path = 'VideoChat.micOn'

        const { localParticipant } = Meeting
        let audioTrack: LocalAudioTrack | undefined

        if (localParticipant) {
          audioTrack = Array.from(localParticipant.tracks.values()).find(
            (trackPublication) => trackPublication.kind === 'audio',
          )?.track as LocalAudioTrack

          const { default: noodl } = await import('../app/noodl')
          noodl.editDraft((draft: any) => {
            if (audioTrack) {
              if (audioTrack.isEnabled) {
                audioTrack.disable()
                set(draft, path, false)
                log.grey(
                  `Toggled audio OFF for LocalParticipant`,
                  localParticipant,
                )
              } else {
                log.grey(
                  `Toggled audio ON for LocalParticipant`,
                  localParticipant,
                )
                audioTrack.enable()
                set(draft, path, true)
              }
            }
          })
        }
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'toggleFlag',
      async fn(action: Action, options: ConsumerOptions) {
        log.func('toggleFlag')
        console.log({ action, ...options })
        const { component } = options
        const { page } = app.mainPage
        const { dataKey = '' } = action.original || {}
        const iteratorVar = findIteratorVar(component)
        const node = findByElementId(component)
        let path = component?.get('path')

        let dataValue: any
        let dataObject: any
        let previousDataValue: boolean | undefined
        let nextDataValue: boolean | undefined
        let newSrc = ''

        if (isDraft(path)) path = original(path)

        log.gold(`iteratorVar: ${iteratorVar} | dataKey: ${dataKey}`)

        if (dataKey?.startsWith(iteratorVar)) {
          const parts = dataKey.split('.').slice(1)
          dataObject = findListDataObject(component as NUIComponent.Instance)
          previousDataValue = get(dataObject, parts)
          // previousDataValueInSdk = _.get(noodl.root[context.page])
          dataValue = previousDataValue
          if (isNOODLBoolean(dataValue)) {
            // true -> false / false -> true
            nextDataValue = !isBooleanTrue(dataValue)
          } else {
            // Set to true if am item exists
            nextDataValue = !dataValue
          }
          set(dataObject, parts, nextDataValue)
        } else {
          const onNextValue = (
            previousValue: any,
            { updateDraft }: { updateDraft?: { path: string } } = {},
          ) => {
            let nextValue: any
            if (isNOODLBoolean(previousValue)) {
              nextValue = !isBooleanTrue(previousValue)
            }
            nextValue = !previousValue
            if (updateDraft) {
              app.noodl.editDraft((draft: any) => {
                set(draft, updateDraft.path, nextValue)
              })
            }
            // Propagate the changes to to UI if there is a path "if" object that
            // references the value as well
            if (node && isObjectLike(path)) {
              let valEvaluating = path?.if?.[0]
              // If the dataKey is the same as the the value we are evaluating we can
              // just re-use the nextDataValue
              if (valEvaluating === dataKey) {
                valEvaluating = nextValue
              } else {
                valEvaluating =
                  get(app.noodl.root, valEvaluating) ||
                  get(app.noodl.root[page || ''], valEvaluating)
              }
              newSrc =
                NUI.getAssetsUrl() + valEvaluating
                  ? path?.if?.[1]
                  : path?.if?.[2]
              // newSrc = NUI.createSrc(
              //   valEvaluating ? path?.if?.[1] : path?.if?.[2],
              //   component,
              // ) as string
              node.setAttribute('src', newSrc)
            }
            return nextValue
          }

          dataObject = app.noodl.root

          if (has(app.noodl.root, dataKey)) {
            dataObject = app.noodl.root
            previousDataValue = get(dataObject, dataKey)
            onNextValue(previousDataValue, { updateDraft: { path: dataKey } })
          } else if (has(app.noodl.root[page], dataKey)) {
            dataObject = app.noodl.root[page]
            previousDataValue = get(dataObject, dataKey)
            onNextValue(previousDataValue, {
              updateDraft: {
                path: `${dataKey}${page ? `.${page}` : ''}`,
              },
            })
          } else {
            log.red(
              `${dataKey} is not a path of the data object. ` +
                `Defaulting to attaching ${dataKey} as a path to the root object`,
              { dataObject, dataKey },
            )
            dataObject = app.noodl.root
            previousDataValue = undefined
            nextDataValue = false
            onNextValue(previousDataValue, {
              updateDraft: { path: `${dataKey}.${page || ''}` },
            })
          }

          if (/mic/i.test(dataKey)) {
            app.ndom.builtIns.toggleMicrophoneOnOff
              .find(Boolean)
              ?.fn?.(action, options)
          } else if (/camera/i.test(dataKey)) {
            app.ndom.builtIns.toggleCameraOnOff
              .find(Boolean)
              ?.fn?.(action, options)
          }
        }

        log.grey('', {
          component: component?.toJSON(),
          componentInst: component,
          dataKey,
          dataValue,
          dataObject,
          previousDataValue,
          nextDataValue,
          previousDataValueInSdk: newSrc,
          node,
          path,
          options,
        })
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'lockApplication',
      async fn(action: Action, options: ConsumerOptions) {
        const result = await _onLockLogout()
        if (result === 'abort') return 'abort'
        const { Account } = await import('@aitmed/cadl')
        await Account.logout(false)
        window.location.reload()
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'logOutOfApplication',
      async fn(action: Action, options: ConsumerOptions) {
        const result = await _onLockLogout()
        if (result === 'abort') return 'abort'
        const { Account } = await import('@aitmed/cadl')
        await Account.logout(true)
        window.location.reload()
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'logout',
      async fn(action: Action, options: ConsumerOptions) {
        const result = await _onLockLogout()
        if (result === 'abort') return 'abort'
        const { Account } = await import('@aitmed/cadl')
        await Account.logout(true)
        window.location.reload()
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'goto',
      async fn(action: Action<any>, options: ConsumerOptions) {
        log.func('builtIn [goto]')
        log.red('', { action, ...options })
        let destinationParam = ''
        let reload: boolean | undefined
        let pageReload: boolean | undefined // If true, gets passed to sdk initPage to disable the page object's "init" from being run
        let dataIn: any // sdk use

        // "Reload" currently is only known to be used in goto when runnning
        // an action chain and given an object like { destination, reload }
        if (typeof action === 'string') {
          destinationParam = action
        } else if (isAction(action)) {
          const gotoObj = action.original
          if (typeof gotoObj === 'string') {
            destinationParam = gotoObj
          } else if (isPlainObject(gotoObj)) {
            if ('goto' in gotoObj) {
              if (isPlainObject(gotoObj.goto)) {
                destinationParam = gotoObj.goto.destination
                if ('reload' in gotoObj.goto) reload = gotoObj.goto.reload
                if ('pageReload' in gotoObj.goto)
                  pageReload = gotoObj.goto.pageReload
                if ('dataIn' in gotoObj.goto) dataIn = gotoObj.goto.dataIn
              } else if (typeof gotoObj.goto === 'string') {
                destinationParam = gotoObj.goto
              }
            } else if (isPlainObject(gotoObj)) {
              destinationParam = gotoObj.destination
              if ('reload' in gotoObj) reload = gotoObj.reload
              if ('pageReload' in gotoObj) pageReload = gotoObj.pageReload
              if ('dataIn' in gotoObj) dataIn = gotoObj.dataIn
            }
          }
        } else if (isPlainObject(action)) {
          if ('destination' in action) {
            destinationParam = action.destination
            if ('reload' in action) reload = action.reload
            if ('pageReload' in action) pageReload = action.pageReload
            if ('dataIn' in action) dataIn = action.dataIn
          }
        }

        if (reload !== undefined) {
          app.mainPage.setModifier(destinationParam, { reload })
        }

        if (pageReload !== undefined) {
          app.mainPage.setModifier(destinationParam, { pageReload })
        }

        if (dataIn !== undefined) {
          app.mainPage.setModifier(destinationParam, { ...dataIn })
        }

        log.grey(`Computed goto params`, {
          destination: destinationParam,
          reload,
          pageReload,
        })

        let { destination, id = '', isSamePage, duration } = parse.destination(
          destinationParam,
        )

        if (destination === destinationParam) {
          app.mainPage.requesting = destination
        }

        log.grey('', {
          destinationParam,
          destination,
          duration,
          id,
          isSamePage,
        })

        if (id) {
          const isInsidePageComponent = isPageConsumer(options.component)
          const node = findByViewTag(id) || findByElementId(id)

          if (node) {
            let win: Window | undefined | null
            let doc: Document | null | undefined
            if (document.contains?.(node)) {
              win = window
              doc = window.document
            } else {
              win = findWindow((w: any) => {
                if (w) {
                  if ('contentDocument' in w) {
                    doc = (w as any).contentDocument
                  } else {
                    doc = w.document
                  }
                  return doc?.contains?.(node)
                }
                return false
              })
            }
            const scroll = () => {
              if (isInsidePageComponent) {
                scrollToElem(node, { win, doc, duration })
              } else {
                node.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'center',
                })
              }
            }
            if (isSamePage) {
              scroll()
            } else {
              app.mainPage.once(pageEvent.ON_COMPONENTS_RENDERED, scroll)
            }
          } else {
            log.red(
              `Could not search for a DOM node with an identity of "${id}"`,
              {
                node,
                id,
                destination,
                isSamePage,
                duration,
                action,
                options,
              },
            )
          }
        }

        if (!destinationParam?.startsWith?.('http')) {
          app.mainPage.pageUrl = resolvePageUrl({
            destination,
            pageUrl: app.mainPage.pageUrl,
            startPage: app.noodl.cadlEndpoint.startPage,
          })
        } else {
          destination = destinationParam
        }

        if (!isSamePage) {
          if (reload) {
            let urlToGoToInstead = ''
            const parts = app.mainPage.pageUrl.split('-')
            if (parts.length > 1) {
              if (!parts[0].startsWith('index.html')) {
                parts.unshift('index.html?')
                parts.push(destination)
                urlToGoToInstead = parts.join('-')
              }
            } else {
              urlToGoToInstead = 'index.html?' + destination
            }

            window.location.href = urlToGoToInstead
          } else await app.navigate(destination)

          if (!destination) {
            log.func('builtIn')
            log.red(
              'Tried to go to a page but could not find information on the whereabouts',
              { action, ...options },
            )
          }
        }
      },
    })
    .register({
      actionType: 'builtIn',
      funcName: 'redraw',
      async fn(action: Action, options: ConsumerOptions) {
        log.func('redraw')
        log.red('', { action, options })

        const viewTag = action?.original?.viewTag || ''

        const components = Object.values(
          NUI.cache.component.get() || {},
        ).reduce((acc: NUIComponent.Instance[], c: any) => {
          if (c && c.get('viewTag') === viewTag) return acc.concat(c)
          return acc
        }, [])

        const { component } = options

        if (
          viewTag &&
          component?.get('viewTag') === viewTag &&
          !components.includes(component as NUIComponent.Instance)
        ) {
          components.push(component as NUIComponent.Instance)
        }

        if (!components.length) {
          log.red(`Could not find any components to redraw`, {
            action,
            ...options,
            component,
          })
        } else {
          log.grey(`Redrawing ${components.length} components`, components)
        }

        let startCount = 0

        while (startCount < components.length) {
          const viewTagComponent = components[
            startCount
          ] as NUIComponent.Instance
          const node = findByElementId(viewTagComponent)
          const dataObject = findListDataObject(viewTagComponent)
          const [newNode, newComponent] = app.ndom.redraw(
            node as HTMLElement,
            viewTagComponent,
          )
          NUI.cache.component.add(newComponent)
          startCount++
        }

        log.red(`COMPONENT CACHE SIZE: ${NUI.cache.component.length}`)
      },
    })
  /* -------------------------------------------------------
    ---- NODE RESOLVERS
  -------------------------------------------------------- */
  app.ndom
    .register({
      name: 'data-value (sync with sdk)',
      cond: (node) => isTextFieldLike(node),
      resolve(node, component) {
        // Attach an additional listener for data-value elements that are expected
        // to change values on the fly by some "on change" logic (ex: input/select elements)
        return import('../utils/sdkHelpers').then(
          ({ createOnDataValueChangeFn }) => {
            ;(node as NOODLDOMElement)?.addEventListener(
              'change',
              createOnDataValueChangeFn(
                node as NOODLDOMDataValueElement,
                component,
                {
                  onChange: component.get('onChange'),
                  eventName: 'onchange',
                },
              ),
            )
            if (component.get('onBlur')) {
              ;(node as NOODLDOMElement)?.addEventListener(
                'blur',
                createOnDataValueChangeFn(
                  node as NOODLDOMDataValueElement,
                  component,
                  {
                    onBlur: component.get('onBlur'),
                    eventName: 'onblur',
                  },
                ),
              )
            }
          },
        )
      },
    })
    .register({
      name: 'image',
      cond: 'image',
      async resolve(node, component) {
        const img = node as HTMLImageElement
        const parent = component.parent
        const pageObject = NUI.getRoot()[NUI.getRootPage()?.page || ''] || {}
        if (
          img?.src === pageObject?.docDetail?.document?.name?.data &&
          pageObject?.docDetail?.document?.name?.type == 'application/pdf'
        ) {
          img?.style && (img.style.visibility = 'hidden')
          const parentNode = findByElementId(parent)
          const iframeEl = document.createElement('iframe')
          iframeEl.setAttribute('src', img.src)
          if (isPlainObject(component.style)) {
            Object.entries(component.style).forEach(
              ([k, v]) => (iframeEl.style[k as any] = v),
            )
          }
          parentNode?.appendChild(iframeEl)
        }
      },
    })
    .register({
      name: 'textField (password + non password)',
      cond: 'textField',
      resolve(node: any, component: any) {
        // Password inputs
        if (component.contentType === 'password') {
          if (!node?.dataset.mods?.includes('[password.eye.toggle]')) {
            import('../app/noodl-ui').then(() => {
              const assetsUrl = NUI.getAssetsUrl() || ''
              const eyeOpened = assetsUrl + 'makePasswordVisiable.png'
              const eyeClosed = assetsUrl + 'makePasswordInvisible.png'
              const originalParent = node?.parentNode as HTMLDivElement
              const newParent = document.createElement('div')
              const eyeContainer = document.createElement('button')
              const eyeIcon = document.createElement('img')

              // Transfering the positioning/sizing attrs to the parent so we can customize with icons and others
              const dividedStyleKeys = [
                'position',
                'left',
                'top',
                'right',
                'bottom',
                'width',
                'height',
              ] as const

              // Transfer styles to the new parent to position our custom elements
              dividedStyleKeys.forEach((styleKey) => {
                newParent.style[styleKey] = component.style?.[styleKey]
                // Remove the transfered styles from the original input element
                node && (node.style[styleKey] = '')
              })

              newParent.style.display = 'flex'
              newParent.style.alignItems = 'center'
              newParent.style.background = 'none'

              node && (node.style.width = '100%')
              node && (node.style.height = '100%')

              eyeContainer.style.top = '0px'
              eyeContainer.style.bottom = '0px'
              eyeContainer.style.right = '6px'
              eyeContainer.style.width = '42px'
              eyeContainer.style.background = 'none'
              eyeContainer.style.border = '0px'
              eyeContainer.style.outline = 'none'

              eyeIcon.style.width = '100%'
              eyeIcon.style.height = '100%'
              eyeIcon.style.userSelect = 'none'

              eyeIcon.setAttribute('src', eyeClosed)
              eyeContainer.setAttribute(
                'title',
                'Click here to reveal your password',
              )
              node && node.setAttribute('type', 'password')
              node && node.setAttribute('data-testid', 'password')

              // Restructing the node structure to match our custom effects with the
              // toggling of the eye iconsf

              if (originalParent) {
                if (originalParent.contains(node))
                  originalParent.removeChild(node)
                originalParent.appendChild(newParent)
              }
              eyeContainer.appendChild(eyeIcon)
              newParent.appendChild(node)
              newParent.appendChild(eyeContainer)

              let selected = false

              eyeIcon.dataset.mods = ''
              eyeIcon.dataset.mods += '[password.eye.toggle]'
              eyeContainer.onclick = () => {
                if (selected) {
                  eyeIcon.setAttribute('src', eyeOpened)
                  node?.setAttribute('type', 'text')
                } else {
                  eyeIcon.setAttribute('src', eyeClosed)
                  node?.setAttribute('type', 'password')
                }
                selected = !selected
                eyeContainer.title = !selected
                  ? 'Click here to hide your password'
                  : 'Click here to reveal your password'
              }
            })
          }
        } else {
          // Set to "text" by default
          node.setAttribute('type', 'text')
        }
      },
    })

  log.grey('Registered noodl-ui-dom listeners')

  let componentCacheSize = 0

  /** Shared common logic for both lock/logout logic */
  async function _onLockLogout() {
    const dataValues = getDataValues() as { password: string }
    const hiddenPwLabel = getByDataUX('passwordHidden') as HTMLDivElement
    const password = dataValues.password || ''
    // Reset the visible status since this is a new attempt
    if (hiddenPwLabel) {
      const isVisible = hiddenPwLabel.style.visibility === 'visible'
      if (isVisible) hiddenPwLabel.style.visibility = 'hidden'
    }
    // Validate if their password is correct or not
    const { Account } = await import('@aitmed/cadl')
    const isValid = Account.verifyUserPassword(password)
    if (!isValid) {
      console.log(`%cisValid ?`, 'color:#e74c3c;font-weight:bold;', isValid)
      if (hiddenPwLabel) hiddenPwLabel.style.visibility = 'visible'
      else window.alert('Password is incorrect')
      return 'abort'
    }
    if (hiddenPwLabel) hiddenPwLabel.style.visibility = 'hidden'
  }

  return app.ndom
}

/* -------------------------------------------------------
  ---- Built in funcs below are for the SDK
-------------------------------------------------------- */

// This goes on the SDK
export function onVideoChatBuiltIn({
  joinRoom,
}: {
  joinRoom: (token: string) => Promise<any>
}) {
  return async function onVideoChat(
    action: BuiltInActionObject & {
      roomId: string
      accessToken: string
    },
  ) {
    try {
      if (action) {
        let msg = ''
        if (action.accessToken) msg += 'Received access token '
        if (action.roomId) msg += 'and room id'
        log.func('onVideoChat').grey(msg, action)
      } else {
        log.func('onVideoChat')
        log.red(
          'Expected an action object but the value passed in was null or undefined',
          action,
        )
      }

      // Disconnect from the room if for some reason we
      // are still connected to one
      // if (room.state === 'connected' || room.state === 'reconnecting') {
      //   room?.disconnect?.()
      //   if (connecting) setConnecting(false)
      // }
      if (action?.roomId) log.grey(`Connecting to room id: ${action.roomId}`)
      const newRoom = (await joinRoom(action.accessToken)) as Room
      if (newRoom) {
        log.func('onVideoChat')
        log.green(`Connected to room: ${newRoom.name}`, newRoom)
        // TODO - read VideoChat.micOn and VideoChat.cameraOn and use those values
        // to initiate the default values for audio/video default enabled/disabled state
        const { default: noodl } = await import('../app/noodl')
        const { cameraOn, micOn } = noodl.root.VideoChat || {}
        const { localParticipant } = newRoom

        const toggle = (state: 'enable' | 'disable') => (
          tracks: Map<
            string,
            LocalVideoTrackPublication | LocalAudioTrackPublication
          >,
        ) => {
          tracks.forEach((publication) => {
            publication?.track?.[state]?.()
          })
        }
        const enable = toggle('enable')
        const disable = toggle('disable')

        if (isNOODLBoolean(cameraOn)) {
          if (isBooleanTrue(cameraOn)) {
            enable(localParticipant?.videoTracks)
          } else if (isBooleanFalse(cameraOn)) {
            disable(localParticipant?.videoTracks)
          }
        } else {
          // Automatically disable by default
          disable(localParticipant?.videoTracks)
        }
        if (isNOODLBoolean(micOn)) {
          if (isBooleanTrue(micOn)) {
            enable(localParticipant?.audioTracks)
          } else if (isBooleanFalse(micOn)) {
            disable(localParticipant?.audioTracks)
          }
        } else {
          // Automatically disable by default
          disable(localParticipant?.audioTracks)
        }
      } else {
        log.func('onVideoChat')
        log.red(
          `Expected a room instance to be returned but received null or undefined instead`,
          newRoom,
        )
      }
    } catch (error) {
      console.error(error)
      window.alert(`[${error.name}]: ${error.message}`)
    }

    stable && log.cyan(`Initialized builtIn funcs`)
  }
}

export default createBuiltInActions
