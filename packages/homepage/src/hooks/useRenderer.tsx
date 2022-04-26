import React from 'react'
import createRendererFactory from '@/utils/createRenderer'
import getElementProps from '@/utils/getElementProps'
import useActionChain from '@/hooks/useActionChain'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import useCtx from '@/useCtx'
import { usePageCtx } from '@/components/PageContext'
import type { ComponentPath, StaticComponentObject } from '@/types'

function useRenderer() {
  const { root, getR, setR } = useCtx()
  const ac = useActionChain()
  const builtIns = useBuiltInFns()
  const pageCtx = usePageCtx()

  const renderComponent: (
    component: string | Partial<StaticComponentObject>,
    path?: ComponentPath,
  ) => React.ReactElement<any> = React.useMemo(
    () =>
      createRendererFactory({
        builtIns,
        createActionChain: ac.createActionChain,
        root,
        getR,
        setR,
        ...pageCtx,
      })(getElementProps),
    [pageCtx, root],
  )

  return renderComponent
}

export default useRenderer
