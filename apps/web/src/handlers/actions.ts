import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import omit from 'lodash/omit'
import has from 'lodash/has'
import get from 'lodash/get'
import set from 'lodash/set'
import add from 'date-fns/add'
import startOfDay from 'date-fns/startOfDay'
import * as imageConversion from 'image-conversion'
import {
  asHtmlElement,
  ConsumerOptions,
  eventId as ndomEventId,
  EmitAction,
  findListDataObject,
  findIteratorVar,
  findWindow,
  findByElementId,
  findByViewTag,
  findByUX,
  findFirstByDataKey,
  findParent,
  getActionObjectErrors,
  isComponent,
  isPageConsumer,
  NDOMPage,
  parseReference,
  Page as NUIPage,
  resolvePageComponentUrl,
  Store,
  triggers,
  NuiComponent,
} from 'noodl-ui'
import SignaturePad from 'signature_pad'
import {
  evalIf,
  isRootDataKey,
  ParsedPageComponentUrlObject,
} from 'noodl-utils'
import { EmitObjectFold, IfObject } from 'noodl-types'
import axios from 'axios'
import {
  getBlobFromCanvas,
  show,
  openFileSelector,
  scrollToElem,
  toast,
  hide,
} from '../utils/dom'
import { useGotoSpinner } from '../handlers/shared/goto'
import App from '../App'
import { pickActionKey, pickHasActionKey } from '../utils/common'
import is from '../utils/is'
import Cropper from 'cropperjs'
import '../../node_modules/cropperjs/dist/cropper.min.css'
import { cloneDeep } from 'lodash'
const log = Logger.create('actions.ts')
const _pick = pickActionKey
const _has = pickHasActionKey

const createActions = function createActions(app: App) {
  const pickNUIPageFromOptions = (options: ConsumerOptions) =>
    (app.pickNUIPage(options.page) || app.mainPage.getNuiPage()) as NUIPage

  const pickNDOMPageFromOptions = (options: ConsumerOptions) =>
    (app.pickNDOMPage(options.page) || app.mainPage) as NDOMPage

  const emit = triggers.reduce(
    (acc: Partial<Record<string, Store.ActionObject<'emit'>['fn']>>, trigger) =>
      u.assign(acc, {
        [trigger]: async function onEmitAction(
          action: EmitAction,
          options: ConsumerOptions,
        ) {
          try {
            !app.getState().spinner.active && app.enableSpinner()

            log.func(`emit [${trigger}]`)

            const emitParams = {
              actions: _pick(action, 'actions'),
              pageName:
                pickNUIPageFromOptions(options)?.page || app.currentPage,
            } as {
              actions: EmitObjectFold['emit']['actions']
              dataKey: EmitObjectFold['emit']['dataKey']
              pageName: string
            }

            if (_has(_pick(action, 'emit'), 'dataKey')) {
              const dataKeyValue = _pick(action, 'dataKey')
              emitParams.dataKey = dataKeyValue
            }

            const emitResult = u.array(
              await app.noodl.emitCall(emitParams as any),
            )

            log.grey(`Emitted`, {
              action: action?.snapshot?.(),
              emitParams,
              emitResult,
            })

            return u.isArr(emitResult)
              ? emitResult.length > 1
                ? emitResult
                : emitResult?.[0]
              : [emitResult]
          } catch (error) {
            console.error(error)
          } finally {
            if (!app.noodl.getState().queue?.length) app.disableSpinner()
          }
        },
      }),
    {},
  )

  const anonymous: Store.ActionObject['fn'] = async (a) => {
    log.func('anonymous')
    log.grey('', a.snapshot())
  }

  const evalObject: Store.ActionObject['fn'] = async function onEvalObject(
    action,
    options,
  ) {
    log.func('evalObject')
    log.grey('', {
      action: action?.snapshot?.(),
      actionChain: options?.ref?.snapshot?.(),
      options,
    })

    !app.getState().spinner.active && app.enableSpinner()
    options.ref?.clear('timeout')

    try {
      let object = _pick(action, 'object') as
        | IfObject
        | ((...args: any[]) => any)

      if (u.isFnc(object)) {
        const strategies = [] as {
          type: 'abort-true' | 'abort-wait'
          object?: any
        }[]
        const result = await object()
        if (result) {
          const { ref: actionChain } = options
          const results = u.array(result)

          while (results.length) {
            let result = results.shift()

            while (u.isArr(result)) {
              results.push(...result)
              result = results.shift()
            }

            if (u.isObj(result)) {
              if (u.isBrowser()) {
                getActionObjectErrors(result).forEach((errMsg: string) =>
                  log.red(errMsg, result),
                )
              }

              if (result.abort) {
                strategies.push({ type: 'abort-true', object: result })
                log.grey(
                  `An evalObject returned an object with abort: true. ` +
                    `The action chain will no longer proceed`,
                  { actionChain, injectedObject: result },
                )
                if (actionChain) {
                  // There is a bug with global popups not being able to be visible because of this abort block.
                  // For now until a better solution is implemented we can do a check here
                  for (const action of actionChain.queue) {
                    const popUpView = _pick(action, 'popUpView')
                    if (popUpView) {
                      const globalPopUp =
                        app.ndom.global.components.get(popUpView)
                      if (globalPopUp) {
                        const msg = [
                          `An "abort: true" was injected from evalObject`,
                          `but a global component with popUpView`,
                          `"${popUpView}" was found.`,
                          `These popUp actions will still be called to ensure`,
                          `the behavior persists for global popUps`,
                        ].join(' ')
                        log.salmon(msg, globalPopUp)
                        await action?.execute?.()
                      }
                    }
                  }
                  if (!actionChain.isAborted()) {
                    await actionChain.abort(
                      `An evalObject is requesting to abort using the "abort" key`,
                    )
                  }
                }
              } else {
                const isPossiblyAction = 'actionType' in result
                const isPossiblyToastMsg = 'message' in result
                const isPossiblyGoto =
                  'goto' in result || 'destination' in result

                if (isPossiblyAction || isPossiblyToastMsg || isPossiblyGoto) {
                  if (isPossiblyGoto) {
                    const destination = result.goto || result.destination || ''
                    const pageComponentParent = findParent(
                      options?.component,
                      is.component.page,
                    )
                    if (
                      pageComponentParent &&
                      pageComponentParent.get('page')
                    ) {
                      const ndomPage = app.ndom.findPage(pageComponentParent)
                      if (ndomPage && ndomPage.requesting !== destination) {
                        ndomPage.requesting = destination
                      }
                    }
                  }

                  log.grey(
                    `An evalObject action is injecting a new object to the chain`,
                    {
                      actionChain,
                      instance: actionChain?.inject.call(
                        actionChain,
                        result as any,
                      ),
                      object: result,
                      queue: actionChain?.queue.slice(),
                    },
                  )
                }
              }
            }
          }
        }
      } else if (_has(object, 'if')) {
        const ifObj = object
        if (u.isArr(ifObj)) {
          const pageName = pickNUIPageFromOptions(options)?.page || ''
          object = evalIf((valEvaluating) => {
            let value
            if (is.isBoolean(valEvaluating)) {
              return is.isBooleanTrue(valEvaluating)
            }
            if (u.isStr(valEvaluating)) {
              if (valEvaluating.includes('.')) {
                if (has(app.root, valEvaluating)) {
                  value = get(app.root, valEvaluating)
                } else if (has(app.root[pageName], valEvaluating)) {
                  value = get(app.root[pageName], valEvaluating)
                }
              }
              if (is.isBoolean(value)) is.isBooleanTrue(value)
            }
            return !!value
          }, ifObj)
          if (u.isFnc(object)) {
            const result = await object()
            if (result) {
              log.hotpink(
                `Received a value from evalObject's "if" evaluation. ` +
                  `Returning it back to the action chain now`,
                { action: action?.snapshot?.(), result },
              )
              return result
            }
          }
        }
      }
    } catch (error) {
      console.error(error)
      toast(error.message, { type: 'error' })
    } finally {
      if (!app.noodl.getState().queue?.length) {
        app.disableSpinner()
      }
    }
  }

  const goto: Store.ActionObject['fn'] = useGotoSpinner(
    app,
    async function onGoto(action, options) {
      let goto = _pick(action, 'goto') || ''
      let ndomPage = pickNDOMPageFromOptions(options)
      let destProps: ReturnType<typeof app.parse.destination>

      if (!app.getState().spinner.active) app.enableSpinner()

      log.func('goto')
      log.grey(
        _pick(action, 'goto'),
        u.isObj(action) ? action?.snapshot?.() : action,
      )

      let destinationParam =
        (u.isStr(goto)
          ? goto
          : u.isObj(goto)
          ? goto.destination || goto.dataIn?.destination || goto
          : '') || ''

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

      let { destination, id = '', isSamePage, duration } = destProps

      let pageModifiers = {} as any

      if (destination === destinationParam) {
        ndomPage.requesting = destination
      }

      if ('targetPage' in destProps) {
        // @ts-expect-error
        const destObj = destProps as ParsedPageComponentUrlObject
        destination = destObj.targetPage || ''
        id = destObj.viewTag || ''
        if (id) {
          for (const obj of app.cache.component) {
            if (obj) {
              if (obj?.component?.blueprint?.id === id) {
                const pageComponent = obj.component
                const currentPageName = pageComponent?.get?.('path')
                ndomPage = app.ndom.findPage(currentPageName) as NDOMPage
                break
              }
            }
          }
        }
      }

      if (u.isObj(goto?.dataIn)) {
        const dataIn = goto.dataIn
        'reload' in dataIn && (pageModifiers.reload = dataIn.reload)
        'pageReload' in dataIn && (pageModifiers.pageReload = dataIn.pageReload)
      }

      if (id) {
        const isInsidePageComponent =
          isPageConsumer(options.component) || !!destProps.targetPage
        const node = findByViewTag(id) || findByElementId(id)
        if (node) {
          let win: Window | null | undefined
          let doc: Document | null | undefined
          if (document.contains?.(node as any)) {
            win = window
            doc = window.document
          } else {
            win = findWindow((w) => {
              if (!w) return false
              return (
                'contentDocument' in w ? w['contentDocument'] : w.document
              )?.contains?.(node as HTMLElement)
            })
          }
          function scroll() {
            if (isInsidePageComponent) {
              scrollToElem(node, { win, doc, duration })
            } else {
              ;(node as HTMLElement)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
              })
            }
          }
          if (isSamePage) scroll()
          else;
          ndomPage.once(ndomEventId.page.on.ON_COMPONENTS_RENDERED, scroll)
        } else {
          log.red(
            `Could not search for a DOM node with an identity of "${id}"`,
            {
              id,
              destination,
              isSamePage,
              duration,
              action: action?.snapshot?.(),
            },
          )
        }
      }

      if (!destinationParam.startsWith('http')) {
        // Avoids letting page components (lower level components) from mutating the tab's url
        if (ndomPage === app.mainPage) {
          const originUrl = ndomPage.pageUrl
          ndomPage.pageUrl = app.parse.queryString({
            destination,
            pageUrl: ndomPage.pageUrl,
            startPage: app.startPage,
          })
          log.grey(`Page URL evaluates to: ${ndomPage.pageUrl}`)
        } else {
          // TODO - Move this to an official location in noodl-ui-dom
          if (ndomPage.node && ndomPage.node instanceof HTMLIFrameElement) {
            if (ndomPage.node.contentDocument?.body) {
              ndomPage.node.contentDocument.body.textContent = ''
            }
          }
        }
      } else {
        destination = destinationParam
      }

      log.grey(`Goto info`, {
        goto: { goto },
        destinationParam,
        isSamePage,
        pageModifiers,
        updatedQueryString: ndomPage?.pageUrl,
      })

      if (!isSamePage) {
        if (ndomPage?.node && ndomPage.node instanceof HTMLIFrameElement) {
          if (ndomPage.node.contentDocument?.body) {
            ndomPage.node.contentDocument.body.textContent = ''
          }
        }
        ndomPage.setModifier(destination, pageModifiers)
        if (ndomPage.page && ndomPage.page !== destination) {
          // delete app.noodl.root[ndomPage.page]
        }
        await app.navigate(ndomPage, destination, { isGoto: true })
        if (!destination) {
          log.func('goto')
          log.red(
            'Tried to go to a page but could not find information on the whereabouts',
            { action: action?.snapshot?.(), options },
          )
        }
      }
    },
  )

  const getBlob = (file:File | undefined,action,options):Promise<Blob>=>{
    return new Promise((res,rej)=>{
      let blob:Blob = new Blob();
      let img = document.createElement("img") as HTMLImageElement;
      let rootDom = document.getElementsByTagName("body")[0];
      let divRootDom = document.createElement("div") as HTMLDivElement;
      let divImgDom = document.createElement("div") as HTMLDivElement;
      let btnResult = document.createElement("button") as HTMLButtonElement;
      let btnCancel = document.createElement("button") as HTMLButtonElement;
      let divDom = document.createElement("div") as HTMLDivElement;
      let divBtn = document.createElement("div") as HTMLDivElement;
      let cropper;
        btnResult.textContent = "Confirm";
        btnCancel.textContent = "Cancel";
        divRootDom.setAttribute("id","rootDom");
        let w = document.documentElement.scrollWidth;
        let h = document.documentElement.scrollHeight;
        divRootDom.style.cssText = `
            position: relative;
            background-color: #fff;
            z-index: 10000000;
            display: flex;
            width: ${w}px;
            height: ${h}px;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        `
      divDom.style.cssText = `
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;`
      divImgDom.style.cssText = `
            height: 80%;
            width: 65%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-end;`
      btnResult.style.cssText = `
            cursor: pointer;
            outline: none;
            border: none;
            height: 30px;
            width: 60px;
            border-radius: 5px;
            color: #fff;
            background-color: #a139ff;
            margin-top: 10px;
            margin-right: 30px;
        `
      btnCancel.style.cssText = `
            cursor: pointer;
            outline: none;
            height: 30px;
            width: 60px;
            border: none;
            border-radius: 5px;
            color: #fff;
            background-color: red;
            margin-top: 10px;
        `
      divBtn.style.cssText = `
            font-size: 15px;
            background-color: red
            color: #fff;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
    `
      divDom.appendChild(img)
      divImgDom.appendChild(divDom)
      divBtn.appendChild(btnResult)
      divBtn.appendChild(btnCancel)
      divImgDom.appendChild(divBtn)
      divRootDom.appendChild(divImgDom)
      rootDom.appendChild(divRootDom)
      img.src = URL.createObjectURL(file as Blob) as string
      cropper = new Cropper(img, {
        viewMode: 2, // 只能在裁剪的图片范围内移动
        dragMode: 'move', // 画布和图片都可以移动
        aspectRatio: 1, // 裁剪区默认正方形
        autoCropArea: 1, // 自动调整裁剪图片
        zoomOnWheel: true,
        scalable: true,
        center: true,
        responsive: true,
        // cropBoxMovable: false, // 禁止裁剪区移动
        // cropBoxResizable: false, // 禁止裁剪区缩放
        background: false, // 关闭默认背景
        // toggleDragModeOnDblclick: true,
        movable: true,
        // aspectRatio: 16 / 9,
        // scalable: false,
        // zoomable: false,
        // crop: function (e) {
        // }
      })
      // };
      btnResult.addEventListener('click', (event) => {
        // const cav = cropper.getCroppedCanvas();
        cropper
          .getCroppedCanvas({
            fillColor: '#fff',
            imageSmoothingEnabled: false,
            imageSmoothingQuality: 'high',
          })
          .toBlob((bob) => {
            blob = bob
            res(blob as Blob)
          })
        let rootDom = document.getElementById('rootDom') as HTMLDivElement
        document.body.removeChild(rootDom)
        cropper.destroy()
      })
      btnCancel.addEventListener('click', () => {
        cropper.destroy()
        let rootDom = document.getElementById('rootDom') as HTMLDivElement
        document.body.removeChild(rootDom)
        action?.snapshot?.()
        options.ref?.abort()
        rej('Deselect file')
      })
    })
  }
  const requireCsv = async (files,dataKey,ac,comp)=>{
    const CSVToJSON = (data, csvTitleKbn:string[], delimiter = ',') => {
      let hanleData:string[] = data.slice(data.indexOf('\n')+1).split('\n');
      return hanleData.filter(Boolean).map(v => {
          const values = v.split(delimiter);
          return v&&csvTitleKbn.reduce(
              (obj, title, index) => (obj[title] = values[index], obj),{});
      });
  };
    const reader:FileReader  = new FileReader();
    // 将上传的文件读取为文本
    reader.readAsText(files?.[0]);
    let result = new Promise((res)=>{
      reader.addEventListener("load", (csvText:ProgressEvent<FileReader>) => {
        // 将CSV文本转换为JSON数据
        const jsonFromCsvFile = CSVToJSON(csvText.target?.result, comp.get("data-option") as string[]);
        res(jsonFromCsvFile)
    });
    });
  return await result;
  }
  const _getInjectBlob: (name: string) => Store.ActionObject['fn']|Function = (name) =>
  // true?function hh(){}:
    async function getInjectBlob(action, options) {
      options.ref?.clear('timeout')
      log.func(name)
      log.gold('', action?.snapshot?.())
      const result = await openFileSelector()
      log.func(name)
      switch (result.status) {
        case 'selected':
          const { files } = result;
          const ac = options?.ref;
          const comp = options?.component;
          const dataKey = _pick(action, 'dataKey');
          const documentType = _pick(action, 'documentType');
          const downloadStatus = _pick(action, 'downloadStatus');
          const fileType = _pick(action, 'fileType');
          const size = _pick(action, 'size') && +_pick(action, 'size') / 1000;
          const fileFormat = _pick(action, 'fileFormat');
          const shearState = _pick(action,"shearState");
          let fileRell:File|undefined;

          if(Boolean(shearState)){
            const hreFile = await getBlob(files?.[0],action,options);
            fileRell = new File([hreFile],files?.[0].name as string,(!(files?.[0].type.includes("svg"))?{type: files?.[0].type} as FilePropertyBag:undefined))
          }
          if (ac && comp) {
            ac.data.set(dataKey, files?.[0])
            if (documentType && downloadStatus) {
              const status = (documentType as string[])?.some(
                (item) => item === files?.[0]?.['type'].split('/')[1],
              )
              ac.data.set(downloadStatus,status)
              app.updateRoot(downloadStatus, status)
            }
            if(fileType){
              const type = files?.[0]?.name.split(".").at(-1);
              ac.data.set(fileType,type)
              app.updateRoot(fileType, type)
            }
            if (fileFormat) {
              ac.data.set(fileFormat, files?.[0].type)
              app.updateRoot(fileFormat, ac.data.get(fileFormat))
            }
            if (u.isStr(dataKey)) {
              if(files?.[0].type.endsWith("/csv")){
                // CSV标题汉字所对应的区分名
               // 构建文件读取对象
              let jsonFromCsvFile = await requireCsv(files,dataKey,ac,comp);
              ac.data.set(dataKey, {"name":files?.[0]?.name,"data":jsonFromCsvFile});
              app.updateRoot(dataKey, ac.data.get(dataKey))
              break;
            }else{
              await imageConversion
              .compressAccurately(fileRell||ac.data.get(dataKey), size)
              .then((dataBlob) => {
                let newFile = dataBlob instanceof File ? dataBlob :  new File([dataBlob], ac.data.get(dataKey).name, {
                  type: files?.[0].type,
                })
                app.updateRoot(dataKey, newFile)
              })
            }
            }else {
              log.red(
                `Could not write file to dataKey because it was not a string. Received "${typeof dataKey}" instead`,
              )
            }
            log.green(`Selected file for dataKey "${dataKey}"`, {
              file: files?.[0],
              actionChain: ac,
            })

            // if (fileFormat) {
            //   ac.data.set(fileFormat, files?.[0]?.type)
            //   app.updateRoot(fileFormat, ac.data.get(fileFormat))
            // }
            // if (u.isStr(dataKey)) {
            //   await imageConversion
            //     .compressAccurately(ac.data.get(dataKey), size)
            //     .then((res) => {
            //       console.log("sssss",res)
            //       let newFile = new File([res], ac.data.get(dataKey).name, {
            //         type: files?.[0].type,
            //       })
            //       console.log("jjjj",newFile)
            //       app.updateRoot(dataKey, newFile)
            //     })
            // } else {
            //   log.red(
            //     `Could not write file to dataKey because it was not a string. Received "${typeof dataKey}" instead`,
            //   )
            // }
            // log.green(`Selected file for dataKey "${dataKey}"`, {
            //   file: files?.[0],
            //   actionChain: ac,
            // })
          } else {
            log.red(
              `%cBoth action and component is needed to inject a blob to the action chain`,
              `color:#ec0000;`,
              {
                action: action?.snapshot?.(),
                actionChain: ac,
                component: comp,
                dataKey,
              },
            )
          }
          break

        case 'canceled':
          await options?.ref?.abort?.('File input window was closed')
          break
        case 'error':
          return void log.red(`An error occurred for action "${name}"`, {
            action: action?.snapshot?.(),
            ...result,
          })
      }
    }

  // These 3 funcs are only for android, so we can ignore these since this
  // behavior is handled in updateObject
  const openCamera = _getInjectBlob('openCamera')
  const openDocumentManager = _getInjectBlob('openDocumentManager')
  const openPhotoLibrary = _getInjectBlob('openPhotoLibrary')

  const pageJump: Store.ActionObject['fn'] = async (action) =>
    app.navigate(_pick(action, 'destination'))

  const loadTimeLabelPopUp = (
    node: HTMLElement,
    component: NuiComponent.Instance,
  ) => {
    const dataKey =
      component.get('data-key') || component.blueprint?.dataKey || ''
    const textFunc = component.get('text=func') || ((x: any) => x)
    const popUpWaitSeconds = app.register.getPopUpWaitSeconds()
    let initialSeconds = get(app.root, dataKey, popUpWaitSeconds) as number
    initialSeconds = initialSeconds ? initialSeconds : 30
    initialSeconds = initialSeconds <= 0 ? popUpWaitSeconds : initialSeconds
    node.textContent = textFunc(initialSeconds * 1000, 'mm:ss')

    const interval = setInterval(() => {
      initialSeconds = initialSeconds - 1
      const seconds = initialSeconds
      node && (node.textContent = textFunc(seconds * 1000, 'mm:ss'))
      if (initialSeconds <= 0) clearInterval(interval)
    }, 1000)

    app.register.setTimeId('PopUPTimeInterval', interval)
  }

  const popUp: Store.ActionObject['fn'] = async function onPopUp(
    action,
    options,
  ) {
    log.func('popUp')
    log.grey('', action?.snapshot?.())
    return new Promise(async (resolve, reject) => {
      try {
        const { ref } = options
        const dismissOnTouchOutside = _pick(action, 'dismissOnTouchOutside')
        const popUpView = _pick(action, 'popUpView')
        const popDismiss = _pick(action, 'popUpDismiss')
        const wait = _pick(action, 'wait')

        let isWaiting = is.isBooleanTrue(wait) || u.isNum(wait)
        let initialSeconds
        u.array(asHtmlElement(findByUX('timerLabelPopUp'))).forEach((node) => {
          if (node) {
            const component = app.cache.component.get(node?.id)?.component
            const dataKey =
              component.get('data-key') || component.blueprint?.dataKey || ''
            const popUpWaitSeconds = app.register.getPopUpWaitSeconds()
            initialSeconds = get(app.root, dataKey, 30) as number
            initialSeconds =
              initialSeconds <= 0 ? popUpWaitSeconds : initialSeconds
            if (action?.actionType === 'popUp') {
              loadTimeLabelPopUp(node, component)
              if (popUpView === 'extendView') {
                const id = setTimeout(() => {
                  app.meeting.room.state === 'connected' &&
                    app.register.extendVideoFunction('onDisconnect')
                  clearTimeout(id)
                }, initialSeconds * 1000)
                app.register.setTimeId('PopUPToDisconnectTime', id)
              }
            } else if (action?.actionType === 'popUpDismiss') {
              app.register.removeTime('PopUPTimeInterval')
              app.register.removeTime('PopUPToDisconnectTime')
              // if(popUpView === 'providerLeftWarningView' || popUpView === 'exitWarningView'){
              //   app.register.extendVideoFunction('onDisconnect')
              // }
            }
          }
        })

        u.array(asHtmlElement(findByUX(popUpView))).forEach((elem) => {
          if (popUpView === 'exitWarningView') {
            setTimeout(() => {
              hide(elem)
              resolve()
            }, initialSeconds * 1000)
          }
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
            if (is.action.popUp(action) && !u.isNum(_pick(action, 'wait'))) {
              show(elem)
            } else if (u.isNum(_pick(action, 'wait'))) {
              show(elem)
              let wait = _pick(action, 'wait')
              if (is.isBooleanTrue(wait)) wait = 0
              if (u.isNum(wait)) isWaiting = true
              setTimeout(() => {
                hide(elem)
                resolve()
              }, wait)
            } else if (is.action.popUpDismiss(action)) {
              hide(elem)
            }
            if (u.isNum(popDismiss)) {
              setTimeout(() => {
                hide(elem)
              }, popDismiss)
            }
            // Some popup components render values using the dataKey. There is a bug
            // where an action returns a popUp action from an evalObject action. At
            // this moment the popup is not aware that it needs to read the dataKey if
            // it is not triggered by some NOODLDOMDataValueElement. So we need to do a check here

            // Removed 02/14/2022 - noodl implements auto filling
            // Auto prefills the verification code when ECOS_ENV === 'test'
            // and when the entered phone number starts with 888
            // if (process.env.ECOS_ENV === 'test') {
            //   const currentPage =
            //     pickNUIPageFromOptions(options)?.page || app.currentPage
            //   const vcodeInput = getVcodeElem()
            //   const phoneInput = u.array(
            //     asHtmlElement(findByDataAttrib('data-name', 'phoneNumber')),
            //   )[0] as HTMLInputElement
            //   let phoneNumber = String(
            //     phoneInput?.value || phoneInput?.dataset?.value,
            //   )
            //   if (!phoneNumber && phoneInput?.dataset?.key) {
            //     const value = get(app.root[currentPage], phoneInput.dataset.key)
            //     value && (phoneNumber = value)
            //   }
            //   const is888 =
            //     phoneNumber.startsWith('888') ||
            //     phoneNumber.startsWith('+1888') ||
            //     phoneNumber.startsWith('+1 888')

            //   if (
            //     vcodeInput &&
            //     is888 &&
            //     action?.actionType !== 'popUpDismiss'
            //   ) {
            //     let pathToTage = 'verificationCode.response.edge.tage'
            //     let vcode = get(app.root?.[currentPage], pathToTage, '')
            //     if (vcode) {
            //       vcode = String(vcode)
            //       vcodeInput.value = vcode
            //       vcodeInput.dataset.value = vcode
            //       app.updateRoot(
            //         `${currentPage}.${
            //           vcodeInput.dataset.key || 'formData.code'
            //         }`,
            //         vcode,
            //       )
            //     } else {
            //       log.orange(
            //         `Could not find a verification code at path "${pathToTage}"`,
            //       )
            //     }
            //   }
            // }

            // If popUp has wait: true, the action chain should pause until a response
            // is received from something (ex: waiting on user confirming their password)
            if (is.isBooleanTrue(_pick(action, 'wait'))) {
              log.grey(
                `Popup action for popUpView "${popUpView}" is ` +
                  `waiting on a response. Aborting now...`,
                action?.snapshot?.(),
              )
              ref?.abort?.()
              resolve()
            }
          } else {
            let msg = `Tried to ${
              action?.actionType === 'popUp' ? 'show' : 'hide'
            }`
            log.func(action?.actionType)
            log.red(
              `${msg} a ${action?.actionType} element but the element ` +
                `was null or undefined`,
              { action: action?.snapshot?.(), popUpView },
            )
          }

          if (!isWaiting) resolve()
        })
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  const popUpDismiss: Store.ActionObject['fn'] = async function onPopUpDismiss(
    action,
    options,
  ) {
    log.func('popUpDismiss')
    log.grey('', action?.snapshot?.())
    for (const obj of app.actions.popUp) {
      await (obj as Store.ActionObject)?.fn?.(action, options)
    }
  }

  const refresh: Store.ActionObject['fn'] = async function onRefresh(action) {
    log.func('refresh')
    log.grey('', action?.snapshot?.())
    window.location.reload()
  }

  const saveObject: Store.ActionObject['fn'] = async function onSaveObject(
    action,
    options,
  ) {
    log.func('saveObject')
    log.grey('', action?.snapshot?.())

    const { getRoot, ref } = options
    const object = _pick(action, 'object')
    const currentPage = pickNUIPageFromOptions(options)?.page || app.currentPage

    try {
      if (u.isFnc(object)) {
        await object()
      } else if (u.isArr(object)) {
        for (const obj of object) {
          if (u.isArr(obj)) {
            // Assuming this a tuple where the first item is the path to the "name" field
            // and the second item is the actual function that takes in values from using
            // the name field to retrieve values
            if (obj.length === 2) {
              let nameField
              const [nameFieldPath, save] = obj
              if (u.isStr(nameFieldPath) && u.isFnc(save)) {
                if (is.reference(nameFieldPath)) {
                  nameField = parseReference(nameFieldPath, {
                    page: currentPage,
                    root: getRoot(),
                  })
                } else {
                  nameField =
                    get(app.root, nameFieldPath, null) ||
                    get(app.root?.[currentPage], nameFieldPath, {})
                }

                const params = { ...nameField }
                'verificationCode' in params && delete params.verificationCode
                await save(params)
                log.func('saveObject')
                log.grey(`Called saveObject with:`, params)
              }
            }
          }
        }
      } else if (u.isStr(object)) {
        log.func('saveObject')
        log.red(
          `The "object" property in the saveObject action is a string which ` +
            `is in the incorrect format. Possibly a parsing error?`,
          action?.snapshot?.(),
        )
      }
    } catch (error) {
      console.error(error)
      toast((error as Error).message, { type: 'error' })
      ref?.abort?.()
    }
  }

  const removeSignature: Store.ActionObject['fn'] =
    async function onRemoveSignature(action, options) {
      try {
        log.func('removeSignature')
        log.grey('', { action: action?.snapshot?.(), options })
        const dataKey = _pick(action, 'dataKey')
        const node = findFirstByDataKey(dataKey) as HTMLCanvasElement
        if (node) {
          const component = app.cache.component.get(node.id)?.component
          if (isComponent(component)) {
            const signaturePad = component.get('signaturePad') as SignaturePad
            console.log('test', signaturePad)
            if (signaturePad) {
              signaturePad.clear()
              log.grey(
                `Cleared signature for dataKey "${dataKey}"`,
                signaturePad,
              )
            } else {
              log.red(
                `Tried to clear the signature using dataKey "${dataKey}" ` +
                  `but the component did not have the signature pad stored in its instance`,
                component,
              )
            }
          } else {
            log.red(
              `Tried to clear the signature using dataKey "${dataKey}" ` +
                `but the component did not exist in the component cache`,
              { node, component, cachedComponents: app.cache.component.get() },
            )
          }
        }
      } catch (error) {
        toast((error as Error).message, { type: 'error' })
      }
    }

  const saveSignature: Store.ActionObject['fn'] =
    async function onSaveSignature(action, options) {
      return new Promise((resolve, reject) => {
        log.func('saveSignature')
        log.grey('', { action: action?.snapshot?.(), options })
        const dataKey = _pick(action, 'dataKey')
        if (dataKey) {
          const node = findFirstByDataKey(dataKey) as HTMLCanvasElement
          const component = app.cache.component.get(node.id)?.component
          if (component) {
            const signaturePad = component.get('signaturePad') as SignaturePad
            if (signaturePad) {
              let isEmpty = _pick(action, 'isEmpty')
              let dataKey = _pick(action, 'dataKey')
              let dataObject = isRootDataKey(dataKey)
                ? app.root
                : app.root?.[pickNUIPageFromOptions(options)?.page || '']
              let dataUrl = signaturePad.toDataURL()
              let mimeType = dataUrl.split(';')[0].split(':')[1] || ''
              if (has(dataObject, dataKey)) {
                getBlobFromCanvas(node, mimeType).then((blob) => {
                  if (isEmpty) {
                    set(dataObject, isEmpty, signaturePad._isEmpty)
                  }
                  set(dataObject, dataKey, blob)
                  log.func('saveSignature')
                  log.grey(`Saved blob to "${dataKey}"`, {
                    blob,
                    dataKey,
                    dataObject,
                    mimeType,
                  })
                  resolve()
                })
              } else {
                resolve(
                  log.red(
                    `Cannot save the signature because the component with dataKey "${dataKey}" did not have a SignaturePad stored in its instance`,
                    { action: action?.snapshot?.(), component },
                  ),
                )
              }
            } else {
              resolve(
                log.red(`Missing signature pad from a canvas component`, {
                  action: action?.snapshot?.(),
                  component,
                }),
              )
            }
          } else {
            resolve(
              log.red(
                `Cannot save the signature because a component with dataKey "${dataKey}" was not available in the component cache`,
                { action: action?.snapshot?.(), component },
              ),
            )
          }
        } else {
          resolve(
            log.red(
              `Cannot save the signature because there is no dataKey`,
              action?.snapshot?.(),
            ),
          )
        }
      })
    }

  const toastAction: Store.ActionObject['fn'] = async function onToast(action) {
    try {
      log.func('toast')
      log.gold('', action?.snapshot?.())
      toast(_pick(action, 'message') || '')
    } catch (error) {
      error instanceof Error && toast(error.message, { type: 'error' })
    }
  }

  const updateObject: Store.ActionObject['fn'] = async function onUpdateObject(
    action,
    { component, ref },
  ) {
    ref?.clear('timeout')
    log.func('updateObject')
    log.grey('', action?.snapshot?.())

    let file: File | undefined

    try {
      if (_pick(action, 'dataObject') === 'BLOB') {
        const dataKey = _pick(action, 'dataKey') || ''
        if (ref) {
          if (ref.data.has(dataKey)) {
            file = ref.data.get(dataKey)
          } else {
            log.orange(
              `No blob was found for dataKey "${dataKey}" on the action chain. ` +
                `Opening the file selector...`,
            )
            const { files, status } = await openFileSelector()
            if (status === 'selected') {
              file = files?.[0]
              ref.data.set(dataKey, file)
              log.green(`Selected file`, file)
            }
          }
        } else {
          log.red(
            `Action chain does not exist. No blob will be available`,
            action?.snapshot?.(),
          )
        }
      }

      let object: any

      // This is the more older version of the updateObject action object where it used
      // the "object" property
      if (_has(action, 'object')) object = _pick(action, 'object')
      // This is the more newer version that is more descriptive, utilizing the data key
      // action = { actionType: 'updateObject', dataKey, dataObject }
      else if (_pick(action, 'dataKey') || _pick(action, 'dataObject')) {
        object = omit(action?.original || action, 'actionType')
      }

      if (u.isFnc(object)) {
        const result = await object()
        log.grey(`Invoked "object" that was a function`, { object, result })
      } else if (u.isStr(object)) {
        log.red(
          `A string was received as the "object" property. Possible parsing error?`,
          action?.snapshot?.(),
        )
      } else if (u.isArr(object)) {
        for (const obj of object) u.isFnc(obj) && (await obj())
      } else if (u.isObj(object)) {
        let { dataKey, dataObject } = object
        let iteratorVar = findIteratorVar(component)

        if (u.isStr(dataObject)) {
          if (/(file|blob)/i.test(dataObject)) {
            const name = dataObject
            log.grey(`The data object is requesting a "${name}"`)
            dataObject = file || dataObject
            log.grey(`Attached the "${name}"`, dataObject)
          } else if (dataObject.startsWith(iteratorVar)) {
            dataObject = findListDataObject(component)
            !dataObject && (dataObject = file)
          }
        }

        const params = { dataKey, dataObject }
        log.func('updateObject')
        log.grey(`Calling updateObject`, { params })
        await app.noodl.updateObject(params)
      }
    } catch (error) {
      console.error(error)
      toast(error.message, { type: 'error' })
    }
  }

  const getLocationAddress: Store.ActionObject['fn'] =
    async function onGetLocationAddress(action, options) {
      log.func('getLocationAddress')
      log.grey('', action?.snapshot?.())
      const types = 'address'
      const access_token =
        'pk.eyJ1IjoiamllamlleXV5IiwiYSI6ImNrbTFtem43NzF4amQyd3A4dmMyZHJhZzQifQ.qUDDq-asx1Q70aq90VDOJA'
      const host = 'https://api.mapbox.com/geocoding/v5/mapbox.places'
      const dataKey = _pick(action, 'dataKey')
      const longitude = localStorage.getItem('longitude')
      const latitude = localStorage.getItem('latitude')
      if (longitude && latitude) {
        await axios({
          method: 'get',
          url: `${host}/${longitude},${latitude}.json`,
          params: {
            // types: types,
            limit: 1,
            access_token: access_token,
          },
        })
          .then((res) => {
            const place_name = res['data']['features'][0]['place_name']
            let dataObject = isRootDataKey(dataKey)
              ? app.root
              : app.root?.[pickNUIPageFromOptions(options)?.page || '']
            if (place_name) {
              set(dataObject, dataKey, place_name)
            }
          })
          .catch((error) => {
            console.log(error)
          })
      }
    }

  return {
    anonymous,
    emit,
    evalObject,
    goto,
    openCamera,
    openDocumentManager,
    openPhotoLibrary,
    pageJump,
    popUp,
    popUpDismiss,
    refresh,
    removeSignature,
    saveObject,
    saveSignature,
    toast: toastAction,
    updateObject,
    getLocationAddress,
  }
}

export default createActions
