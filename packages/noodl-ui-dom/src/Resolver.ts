import * as u from '@jsmanifest/utils'
import h from 'virtual-dom/h'
import diff from 'virtual-dom/diff'
import createElement from 'virtual-dom/create-element'
import patch from 'virtual-dom/patch'
import VNode from 'virtual-dom/vnode/vnode'
import VText from 'virtual-dom/vnode/vtext'
import SignaturePad from 'signature_pad'
import { LiteralUnion } from 'type-fest'
import { OrArray } from '@jsmanifest/typefest'
import { Identify } from 'noodl-types'
import { Component } from 'noodl-ui'
import { getPageAncestor } from './utils'
import { cache, nui } from './nui'
import attributesResolver from './resolvers/attributes'
import componentsResolver from './resolvers/components'
import NDOM from './noodl-ui-dom'
import NDOMPage from './Page'
import * as t from './types'

export class NDOMResolver_ {
  getOptions<N extends t.VNode>(
    args: t.Resolve_.BaseOptions<N> & { ndom: NDOM },
  ) {
    if (Identify.component.canvas(args.component)) {
      args.component.edit(
        'signaturePad',
        new SignaturePad(createElement(args.vnode) as HTMLCanvasElement, {
          dotSize: 0.2,
        }),
      )
    }

    return {
      cache,
      component: args.component,
      createPage: args.ndom.createPage.bind(args.ndom),
      draw: args.ndom.draw.bind(args.ndom),
      findPage: args.ndom.findPage.bind(args.ndom),
      global: args.ndom.global,
      vnode: args.vnode,
      nui,
      get page() {
        return (
          args.page ||
          args.ndom.findPage(getPageAncestor(args.component)?.get?.('page')) ||
          args.ndom.page
        )
      },
      redraw: args.ndom.redraw.bind(args.ndom),
      /**
       * REMINDER: This intentionally does not include componentsResolver due to
       * circular references/infinite loops
       */
      renderPage: args.ndom.render.bind(args.ndom),
      resolvers: [
        ...args.ndom.consumerResolvers,
        attributesResolver,
        componentsResolver,
      ],
      elementType: args.vnode?.tagName || '',
      componentType: args.component?.type || '',
      setAttr: <K extends keyof t.VNodeAttributes>(
        k: LiteralUnion<K, string>,
        v: any,
      ) => {
        if (!args.vnode.properties.attributes) {
          args.vnode.properties.attributes = {}
        }
        args.vnode.properties.attributes[k] = v
      },
      setDataAttr: <K extends string>(
        dataAttr: LiteralUnion<K, string>,
        v: string,
      ) => {
        if (!args.vnode.properties.attributes) {
          args.vnode.properties.attributes = {}
        }
        args.vnode.properties.attributes.dataset[
          dataAttr.replace?.('data-', '')
        ] = v
      },
      setStyleAttr: <K extends keyof t.VNodeStyle>(k: K, v: any) => {
        if (!args.vnode.properties.style) args.vnode.properties.style = {}
        args.vnode.properties.style[k] = v
      },
    }
  }

  async run<N extends t.VNode>({
    ndom,
    vnode,
    component,
    page,
    resolvers,
  }: Pick<t.Resolve_.BaseOptions<N>, 'vnode' | 'component'> & {
    ndom: NDOM
    page?: NDOMPage
    resolvers: OrArray<t.Resolve_.Config<N>>
  }) {
    const options = this.getOptions({ ndom, vnode, component, page })
    const runners = u.array(resolvers)
    await Promise.all(runners.map((r) => this.resolve(r, options)))
  }

  async resolve<N extends t.VNode>(
    config: t.Resolve_.Config<N>,
    options: ReturnType<NDOMResolver_['getOptions']>,
  ) {
    await Promise.all(
      [config.before, config.resolve, config.after].map(
        (fn) => fn && this.resolveCond(config.cond, options, fn),
      ),
    )
    return options.vnode
  }

  async resolveCond(
    cond: t.Resolve_.Config['cond'],
    options: ReturnType<NDOMResolver_['getOptions']>,
    callback: (options: ReturnType<NDOMResolver_['getOptions']>) => void,
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

export default class NDOMResolver {
  createStyleEditor(component: Component) {
    function editComponentStyles(
      styles: Record<string, any> | undefined,
      { remove }: { remove?: string | string[] | false } = {},
    ) {
      styles && component?.edit?.(() => ({ style: styles }))
      if (u.isArr(remove)) {
        u.forEach((k) => k && delete component.style[k], remove)
      } else if (remove && u.isStr(remove)) delete component.style[remove]
    }
    return editComponentStyles
  }

  getOptions<
    T extends string = string,
    N extends t.NDOMElement<T> = t.NDOMElement<T>,
  >(args: t.Resolve.BaseOptions<T, N> & { ndom: NDOM }) {
    if (Identify.component.canvas(args.component)) {
      args.component.edit(
        'signaturePad',
        new SignaturePad(args.node as HTMLCanvasElement, {
          dotSize: 0.2,
        }),
      )
    }

    return {
      cache,
      component: args.component,
      createPage: args.ndom.createPage.bind(args.ndom) as NDOM['createPage'],
      draw: args.ndom.draw.bind(args.ndom) as NDOM['draw'],
      editStyle: this.createStyleEditor(args.component),
      findPage: args.ndom.findPage.bind(args.ndom) as NDOM['findPage'],
      global: args.ndom.global,
      node: args.node,
      nui,
      get page() {
        return (
          args.page ||
          args.ndom.findPage(getPageAncestor(args.component)?.get?.('page')) ||
          args.ndom.page
        )
      },
      redraw: args.ndom.redraw.bind(args.ndom) as NDOM['redraw'],
      renderPage: args.ndom.render.bind(args.ndom) as NDOM['render'],
      /**
       * REMINDER: This intentionally does not include componentsResolver due to
       * circular references/infinite loops
       */
      resolvers: [
        ...args.ndom.consumerResolvers,
        attributesResolver,
        componentsResolver,
      ],
      elementType: args.node?.tagName || '',
      componentType: (args.component?.type || '') as string,
      setAttr: <K extends keyof t.NDOMElement>(
        k: LiteralUnion<K, string>,
        v: any,
      ) => {
        if (/(innerHTML|innerText|textContent)/i.test(k)) {
          args.node[k] = v
        } else {
          args.node?.setAttribute?.(k, v)
        }
      },
      setDataAttr: <K extends string>(
        dataAttr: LiteralUnion<K, string>,
        v: string,
      ) =>
        args.node?.dataset &&
        dataAttr &&
        (args.node.dataset[dataAttr.replace?.('data-', '')] = v),
      setStyleAttr: <K extends keyof t.NDOMElement['style']>(k: K, v: any) =>
        args.node && (args.node.style[k] = v),
      transact: args.ndom.transact.bind(args.ndom) as NDOM['transact'],
    }
  }

  async run<
    T extends string = string,
    N extends t.NDOMElement<T> = t.NDOMElement<T>,
  >({
    ndom,
    node,
    component,
    page,
    resolvers,
  }: Pick<t.Resolve.BaseOptions<T, N>, 'node' | 'component'> & {
    ndom: NDOM
    page?: NDOMPage
    resolvers: OrArray<t.Resolve.Config<T, N>>
  }) {
    const options = this.getOptions({ ndom, node, component, page })
    const runners = u.array(resolvers)
    await Promise.all(runners.map((r) => this.resolve(r, options)))
  }

  async resolve<
    T extends string = string,
    N extends t.NDOMElement<T> = t.NDOMElement<T>,
  >(
    config: t.Resolve.Config<T, N>,
    options: ReturnType<NDOMResolver['getOptions']>,
  ) {
    await Promise.all(
      [config.before, config.resolve, config.after].map(
        (fn) => fn && this.resolveCond(config.cond, options, fn),
      ),
    )
  }

  async resolveCond(
    cond: t.Resolve.Config['cond'],
    options: ReturnType<NDOMResolver['getOptions']>,
    callback: (options: ReturnType<NDOMResolver['getOptions']>) => void,
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
