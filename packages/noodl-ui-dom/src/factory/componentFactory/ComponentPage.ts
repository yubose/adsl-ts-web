import * as u from '@jsmanifest/utils'
import type { OrArray } from '@jsmanifest/typefest'
import type { NUIComponent, Page as NUIPage } from 'noodl-ui'
import { isComponent, isPage as isNUIPage } from 'noodl-ui'
import NDOMPage from '../../Page'
import isNDOMPage from '../../utils/isPage'
import copyAttributes from '../../utils/copyAttributes'
import * as c from '../../constants'
import * as t from '../../types'

export type ComponentPageEvent =
  typeof c.eventId.componentPage.on[keyof typeof c.eventId.componentPage.on]

export interface ComponentPageHooks {
  [c.eventId.componentPage.on.ON_LOAD]: OnLoad[]
  [c.eventId.componentPage.on.ON_ERROR]: OnError[]
  [c.eventId.componentPage.on.ON_MESSAGE]: OnMessage[]
}

export type OnLoad = (evt: Event, node: HTMLIFrameElement) => void
export type OnError = (error: ErrorEvent) => void
export type OnMessage = (evt: MessageEvent) => void

class ComponentPage<
  N extends HTMLIFrameElement = HTMLIFrameElement,
> extends NDOMPage {
  #component: NUIComponent.Instance
  #hooks = {
    [c.eventId.componentPage.on.ON_LOAD]: [],
    [c.eventId.componentPage.on.ON_ERROR]: [],
    [c.eventId.componentPage.on.ON_MESSAGE]: [],
  } as ComponentPageHooks
  #nuiPage: NUIPage
  #initialized = false
  #error: Error | null = null
  origin = '';

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      ...this.snapshot(),
      error: this.error,
      initialized: this.#initialized,
      component: this.component?.toJSON(),
    }
  }

  constructor(
    component: NUIComponent.Instance,
    hooks?: { onLoad?: OnLoad; onError?: OnError },
  ) {
    let nuiPage = component?.get?.('page')
    if (isNDOMPage(nuiPage)) nuiPage = nuiPage.getNuiPage()
    super(nuiPage)
    this.#component = component
    this.rootNode = super.rootNode as N
    this.origin = window.origin

    if (this.rootNode) {
      if (this.rootNode.tagName !== 'IFRAME') {
        const attributes = copyAttributes(this.rootNode)
        if (this.rootNode.parentElement) {
          this.rootNode.parentElement.removeChild(this.rootNode)
        } else {
          this.rootNode.remove()
        }
        this.rootNode = document.createElement('iframe') as N
        this.rootNode.id = component.id
        u.assign(this.rootNode, attributes)
      }
    } else {
      this.rootNode = document.createElement('iframe')
    }

    window?.addEventListener('message', this.#onparentmessage)
    window?.addEventListener('messageerror', this.#onparentmessageerror)
    this.rootNode?.addEventListener(
      'load',
      (evt) => {
        console.info(`LOADED FROM COMPONENT PAGE ${this?.id}`, {
          event: evt,
          instance: this,
        })
        // const observe = () => {
        //   const observer = new MutationObserver((mutations) => {
        //     console.info(`Mutations`, mutations)
        //   })

        //   observer.observe(this.body)
        // }

        // this.body.addEventListener('load', (evt) => {
        //   console.info(`OBSERVING BODY`, this.body)
        //   observe()
        // })
      },
      { once: true },
    )
    this.rootNode?.addEventListener?.(
      'unload',
      (evt) => {
        console.info(`UNLOADING FROM COMPONENT PAGE ${this.id}`, {
          event: evt,
          instance: this,
        })
        try {
          this.body.innerHTML = ''
          this.body.remove()
          this.rootNode.remove()
        } catch (error) {
          console.error(`[Error from unload ComponentPage]`, error)
        }
      },
      { once: true },
    )

    this.configure({
      allow: '*',
      name: this.page,
      onLoad: hooks?.onLoad,
      onError: hooks?.onError,
    })
  }

  get component() {
    return this.#component
  }

  get hasNuiPage() {
    return isNUIPage(this.getNuiPage())
  }

  get window() {
    return ((this.rootNode as HTMLIFrameElement)?.contentWindow ||
      null) as Window
  }

  get document() {
    return this.window?.document || null
  }

  get head() {
    return this.document?.head || null
  }

  get body() {
    return this.document?.body || null
  }

  get error() {
    return this.#error || null
  }

  get initialized() {
    return this.#initialized
  }

  get parentElement() {
    return this.rootNode?.parentElement || null
  }

  #onparentmessage = (evt: MessageEvent) => {
    console.log(`%c[ComponentPage] Received message`, `color:#0047ff;`, evt)
    this.#hooks
    let data
    try {
      if (u.isObj(evt.data)) data = evt.data
      else if (u.isStr(evt.data)) data = JSON.parse(evt.data)
    } catch (error) {
      console.error(error)
    }
    this.emitSync(c.eventId.componentPage.on.ON_MESSAGE, data)
  }

  #onparentmessageerror = (evt: MessageEvent) => {
    console.log(
      `%c[ComponentPage] Received message error `,
      `color:#0047ff;`,
      evt,
    )
  }

  appendChild<N extends HTMLElement>(childNode: N) {
    try {
      this.body?.appendChild?.(childNode)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  clear() {
    this.remove()
    this.rootNode?.remove?.()
    u.forEach(u.clearArr, u.values(this.#hooks))
    this.#component = null as any
  }

  configure(opts: {
    [c.ARIA_LABELLEDBY]?: string
    [c.ARIA_HIDDEN]?: string
    [c.ARIA_LABEL]?: string
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
      cspElem.setAttribute('http-equiv', c.CONTENT_SECURITY_POLICY)
      // default-src 'self' === all content should come from the site's origin
      let value = `default-src 'self';`
      let obj = opts.contentSecurityPolicy
      obj.allowImages && (value += addKeyPair('img-src', '*'))
      obj.allowVideos && (value += addKeyPair('media-src', '*'))
      obj.allowScripts && (value += addKeyPair('script-src', obj.allowScripts))
      cspElem.setAttribute('content', value)
      this.rootNode?.contentDocument?.head.appendChild(cspElem)
    }

    opts.onLoad && this.on(c.eventId.componentPage.on.ON_LOAD, opts.onLoad)
    opts.onError && this.on(c.eventId.componentPage.on.ON_ERROR, opts.onError)

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

  emitSync<Evt extends ComponentPageEvent>(
    evt: Evt,
    ...args: Parameters<ComponentPageHooks[Evt][number]>
  ): this

  emitSync<
    Evt extends typeof c.eventId.page.on[keyof typeof c.eventId.page.on],
  >(...args: Parameters<NDOMPage['emitSync']>): this

  emitSync<Evt extends string>(
    evt: Evt,
    ...args:
      | Parameters<ComponentPageHooks[ComponentPageEvent][number]>
      | Parameters<NDOMPage['emitSync']>
  ) {
    if (evt in super.hooks) {
      super.emitSync(
        evt as typeof c.eventId.page.on[keyof typeof c.eventId.page.on],
        ...(args as Parameters<NDOMPage['emitSync']>),
      )
    } else if (evt in this.#hooks) {
      u.forEach?.(
        (fn) =>
          (fn as any)?.(
            ...(args as Parameters<
              ComponentPageHooks[ComponentPageEvent][number]
            >),
          ),
        this.#hooks[evt as ComponentPageEvent],
      )
    }
    return this
  }

  getNuiPage() {
    const nuiPage = this.#component?.get?.('page') as NUIPage
    if (nuiPage) {
      if (this.#nuiPage !== nuiPage) {
        this.#nuiPage = nuiPage
        // const origSetter = Object.getOwnPropertyDescriptor(
        //   this.#nuiPage,
        //   'page',
        // )
        // if (origSetter) {
        //   Object.defineProperty(this.#nuiPage, 'page', {
        //     set(value) {
        //       origSetter.set?.(value)
        //       console.info(`getNuiPage`, { thisValue: this, value })
        //     },
        //   })
        // }
      }
    }
    return this.#nuiPage
  }

  on<
    Evt extends
      | ComponentPageEvent
      | typeof c.eventId.page.on[keyof typeof c.eventId.page.on],
  >(
    evt: Evt,
    fn:
      | Parameters<NDOMPage['on']>[1]
      | ComponentPageHooks[ComponentPageEvent][number],
  ) {
    if (c.eventId.page.on[evt as keyof typeof c.eventId.page.on]) {
      super.on(
        evt as keyof typeof c.eventId.page.on,
        fn as Parameters<NDOMPage['on']>[1],
      )
    } else if (evt in this.#hooks) {
      this.#hooks[evt as ComponentPageEvent].push(fn as any)
    }
    return this
  }

  patch(nuiPage: NUIPage | NUIComponent.Instance) {
    if (isNUIPage(nuiPage)) {
      if (nuiPage.page !== this.page) this.page = nuiPage.page
      this.#nuiPage = nuiPage
      this.#component?.edit?.('page', nuiPage)
    } else if (isComponent(nuiPage)) {
      this.#component = nuiPage
      if (this.#nuiPage && !nuiPage.get('page')) {
        this.#component.edit('page', this.#nuiPage)
      } else if (!this.#nuiPage && nuiPage.get('page')) {
        this.#nuiPage = nuiPage.get('page')
      }
    }
  }

  replaceNode<NN extends N>(node: NN) {
    try {
      if (this.parentElement) {
        this.parentElement.replaceChild(node, this.rootNode)
      }
      this.rootNode = node as NN
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  sendMessage(message: any, origin = '*', transfer?: Transferable[]) {
    console.log(
      `%c[ComponentPage] Sending message to origin: ${origin}`,
      `color:#95a5a6;`,
      message,
    )
    // window.parent.postMessage(message, origin)
    this.window.postMessage(message, origin)
  }
}

export default ComponentPage
