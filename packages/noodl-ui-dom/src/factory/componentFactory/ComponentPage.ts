import * as u from '@jsmanifest/utils'
import type { OrArray } from '@jsmanifest/typefest'
import type { NUIComponent, Page as NUIPage } from 'noodl-ui'
import NDOMPage from '../../Page'
import copyAttributes from '../../utils/copyAttributes'
import * as c from '../../constants'
import * as t from '../../types'

const _getRandomKey = () => `_${Math.random().toString(36).substr(2, 9)}`

export type ComponentPageEvent =
  typeof c.eventId.componentPage.on[keyof typeof c.eventId.componentPage.on]

export interface ComponentPageHooks {
  [c.eventId.componentPage.on.ON_LOAD]: OnLoad[]
  [c.eventId.componentPage.on.ON_ERROR]: OnError[]
}

export type OnLoad = (evt: Event, node: HTMLIFrameElement) => void
export type OnError = (error: ErrorEvent) => void

class ComponentPage<
  N extends HTMLIFrameElement = HTMLIFrameElement,
> extends NDOMPage {
  #component: NUIComponent.Instance
  #hooks = {
    [c.eventId.componentPage.on.ON_LOAD]: [],
    [c.eventId.componentPage.on.ON_ERROR]: [],
  } as ComponentPageHooks
  #onLoad: OnLoad | undefined
  #onError: OnError | undefined
  #initialized = false
  #error: Error | null = null
  rootNode: N;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      ...this.snapshot(),
      error: this.error,
      initialized: this.#initialized,
      component: this.component?.toJSON(),
    }
  }

  [Symbol.iterator]() {
    return {
      next() {
        let component: NUIComponent.Instance
        let node: t.NDOMElement

        // while ()

        return {
          // value: ,
          done: false,
        }
      },
    }
  }

  constructor(
    component: NUIComponent.Instance,
    hooks?: { onLoad?: OnLoad; onError?: OnError },
  ) {
    super(
      (component?.get?.('page') as NUIPage) || {
        id: component?.id || _getRandomKey(),
      },
    )

    this.#component = component
    this.rootNode = super.rootNode as N

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
      this.rootNode = document.createElement('iframe') as N
    }

    this.rootNode.addEventListener(
      'load',
      (evt) => {
        this.#initialized = true
        this.#onLoad?.(evt, this.rootNode)
      },
      { once: true },
    )

    this.rootNode.addEventListener('error', (err) => this.#onError?.(err), {
      once: true,
    })

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

  get window() {
    return this.rootNode?.contentWindow || null
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

  appendChild<N extends HTMLElement>(childNode: N) {
    try {
      this.body?.appendChild?.(childNode)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  clear() {
    this.reset()
    this.rootNode?.remove?.()
    // @ts-expect-error
    this.rootNode = null
    u.values(this.#hooks).forEach((arr) => (arr.length = 0))
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
      this.rootNode.contentDocument?.head.appendChild(cspElem)
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
    } else {
      this.hooks[evt as ComponentPageEvent].forEach((fn) =>
        (fn as any)?.(
          ...(args as Parameters<
            ComponentPageHooks[ComponentPageEvent][number]
          >),
        ),
      )
    }
    return this
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

  replaceNode<NN extends N>(node: NN) {
    try {
      if (this.parentElement) {
        this.parentElement.replaceChild(node, this.rootNode)
      } else {
        this.rootNode?.remove?.()
      }
      this.rootNode = node as NN
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

export default ComponentPage
