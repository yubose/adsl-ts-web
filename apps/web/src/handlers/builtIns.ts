import * as u from '@jsmanifest/utils'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import { isAction } from 'noodl-action-chain'
import 'firebase/auth'
import { firebase as firebaseConfig } from '../app/config'
import firebase from 'firebase/app'
import {
  BASE_PAGE_URL,
  eventId as ndomEventId,
  findListDataObject,
  findIteratorVar,
  findByViewTag,
  findByUX,
  findFirstBySelector,
  findFirstByElementId,
  findWindow,
  getDataValues,
  isPage as isNuiPage,
  isPageConsumer,
  NuiComponent,
  NDOMPage,
  resolvePageComponentUrl,
  Store,
  Viewport as VP,
  isListConsumer,
  ConsumerOptions,
  findParent,
  asHtmlElement,
  isNDOMPage,
  eventId,
} from 'noodl-ui'
import QRCode from 'qrcode'
import { BuiltInActionObject, EcosDocument } from 'noodl-types'
import log from '../log'
import {
  download,
  exportToPDF,
  isVisible,
  hide,
  show,
  scrollToElem,
  toast,
} from '../utils/dom'
import {
  getActionMetadata,
  hasAbortPopup,
  logError,
  pickActionKey,
  throwError,
} from '../utils/common'
import * as perf from '../utils/performance'
import is from '../utils/is'
import App from '../App'
import { useGotoSpinner } from './shared/goto'
import { Room } from '../app/types'
import type { Format as PdfPageFormat } from '../modules/ExportPdf'
import * as c from '../constants'
import axios from 'axios'
import isLocalReference from 'noodl-types/dist/utils/isLocalReference'
import isRootReference from 'noodl-types/dist/utils/isRootReference'
import { createToast, destroyAllToasts } from '../utils/chatToast'
const _pick = pickActionKey

const createBuiltInActions = function createBuiltInActions(app: App) {
  const { createBuiltInHandler } = app.actionFactory

  const pickNDOMPageFromOptions = (options: ConsumerOptions) =>
    (app.pickNDOMPage(options?.page) || app.mainPage) as NDOMPage

  async function _toggleMeetingDevice(kind: 'audio' | 'video') {
    log.debug(`Toggling ${kind}`)
    const page = app.initPage ? app.initPage : 'VideoChat'
    let devicePath = `${page}.${kind === 'audio' ? 'micOn' : 'cameraOn'}`
    let localParticipant = app.meeting.room.getCurrentUserInfo()
    const userId = localParticipant?.userId
    const isVideoOn = localParticipant?.bVideoOn
    const mediaStream = app.meeting.room.stream
    if (localParticipant && userId && isVideoOn && mediaStream) {
      // for (const publication of localParticipant.tracks.values()) {
      //   if (publication.track.kind === kind) localTrack = publication.track
      // }
      app.updateRoot(async (draft) => {
        // if (localUser) {
        let videoNode = app.selfStream.getVideoElement() as HTMLVideoElement
        if (videoNode && kind === 'video') {
          isVideoOn
            ? (videoNode.style.display = 'none')
            : (videoNode.style.display = 'block')
        }
        if (isVideoOn) {
          // await mediaStream.startVideo({videoElement: videoNode})
          await mediaStream.renderVideo(
            videoNode,
            userId,
            videoNode.width,
            videoNode.height,
            0,
            0,
            3,
          )
        } else {
          await mediaStream.stopRenderVideo(videoNode, userId)
        }
        // localTrack[localTrack.isEnabled ? 'disable' : 'enable']?.()

        // set(draft, devicePath, !localTrack.isEnabled)
        // log.debug(
        //   `Toggled ${kind} ${localTrack.isEnabled ? 'off' : 'on'}`,
        //   localParticipant,
        // )
        // } else {
        //   log.error(
        //     `Tried to toggle ${kind} track on/off for LocalParticipant but a ${kind} ` +
        //       `track was not available`,
        //     app.meeting.localParticipant,
        //   )
        // }
      })
    }
  }
  const copy: Store.BuiltInObject['fn'] = async function onCopy(
    action,
    options,
  ) {
    log.debug('', action?.snapshot?.())
    const viewTag = _pick(action, 'viewTag')
    const node: any = findByViewTag(viewTag)
    if (!node) {
      log.error(`Cannot find a DOM node for viewTag "${viewTag}"`)
    }
    // !node &&
    try {
      if (node) {
        const range = document.createRange()
        range.selectNode(node)
        const select = window.getSelection()
        if (select) {
          select.removeAllRanges()
          select.addRange(range)
          document.execCommand('copy')
          select.removeAllRanges()
          log.debug(`Copy successfully in viewTag "${viewTag}"`)
          // toast('Copy successfully')
        }
      } else {
        log.error(`Copy failed in viewTag "${viewTag}"`)
      }
    } catch (e) {
      log.error(`Copy failed in viewTag "${viewTag}"`)
    }
  }

  const checkField: Store.BuiltInObject['fn'] = async function onCheckField(
    action,
  ) {
    log.debug('', action?.snapshot?.())
    const delay: boolean | number = _pick(action, 'wait')
    const onCheckField = () => {
      u.array(findByUX(_pick(action, 'contentType'))).forEach(
        (n) => n && show(n),
      )
    }
    u.isNum(delay) ? setTimeout(() => onCheckField(), delay) : onCheckField()
  }

  const exportCSV = async function onExportCSV(options: {
    ecosObj?: EcosDocument
    obj?: Object
    viewTag?: string
    format?: PdfPageFormat
    download?: boolean
    open?: boolean
    header?: Array<any>
    fileName?: string
  }) {
    try {
      let listOfData = u.isArr(options) ? options : ([] as any[])
      let title = new Date().toLocaleDateString().replaceAll('/', '-')

      if (u.isObj(options)) {
        if ('ecosObj' in options) {
          listOfData.push(options.ecosObj?.name || {})
          if (options.ecosObj?.name?.title) title = options.ecosObj.name.title
        } else {
          listOfData.push(options)
        }
      } else if (u.isStr(options)) {
        try {
          let data = JSON.parse(options)
          listOfData.push(data)
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          listOfData.push(options)
        }
      }

      let csv = options.obj
      // generate header
      let csvHeader: string | undefined = ''
      if ('header' in options) {
        csvHeader = options.header?.toString()
        csvHeader += '\r\n'
      }
      csv = csvHeader ? csvHeader + csv : csv
      // formate csv in sdk
      // for (const dataObject of listOfData) {
      //   let entries = u.entries(dataObject).map(([k, v]) => [[k, v]])
      //   let numEntries = entries.length

      //   //1st loop is to extract each row
      //   for (let i = 0; i < numEntries; i++) {
      //     let row = ''
      //     //2nd loop will extract each column and convert it in string comma-seprated
      //     for (const index in entries[i]) {
      //       row += '"' + entries[i][index] + '",'
      //     }
      //     row.slice(0, row.length - 1)
      //     //add a line break after each row
      //     csv += row + '\r\n'
      //   }

      //   numEntries && (csv += '\r\n')
      // }

      const link = document.createElement('a')
      link.id = 'lnkDwnldLnk'
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      // @ts-expect-error
      const blob = new Blob([csv], { type: 'text/csv' })
      const csvUrl = URL.createObjectURL(blob)
      let filename = ''
      if ('fileName' in options) {
        filename = `${options.fileName}.csv`
      } else {
        filename =
          `${
            title ||
            `data-${new Date().toLocaleDateString().replaceAll('/', '-')}`
          }` + '.csv'
      }
      link.download = filename
      link.href = csvUrl
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(csvUrl)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      log.error(err)
    }
  }

  /**
   * Initiates a download window to export PDF using the information inside the document object
   * @param { object } options
   * @param { EcosDocument } options.ecosObj - eCOS document object
   */
  const exportPDF: any = async function onExportPDF(options: {
    ecosObj: EcosDocument
    viewTag?: string
    format?: PdfPageFormat
    download?: boolean
    open?: boolean
  }) {
    try {
      log.debug('Downloading PDF file', options)

      // Blob will be returned to sdk and written to dataOut if dataOut is given
      let pdfBlob: Blob | undefined

      const ecosObj = (
        u.isObj(options) && 'ecosObj' in options ? options.ecosObj : options
      ) as EcosDocument

      const viewTag = u.isObj(options) && options.viewTag
      const format = u.isObj(options) ? options.format : undefined
      const fileName = ecosObj.name?.title || ''
      const shouldDownload = u.isBool(options?.download)
        ? options.download
        : true
      const shouldOpen = u.isBool(options?.open) ? options.open : false

      if (viewTag) {
        if (u.isStr(viewTag)) {
          for (const elem of [...u.array(findByViewTag(viewTag))]) {
            if (elem) {
              pdfBlob = await exportToPDF({
                data: elem,
                download: shouldDownload,
                open: shouldOpen,
                filename: fileName,
                format,
              })
            }
          }
        } else if (u.isObj(viewTag)) {
          // Future support
        }
      } else if (u.isObj(ecosObj)) {
        const { name, subtype } = ecosObj
        const mediaType = subtype?.mediaType

        if (u.isObj(name)) {
          const { content, data, title } = name

          if (data) {
            try {
              pdfBlob = await exportToPDF({
                data:
                  is.mediaType.audio(mediaType) ||
                  is.mediaType.font(mediaType) ||
                  is.mediaType.image(mediaType) ||
                  is.mediaType.video(mediaType)
                    ? data
                    : { title: title || (u.isStr(content) && content) || data },
                labels: true,
                download: shouldDownload,
                open: shouldOpen,
                filename: title,
              })
              log.info('Exported successfully')
            } catch (error) {
              log.error(error)
            }
          } else {
            log.error(
              `Tried to export the document to PDF but the "data" property is empty`,
            )
          }
        } else {
          log.error('The name field in an ecosObj was not an object', ecosObj)
        }
      }
      return pdfBlob
    } catch (error) {
      logError(error)
      throwError(error)
    }
  }

  const disconnectMeeting: Store.BuiltInObject['fn'] =
    async function onDisconnectMeeting(action) {
      const selfStream = app.meeting.selfStream.getElement()
      const parent = selfStream?.parentElement
      const cloneNode = selfStream?.cloneNode()

      if (parent) {
        parent.replaceChild(cloneNode, selfStream)
        parent.style.visibility = 'hidden'
      }

      // app.meeting.room?.removeAllListeners?.()
      // app.meeting.leave()
      // app.meeting.room?.disconnect?.()
      app.meeting.leave()
    }

  const goBack: Store.BuiltInObject['fn'] = async function onGoBack(
    action,
    options,
  ) {
    const reload = _pick(action, 'reload')
    let isRunLeave = _pick(action, 'isRunLeave')
    isRunLeave = u.isNil(isRunLeave) ? true : isRunLeave
    const ndomPage = pickNDOMPageFromOptions(options)
    if (isNDOMPage(ndomPage) && isRunLeave) {
      const results = await ndomPage.emitAsync(
        eventId.page.on.ON_NAVIGATE_START,
        ndomPage,
      )
      localStorage.setItem('continueGoto', ndomPage.previous)
      if (u.isArr(results) && hasAbortPopup(results)) return
    }
    if (ndomPage) {
      ndomPage.requesting = ndomPage.previous
      // TODO - Find out why the line below is returning the requesting page instead of the correct one above this line. getPreviousPage is planned to be deprecated
      // app.mainPage.requesting = app.mainPage.getPreviousPage(app.startPage).trim()
      ndomPage.setModifier(ndomPage.previous, {
        reload: is.isBooleanFalse(reload) ? false : true,
        isRunLeave: isRunLeave,
      })
    }

    if (!app.getState().spinner.active) app.enableSpinner()

    window.history.back()
  }

  const hideAction: Store.BuiltInObject['fn'] = async function onHide(action) {
    const viewTag = _pick(action, 'viewTag')
    let wait = _pick(action, 'wait')
    const onElem = (node: HTMLElement) => {
      if (VP.isNil(node.style.top, 'px')) {
        node.style.display !== 'none' && (node.style.display = 'none')
      } else {
        node.style.display === 'none' && (node.style.display = 'block')
      }
    }
    const onHide = () => {
      let elemCount
      elemCount = hide(findByViewTag(viewTag), onElem)
      if (!elemCount) {
        log.error(`Cannot find a DOM node for viewTag "${viewTag}"`)
      }
    }
    !u.isUnd(wait) ? setTimeout(onHide, wait === true ? 0 : wait) : onHide()
  }

  const showAction: Store.BuiltInObject['fn'] = async function onShow(
    action,
    options,
  ) {
    const viewTag = _pick(action, 'viewTag')
    let wait = _pick(action, 'wait') || 0
    const onElem = (node: HTMLElement) => {
      const component = options.component
      if (component && (node.style.top === '0' || node.style.top === '')) {
        !isVisible(node) && (node.style.visibility = 'visible')
        node.style.display === 'none' && (node.style.display = 'block')
      }
    }
    const showNode = (vTag: string) => {
      let elemCount = show(findByViewTag(vTag), onElem)
      if (!elemCount) {
        log.error(`Cannot find a DOM node for viewTag "${vTag}"`)
      }
    }
    if (!u.isUnd(wait)) {
      setTimeout(() => showNode(viewTag), wait === true ? 0 : wait)
    } else showNode(viewTag)
  }

  const toggleCameraOnOff: Store.BuiltInObject['fn'] =
    async function onToggleCameraOnOff(action, options) {
      const { cameraOn } = options
      if (is.isBoolean(cameraOn)) {
        if (is.isBooleanTrue(cameraOn)) {
          void app.selfStream.toggeleSelfCamera('close')
        } else if (is.isBooleanFalse(cameraOn)) {
          void app.selfStream.toggeleSelfCamera('open')
        }
      }
    }

  const toggleMicrophoneOnOff: Store.BuiltInObject['fn'] =
    async function onToggleMicrophoneOnOff(action, options) {
      const { micOn } = options
      if (is.isBoolean(micOn)) {
        if (is.isBooleanTrue(micOn)) {
          void app.selfStream.toggleSelfMicrophone('close')
        } else if (is.isBooleanFalse(micOn)) {
          void app.selfStream.toggleSelfMicrophone('open')
        }
      }
    }
  const getViewTagValue = async function onGetViewTagValue(options: {
    viewTag: string
  }) {
    let viewTagDiv = findByViewTag(options.viewTag) as HTMLElement
    let scrollTop = viewTagDiv.scrollHeight
    return scrollTop
  }
  const toggleFlag: Store.BuiltInObject['fn'] = async function onToggleFlag(
    action,
    options,
  ) {
    try {
      const { component, getAssetsUrl } = options
      const dataKey = _pick(action, 'dataKey') || ''
      const iteratorVar = findIteratorVar(component)
      const node = findFirstByElementId(component)
      const ndomPage = pickNDOMPageFromOptions(options)
      const pageName = ndomPage?.page || ''
      let path = component?.get('path')

      let dataValue: any
      let dataObject: any
      let previousDataValue: boolean | undefined
      let nextDataValue: boolean | undefined
      let newSrc = ''

      if (iteratorVar && dataKey?.startsWith(iteratorVar)) {
        let parts = dataKey.split('.').slice(1)
        dataObject = findListDataObject(component)
        previousDataValue = get(dataObject, parts)
        dataValue = previousDataValue
        if (is.isBoolean(dataValue)) {
          // true -> false / false -> true
          nextDataValue = !is.isBooleanTrue(dataValue)
        } else {
          // Set to true if am item exists
          nextDataValue = !dataValue
        }
        // set(dataObject, parts, nextDataValue)
      } else {
        const onNextValue = (
          prevValue: any,
          { updateDraft }: { updateDraft?: { path: string } } = {},
        ) => {
          let nextValue: any
          if (is.isBoolean(prevValue)) {
            nextValue = !is.isBooleanTrue(prevValue)
          }
          nextValue = !prevValue
          // if (updateDraft) {
          //   app.updateRoot(
          //     (draft) => void set(draft, updateDraft.path, nextValue),
          //   )
          // }
          // Propagate the changes to to UI if there is a path "if" object that
          // references the value as well
          if (node && u.isObj(path)) {
            let valEvaluating = path?.if?.[0]
            // If the dataKey is the same as the the value we are evaluating we can
            // just re-use the nextDataValue
            if (valEvaluating === dataKey) {
              valEvaluating = nextValue
            } else {
              valEvaluating =
                get(app.root, valEvaluating) ||
                get(app.root[pageName], valEvaluating)
            }
            node.setAttribute(
              'src',
              getAssetsUrl() + valEvaluating ? path?.if?.[1] : path?.if?.[2],
            )
          }
          return nextValue
        }

        dataObject = app.root

        if (has(dataObject, dataKey)) {
          previousDataValue = get(dataObject, dataKey)
          onNextValue(previousDataValue, { updateDraft: { path: dataKey } })
        } else if (has(dataObject[pageName], dataKey)) {
          dataObject = dataObject[pageName]
          previousDataValue = get(dataObject, dataKey)
          onNextValue(previousDataValue, {
            updateDraft: {
              path: `${dataKey}${pageName ? `.${pageName}` : ''}`,
            },
          })
        } else {
          log.error(
            `${dataKey} is not a path of the data object. ` +
              `Defaulting to attaching ${dataKey} as a path to the root object`,
            { action: action?.snapshot?.(), dataObject, dataKey },
          )
          previousDataValue = undefined
          nextDataValue = false
          onNextValue(previousDataValue, {
            updateDraft: { path: `${dataKey}.${pageName || ''}` },
          })
        }
      }
      if (/mic/i.test(dataKey)) {
        await app.builtIns
          .get('toggleMicrophoneOnOff')
          ?.find(Boolean)
          ?.fn?.(action, { ...options, micOn: previousDataValue })
      } else if (/camera/i.test(dataKey)) {
        await app.builtIns
          .get('toggleCameraOnOff')
          ?.find(Boolean)
          ?.fn?.(action, { ...options, cameraOn: previousDataValue })
      }

      log.debug('', {
        action: action?.snapshot?.(),
        component,
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
    } catch (error) {
      log.error(error)
      throw error
    }
  }

  const lockApplication: Store.BuiltInObject['fn'] =
    async function onLockApplication(action, options) {
      const result = await _onLockLogout()
      if (result === 'abort') options?.ref?.abort?.()
      await (await import('@aitmed/cadl')).Account.logout(false)
      window.location.reload()
    }

  const logOutOfApplication: Store.BuiltInObject['fn'] =
    async function onLogOutOfApplication(action, options) {
      if ((await _onLockLogout()) === 'abort') options?.ref?.abort?.()
      await (await import('@aitmed/cadl')).Account.logout(true)
      window.location.reload()
    }

  const logout: Store.BuiltInObject['fn'] = async function onLogout(
    action,
    options,
  ) {
    if ((await _onLockLogout()) === 'abort') options?.ref?.abort?.()
    const { Account } = await import('@aitmed/cadl')
    await Account.logout(true)
    window.location.reload()
  }

  const goto = createBuiltInHandler(
    useGotoSpinner(app, async function onGoto(action, options) {
      if (!app.getState().spinner.active) app.enableSpinner()

      let destinationParam = ''
      let reload: boolean | undefined
      let pageReload: boolean | undefined // If true, gets passed to sdk initPage to disable the page object's "init" from being run
      let ndomPage = pickNDOMPageFromOptions(options)
      let dataIn: any // sdk use

      let destProps: ReturnType<typeof app.parse.destination>
      let destination = ''
      let id = ''
      let isSamePage = false
      let duration = 350
      let isRunLeave: boolean = true
      if (_pick(action, 'blank') && _pick(action, 'goto')) {
        app.disableSpinner()
        options?.ref?.abort() as any
        let a = document.createElement('a')
        a.style.display = 'none'
        a.href = _pick(action, 'goto')
        a.target = '_blank'
        a.click()
        a = null as any
        return
      }

      if (u.isStr(action)) {
        destinationParam = action
      } else if (isAction(action)) {
        const gotoObj = action?.original
        if (u.isStr(gotoObj)) {
          destinationParam = gotoObj
        } else if (u.isObj(gotoObj)) {
          if ('goto' in gotoObj) {
            if (u.isObj(gotoObj.goto)) {
              destinationParam = _pick(gotoObj.goto, 'destination')
              'reload' in gotoObj.goto &&
                (reload = _pick(gotoObj.goto, 'reload'))
              'pageReload' in gotoObj.goto &&
                (pageReload = _pick(gotoObj.goto, 'pageReload'))
              'dataIn' in gotoObj.goto &&
                (dataIn = _pick(gotoObj.goto, 'dataIn'))
              'isRunLeave' in gotoObj.goto &&
                (isRunLeave = _pick(gotoObj.goto, 'isRunLeave'))
            } else if (u.isStr(gotoObj.goto)) {
              destinationParam = gotoObj.goto
            }
          } else if (u.isObj(gotoObj)) {
            destinationParam = gotoObj.destination
            'reload' in gotoObj && (reload = gotoObj.reload)
            'pageReload' in gotoObj && (pageReload = gotoObj.pageReload)
            'dataIn' in gotoObj && (dataIn = gotoObj.dataIn)
            'isRunLeave' in gotoObj && (isRunLeave = gotoObj.isRunLeave)
          }
        }
      } else if (u.isObj(action)) {
        if ('destination' in action || 'goto' in action) {
          destinationParam = _pick(action, 'destination', _pick(action, 'goto'))
          'reload' in action && (reload = _pick(action, 'reload'))
          'pageReload' in action && (pageReload = _pick(action, 'pageReload'))
          'dataIn' in action && _pick(action, 'dataIn')
          'isRunLeave' in action && (isRunLeave = _pick(action, 'isRunLeave'))
        }
      }

      // @ts-expect-error
      destProps = app.parse.destination(
        is.pageComponentUrl(destinationParam)
          ? resolvePageComponentUrl({
              component: options?.component,
              page: ndomPage.getNuiPage(),
              localKey: ndomPage.page,
              root: app.root,
              key: 'goto',
              value: destinationParam,
            })
          : destinationParam,
      )

      /** PARSE FOR DESTINATION PROPS */

      if ('destination' in destProps) {
        destination = destProps.destination || ''
        id = destProps.id || id
        isSamePage = !!destProps.isSamePage
        duration = destProps.duration || duration
        ndomPage = options?.page
        const pageComponentParent = is.component.page(options?.component)
          ? options.component
          : findParent(options?.component, is.component.page)

        if (!ndomPage || isNuiPage(ndomPage)) {
          ndomPage =
            // @ts-expect-error
            app.ndom.findPage(pageComponentParent || options?.component) ||
            app.mainPage
        }
      } else if ('targetPage' in destProps) {
        // @ts-expect-error
        destination = destProps.targetPage || ''
        // @ts-expect-error
        id = destProps.viewTag || ''
        if (id) {
          const pageNode = findByViewTag(id)
          const pageComponent = Array.from(app.cache.component || [])?.find(
            (obj) => obj?.component?.blueprint?.viewTag === id,
          )?.component
          if (pageNode) {
            if (pageNode instanceof HTMLIFrameElement) {
              //
            }
          }
          const currentPageName = pageComponent?.get?.('path')
          ndomPage = app.ndom.findPage(currentPageName) as NDOMPage
        }
      }

      //find reference value
      if (isLocalReference(destination)) {
        destination = destination.substring(2)
        app.initPage && (destination = get(app.root[app.initPage], destination))
      } else if (isRootReference(destination)) {
        destination = destination.substring(1)
        destination = get(app.root, destination)
      }

      if (destination === destinationParam) {
        ndomPage.requesting = destination
      }

      if (!u.isNil(reload)) {
        // reload = is.isBooleanFalse(reload) ? false : true
        ndomPage.setModifier(destinationParam, {
          reload,
        })
      }

      if (!u.isUnd(pageReload)) {
        ndomPage.setModifier(destinationParam, { pageReload })
      }
      if (!u.isUnd(dataIn)) {
        ndomPage.setModifier(destinationParam, { ...dataIn })
      }

      log.debug(`Goto info`, {
        action: action?.snapshot?.(),
        ...destProps,
        destinationParam,
        reload,
        pageReload,
        isRunLeave,
      })

      if (destination.startsWith('http')) {
        // This is for testing in mobile mode to prevent the auto-redirection to google play store
        // return
      }

      if (id) {
        const isInsidePageComponent =
          // @ts-expect-error
          isPageConsumer(options?.component) || !!destProps.targetPage
        const node = findByViewTag(id) || findFirstByElementId(id)

        if (node) {
          let win: Window | null | undefined
          let doc: Document | null | undefined
          if (document.contains?.(node as HTMLElement)) {
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
                return doc?.contains?.(node as HTMLElement)
              }
              return false
            })
          }
          const scroll = () => {
            if (isInsidePageComponent) {
              scrollToElem(node, { win, doc, duration })
            } else {
              ;(node as HTMLElement).scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
              })
            }
          }
          if (isSamePage) {
            scroll()
          } else {
            ndomPage.once(ndomEventId.page.on.ON_COMPONENTS_RENDERED, scroll)
          }
        } else {
          log.error(
            `Could not search for a DOM node with an identity of "${id}"`,
            {
              action: action?.snapshot?.(),
              node,
              id,
              destination,
              isSamePage,
              duration,
              options,
            },
          )
        }
      }
      if (isNDOMPage(ndomPage) && isRunLeave) {
        const results = await ndomPage.emitAsync(
          eventId.page.on.ON_NAVIGATE_START,
          ndomPage,
        )
        if (!destinationParam.startsWith('http')) {
          localStorage.setItem('continueGoto', destination)
        } else {
          localStorage.setItem('continueGoto', destinationParam)
        }
        if (u.isArr(results) && hasAbortPopup(results)) return
      }
      if (!destinationParam.startsWith('http')) {
        const originUrl = ndomPage.pageUrl
        ndomPage.pageUrl = app.parse.queryString({
          destination,
          pageUrl: ndomPage.pageUrl,
          startPage: app.startPage,
        })
      } else {
        destination = destinationParam
        // if (/apple|store/i.test(destination)) destination = 'SignIn'
      }

      if (!isSamePage) {
        if (reload) {
          let urlToGoToInstead = ''
          const parts = ndomPage.pageUrl.split('-')
          if (parts.length > 1) {
            if (!parts[0].startsWith('index.html')) {
              parts.unshift(BASE_PAGE_URL)
              parts.push(destination)
              urlToGoToInstead = parts.join('-')
            }
          } else {
            urlToGoToInstead = BASE_PAGE_URL + destination
          }
          window.location.href = urlToGoToInstead
        } else {
          if (ndomPage.node && ndomPage.node instanceof HTMLIFrameElement) {
            if (ndomPage.node.contentDocument?.body) {
              ndomPage.node.contentDocument.body.textContent = ''
            }
          }
          await app.navigate(
            ndomPage,
            destination,
            { isGoto: true },
            destinationParam.startsWith('http') ? true : false,
          )
        }

        if (!destination) {
          log.error(
            'Tried to go to a page but could not find information on the whereabouts',
            { action, snapshot: action?.snapshot?.(), ...options },
          )
        }
      }
    }),
  )

  const redraw: Store.BuiltInObject['fn'] = async function onRedraw(
    action,
    options,
  ) {
    const component = options?.component as NuiComponent.Instance
    const viewTag = component
      ? getActionMetadata(action, { component, pickKeys: 'viewTag' })?.[
          'viewTag'
        ]
      : { fromAction: options['viewTag'], fromComponent: undefined }

    let components = [] as NuiComponent.Instance[]
    let numComponents = 0
    let focus = action.original?.focus || action?.['focus']

    for (const obj of app.cache.component) {
      if (obj) {
        if (
          obj.component?.blueprint?.viewTag &&
          obj.component?.get?.('data-viewtag') === viewTag.fromAction
        ) {
          components.push(obj.component)
          numComponents++
        }
      }
    }

    if (
      viewTag.fromComponent === viewTag.fromAction &&
      !components.includes(component)
    ) {
      components.push(component) && numComponents++
    }

    try {
      if (!numComponents) {
        log.error(
          `Could not find any components to redraw, please check yaml ,viewTag is:`,
          `${JSON.stringify(action)}`,
          action?.snapshot?.(),
        )
      } else {
        log.debug(`Redrawing ${numComponents} components`, {
          components,
          nodes: components.map((c) => findFirstBySelector(`#${c?.id}`)),
        })
      }

      for (const _component of components) {
        const _node = findFirstBySelector(`#${_component?.id}`)
        if (!_node) {
          log.error(
            `Tried to redraw a ${_component.type} component node from the DOM but the DOM node did not exist`,
            { component: _component, node: _node },
          )
        } else {
          const ctx = {} as any
          if (isListConsumer(_component)) {
            const dataObject = findListDataObject(_component)
            dataObject && (ctx.dataObject = dataObject)
            if (is.component.list(_component)) {
              ctx.listObject =
                _component.get?.('listObject') ||
                _component.blueprint?.listObject ||
                _component?.['listObject']
              ctx.index = 0
              ctx.dataObject = ctx.listObject?.[0]
              ctx.iteratorVar = _component.blueprint?.iteratorVar
            }
          }
          const ndomPage = pickNDOMPageFromOptions(options)
          await app.ndom.redraw(
            _node,
            _component,
            ndomPage,
            {
              context: ctx,
            },
            { focus },
          )
          if (
            [window.build.nodeEnv, window.build.build_web].includes(
              'development',
            )
          ) {
            // try {
            //   const port = (
            //     await fetch('./truthPort.json').then(
            //       (res) => res.json(),
            //       (rej) => console.error('error'),
            //     )
            //   )?.['port']
            //   axios({
            //     url: `http://127.0.0.1:${port}`,
            //     method: 'POST',
            //     headers: {
            //       'Content-Type': 'text/plain',
            //     },
            //     data: app.root,
            //   }).catch((e) => console.error(e))
            // } catch (e) {
            //   console.error(e)
            // }
          }
        }
      }

      // await Promise.all(
      //   components.map(async function redrawComponents(_component) {
      //     const _node = findFirstBySelector(`#${_component?.id}`)
      //     if (!_node) {
      //       log.func('redraw')
      //       log.error(
      //         `Tried to redraw a ${_component.type} component node from the DOM but the DOM node did not exist`,
      //         { component: _component, node: _node },
      //       )
      //     } else {
      //       const ctx = {} as any
      //       if (isListConsumer(_component)) {
      //         const dataObject = findListDataObject(_component)
      //         dataObject && (ctx.dataObject = dataObject)
      //       }
      //       const ndomPage = pickNDOMPageFromOptions(options)
      //       const redrawed = await app.ndom.redraw(
      //         _node,
      //         _component,
      //         ndomPage,
      //         { context: ctx },
      //       )
      //       debugger
      //       return redrawed
      //     }
      //   }),
      // )
    } catch (error) {
      log.error(error)
      error instanceof Error && toast(error.message, { type: 'error' })
    }
    log.debug(`COMPONENT CACHE SIZE: ${app.cache.component.length}`)
  }

  const redrawCurrent: Store.BuiltInObject['fn'] =
    async function onRedrawCurrent(action, options) {
      const component = options?.component as NuiComponent.Instance
      const metadata = getActionMetadata(action, {
        component,
        pickKeys: 'viewTag',
      })
      const { viewTag } = metadata
      try {
        let _component
        if (component?.get?.('data-viewtag') === viewTag.fromAction) {
          _component = component as NuiComponent.Instance
        } else {
          let newComponent = component
          while (newComponent && !_component) {
            newComponent = newComponent?.parent as NuiComponent.Instance
            if (
              newComponent?.blueprint?.viewTag &&
              newComponent?.get?.('data-viewtag') === viewTag.fromAction
            ) {
              _component = newComponent as NuiComponent.Instance
            }
          }
        }

        if (_component) {
          log.error(`Redrawing current component`, {
            _component,
          })
          const _node = findFirstBySelector(`#${_component?.id}`)
          if (!_node) {
            log.error(
              `Tried to redraw a ${_component.type} component node from the DOM but the DOM node did not exist`,
              { component: _component, node: _node },
            )
          } else {
            const ctx = {} as any
            if (isListConsumer(_component)) {
              const dataObject = findListDataObject(_component)
              dataObject && (ctx.dataObject = dataObject)
              if (is.component.list(_component)) {
                ctx.listObject =
                  _component.get?.('listObject') ||
                  _component.blueprint?.listObject ||
                  _component?.['listObject']
                ctx.index = 0
                ctx.dataObject = ctx.listObject?.[0]
                ctx.iteratorVar = _component.blueprint?.iteratorVar
              }
            }
            const ndomPage = pickNDOMPageFromOptions(options)
            await app.ndom.redraw(_node, _component, ndomPage, {
              context: ctx,
            })
          }
        } else {
          log.error(
            `Could not find any components to redraw`,
            action?.snapshot?.(),
          )
        }
      } catch (error) {
        log.error(error)
        error instanceof Error && toast(error.message, { type: 'error' })
      }
    }

  const dismissOnTouchOutside: Store.BuiltInObject['fn'] =
    async function onDismissOnTouchOutside(action, options) {
      const component = options?.component as NuiComponent.Instance
      const metadata = getActionMetadata(action, {
        component,
        pickKeys: 'viewTag',
      })
      const { viewTag } = metadata
      if (viewTag) {
        const node = findByViewTag(viewTag.fromAction) as HTMLElement
        const onTouchOutside = function onTouchOutside(
          this: HTMLDivElement,
          e: Event,
        ) {
          e.preventDefault()
          node?.style && (node.style.display = 'none')
          document.body.removeEventListener('click', onTouchOutside)
        }
        document.body.addEventListener('click', onTouchOutside)
      }
    }

  const extendMeeting: Store.BuiltInObject['fn'] =
    async function onExtendMeeting(action, options) {
      let numberofExtensions = app.register.numberofExtensions
      let timePerExtendSeconds = _pick(action, 'timePerExtendSeconds')
      let oldTimePerExtendSeconds = app.register.timePerExtendSeconds
      app.register.timePerExtendSeconds = timePerExtendSeconds
      app.register.numberofExtensions = numberofExtensions - 1
      const popUpWaitSeconds = 30
      let remainTime = oldTimePerExtendSeconds - popUpWaitSeconds
      log.log(remainTime, numberofExtensions)
      if (remainTime > 0 && numberofExtensions >= 0) {
        app.register.removeTime('extendVideoChatTime')
        app.register.removeTime('PopUPTimeInterval')
        app.register.removeTime('PopUPToDisconnectTime')
        const id = setTimeout(() => {
          app.meeting.room.state === 'connected' &&
            app.register.extendVideoFunction('showExtendView')
          clearTimeout(id)
        }, remainTime * 1000)
        app.register.setTimeId('extendVideoChatTime', id)
      } else {
        log.log(
          'The meeting might had already ended. Please reschedule or cancel it.',
        )
        app.meeting.leave()
        app.register.extendVideoFunction('onDisconnect')
      }
    }
  const routeRediredct: Store.BuiltInObject['fn'] =
    async function onRouteRediredct(action, options) {
      let pageNames = _pick(action, 'pageNames')
      let routeStr: string = ''
      if (u.isArr(pageNames)) {
        let url = window.location.href
        const parts = url.split('?')
        const basePart = parts[0]
        const oldRouteStr = parts[1]
        u.reduce(
          pageNames,
          (acc, key) =>
            (routeStr = `${routeStr ? routeStr + '-' : routeStr}${key}`),
          '',
        )
        if (oldRouteStr !== routeStr)
          app.mainPage.pageUrl = `${basePart}?${routeStr}`
      }
    }
  const delayTask: Store.BuiltInObject['fn'] = async function onDelayTask(
    action,
    options,
  ) {
    const onEvent = _pick(action, 'onEvent')
    const delayTime = _pick(action, 'delayTime')
    const id = setTimeout(() => {
      app.register.extendVideoFunction(onEvent)
      clearTimeout(id)
    }, delayTime)
  }
  const switchCamera: Store.BuiltInObject['fn'] = async function onSwitchCamera(
    action,
    options,
  ) {
    log.debug('switchCamera', options)
    try {
      void app.selfStream.switchCamera()
    } catch (error) {
      log.error(error)
    }
  }
  const countDown = async function onCountDown(options: {
    viewTag: string
    timeFormat: string
    time: number | string
    color: string
    pointerEvents: string
    resendText: string
  }) {
    if (options.time <= 0) return
    let viewTagDiv = findByViewTag(options.viewTag) as HTMLElement
    let oldColor = viewTagDiv.style.color
    let oldTextContent = viewTagDiv.textContent
    viewTagDiv.style.color = options.color
    viewTagDiv.style.pointerEvents = options.pointerEvents
    viewTagDiv.textContent = `Resend (${(options.time as number)--}s)`
    // log.error('oldTextContent');
    // log.error(oldTextContent);
    const attributeTimeOut = setInterval(() => {
      if (options.time <= 0) {
        viewTagDiv.style.color = oldColor
        viewTagDiv.textContent = options.resendText
        viewTagDiv.style.pointerEvents = 'auto'
        clearInterval(attributeTimeOut)
      } else {
        viewTagDiv.textContent = `Resend (${(options.time as number)--}s)`
      }
    }, 1000)
    return
  }
  const toast = async function onToast(action, options) {
    const components = options.components
    const container = document.createElement('div')
    container.id = 'toast-innerHTML'
    if (u.isArr(components) && app.initPage) {
      const page = app.mainPage.getNuiPage()
      for (let i = 0; i < components.length; i++) {
        const component = components[i]
        const obj = await app.noodl.replaceEvalObject({
          pageName: app.initPage,
          cadlObject: component,
          dispatch: app.noodl.dispatch,
        })
        let newComponent = app.nui.createComponent(obj, page)
        newComponent = await app.nui.resolveComponents?.({
          callback: options?.callback,
          components: newComponent,
          page,
          context: {},
          on: {},
        })
        await app.ndom.draw(newComponent, container, app.mainPage, {
          ...options,
          on: options?.on,
          context: {},
          nodeIndex: i,
        })
      }
    }

    const left = options.left ? options.left : 0
    const top = options.top ? options.top : 0
    //@ts-expect-error
    const newTop = app.nui?.getSize?.(`${1 - parseFloat(top)}`, 'height')
    //@ts-expect-error
    const newLeft = app.nui?.getSize?.(left, 'width')
    createToast(container, {
      timeout: 2000,
      groupId: 'chat-toast-contrainer',
      groupStyle: {
        bottom: `${newTop}`,
        left: `${newLeft}`,
      },
    })
    container.addEventListener('click', () => {
      destroyAllToasts()
    })
  }

  const mute = async function onMute(action, options) {
    const isMuted = app.calling.call.isMuted()
    app.calling.call.mute(!isMuted)
  }
  const disconnectCall = async function onDisconnectCall(action, options) {
    app.calling.leave()
  }
  const builtIns = {
    checkField,
    disconnectMeeting,
    exportCSV,
    exportPDF,
    goBack,
    hide: hideAction,
    show: showAction,
    toggleCameraOnOff,
    toggleMicrophoneOnOff,
    toggleFlag,
    lockApplication,
    logOutOfApplication,
    logout,
    goto,
    redraw,
    redrawCurrent,
    copy,
    routeRediredct,
    dismissOnTouchOutside,
    extendMeeting,
    delayTask,
    getViewTagValue,
    countDown,
    switchCamera,
    toast,
    mute,
    disconnectCall,
  }

  /** Shared common logic for both lock/logout logic */
  async function _onLockLogout() {
    const dataValues = getDataValues() as { password: string }
    const hiddenPwLabel = findByUX('passwordHidden') as HTMLDivElement
    const password = dataValues.password || ''
    // Reset the visible status since this is a new attempt
    if (hiddenPwLabel) {
      const isVisible = hiddenPwLabel.style.visibility === 'visible'
      if (isVisible) hiddenPwLabel.style.visibility = 'hidden'
    }
    // Validate if their password is correct or not
    const isValid = (
      await import('@aitmed/cadl')
    ).Account?.verifyUserPassword?.(password) // @ts-expect-error
    if (!isValid) {
      log.log(`%cisValid ?`, 'color:#e74c3c;font-weight:bold;', isValid)
      if (hiddenPwLabel) hiddenPwLabel.style.visibility = 'visible'
      else {
        toast('Password is incorrect', { type: 'error' })
      }
      return 'abort'
    }
    if (hiddenPwLabel) hiddenPwLabel.style.visibility = 'hidden'
  }

  return builtIns as Record<keyof typeof builtIns, Store.BuiltInObject['fn']>
}

/* -------------------------------------------------------
  ---- Built in funcs below are for the SDK (most likely passed to initPage)
---------------------------------------------------------- */

// These get attached to the level 2 sdk's "builtIn" prop during initPage
export const extendedSdkBuiltIns = {
  /**
   * Called when user clicks the download icon. The passed in args should contain
   * the ecosObj that contains the file data
   */
  download(
    this: App,
    { ecosObj, fileName }: { ecosObj?: EcosDocument<any>; fileName?: string },
  ) {
    if (!ecosObj) {
      return log.error(
        `Cannot prompt with the download dialog because the "ecosObj" ` +
          `object was passed in as typeof "${typeof ecosObj}"`,
        ecosObj,
      )
    }
    if (!ecosObj.name?.data || !u.isStr(ecosObj.name?.data)) {
      return log.error(
        `Tried to prompt a download window for the user but the "data" ` +
          `field in the name object is empty`,
        ecosObj,
      )
    }
    let ext = ''
    // let filename = (ecosObj.name.title || '') as string
    let mimeType = (ecosObj.name.type || '') as string
    let data

    if (mimeType && u.isStr(mimeType)) {
      // Assuming these are note docs since we are storing their data in json
      if (mimeType.endsWith('json')) {
        ext = '.txt'
        const title = ecosObj.name.title || ''
        const body = ecosObj.name.data || ''
        const note = `${title}\n\n${body}`
        data = new Blob([note], { type: 'text/plain' })
      } else {
        ext = mimeType.substring(mimeType.lastIndexOf('/')).replace('/', '.')
      }
    }

    // ext && u.isStr(filename) && (filename += ext)
    !data && (data = ecosObj.name?.data || '')
    !fileName && (fileName = ecosObj.name.title)
    // log.log(ecosObj.name.title,"kkkk")
    return download(data, fileName)
  },
  downloadQRCode(
    this: App,
    {
      content,
      scale,
      viewTag,
      fileName,
    }: {
      content?: any
      scale?: number
      viewTag?: string
      fileName?: string
    } = {},
  ) {
    // Generate QRCode image
    let ext = ''
    let filename = (fileName || 'QRCode') as string
    let mimeType = ('image/png' || '') as string
    ext = mimeType.substring(mimeType.lastIndexOf('/')).replace('/', '.')
    ext && u.isStr(filename) && (filename += ext)

    if (viewTag) {
      const node = findByViewTag(viewTag) as HTMLElement
      let imgArr = node.getElementsByTagName('img')
      for (let i = 0; i < imgArr.length; i++) {
        imgArr[i].setAttribute('crossOrigin', 'anonymous')
      }
      void html2canvas(node, {
        allowTaint: true, //跨域
        useCORS: true, //跨域
      }).then((canvas) => {
        let url = canvas.toDataURL(mimeType)
        return download(url, filename)
      })
    } else {
      let text = content
      if (u.isObj(content)) text = JSON.stringify(content)

      let opts: Record<string, any> = {
        errorCorrectionLevel: 'H',
        type: 'svg',
        quality: 0.3,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        scale: scale,
      }

      QRCode.toDataURL(text, opts, function (err, url) {
        if (err) throw err
        return download(url, filename)
      })
    }
  },
  async signInWithGoogle(this: App) {
    return new Promise(async (resolve, reject) => {
      await firebase.auth().signOut()
      const provider = new firebase.auth.GoogleAuthProvider()
      firebase
        .auth()
        .signInWithPopup(provider)
        .then(async (result) => {
          const user = result?.user
          const profile = result?.additionalUserInfo?.profile
          // const credential = result?.credential
          // @ts-expect-error
          const { email, name, given_name, family_name } = profile
          const uid = user?.uid
          const idToken = await user?.getIdToken()
          resolve({
            userID: uid,
            idToken,
            email,
            fullName: name,
            givenName: given_name,
            familyName: family_name,
          })
          // resolve(result)
        })
        .catch((error) => {
          // Handle Errors here.
          const errorCode = error.code
          const errorMessage = error.message
          reject(errorMessage)
        })
    })
  },
  async signInWithApple(this: App) {
    return new Promise(async (resolve, reject) => {
      await firebase.auth().signOut()
      const provider = new firebase.auth.OAuthProvider('apple.com')
      provider.addScope('email')
      provider.addScope('name')
      firebase
        .auth()
        .signInWithPopup(provider)
        .then(async (result) => {
          const user = result?.user
          // const credential = result?.credential
          // @ts-expect-error
          const { email, displayName, givenName, familyName } = user
          let given_name = givenName
          let family_name = familyName
          if (!given_name && !family_name && displayName) {
            const res = displayName.split(' ')
            given_name = res[0]
            family_name = res[1]
          }
          const uid = user?.uid
          const idToken = await user?.getIdToken()
          resolve({
            userIdentifier: uid,
            identityToken: idToken,
            email,
            fullName: displayName,
            givenName: given_name,
            familyName: family_name,
          })
          // resolve(result)
        })
        .catch((error) => {
          // Handle Errors here.
          const errorCode = error.code
          const errorMessage = error.message
          reject(errorMessage)
        })
    })
  },
  /**
   * Called during "init" when navigating to VideoChat
   */
  async videoChat(
    this: App,
    action: BuiltInActionObject & {
      roomId: string
      accessToken: string
      timer: number
      timerTag: string
      sessionName: string
      userName: string
    },
  ) {
    try {
      if (action) {
        let msg = ''
        if (action?.accessToken) msg += 'Received access token '
        if (action?.roomId) msg += 'and room id'
        log.debug(msg, action)
      } else {
        log.error(
          'Expected an action object but the value passed in was null or undefined',
          action,
        )
      }

      let newRoom: Room | null = null
      // Disconnect from the room if for some reason we
      // are still connected to one
      // if (room.state === 'connected' || room.state === 'reconnecting') {
      //   room?.disconnect?.()
      //   if (connecting) setConnecting(false)
      // }

      // Reuse the existing room
      if (this.meeting?.calledOnConnected) {
        newRoom = await this.meeting.rejoin()
        log.info(
          `Reusing existent room that you are already connected to`,
          newRoom,
        )
      } else {
        log.debug(`Connecting to room id: ${action?.sessionName}`)
        const base64Tobase32 = this.root.builtIn.utils?.['base64Tobase32']
        const sessionBs32Name = base64Tobase32({ key: action?.sessionName })
        newRoom = (await this.meeting.join(
          action?.accessToken,
          sessionBs32Name,
          action?.userName,
        )) as Room
        if (newRoom) {
          log.info(`Connected to room: ${action?.sessionName}`, newRoom)
        }
      }
    } catch (error) {
      log.error(error)
      error instanceof Error && toast(error.message, { type: 'default' })
    }
  },
  async callPhone(
    this: App,
    action: BuiltInActionObject & {
      from: string
      accessToken: string
      to: string
    },
  ) {
    try {
      if (action) {
        let msg = ''
        if (action?.accessToken) msg += 'Received access token '
        if (action?.from) msg += 'and to'
        log.debug(msg, action)
      } else {
        log.error(
          'Expected an action object but the value passed in was null or undefined',
          action,
        )
      }
      let newCall: any = null
      if (this.calling?.calledOnConnected) {
        // newCall = await this.calling.rejoin()
        log.info(
          `Reusing existent call that you are already connected to`,
          newCall,
        )
      } else {
        log.debug(`Connecting to call to: ${action?.to}`)
        newCall = await this.calling.join(
          action?.accessToken,
          action.from,
          action.to,
        )
        if (newCall) {
          log.info(`Connected to call: ${action?.sessionName}`, newCall)
        }
      }
    } catch (error) {
      log.error(error)
      error instanceof Error && toast(error.message, { type: 'default' })
    }
  },
  async initExtend(
    this: App,
    action: BuiltInActionObject & {
      timePerExtendSeconds: number
      numberofExtensions: number
      popUpWaitSeconds: number
      meetingEndTime: number
    },
  ) {
    let countDownNum = 0
    let isPopUpOnScreen = false
    let numberofExtensions = action?.numberofExtensions
    let popUpWaitSeconds = action?.popUpWaitSeconds
    let currentTime = Math.ceil(new Date().getTime() / 1000)
    let meetingEndTime = action?.meetingEndTime
    let remainTime = meetingEndTime - currentTime - popUpWaitSeconds
    let timePerExtendSeconds = action.timePerExtendSeconds
    this.register.numberofExtensions = numberofExtensions - 1
    this.register.timePerExtendSeconds = timePerExtendSeconds
    this.register.popUpWaitSeconds = popUpWaitSeconds
    if (remainTime > 0 && numberofExtensions > 0) {
      const id = setTimeout(() => {
        this.meeting.isInMeeting &&
          this.register.extendVideoFunction('showExtendView')
        clearTimeout(id)
      }, remainTime * 1000)
      this.register.setTimeId('extendVideoChatTime', id)
    } else if (remainTime > 0 && numberofExtensions == 0) {
      const id = setTimeout(() => {
        this.meeting.isInMeeting &&
          this.register.extendVideoFunction('showExitWarningView')
        clearTimeout(id)
      }, remainTime * 1000)
    }
    // else{
    //   log.log('The meeting might had already ended. Please reschedule or cancel it.')
    //   this.meeting.leave()
    //   this.register.extendVideoFunction('onDisconnect')
    //   // const id = setTimeout(
    //   //   ()=>{
    //   //     this.register.extendVideoFunction('showExtendView')
    //   //   }
    //   // ,10*1000)
    //   // this.register.setTimeId('extendVideoChatTime',id)

    // }
  },
  async popUp(
    this: App,
    action: BuiltInActionObject & {
      popUpDismiss?: number
      wait?: boolean | number
      popUpView: string
      dismissOnTouchOutside?: boolean
    },
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const { popUpDismiss, dismissOnTouchOutside, wait, popUpView } = action
        let isWaiting = is.isBooleanTrue(wait) || u.isNum(wait)
        u.array(asHtmlElement(findByUX(popUpView))).forEach((elem) => {
          if (dismissOnTouchOutside) {
            const onTouchOutside = function onTouchOutside(
              this: HTMLDivElement,
              e: Event,
            ) {
              e.preventDefault()
              hide(elem)
              document.body.removeEventListener('click', onTouchOutside)
            }
            document.body.addEventListener('click', onTouchOutside)
          }

          if (elem?.style) {
            if (!u.isNum(wait)) {
              let inp_dom: NodeListOf<HTMLInputElement> =
                elem.querySelectorAll('input')
              for (let di_inp of inp_dom) {
                if (
                  (di_inp as HTMLInputElement).getAttribute('showSoftInput')
                ) {
                  setTimeout(() => {
                    di_inp?.focus()
                  }, 100)
                }
              }
              show(elem)
            } else if (u.isNum(wait)) {
              show(elem)
              setTimeout(() => {
                hide(elem)
                resolve(void 0)
              }, wait)
            }
            if (is.isBooleanTrue(wait)) {
              show(elem)
              resolve({ abort: 'true' })
            }
            if (u.isNum(popUpDismiss)) {
              setTimeout(() => {
                hide(elem)
              }, popUpDismiss)
            }
          } else {
            log.error(
              `Tried to show a element but the element ` +
                `was null or undefined`,
              { action: action?.snapshot?.(), popUpView },
            )
          }
          if (!isWaiting) resolve(void 0)
        })
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  },
  async popUpDismiss(
    this: App,
    action: BuiltInActionObject & {
      popUpView: string
    },
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const { popUpView } = action
        u.array(asHtmlElement(findByUX(popUpView))).forEach((elem) => {
          if (elem?.style) hide(elem)
          else
            log.error(
              `Tried to hide a element but the element ` +
                `was null or undefined`,
              { action: action?.snapshot?.(), popUpView },
            )
        })
        resolve(void 0)
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  },
  async continueGoto(this: App, action: BuiltInActionObject) {
    const destination = localStorage.getItem('continueGoto')
    if (destination) {
      const ndomPage = this.mainPage
      ndomPage.pageUrl = this.parse.queryString({
        destination,
        pageUrl: ndomPage.pageUrl,
        startPage: this.startPage,
      })
      await this.navigate(ndomPage, destination, { isGoto: true }, false)
    }
  },
  async initAutoDC(
    this: App,
    action: BuiltInActionObject & {
      popUpWaitSeconds: number
      meetingEndTime: number
    },
  ) {
    const popUpWaitSeconds = action?.popUpWaitSeconds
    const currentTime = Math.ceil(new Date().getTime() / 1000)
    const meetingEndTime = action?.meetingEndTime
    const remainTime = meetingEndTime - currentTime - popUpWaitSeconds
    // const remainTime2 = meetingEndTime-currentTime
    this.register.popUpWaitSeconds = popUpWaitSeconds
    this.register.meetingEndTime = meetingEndTime
    if (remainTime > 0) {
      const initAutoDcTime = setTimeout(() => {
        if (this.meeting.room.state === 'connected') {
          this.register.extendVideoFunction('showExitWarningView')
        }
        clearTimeout(initAutoDcTime)
      }, remainTime * 1000)
      this.register.setTimeId('extendVideoChatTime', initAutoDcTime)

      // const endMeetingId = setTimeout(
      //   ()=>{
      //     const participantsNumber = this.meeting.room.participants.size
      //     if(this.meeting.room?.participants && this.meeting.room.state === 'connected' && this.meeting.room.participants.size === 0){
      //       this.register.extendVideoFunction('onDisconnect')
      //     }
      //     clearTimeout(endMeetingId)
      //   },
      //   remainTime2*1000
      // )
    }
  },
  async handlePaymentMethodSubmission(this: App) {
    const paymentMethod = this['paymentMethod']
    if (paymentMethod) {
      const tokenResult = await paymentMethod.tokenize()
      return tokenResult
    }
    return
  },
}

export default createBuiltInActions
