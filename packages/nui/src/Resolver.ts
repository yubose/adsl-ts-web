import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import SignaturePad from 'signature_pad'
import {
  attributesModule,
  htmlDomApi as dom,
  init,
  h,
  classModule,
  datasetModule,
  propsModule,
  styleModule,
  eventListenersModule,
  toVNode,
} from 'snabbdom'
import { LiteralUnion } from 'type-fest'
import { OrArray } from '@jsmanifest/typefest'
import { hasDecimal, hasLetter } from './utils/common'
import VP from './Viewport'
import * as t from './types'

export class NuiResolver {
  translators = new Map<string, t.Resolve.TranslateConfig[]>();

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      translators: this.translators,
    }
  }

  options<N extends VNode>(args: t.Resolve.BaseOptions<N> & { ndom: NDOM }) {
    if (nt.Identify.component.canvas(args.component)) {
      args.component.edit(
        'signaturePad',
        new SignaturePad(
          document.createElement(args.vnode) as HTMLCanvasElement,
          {
            dotSize: 0.2,
          },
        ),
      )
    }

    return {
      cache,
      component: args.component,
      vnode: args.vnode,
      get page() {
        return (
          args.page ||
          args.ndom.findPage(getPageAncestor(args.component)?.get?.('page')) ||
          args.ndom.page
        )
      },
      /**
       * REMINDER: This intentionally does not include componentsResolver due to
       * circular references/infinite loops
       */
      resolvers: [
        ...args.ndom.consumerResolvers,
        attributesResolver,
        componentsResolver,
      ],
      elementType: args.vnode?.tagName || '',
      componentType: args.component?.type || '',
    }
  }

  async run<N extends t.VNode>({
    ndom,
    vnode,
    component,
    page,
    resolvers,
  }: Pick<t.Resolve.BaseOptions<N>, 'vnode' | 'component'> & {
    ndom: NDOM
    page?: NDOMPage
    resolvers: OrArray<t.Resolve.Config<N>>
  }) {
    const options = this.options({ ndom, vnode, component, page })
    const runners = u.array(resolvers)
    await Promise.all(runners.map((r) => this.resolve(r, options)))
  }

  async resolve<N extends t.VNode>(
    config: t.Resolve.Config<N>,
    options: ReturnType<NuiResolver['options']>,
  ) {
    await Promise.all(
      [config.before, config.resolve, config.after].map(
        (fn) => fn && this.resolveCond(config.cond, options, fn),
      ),
    )
    return options.vnode
  }

  async resolveCond(
    cond: t.Resolve.Config['cond'],
    options: ReturnType<NuiResolver['options']>,
    callback: (options: ReturnType<NuiResolver['options']>) => void,
  ) {
    if (cond && u.isStr(cond)) {
      // If they passed in a resolver strictly for this node/component
      if (cond === options.component?.type) return callback(options)
    } else if (u.isFnc(cond)) {
      // If they only want the resolver to be called depending on a
      // certain condition
      if (cond(options)) return callback(options)
    } else {
      // Default to calling the resolver in all other cases
      return callback(options)
    }
  }
}

const resolvers = new NuiResolver()

const resolvePositioning: t.Resolve.ResolverFn = function ({
  component,
  vprops,
  viewport,
}) {
  const xKeys = <const>['width', 'left']
  const yKeys = <const>['height', 'top', 'marginTop']
  const posKeys = <const>[...xKeys, ...yKeys]

  function getPositionProps(
    styleObj: nt.StyleObject | undefined,
    key: string, // 'marginTop' | 'top' | 'height' | 'width' | 'left' | 'fontSize'
    viewportSize: number,
  ) {
    if (!styleObj) return
    const value = styleObj?.[key]
    // String
    if (u.isStr(value)) {
      if (value == '0') vprops.style[key] = '0x'
      else if (value == '1') vprops.style[key] = `${viewportSize}px`
      if (!hasLetter(value)) {
        vprops.style[key] = getViewportRatio(viewportSize, value) + 'px'
      }
    }
    // Number
    else if (hasDecimal(styleObj?.[key])) {
      vprops.style[key] = getViewportRatio(viewportSize, value) + 'px'
    }

    return undefined
  }

  /**
   * Returns a ratio (in pixels) computed from a total given viewport size
   * @param { number } viewportSize - Size (in pixels) in the viewport (represents width or height)
   * @param { string | number } size - Size (raw decimal value from NOODL response) most likely in decimals. Strings are converted to numbers to evaluate the value. Numbers that aren't decimals are used as a fraction of the viewport size.
   */
  function getViewportRatio(viewportSize: number, size: string | number) {
    if (u.isStr(size) || u.isNum(size)) {
      return viewportSize * Number(size)
    }
    return viewportSize
  }

  if (!component?.style) return

  for (const key of posKeys) {
    const value = component.style[key]
    if (
      viewport &&
      !u.isNil(value) &&
      u.isNum(viewport.width) &&
      u.isNum(viewport.height)
    ) {
      return getPositionProps(
        component.style,
        key,
        viewport[xKeys.includes(key as any) ? 'width' : 'height'],
      )
    }
  }
}

const resolveSizes: t.Resolve.ResolverFn = function ({
  component,
  vprops,
  viewport,
}) {
  let { width, height } = component.style || {}

  if (!u.isNil(width) && u.isNum(viewport?.width)) {
    vprops.style.width = String(VP.getSize(width, viewport.width))
  }

  if (VP.isNoodlUnit(height) && u.isNum(viewport?.height)) {
    vprops.style.height = String(VP.getSize(height, viewport.height))
  }

  for (const key of ['maxHeight', 'maxWidth', 'minHeight', 'minWidth']) {
    const value = component?.style?.[key]
    switch (typeof value) {
      case 'string':
      case 'number':
        vprops.style[key] = String(
          VP.getSize(
            value,
            /width/i.test(key)
              ? (viewport?.width as number)
              : (viewport?.height as number),
          ),
        )
        break
    }
  }
}

export default resolvers
