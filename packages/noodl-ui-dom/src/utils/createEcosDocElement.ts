import * as u from '@jsmanifest/utils'
import { EcosDocument, Identify, NameField } from 'noodl-types'
import { classes } from '../constants'
import { isImageDoc, isPdfDoc, isTextDoc } from './internal'
import createAsyncImageElement from './createAsyncImageElement'
import createTextNode from './createTextNode'

const is = Identify.ecosObj

interface CreateEcosDocElementArgs<N extends NameField = NameField> {
  ecosObj: EcosDocument<N>
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

function createEcosDocElement<N extends NameField = NameField>(
  container: HTMLElement,
  ecosObj: EcosDocument<N>,
): HTMLIFrameElement

function createEcosDocElement<
  N extends NameField = NameField,
  Args extends CreateEcosDocElementArgs<N> = CreateEcosDocElementArgs<N>,
>(
  container: HTMLElement,
  opts: CreateEcosDocElementArgs<NameField>,
): HTMLIFrameElement

function createEcosDocElement<
  N extends NameField & Record<string, any> = NameField,
>(
  container: HTMLElement,
  opts: EcosDocument<N> | CreateEcosDocElementArgs<N>,
): HTMLIFrameElement {
  const width = Number(container.style.width.replace(/[a-zA-Z]/i, ''))
  const height = Number(container.style.height.replace(/[a-zA-Z]/i, ''))
  const iframe = document.createElement('iframe')
  let iframeContent: any // HTML element, direct child of iframe's contentDocument.body node

  let onLoad: CreateEcosDocElementArgs['onLoad'] | undefined
  let onError: CreateEcosDocElementArgs['onError'] | undefined
  let ecosObj: EcosDocument<N> | undefined

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
  if (isImageDoc(ecosObj)) {
    iframeContent = createAsyncImageElement(iframe.contentDocument?.body as any)
    iframeContent.classList.add(classes.ECOS_DOC_IMAGE)
    iframeContent.src = ecosObj?.name?.data || ''
    iframeContent.style.width = '100%'
    iframeContent.style.height = '100%'
  }
  // PDF Document
  else if (isPdfDoc(ecosObj)) {
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
  else if (is.note(ecosObj) || isTextDoc(ecosObj as EcosDocument)) {
    iframeContent = document.createElement('div')
    iframeContent.style.width = '100%'
    iframeContent.style.height = '100%'

    if (is.note(ecosObj)) {
      iframeContent.classList.add(classes.ECOS_DOC_NOTE)
    } else if (isTextDoc(ecosObj as EcosDocument)) {
      iframeContent.classList.add(classes.ECOS_DOC_TEXT)
    }

    const appendTextNode = function _appendTextNode(
      label: 'title' | 'content' | 'note' | 'data',
    ) {
      let content = ecosObj?.name?.[label]
      if (!u.isStr(content)) {
        if (u.isObj(content)) {
          console.log(
            `%cAlert! Reached an ecosDoc's content as an object for a "${label}". Look into this`,
            `color:#ec0000;`,
            content,
          )
          u.eachEntries(content, (k, v) => u.isStr(v) && (content = v))
        }
      }

      iframeContent.appendChild(
        createTextNode(content, {
          title: label === 'title' ? ecosObj?.name?.[label] : undefined,
          name: label,
          classList:
            label === 'title'
              ? classes.ECOS_DOC_TEXT_TITLE
              : label === 'content'
              ? classes.ECOS_DOC_TEXT_BODY
              : label === 'note'
              ? classes.ECOS_DOC_NOTE
              : label === 'data'
              ? classes.ECOS_DOC_NOTE_DATA
              : undefined,
        }),
      )
    }

    ecosObj?.name?.title && !is.note(ecosObj) && appendTextNode('title')
    ecosObj?.name?.content && appendTextNode('content')
    ecosObj?.name?.note && appendTextNode('note')
    ecosObj?.name?.data && appendTextNode('data')
  }

  return iframe
}

export default createEcosDocElement
