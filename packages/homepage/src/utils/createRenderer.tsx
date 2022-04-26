import React from 'react'
import * as u from '@jsmanifest/utils'
import * as t from '@/types'
// import NoodlImage from '@/components/Image'
import log from '@/utils/log'
import is from '@/utils/is'
import type useActionChain from '@/hooks/useActionChain'
import type useBuiltInFns from '@/hooks/useBuiltInFns'

export interface CreateRenderFactoryOptions
  extends Pick<t.AppContext, 'root' | 'getR' | 'setR'>,
    t.PageContext {
  builtIns?: ReturnType<typeof useBuiltInFns>
  createActionChain?: ReturnType<typeof useActionChain>['createActionChain']
  pageName: string
}

export type RenderUtils = Pick<
  CreateRenderFactoryOptions,
  'builtIns' | 'createActionChain' | 'pageName' | 'root' | 'getR' | 'setR'
> &
  t.PageContext & { path?: t.ComponentPath }

function createRendererFactory({
  builtIns,
  createActionChain,
  lists,
  pageName,
  getR,
  setR,
  root: rootRef,
  refs,
  ...pageCtx
}: CreateRenderFactoryOptions) {
  return function createRenderer(
    fn: (
      value: Partial<t.StaticComponentObject> | string,
      utils: RenderUtils,
    ) => t.CreateElementProps<any> | null,
  ) {
    /**
     * Render a NOODL component in one of several ways:
     *   1. Reference (string)
     *   2. ReactNode (string)
     *   3. StaticComponentObject (parsed component object)
     *
     * @example
     * ```jsx
     * const component1 = renderComponent('.BaseHeader')
     * const component2 = renderComponent('Submit')
     * const component3 = renderComponent({
     *   type: 'button',
     *   text: 'Submit',
     *   onClick: [{ emit: { actions: [], dataKey: { var1: 'itemObject' } } }]
     * })
     *
     * ```
     * @returns { React.ReactElement } React element
     */
    return function renderComponent(
      value: Parameters<typeof fn>[0],
      path?: t.ComponentPath,
    ) {
      let reference: string | undefined

      if (u.isStr(value)) {
        if (is.reference(value)) {
          reference = value
          value = getR(reference) as t.StaticComponentObject

          if (!value) {
            log.error(
              `Did not receive a component object using path referenced in "${reference}". ` +
                `Received a(n) "${typeof value}" instead`,
              { path, reference },
            )
          }
        }
      }

      if (!u.isObj(value)) return null

      const {
        type,
        key,
        children = [],
        ...props
      } = fn(value as t.StaticComponentObject, {
        builtIns,
        createActionChain,
        lists,
        pageName,
        getR,
        setR,
        root: rootRef,
        refs,
        path,
        ...pageCtx,
      })

      const renderElements = ({
        path = [],
        type,
        key,
        children = [],
        ...rest
      }: t.CreateElementProps<any>) => {
        let _children = [] as React.ReactElement[]
        let index = 0

        for (const childProps of u.array(children)) {
          const _path = (path || []).concat('children', index)
          const renderKey = _path.join('.')

          if (u.isObj(childProps)) {
            const props = { ...childProps, path: _path }
            _children.push(
              <React.Fragment key={renderKey}>
                {renderElements(props)}
              </React.Fragment>,
            )
          } else {
            _children.push(
              <React.Fragment key={renderKey}>{childProps}</React.Fragment>,
            )
          }
          index++
        }

        // if (type === 'img' && u.isStr(rest._path_) && images?.[rest._path_]) {
        // @ts-expect-error
        // type = NoodlImage
        // rest.alt = rest._path_
        // rest.data = images[rest._path_].data
        // rest.id = images[rest._path_]['id']
        // rest.title = rest._path_
        // }

        return React.createElement(
          type,
          { ...rest, key },
          _children.length ? _children : undefined,
        )
      }

      return renderElements(u.assign({ path }, props, { type, key, children }))
    }
  }
}

export default createRendererFactory
