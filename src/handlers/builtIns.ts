import * as u from '@jsmanifest/utils'
import get from 'lodash/get'
import has from 'lodash/has'
import set from 'lodash/set'
import { isAction } from 'noodl-action-chain'
import {
  findListDataObject,
  findIteratorVar,
  getDataValues,
  isPage as isNuiPage,
  NuiComponent,
  resolvePageComponentUrl,
  Store,
  Viewport as VP,
  isListConsumer,
  ConsumerOptions,
  findParent,
} from 'noodl-ui'
import QRCode from 'qrcode'
import {
  BASE_PAGE_URL,
  eventId as ndomEventId,
  findByViewTag,
  findByUX,
  findFirstBySelector,
  findWindow,
  isPageConsumer,
  Page as NDOMPage,
} from 'noodl-ui-dom'
import { BuiltInActionObject, EcosDocument, Identify } from 'noodl-types'
import Logger from 'logsnap'
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
  logError,
  pickActionKey,
  throwError,
} from '../utils/common'
import App from '../App'
import {
  LocalAudioTrack,
  LocalAudioTrackPublication,
  LocalVideoTrack,
  LocalVideoTrackPublication,
  Room,
} from '../app/types'

const log = Logger.create('builtIns.ts')
const _pick = pickActionKey

const createBuiltInActions = function createBuiltInActions(app: App) {
  const { createBuiltInHandler } = app.actionFactory

  const pickNDOMPageFromOptions = (options: ConsumerOptions) =>
    (app.pickNDOMPage(options?.page) || app.mainPage) as NDOMPage

  function _toggleMeetingDevice(kind: 'audio' | 'video') {
    log.func(`(${kind}) toggleDevice`)
    log.grey(`Toggling ${kind}`)
    let devicePath = `VideoChat.${kind === 'audio' ? 'micOn' : 'cameraOn'}`
    let localParticipant = app.meeting.localParticipant
    let localTrack: LocalAudioTrack | LocalVideoTrack | undefined
    if (localParticipant) {
      for (const publication of localParticipant.tracks.values()) {
        if (publication.track.kind === kind) localTrack = publication.track
      }
      app.updateRoot((draft) => {
        if (localTrack) {
          localTrack[localTrack.isEnabled ? 'disable' : 'enable']?.()
          set(draft, devicePath, !localTrack.isEnabled)
          log.grey(
            `Toggled ${kind} ${localTrack.isEnabled ? 'off' : 'on'}`,
            localParticipant,
          )
        } else {
          log.red(
            `Tried to toggle ${kind} track on/off for LocalParticipant but a ${kind} ` +
              `track was not available`,
            app.meeting.localParticipant,
          )
        }
      })
    }
  }
  const copy: Store.BuiltInObject['fn'] = async function onCopy(
    action,
    options,
  ) {
    log.func('copy')
    log.grey('', action?.snapshot?.())
    const viewTag = _pick(action, 'viewTag')
    const node: any = findByViewTag(viewTag)
    !node && log.red(`Cannot find a DOM node for viewTag "${viewTag}"`)
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
          log.grey(`Copy successfully in viewTag "${viewTag}"`)
          // toast('Copy successfully')
        }
      } else {
        log.red(`Copy failed in viewTag "${viewTag}"`)
      }
    } catch (e) {
      log.red(`Copy failed in viewTag "${viewTag}"`)
    }
  }

  const checkField: Store.BuiltInObject['fn'] = async function onCheckField(
    action,
  ) {
    log.func('checkField')
    log.grey('', action?.snapshot?.())
    const delay: number | boolean = _pick(action, 'wait')
    const onCheckField = () => {
      u.arrayEach(findByUX(_pick(action, 'contentType')), (n) => n && show(n))
    }
    u.isNum(delay) ? setTimeout(() => onCheckField(), delay) : onCheckField()
  }

  /**
   * Initiates a download window to export PDF using the information inside the document object
   * @param { object } options
   * @param { EcosDocument } options.ecosObj - eCOS document object
   */
  const exportPDF: any = async function onExportPDF(options: {
    ecosObj: EcosDocument
    viewTag?: string
  }) {
    try {
      log.func('exportPDF')
      log.grey('Downloading PDF file', options)

      const ecosObj = (
        u.isObj(options) && 'ecosObj' in options ? options.ecosObj : options
      ) as EcosDocument

      const viewTag = u.isObj(options) && options.viewTag
      const fileName = ecosObj.name?.title
      if (viewTag) {
        if (u.isStr(viewTag)) {
          for (const elem of [...u.array(findByViewTag(viewTag))]) {
            if (elem) {
              const pdf = await exportToPDF({
                data: elem,
                download: true,
                filename: fileName,
                viewport: app.viewport,
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
              await exportToPDF({
                data:
                  Identify.mediaType.audio(mediaType) ||
                  Identify.mediaType.font(mediaType) ||
                  Identify.mediaType.image(mediaType) ||
                  Identify.mediaType.video(mediaType)
                    ? data
                    : { title: title || (u.isStr(content) && content) || data },
                labels: true,
                download: true,
                filename: title,
              })
              log.green('Exported successfully')
            } catch (error) {
              console.error(error)
            }
          } else {
            log.red(
              `Tried to export the document to PDF but the "data" property is empty`,
            )
          }
        } else {
          log.red('The name field in an ecosObj was not an object', ecosObj)
        }
      }
    } catch (error) {
      logError(error)
      throwError(error)
    }
  }

  const disconnectMeeting: Store.BuiltInObject['fn'] =
    async function onDisconnectMeeting(action) {
      log.func('disconnectMeeting')
      log.grey('', action?.snapshot?.())
      app.meeting.leave()
    }

  const goBack: Store.BuiltInObject['fn'] = async function onGoBack(
    action,
    options,
  ) {
    log.func('goBack')
    log.grey('', action?.snapshot?.())
    const reload = _pick(action, 'reload')
    const ndomPage = pickNDOMPageFromOptions(options)

    if (ndomPage) {
      ndomPage.requesting = ndomPage.previous
      // TODO - Find out why the line below is returning the requesting page instead of the correct one above this line. getPreviousPage is planned to be deprecated
      // app.mainPage.requesting = app.mainPage.getPreviousPage(app.startPage).trim()
      if (u.isBool(reload)) {
        ndomPage.setModifier(ndomPage.previous, { reload })
      }
    }

    window.history.back()
  }

  const hideAction: Store.BuiltInObject['fn'] = async function onHide(action) {
    log.func('hide')
    log.grey('', action?.snapshot?.())
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
      !elemCount && log.red(`Cannot find a DOM node for viewTag "${viewTag}"`)
    }
    !u.isUnd(wait) ? setTimeout(onHide, wait === true ? 0 : wait) : onHide()
  }

  const showAction: Store.BuiltInObject['fn'] = async function onShow(
    action,
    options,
  ) {
    log.func('show')
    log.grey('', action?.snapshot?.())
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
      !elemCount && log.red(`Cannot find a DOM node for viewTag "${vTag}"`)
    }
    if (!u.isUnd(wait)) {
      setTimeout(() => showNode(viewTag), wait === true ? 0 : wait)
    } else showNode(viewTag)
  }

  const toggleCameraOnOff: Store.BuiltInObject['fn'] =
    async function onToggleCameraOnOff(action) {
      log.func('toggleCameraOnOff')
      log.green('', action?.snapshot?.())
      _toggleMeetingDevice('video')
    }

  const toggleMicrophoneOnOff: Store.BuiltInObject['fn'] =
    async function onToggleMicrophoneOnOff(action) {
      log.func('toggleMicrophoneOnOff')
      log.green('', action?.snapshot?.())
      _toggleMeetingDevice('audio')
    }

  const toggleFlag: Store.BuiltInObject['fn'] = async function onToggleFlag(
    action,
    options,
  ) {
    log.func('toggleFlag')
    log.grey('', action?.snapshot?.())
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
        if (Identify.isBoolean(dataValue)) {
          // true -> false / false -> true
          nextDataValue = !Identify.isBooleanTrue(dataValue)
        } else {
          // Set to true if am item exists
          nextDataValue = !dataValue
        }
        set(dataObject, parts, nextDataValue)
      } else {
        const onNextValue = (
          prevValue: any,
          { updateDraft }: { updateDraft?: { path: string } } = {},
        ) => {
          let nextValue: any
          if (Identify.isBoolean(prevValue)) {
            nextValue = !Identify.isBooleanTrue(prevValue)
          }
          nextValue = !prevValue
          if (updateDraft) {
            app.updateRoot(
              (draft) => void set(draft, updateDraft.path, nextValue),
            )
          }
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
          log.red(
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
          ?.fn?.(action, options)
      } else if (/camera/i.test(dataKey)) {
        await app.builtIns
          .get('toggleCameraOnOff')
          ?.find(Boolean)
          ?.fn?.(action, options)
      }

      log.grey('', {
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
      console.error(error)
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
    ;(await import('@aitmed/cadl')).Account.logout(true)
    window.location.reload()
  }

  const goto = createBuiltInHandler(async function onGoto(action, options) {
    log.func('goto')
    log.grey('', u.isObj(action) ? action?.snapshot?.() : action)

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
            'reload' in gotoObj.goto && (reload = _pick(gotoObj.goto, 'reload'))
            'pageReload' in gotoObj.goto &&
              (pageReload = _pick(gotoObj.goto, 'pageReload'))
            'dataIn' in gotoObj.goto && (dataIn = _pick(gotoObj.goto, 'dataIn'))
          } else if (u.isStr(gotoObj.goto)) {
            destinationParam = gotoObj.goto
          }
        } else if (u.isObj(gotoObj)) {
          destinationParam = gotoObj.destination
          'reload' in gotoObj && (reload = gotoObj.reload)
          'pageReload' in gotoObj && (pageReload = gotoObj.pageReload)
          'dataIn' in gotoObj && (dataIn = gotoObj.dataIn)
        }
      }
    } else if (u.isObj(action)) {
      if ('destination' in action || 'goto' in action) {
        destinationParam = _pick(action, 'destination', _pick(action, 'goto'))
        'reload' in action && (reload = _pick(action, 'reload'))
        'pageReload' in action && (pageReload = _pick(action, 'pageReload'))
        'dataIn' in action && _pick(action, 'dataIn')
      }
    }

    destProps = app.parse.destination(
      Identify.pageComponentUrl(destinationParam)
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
      const pageComponentParent = Identify.component.page(options?.component)
        ? options.component
        : findParent(options?.component, Identify.component.page)

      if (!ndomPage || isNuiPage(ndomPage)) {
        ndomPage =
          app.ndom.findPage(pageComponentParent || options.component) ||
          app.mainPage
      }
    } else if ('targetPage' in destProps) {
      destination = destProps.targetPage || ''
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

    if (destination === destinationParam) {
      ndomPage.requesting = destination
    }

    if (!u.isUnd(reload)) {
      ndomPage.setModifier(destinationParam, { reload })
    }
    if (!u.isUnd(pageReload)) {
      ndomPage.setModifier(destinationParam, { pageReload })
    }
    if (!u.isUnd(dataIn)) {
      ndomPage.setModifier(destinationParam, { ...dataIn })
    }

    log.grey(`Goto info`, {
      action: action?.snapshot?.(),
      ...destProps,
      destinationParam,
      reload,
      pageReload,
    })

    if (destination.startsWith('http')) {
      // This is for testing in mobile mode to prevent the auto-redirection to google play store
      // return
    }

    if (id) {
      const isInsidePageComponent =
        isPageConsumer(options?.component) || !!destProps.targetPage
      const node = findByViewTag(id) || findFirstByElementId(id)

      if (node) {
        let win: Window | undefined | null
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
        log.red(`Could not search for a DOM node with an identity of "${id}"`, {
          action: action?.snapshot?.(),
          node,
          id,
          destination,
          isSamePage,
          duration,
          options,
        })
      }
    }

    if (!destinationParam.startsWith('http')) {
      const originUrl = ndomPage.pageUrl
      ndomPage.pageUrl = app.parse.queryString({
        destination,
        pageUrl: ndomPage.pageUrl,
        startPage: app.startPage,
      })
      if(originUrl.includes('&')){
        ndomPage.pageUrl = originUrl + '-' + destination
      }
    } else {
      destination = destinationParam
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
        await app.navigate(ndomPage, destination)
      }

      if (!destination) {
        log.func('builtIn')
        log.red(
          'Tried to go to a page but could not find information on the whereabouts',
          { action, snapshot: action?.snapshot?.(), ...options },
        )
      }
    }
  })

  const redraw: Store.BuiltInObject['fn'] = async function onRedraw(
    action,
    options,
  ) {
    const component = options?.component as NuiComponent.Instance
    const metadata = getActionMetadata(action, {
      component,
      pickKeys: 'viewTag',
    })
    const { viewTag } = metadata

    let components = [] as NuiComponent.Instance[]
    let numComponents = 0

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

    log.func('redraw')
    log.hotpink('', metadata)

    try {
      if (!numComponents) {
        log.red(`Could not find any components to redraw`, action?.snapshot?.())
      } else {
        log.grey(`Redrawing ${numComponents} components`, {
          components,
          nodes: components.map((c) => findFirstBySelector(`#${c?.id}`)),
        })
      }

      for (const _component of components) {
        const _node = findFirstBySelector(`#${_component?.id}`)
        if (!_node) {
          log.func('redraw')
          log.red(
            `Tried to redraw a ${_component.type} component node from the DOM but the DOM node did not exist`,
            { component: _component, node: _node },
          )
        } else {
          const ctx = {} as any
          if (isListConsumer(_component)) {
            const dataObject = findListDataObject(_component)
            dataObject && (ctx.dataObject = dataObject)
            if (Identify.component.list(_component)) {
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
          // const redrawed = await app.ndom.redraw(_node, _component, ndomPage, {
          //   context: ctx,
          // })
          // return redrawed
        }
      }

      // await Promise.all(
      //   components.map(async function redrawComponents(_component) {
      //     const _node = findFirstBySelector(`#${_component?.id}`)
      //     if (!_node) {
      //       log.func('redraw')
      //       log.red(
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
      console.error(error)
      error instanceof Error && toast(error.message, { type: 'error' })
    }
    log.red(`COMPONENT CACHE SIZE: ${app.cache.component.length}`)
  }

  const builtIns = {
    checkField,
    disconnectMeeting,
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
    copy,
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
    ).Account?.verifyUserPassword?.(password)
    if (!isValid) {
      console.log(`%cisValid ?`, 'color:#e74c3c;font-weight:bold;', isValid)
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
  download(this: App, { ecosObj }: { ecosObj?: EcosDocument<any> } = {}) {
    log.func('download (document)')
    if (!ecosObj) {
      return log.red(
        `Cannot prompt with the download dialog because the "ecosObj" ` +
          `object was passed in as typeof "${typeof ecosObj}"`,
        ecosObj,
      )
    }
    if (!ecosObj.name?.data || !u.isStr(ecosObj.name?.data)) {
      return log.red(
        `Tried to prompt a download window for the user but the "data" ` +
          `field in the name object is empty`,
        ecosObj,
      )
    }
    let ext = ''
    let filename = (ecosObj.name.title || '') as string
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

    ext && u.isStr(filename) && (filename += ext)
    !data && (data = ecosObj.name?.data || '')
    return download(data, filename)
  },
  downloadQRCode(
    this: App,
    { content, scale }: { content?: any; scale?: number } = {},
  ) {
    log.func('download (QRCode)')
    // Generate QRCode image
    let text = content
    if (u.isObj(content)) text = JSON.stringify(content)

    let opts = {
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
    let data
    QRCode.toDataURL(text, opts, function (err, url) {
      if (err) throw err
      data = url
    })

    // transform base64 to blob
    let dataURLtoBlob = (dataurl) => {
      let arr = dataurl.split(',')
      //注意base64的最后面中括号和引号是不转译的
      let _arr = arr[1].substring(0, arr[1].length - 2)
      let mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(_arr),
        n = bstr.length,
        u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new Blob([u8arr], {
        type: mime,
      })
    }
    let blobSrc = dataURLtoBlob(data)
    console.log('test', blobSrc)
    let ext = ''
    let filename = ('QRCode' || '') as string
    let mimeType = ('image/png' || '') as string

    if (mimeType && u.isStr(mimeType)) {
      // Assuming these are note docs since we are storing their data in json
      if (mimeType.endsWith('json')) {
        ext = '.txt'
        const title = filename
        const body = blobSrc
        const note = `${title}\n\n${body}`
        data = new Blob([note], { type: 'text/plain' })
      } else {
        ext = mimeType.substring(mimeType.lastIndexOf('/')).replace('/', '.')
      }
    }

    ext && u.isStr(filename) && (filename += ext)
    !data && (data = blobSrc || '')
    return download(data, filename)
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
    },
  ) {
    log.func('onVideoChat')
    try {
      if (action) {
        let msg = ''
        if (action?.accessToken) msg += 'Received access token '
        if (action?.roomId) msg += 'and room id'
        log.grey(msg, action)
      } else {
        log.red(
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

      log.func('onVideoChat')
      // Reuse the existing room
      if (this.meeting.isConnected) {
        newRoom = await this.meeting.rejoin()
        log.green(
          `Reusing existent room that you are already connected to`,
          newRoom,
        )
      } else {
        log.grey(`Connecting to room id: ${action?.roomId}`)
        newRoom = (await this.meeting.join(action?.accessToken)) as Room
        newRoom && log.green(`Connected to room: ${newRoom.name}`, newRoom)
      }
      if (newRoom) {
        // TODO - read VideoChat.micOn and VideoChat.cameraOn and use those values
        // to initiate the default values for audio/video default enabled/disabled state
        const { cameraOn, micOn } = this.root.VideoChat || {}
        const { localParticipant } = newRoom

        const toggle =
          (state: 'enable' | 'disable') =>
          (
            tracks: Map<
              string,
              LocalVideoTrackPublication | LocalAudioTrackPublication
            >,
          ) => {
            tracks.forEach((publication) => publication?.track?.[state]?.())
          }

        const enable = toggle('enable')
        const disable = toggle('disable')

        if (Identify.isBoolean(cameraOn)) {
          if (Identify.isBooleanTrue(cameraOn)) {
            enable(localParticipant?.videoTracks)
          } else if (Identify.isBooleanFalse(cameraOn)) {
            disable(localParticipant?.videoTracks)
          }
        } else {
          // Automatically disable by default
          disable(localParticipant?.videoTracks)
        }
        if (Identify.isBoolean(micOn)) {
          if (Identify.isBooleanTrue(micOn)) {
            enable(localParticipant?.audioTracks)
          } else if (Identify.isBooleanFalse(micOn)) {
            disable(localParticipant?.audioTracks)
          }
        } else {
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
      error instanceof Error && toast(error.message, { type: 'error' })
    }
  },
}

export default createBuiltInActions
