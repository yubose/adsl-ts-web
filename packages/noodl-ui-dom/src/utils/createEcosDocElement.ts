import * as u from '@jsmanifest/utils'
import { component, EcosDocument, Identify, NameField } from 'noodl-types'
import { classes } from '../constants'
import createAsyncImageElement from './createAsyncImageElement'
import createTextNode from './createTextNode'

const is = Identify.ecosObj
const getBody = (iframe: HTMLIFrameElement | null) =>
  (iframe?.contentDocument?.body as HTMLBodyElement) || null

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
  let mimeType = ''

  if (u.isObj(opts)) {
    if ('ecosObj' in opts) {
      ecosObj = opts.ecosObj
      onLoad = opts.onLoad
      onError = opts.onError
    } else {
      ecosObj = opts
    }
  }

  ecosObj?.name?.type && (mimeType = ecosObj.name.type)

  iframe.classList.add(classes.ECOS_DOC)
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = 'none'
  iframe.title = ecosObj?.name?.title || 'eCOS Document'

  /** LOADED */
  iframe.onload = function onLoadEcosDocElement(event) {
    let className = ''
    if (is.doc(ecosObj)) {
      if (/json/i.test(mimeType)) {
        className = classes.ECOS_DOC_NOTE
      } else if (/pdf/i.test(mimeType)) {
        // className added in the render block somewhere below
      }
    } else if (is.image(ecosObj)) {
      className = classes.ECOS_DOC_IMAGE
    } else if (is.text(ecosObj)) {
      if (/css/i.test(mimeType)) {
        className = classes.ECOS_DOC_TEXT_CSS
      } else if (/html/i.test(mimeType)) {
        className = classes.ECOS_DOC_TEXT_HTML
      } else if (/javascript/i.test(mimeType)) {
        className = classes.ECOS_DOC_TEXT_JAVASCRIPT
      } else if (/plain/i.test(mimeType)) {
        className = classes.ECOS_DOC_TEXT_PLAIN
      } else if (/markdown/i.test(mimeType)) {
        className = classes.ECOS_DOC_TEXT_MARKDOWN
      }
    } else if (is.video(ecosObj)) {
      className = classes.ECOS_DOC_VIDEO
    }
    className && getBody(iframe)?.classList.add(className)
    iframeContent && getBody(iframe)?.appendChild(iframeContent)
    onLoad?.({
      event,
      width,
      height,
      src: ecosObj?.name?.data || '',
      title: ecosObj?.name?.title,
    })
  }

  /** ERROR */
  iframe.onerror = function onErrorEcosDocElement(...args) {
    const [event, source, lineNum, colNum, error] = args
    onError?.({ error, event, lineNum, colNum, source })
  }
  /* -------------------------------------------------------
    ---- IMAGE DOCUMENTS
  -------------------------------------------------------- */
  if (is.image(ecosObj)) {
    iframeContent = createAsyncImageElement(getBody(iframe))
    if (ecosObj.name?.data) {
      // TODO - Change iframeContent to just be the iframe
      iframeContent.src = ecosObj.name.data || ''
    } else {
      console.log(
        `%cData is missing from an image ecosObj`,
        `color:#ec0000;`,
        ecosObj,
      )
    }
  } else if (is.doc(ecosObj)) {
    if (/pdf/i.test(ecosObj.name?.type || '')) {
      iframe.classList.add(classes.ECOS_DOC_PDF)
      /* -------------------------------------------------------
        ---- PDF DOCUMENTS
      -------------------------------------------------------- */
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
    } else if (/json/i.test(ecosObj.name?.type || '')) {
      /* -------------------------------------------------------
      ---- NOTE DOCUMENTS
    -------------------------------------------------------- */
      iframeContent = document.createElement('div')
      if (ecosObj.name?.data) {
        if (u.isStr(ecosObj.name.data) || u.isNum(ecosObj.name.data)) {
          iframeContent?.appendChild(
            createTextNode(ecosObj.name.data, {
              title: ecosObj.name.title,
              name: 'Note',
              classList: classes.ECOS_DOC_NOTE_DATA,
            }),
          )
        } else {
          console.log(
            `%cExpected a string for a note's "data" but received "${typeof ecosObj
              .name.data}"`,
            `color:#ec0000;`,
            ecosObj,
          )
        }
      } else {
        console.log(
          `%cA note is missing the "data" property. No content will be shown`,
          `color:#ec0000;`,
          component,
        )
      }
    } else {
      throw new Error(
        `Could not handle an unknown ecosObj with mime type "${ecosObj.name?.type}"`,
      )
    }
  } else if (is.text(ecosObj)) {
    /* -------------------------------------------------------
      ---- TEXT DOCUMENTS (HTML/PLAIN/JAVASCRIPT/MARKDOWN/ETC)
    -------------------------------------------------------- */
    iframeContent = document.createElement('div')
    iframeContent.classList.add(classes.ECOS_DOC_TEXT)

    function appendTextNode(label: 'title' | 'content' | 'data') {
      let content = ecosObj?.name?.[label] || ''
      if (u.isStr(content) && content.startsWith('blob:')) {
        const img = document.createElement('img')
        img.title = ecosObj?.name?.title || ''
        img.alt = 'eCOS image'
        img.src = content
        iframeContent.appendChild(img)
      } else {
        iframeContent.appendChild(
          createTextNode(content, {
            title: label === 'title' ? ecosObj?.name?.[label] : undefined,
            name: label,
            classList:
              label === 'title'
                ? classes.ECOS_DOC_TEXT_TITLE
                : label === 'content'
                ? classes.ECOS_DOC_TEXT_BODY
                : label === 'data'
                ? classes.ECOS_DOC_TEXT_BODY
                : undefined,
          }),
        )
      }
    }
    ecosObj?.name?.title && !is.doc(ecosObj) && appendTextNode('title')
    ecosObj?.name?.content && appendTextNode('content')
    ecosObj?.name?.data && appendTextNode('data')
  }

  if (iframeContent) {
    iframeContent.style.width = '100%'
    iframeContent.style.height = '100%'
  }

  return iframe
}

export default createEcosDocElement
