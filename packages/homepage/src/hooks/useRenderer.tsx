import * as u from '@jsmanifest/utils'
import React from 'react'
import deref from '@/utils/deref'
import getElementProps from '@/utils/getElementProps'
import log from '@/utils/log'
import is from '@/utils/is'
import useCtx from '@/useCtx'
import { usePageCtx } from '@/components/PageContext'
import type * as t from '@/types'

function useRenderer() {
  const { root, getR, setR } = useCtx()
  const pageCtx = usePageCtx()

  const render = React.useCallback(
    (
      component: string | Partial<t.StaticComponentObject>,
      pathsProp: t.ComponentPath = [],
    ) => {
      let reference: string | undefined

      if (u.isStr(component)) {
        if (is.reference(component)) {
          reference = component

          component = deref({
            paths: pathsProp,
            ref: reference,
            root,
            rootKey: pageCtx.pageName,
          })

          if (!component) {
            log.error(
              `Did not receive a component object using path referenced in ` +
                `"${reference}". Received a(n) "${typeof component}" instead`,
              { paths: pathsProp, reference },
            )
          }
        }
      }

      if (!u.isObj(component)) return null

      const {
        type,
        key,
        children = [],
        ...props
      } = getElementProps(component as t.StaticComponentObject, {
        getR,
        setR,
        root,
        path: pathsProp,
        ...pageCtx,
      })
    },
    [pageCtx, root],
  )

  const renderElement = React.useCallback(
    ({
      path = [],
      type,
      key,
      children = [],
      ...rest
    }: t.CreateElementProps) => {
      let _children = [] as React.ReactElement[]
      let index = 0

      for (const childProps of u.array(children)) {
        const _path = (path || []).concat('children', index)
        const renderKey = _path.join('.')

        if (u.isObj(childProps)) {
          const props = { ...childProps, path: _path }
          _children.push(
            <React.Fragment key={renderKey}>
              {renderElement(props)}
            </React.Fragment>,
          )
        } else {
          _children.push(
            <React.Fragment key={renderKey}>{childProps}</React.Fragment>,
          )
        }
        index++
      }

      return React.createElement(
        type,
        { ...rest, key },
        _children.length ? _children : undefined,
      )
    },
    [],
  )

  return render
}

export default useRenderer
