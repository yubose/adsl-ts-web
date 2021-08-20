import * as u from '@jsmanifest/utils'
import SignaturePad from 'signature_pad'
import { OrArray } from '@jsmanifest/typefest'
import { Identify } from 'noodl-types'
import { Component } from 'noodl-ui'
import { getPageAncestor } from './utils'
import { cache, nui } from './nui'
import NDOM from './noodl-ui-dom'
import NDOMPage from './Page'
import * as t from './types'

export default class NDOMResolver {
  createStyleEditor(component: Component) {
    function editComponentStyles(
      styles: Record<string, any> | undefined,
      { remove }: { remove?: string | string[] | false } = {},
    ) {
      styles && component?.edit?.(() => ({ style: styles }))
      if (u.isArr(remove)) {
        remove.forEach(
          (styleKey) => styleKey && delete component.style[styleKey],
        )
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
      createPage: args.ndom.createPage.bind(args.ndom),
      draw: args.ndom.draw.bind(args.ndom),
      editStyle: this.createStyleEditor(args.component),
      findPage: args.ndom.findPage.bind(args.ndom),
      global: args.ndom.global,
      node: args.node,
      nui,
      page:
        args.page ||
        args.ndom.findPage(getPageAncestor(args.component)?.get?.('page')) ||
        args.ndom.page,
      redraw: args.ndom.redraw.bind(args.ndom),
      elementType: args.node?.tagName || '',
      componentType: args.component?.type || '',
      setAttr: <K extends keyof t.NDOMElement>(k: K, v: any) =>
        args.node?.setAttribute?.(k, v),
      setDataAttr: <K extends string>(dataAttr: K, v: string) =>
        args.node?.dataset &&
        (args.node.dataset[dataAttr.replace('data-', '')] = v),
      setStyleAttr: <K extends keyof t.NDOMElement['style']>(k: K, v: any) =>
        args.node && (args.node.style[k] = v),
    }
  }

  run<
    T extends string = string,
    N extends t.NDOMElement<T> = t.NDOMElement<T>,
  >({
    ndom,
    node,
    component,
    page,
    resolvers,
  }: Pick<t.Resolve.Options<T, N>, 'node' | 'component'> & {
    ndom: NDOM
    page?: NDOMPage
    resolvers: OrArray<t.Resolve.Config>
  }) {
    const options = this.getOptions({ ndom, node, component, page })
    const runners = u.array(resolvers)
    const total = runners.length

    // TODO - feat. consumer return value
    for (let index = 0; index < total; index++) {
      this.resolve(runners[index], options)
    }
  }

  resolve<
    T extends string = string,
    N extends t.NDOMElement<T> = t.NDOMElement<T>,
  >(
    config: t.Resolve.Config<T, N>,
    options: ReturnType<NDOMResolver['getOptions']>,
  ) {
    for (const fn of [config.before, config.resolve, config.after]) {
      fn && this.resolveCond(config.cond, options, fn)
    }
  }

  resolveCond(
    cond: t.Resolve.Config['cond'],
    options: ReturnType<NDOMResolver['getOptions']>,
    callback: (options: ReturnType<NDOMResolver['getOptions']>) => void,
  ) {
    if (u.isStr(cond)) {
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
