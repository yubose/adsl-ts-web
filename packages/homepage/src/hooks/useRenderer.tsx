import React from 'react'
import createRendererFactory from '@/utils/createRenderer'
import getElementProps from '@/utils/getElementProps'
import useActionChain from '@/hooks/useActionChain'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import useCtx from '@/useCtx'
import usePageCtx from '@/usePageCtx'
import type { ComponentPath, StaticComponentObject } from '@/types'

function useRenderer() {
  const { root, getInRoot, setInRoot, images } = useCtx()
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
        getInRoot,
        setInRoot,
        static: { images },
        pageName: pageCtx.pageName,
        _context_: pageCtx._context_,
      })(getElementProps),
    [pageCtx, root],
  )

  return renderComponent
}

export default useRenderer
