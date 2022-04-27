import React from 'react'
import * as u from '@jsmanifest/utils'
import getElementProps from '@/utils/getElementProps'
import log from '@/utils/log'
import is from '@/utils/is'
import useCtx from '@/useCtx'
import { usePageCtx } from '@/components/PageContext'
import * as t from '@/types'

function useRenderer() {
  const { getR, root, setR } = useCtx()
  const { lists, pageName, refs } = usePageCtx()

  const renderComponent = React.useCallback(
    (component: string | t.StaticComponentObject, path: t.ComponentPath) => {
      let reference: string | undefined
      let refValue: any

      if (u.isStr(component)) {
        if (is.reference(component)) {
          reference = component
          refValue = getR(component)
        }

        if (!refValue) {
          log.error(
            `Did not receive a component object using path referenced in "${reference}". ` +
              `Received a(n) "${typeof refValue}" instead`,
            { path, reference, refValue },
          )
        } else {
          component = refValue
        }
      }

      if (!u.isObj(component)) return null

      const {
        type,
        key,
        children = [],
        ...props
      } = getElementProps(component as t.StaticComponentObject, {
        createActionChain,
        lists,
        pageName,
        getR,
        setR,
        root,
        refs,
        path,
      })

      return renderElement({ type, key, children, path, ...props })
    },
    [],
  )

  const renderElement = React.useCallback(
    ({ path, type, key, children = [], ...rest }: t.CreateElementProps) => {
      let _children = [] as React.ReactElement[]
      let _index = 0

      for (const cprops of u.array(children)) {
        const _path = (path || []).concat('children', _index)
        const renderKey = _path.join('.')

        if (u.isObj(cprops)) {
          const props = { ...cprops, path: _path }
          _children.push(
            <React.Fragment key={renderKey}>
              {renderElement(props)}
            </React.Fragment>,
          )
        } else {
          _children.push(
            <React.Fragment key={renderKey}>{cprops}</React.Fragment>,
          )
        }

        _index++
      }

      return React.createElement(
        type,
        { ...rest, key },
        _children.length ? _children : undefined,
      )
    },
    [],
  )

  return renderComponent
}

export default useRenderer
