import * as u from '@jsmanifest/utils'
import SignaturePad from 'signature_pad'
import { VNode } from 'snabbdom/vnode'
import toVNode from 'snabbdom/tovnode'
import dom from 'snabbdom/htmldomapi'
import { h, init } from 'snabbdom'
import { LiteralUnion } from 'type-fest'
import { OrArray } from '@jsmanifest/typefest'
import { Identify } from 'noodl-types'
import * as t from './types'

export class NuiResolver {
  translators = new Map<string, t.Resolve.TranslateConfig[]>();

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      translators: this.translators,
    }
  }

  options<N extends VNode>(args: t.Resolve.BaseOptions<N> & { ndom: NDOM }) {
    if (Identify.component.canvas(args.component)) {
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

export default NuiResolver
