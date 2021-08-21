import * as u from '@jsmanifest/utils'
import type { OrArray } from '@jsmanifest/typefest'
import type { Page as NUIPage } from 'noodl-ui'
import NDOMPage from '../../Page'
import * as c from '../../constants'
import * as t from '../../types'

const ARIA_LABELLEDBY = 'aria-labelledby'
const ARIA_HIDDEN = 'aria-hidden'
const ARIA_LABEL = 'aria-label'
const CONTENT_SECURITY_POLICY = 'Content-Security-Policy'

export type OnLoad = (evt: Event, node: HTMLIFrameElement) => void
export type OnError = (error: ErrorEvent) => void

class ComponentPage extends NDOMPage {
  #onLoad: OnLoad | undefined
  #onError: OnError | undefined
  rootNode: HTMLIFrameElement

  constructor(
    nuiPage: NUIPage,
    hooks?: { onLoad?: OnLoad; onError?: OnError },
  ) {
    super(nuiPage)

    this.rootNode = document.createElement('iframe')

    this.rootNode.addEventListener(
      'load',
      (evt) => this.#onLoad?.(evt, this.rootNode),
      { once: true },
    )

    this.rootNode.addEventListener('error', (err) => this.#onError?.(err), {
      once: true,
    })

    hooks?.onLoad && this.onLoad(hooks.onLoad)
    hooks?.onError && this.onError(hooks.onError)

    this.configure({
      allow: '*',
      name: nuiPage.page,
    })
  }

  configure(opts: {
    [ARIA_LABELLEDBY]?: string
    [ARIA_HIDDEN]?: string
    [ARIA_LABEL]?: string
    /**
     * A string or an array of strings as policies to control content
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
     */
    allow?: OrArray<string>
    allowPaymentRequest?: boolean
    allowFullScreen?: boolean
    contentSecurityPolicy?: {
      allowImages?: boolean
      allowVideos?: boolean
      allowScripts?: boolean | OrArray<string>
      allowedHosts?: OrArray<string>
    }
    className?: string
    name?: string
    onLoad?: OnLoad
    onError?: OnError
    httpsOnly?: boolean
    width?: string
    height?: string // Defaults to 150
    /**
     * Indicates which referrer to send when fetching the frame's resource
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-referrerpolicy
     */
    referrerPolicy?: HTMLIFrameElement['referrerPolicy']
    /**
     * Applies extra restrictions to the content in the frame.
     * Defaults to an empty string (applies all restrictions)
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox
     */
    sandbox?: HTMLIFrameElement['sandbox']
    style?: HTMLIFrameElement['style']
    src?: string
    srcDoc?: string
    title?: string
  }) {
    opts.allowPaymentRequest && (this.rootNode.allowPaymentRequest = true)
    opts.className && this.rootNode.classList.add(opts.className)
    opts.width && (this.rootNode.width = opts.width)
    opts.height && (this.rootNode.height = opts.height)
    opts.name && (this.rootNode.name = opts.name)

    if (opts.contentSecurityPolicy) {
      const addKeyPair = (k: string, v: OrArray<string> | boolean) => {
        let value = ''
        value += `${k} ${
          u.isBool(v)
            ? '*'
            : u.array(v).reduce((acc, str) => (acc += `${str};`), '')
        }`
        return value
      }
      const cspElem = document.createElement('meta')
      cspElem.setAttribute('http-equiv', CONTENT_SECURITY_POLICY)
      // default-src 'self' === all content should come from the site's origin
      let value = `default-src 'self';`
      let obj = opts.contentSecurityPolicy
      obj.allowImages && (value += addKeyPair('img-src', '*'))
      obj.allowVideos && (value += addKeyPair('media-src', '*'))
      obj.allowScripts && (value += addKeyPair('script-src', obj.allowScripts))
      cspElem.setAttribute('content', value)
      this.rootNode.contentDocument?.head.appendChild(cspElem)
    }

    opts.onLoad && this.onLoad(opts.onLoad)
    opts.onError && this.onError(opts.onError)

    if (opts.sandbox) {
      const tokenList = new DOMTokenList()
      tokenList.add(
        'allow-modals',
        'allow-orientation-lock',
        'allow-popups',
        'allow-popups-to-escape-sandbox',
        'allow-same-origin',
        'allow-scripts',
        'allow-top-navigation',
      )
    }

    return this
  }

  onLoad(fn: OnLoad | undefined) {
    this.#onLoad = fn
    return this
  }

  onError(fn: OnError | undefined) {
    this.#onError = fn
    return this
  }
}

export default ComponentPage
