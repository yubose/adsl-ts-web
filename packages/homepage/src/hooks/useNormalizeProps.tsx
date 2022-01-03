import React from 'react'
import { normalizeProps as normalize } from 'noodl-ui'
import { NUI as nui, Viewport as NuiViewport } from 'noodl-ui'

export type NormalizeOptions = Parameters<typeof normalize>[2]

function useNormalizeProps({
  getBaseStyles,
  root = {},
  viewport,
}: {
  getBaseStyles?: NormalizeOptions['getBaseStyles']
  root?: Record<string, any>
  viewport?: NuiViewport
}) {
  const vpRef = React.useRef<NuiViewport>(
    viewport ||
      new NuiViewport({ width: window.innerWidth, height: window.innerHeight }),
  )

  const normalizeProps = React.useCallback(
    (
      props: Record<string, any> = {},
      blueprint: Record<string, any> = {},
      options?: NormalizeOptions,
    ) => {
      const normalized = normalize(props, blueprint, {
        ...options,
        getBaseStyles,
        root,
        viewport: vpRef.current,
      })
      return normalized
    },
    [],
  )

  return {
    normalizeProps,
  }
}

export default useNormalizeProps
