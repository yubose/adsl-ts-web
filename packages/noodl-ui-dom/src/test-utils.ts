import { ComponentObject, PageObject } from 'noodl-types'
import { ComponentInstance, NOODL as NOODLUI, Viewport } from 'noodl-ui'
import { NOODLDOMElement, Page, Resolve } from './types'
import { array, entries, keys } from './utils/internal'
import { eventId } from './constants'
import NOODLDOM from './noodl-ui-dom'
import * as resolvers from './resolvers'

export const baseUrl = 'https://aitmed.com/'
export const assetsUrl = baseUrl + 'assets/'
export const ndom = new NOODLDOM()
export const noodlui = new NOODLUI()
export const viewport = new Viewport()

/**
 * A helper that tests a noodl-ui-dom DOM resolver. This helps to automatically prepare
 * the noodl-ui client when testing resolvers. The root object automatically
 * inserts the pageName and pageObject if they are both set, so its entirely optional
 * to provide a getRoot function in that case
 */
export function useResolver<Evt extends Page.HookEvent = Page.HookEvent>({
  on,
  ...opts
}: {
  component: ComponentObject
  noodlui?: NOODLUI
  on?: Partial<Record<Evt, Page.Hook[Evt]>>
  pageName?: string
  pageObject?: PageObject
  resolver?:
    | Resolve.Config
    | keyof typeof resolvers
    | (Resolve.Config | keyof typeof resolvers)[]
  root?: Record<string, any>
}) {
  ndom.reset('resolvers')

  if (!opts.resolver) {
    opts.resolver = keys(resolvers) as (keyof typeof resolvers)[]
  }

  array(opts.resolver).forEach(
    (resolver: Resolve.Config | keyof typeof resolvers) => {
      if (typeof resolver === 'string') {
        resolvers[resolver] && ndom.register({ resolve: resolvers[resolver] })
      } else {
        resolver && ndom.register({ resolve: resolver })
      }
    },
  )

  if (on) {
    entries(on).forEach(([evt, fn]) =>
      ndom.page.on<Evt>(evt as Evt, fn as Page.Hook[Evt]),
    )
  }

  if (!ndom.resolvers().find((o) => o.name === resolvers.id.name)) {
    ndom.register({ resolve: resolvers.id })
  }

  const nui = opts.noodlui || noodlui

  if (opts.pageName) {
    nui.setPage(opts.pageName)
    nui.use({
      getRoot: () => ({
        [opts.pageName as string]: {
          components: [],
          ...opts.pageObject,
          ...opts.root?.[opts.pageName as string],
        },
      }),
    })
  }

  ndom.page.on(eventId.page.on.ON_BEFORE_RENDER_COMPONENTS, async () => ({
    name: nui.page,
    object: {
      ...nui.root[nui.page],
      components: opts.component
        ? [opts.component]
        : nui.root[nui.page]?.components || [],
    },
  }))

  return {
    assetsUrl,
    componentCache: nui.componentCache.bind(nui),
    page: ndom.page,
    async requestPageChange(name: string = nui.page) {
      const components = await ndom.page.requestPageChange(name)
      return components.snapshot.components as ComponentInstance[]
    },
  }
}

export function toDOM<
  N extends NOODLDOMElement = NOODLDOMElement,
  C extends ComponentInstance = ComponentInstance
>(props: any) {
  let node: N | null = null
  let component: C | undefined
  if (typeof props?.props === 'function') {
    node = ndom.draw(props as any) as N
    component = props as any
  } else if (typeof props === 'object' && 'type' in props) {
    component = noodlui.resolveComponents(props) as any
    // @ts-expect-error
    node = ndom.draw(component) as N
  }
  if (node) document.body.appendChild(node as any)
  return [node, component] as [NonNullable<N>, C]
}
