import React from 'react'

/**
 * A helper to create a Context and Provider with no upfront default value, and
 * without having to check for undefined all the time.
 */
export function createCtx<A extends {} | null>() {
  const Context = React.createContext<A | undefined>(undefined)

  function useCtx() {
    const ctx = React.useContext(Context)
    if (ctx === undefined) {
      throw new Error('useCtx must be used inside a Provider with a value')
    }
    return ctx
  }

  return [useCtx, Context.Provider] as const
}
