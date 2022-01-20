import React from 'react'
import * as u from '@jsmanifest/utils'
import merge from 'lodash/merge'
import produce, { Draft } from 'immer'
import { Provider } from './useCtx'

export type AppState = typeof initialState

export const initialState = {
  pages: {},
}

function AppProvider({ children }: React.PropsWithChildren<any>) {
  const [state, _setState] = React.useState(initialState)

  const setState = React.useCallback(
    (stateOrSetter: Partial<AppState> | ((draft: Draft<AppState>) => void)) => {
      _setState(
        produce((draft) => {
          if (u.isFnc(stateOrSetter)) {
            stateOrSetter(draft)
          } else if (u.isObj(stateOrSetter)) {
            merge(draft, stateOrSetter)
          }
        }),
      )
    },
    [],
  )

  const ctx = {
    ...state,
  }

  return <Provider value={ctx}>{children}</Provider>
}

export default AppProvider
