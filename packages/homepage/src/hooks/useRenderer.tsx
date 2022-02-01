import React from 'react'
import createRendererFactory from '@/utils/createRenderer'
import getElementProps from '@/utils/getElementProps'
import useActionChain from '@/hooks/useActionChain'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import useCtx from '@/useCtx'
import usePageCtx from '@/usePageCtx'

function useRenderer() {
  const { pages: root, get: getInRoot, set: setInRoot } = useCtx()
  const pageCtx = usePageCtx()
  const ac = useActionChain()
  const builtIns = useBuiltInFns()

  const renderComponent = React.useMemo(
    () =>
      createRendererFactory(
        {
          builtIns,
          createActionChain: ac.createActionChain,
          root,
          getInRoot,
          setInRoot,
          pageName: pageCtx.pageName,
          _context_: pageCtx._context_,
        },
        getElementProps,
      ),
    [ac.createActionChain, pageCtx, root],
  )

  return renderComponent
}

export default useRenderer
