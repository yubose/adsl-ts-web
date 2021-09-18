// @ts-nocheck
import * as u from '@jsmanifest/utils'
import * as nu from 'noodl-utils'
import * as nt from 'noodl-types'
import EmitAction from './actions/EmitAction'
import * as c from './constants'
import * as t from './types'
import getRootPage from './getRootPage'
import NUIPage from './Page'
import {
  findIteratorVar,
  findListDataObject,
  resolveAssetUrl,
} from './utils/noodl'

/**
 *  Create a url
 * @param { function } createSrc
 */
async function createSrc(args: {
  key: string
  value: nt.Path
  component: t.NuiComponent.Instance
  page: NUIPage
}): Promise<string>

async function createSrc(
  path: nt.Path,
  opts?: {
    component: t.NuiComponent.Instance
    context?: Record<string, any>
  },
): Promise<string>

async function createSrc(
  path: nt.IfObject,
  opts?: {
    component?: t.NuiComponent.Instance
    page?: NUIPage
  },
): Promise<string>

async function createSrc(path: string): Promise<string>

async function createSrc(
  args:
    | nt.EmitObjectFold
    | nt.IfObject
    | {
        context?: Record<string, any>
        component: t.NuiComponent.Instance
        page: NUIPage
      }
    | string,
  opts?:
    | {
        component?: t.NuiComponent.Instance
        context?: Record<string, any>
        page?: NUIPage
      }
    | {
        on: NonNullable<t.ResolveComponentOptions<any>['on']>
        key?: string
        component?: t.NuiComponent.Instance
        page?: NUIPage
      },
) {
  let component: t.NuiComponent.Instance | undefined
  let page: NUIPage = getRootPage()

  if (u.isStr(args)) {
    // Components of type "page" can have a path that points directly to a page
    // ex: path: "LeftPage"
    if ([...o.getPages(), ...o.getPreloadPages()].includes(args)) {
      const pageLink = o.getBaseUrl() + args + '_en.yml'
      component?.emit?.('path', pageLink)
      return pageLink
    }
    return resolveAssetUrl(args, o.getAssetsUrl())
  } else if (u.isObj(args)) {
    if (nt.Identify.folds.emit(args)) {
      component = opts?.component as t.NuiComponent.Instance
      // TODO - narrow this query to avoid only using the first encountered obj
      const obj = o.cache.actions.emit.get('path')?.[0]
      const iteratorVar =
        opts?.context?.iteratorVar || findIteratorVar(component)
      if (u.isFnc(obj?.fn)) {
        const emitAction = new EmitAction('path', args)
        if ('dataKey' in args.emit) {
          emitAction.dataKey = createEmitDataKey(
            args.emit.dataKey as string,
            _getQueryObjects({
              component,
              page,
              listDataObject: opts?.context?.dataObject,
            }),
            { iteratorVar },
          )
        }
        emitAction.executor = async () => {
          const callbacks = (o.cache.actions.emit.get('path') || []).reduce(
            (acc, obj) =>
              obj?.trigger === 'path' ? acc.concat(obj as any) : acc,
            [],
          )
          if (!callbacks.length) return ''
          const result = await Promise.race(
            callbacks.map(async (obj: t.Store.ActionObject) =>
              obj.fn?.(
                emitAction,
                _getConsumerOptions({
                  component,
                  on: opts?.on,
                  page,
                  path: args,
                }),
              ),
            ),
          )
          return (u.isArr(result) ? result[0] : result) || ''
        }
        // Result returned should be a string type
        let result = (await emitAction.execute(args)) as
          | string
          | Promise<string>

        if (u.isStr(result)) {
          if (!result.startsWith('http')) {
            result = resolveAssetUrl(result, o.getAssetsUrl())
          }
          component?.emit?.('path', result)
          return result
        }
      }
    } else if (nt.Identify.if(args)) {
      if (u.isObj(opts) && 'on' in opts && opts.on.if) {
        return opts.on?.if({
          key: opts.key || '',
          component: opts.component,
          page: opts.page || page,
          value: args,
        })
      }
      return resolveAssetUrl(
        nu.evalIf((val: any) => {
          if (nt.Identify.isBoolean(val)) return nt.Identify.isBooleanTrue(val)
          if (u.isFnc(val)) {
            if (component) return val(findListDataObject(component))
            return val()
          }
          return !!val
        }, args as IfObject),
        o.getAssetsUrl(),
      )
    } else {
    }
  }
}

export default createSrc
