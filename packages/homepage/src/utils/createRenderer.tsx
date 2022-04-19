import React from 'react'
import { trimReference } from 'noodl-utils'
import has from 'lodash/has'
import get from 'lodash/get'
import * as u from '@jsmanifest/utils'
import * as t from '@/types'
import NoodlImage from '@/components/Image'
import log from '@/utils/log'
import is from '@/utils/is'
import type useActionChain from '@/hooks/useActionChain'
import type useBuiltInFns from '@/hooks/useBuiltInFns'

export interface CreateRenderFactoryOptions
  extends Pick<t.AppContext, 'root' | 'getInRoot' | 'setInRoot'> {
  _context_: t.PageContext['_context_']
  builtIns?: ReturnType<typeof useBuiltInFns>
  createActionChain?: ReturnType<typeof useActionChain>['createActionChain']
  static: {
    images: t.AppContext['images']
  }
  pageName: string
}

export type RenderUtils = Pick<
  CreateRenderFactoryOptions,
  | '_context_'
  | 'builtIns'
  | 'createActionChain'
  | 'pageName'
  | 'root'
  | 'getInRoot'
  | 'setInRoot'
> & { path?: t.ComponentPath }

function createRendererFactory({
  _context_,
  builtIns,
  createActionChain,
  static: { images },
  pageName,
  getInRoot,
  setInRoot,
  root: rootRef,
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

      if (path) {
        const _pathStr = path.join('.')

        if (_pathStr) {
          const listContextObject = u
            .values(_context_.lists || {})
            .find((obj) => {
              return (
                _pathStr === obj.path?.join?.('.') ||
                obj.listObjectPath === _pathStr
              )
            }) as t.PageContextListContextObject

          if (listContextObject?.listObjectPath) {
            const referenceDataPath = trimReference(
              listContextObject.listObjectPath,
            )

            const dataObject = is.localKey(referenceDataPath)
              ? rootRef.current.root[pageName]
              : rootRef.current.root

            if (!has(dataObject, referenceDataPath)) {
              log.error(
                `Did not receive a list component using the original referenced path ${listContextObject.listObjectPath}. ` +
                  `A copy will be used instead (the reference will be lost)`,
                { path, value, listContextObject },
              )
            }

            value = get(dataObject, referenceDataPath)
          }
        }
      }

      if (u.isStr(value)) {
        if (is.reference(value)) {
          reference = value
          value = getInRoot(reference) as t.StaticComponentObject

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
        _context_,
        builtIns,
        createActionChain,
        pageName,
        root: rootRef,
        getInRoot,
        setInRoot,
        path,
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

        if (type === 'img' && u.isStr(rest._path_) && images?.[rest._path_]) {
          // @ts-expect-error
          type = NoodlImage
          rest.alt = rest._path_
          rest.data = images[rest._path_].data
          rest.id = images[rest._path_]['id']
          rest.title = rest._path_
        }

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
