import { EcosDocument, NameFieldBase } from 'noodl-types'
import { classes } from '../constants'
import createAsyncImageElement from './createAsyncImageElement'
import * as u from './internal'

interface CreateEcosDocElementArgs<
  NameField extends NameFieldBase = NameFieldBase
> {
  ecosObj: EcosDocument<NameField>
  width?: number
  height?: number
  onLoad?(args: {
    event: Event
    width: number
    height: number
    src: string
    title?: string
  }): void
  onError?(args: {
    error: Error | undefined
    event: string | Event
    lineNum: number | undefined
    colNum: number | undefined
    source: string | undefined
  }): void
}

function createEcosDocElement<NameField extends NameFieldBase = NameFieldBase>(
  container: HTMLElement,
  ecosObj: EcosDocument<NameField>,
): HTMLIFrameElement

function createEcosDocElement<
  NameField extends NameFieldBase = NameFieldBase,
  Args extends CreateEcosDocElementArgs<NameField> = CreateEcosDocElementArgs<NameField>
>(
  container: HTMLElement,
  opts: CreateEcosDocElementArgs<NameField>,
): HTMLIFrameElement

function createEcosDocElement<
  NameField extends NameFieldBase & Record<string, any> = NameFieldBase
>(
  container: HTMLElement,
  opts: EcosDocument<NameField> | CreateEcosDocElementArgs<NameField>,
): HTMLIFrameElement {
  const width = Number(container.style.width.replace(/[a-zA-Z]/i, ''))
  const height = Number(container.style.height.replace(/[a-zA-Z]/i, ''))
  const iframe = document.createElement('iframe')
  let iframeContent: any // HTML element, direct child of iframe's contentDocument.body node

  let onLoad: CreateEcosDocElementArgs['onLoad'] | undefined
  let onError: CreateEcosDocElementArgs['onError'] | undefined
  let ecosObj: EcosDocument<NameField> | undefined

  if (u.isObj(opts)) {
    if ('ecosObj' in opts) {
      ecosObj = opts.ecosObj
      onLoad = opts.onLoad
      onError = opts.onError
    } else {
      ecosObj = opts
    }
  }

  iframe.classList.add(classes.ECOS_DOC)
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = 'none'
  iframe.title = ecosObj?.name?.title || 'eCOS Document'

  iframe.onload = function onLoadEcosDocElement(event) {
    iframeContent && iframe.contentDocument?.body.appendChild(iframeContent)
    onLoad?.({
      event,
      width,
      height,
      src: ecosObj?.name?.data || '',
      title: ecosObj?.name?.title,
    })
  }

  iframe.onerror = function onErrorEcosDocElement(...args) {
    const [event, source, lineNum, colNum, error] = args
    onError?.({ error, event, lineNum, colNum, source })
  }

  // Image document
  if (u.isImageDoc(ecosObj)) {
    iframeContent = createAsyncImageElement(iframe.contentDocument?.body as any)
    iframeContent.classList.add(classes.ECOS_DOC_IMAGE)
    iframeContent.src = ecosObj?.name?.data || ''
    iframeContent.style.width = '100%'
    iframeContent.style.height = '100%'
  }
  // PDF Document
  else if (u.isPdfDoc(ecosObj)) {
    iframe.classList.add(classes.ECOS_DOC_PDF)
    const url = ecosObj?.name?.data
    if (u.isStr(url)) {
      if (
        url.startsWith('blob:') ||
        url.startsWith('data:') ||
        url.startsWith('http')
      ) {
        iframe.src = url
        console.log(
          `%cAttaching a URL to iframe for a PDF ecosDoc component`,
          `color:#95a5a6;`,
          url,
        )
      } else {
        console.log(
          `%cThe url is in an unknown format (expected to receive it as ` +
            `one of : "blob:...", "data:...", or "http")`,
          `color:#ec0000;`,
          url,
        )
      }
    } else {
      console.log(
        `%cExpected a URL string as a value for ecosObj.name.data but received "${typeof url}" instead`,
        `color:#ec0000;`,
        url,
      )
    }
  }
  // Text document (markdown, html, plain text, etc)
  else if (u.isTextDoc(ecosObj as EcosDocument)) {
    iframeContent = document.createElement('div')
    iframeContent.style.width = '100%'
    iframeContent.style.height = '100%'
    iframeContent.classList.add(classes.ECOS_DOC_TEXT)

    const createTextDocElement = function _createTextDocElement(
      content: string | number,
      options?: Record<string, any>,
    ) {
      const div = document.createElement('div')
      const textNode = document.createTextNode(String(content))
      if (options) {
        u.entries(options).forEach(([key, value]) => {
          if (key === 'style') {
            div.style[key] = value
          } else if (key === 'classList') {
            u.array(value).forEach((className: string) => {
              className && div.classList.add(className)
            })
          } else {
            div.setAttribute(key, value)
          }
        })
      }
      div.appendChild(textNode)
      return div
    }

    const appendTextNode = function _appendTextNode(
      label: 'title' | 'content',
    ) {
      iframeContent.appendChild(
        createTextDocElement(ecosObj?.name?.[label] as string, {
          title: label === 'title' ? ecosObj?.name?.[label] : undefined,
          name: label,
          classList:
            label === 'title'
              ? classes.ECOS_DOC_TEXT_TITLE
              : label === 'content'
              ? classes.ECOS_DOC_TEXT_BODY
              : undefined,
        }),
      )
    }

    ecosObj?.name?.title && appendTextNode('title')
    ecosObj?.name?.content && appendTextNode('content')
  }

  return iframe
}

export default createEcosDocElement
