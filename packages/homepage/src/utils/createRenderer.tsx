import React from 'react'
import { trimReference } from 'noodl-utils'
import curry from 'lodash/curry'
import has from 'lodash/has'
import get from 'lodash/get'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as c from '@/consts'
import * as t from '@/types'
import type useActionChain from '@/hooks/useActionChain'
import type useBuiltInFns from '@/hooks/useBuiltInFns'
import log from '@/utils/log'
import is from '@/utils/is'

export interface CreateRenderFactoryOptions {
  _context_: t.PageContext['_context_']
  builtIns?: ReturnType<typeof useBuiltInFns>
  createActionChain?: ReturnType<typeof useActionChain>['createActionChain']
  pageName: string
  root: t.AppContext['pages']
  getInRoot: t.AppContext['get']
  setInRoot: t.AppContext['set']
}

export type RenderUtils = Pick<
  CreateRenderFactoryOptions,
  | '_context_'
  | 'builtIns'
  | 'createActionChain'
  | 'root'
  | 'getInRoot'
  | 'setInRoot'
> & { path?: (string | number)[] }

const createRendererFactory = curry(
  (
    {
      _context_,
      builtIns,
      createActionChain,
      pageName,
      getInRoot,
      setInRoot,
      root,
    }: CreateRenderFactoryOptions,
    fn: (
      value: t.StaticComponentObject | nt.ReferenceString,
      utils: RenderUtils,
    ) => t.CreateElementProps<any> | null,
  ) => {
    return function render(
      value: Partial<t.StaticComponentObject> | string,
      path?: (string | number)[],
    ) {
      let reference: string | undefined

      if (path) {
        const _pathStr = path.join('.')
        if (_pathStr) {
          const listContextObject = u.values(_context_.lists).find((obj) => {
            return (
              _pathStr === obj.path.join('.') || obj.listObjectPath === _pathStr
            )
          }) as t.PageContextListContextObject

          if (listContextObject?.listObjectPath) {
            const referenceDataPath = trimReference(
              listContextObject.listObjectPath,
            )

            const dataObject = is.localKey(referenceDataPath)
              ? root[pageName]
              : root

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
              `Did not receive a component object using path referenced in "${reference}". Received a(n) "${typeof value}" instead`,
              { path, reference },
            )
          }
        }
      }

      const {
        type,
        key,
        children = [],
        ...props
      } = fn(value as t.StaticComponentObject, {
        _context_,
        builtIns,
        createActionChain,
        root,
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
        const _children = [] as React.ReactElement[]

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
              <React.Fragment key={renderKey}>{props}</React.Fragment>,
            )
          }
          index++
        }

        return React.createElement(
          type,
          u.assign({}, rest, { key }),
          _children.length ? _children : undefined,
        )
      }

      return renderElements(u.assign({ path }, props, { type, key, children }))
    }
  },
)

export default createRendererFactory
