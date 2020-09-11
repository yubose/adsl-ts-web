import _ from 'lodash'
import {
  configureStore,
  getDefaultMiddleware,
  Middleware,
} from '@reduxjs/toolkit'
import { createLogger } from 'redux-logger'
import { serializeError } from 'utils/common'
import reducers from './reducers'

const middlewares = [...getDefaultMiddleware()]

if (process.env.NODE_ENV !== 'production') {
  middlewares.push(
    createLogger({
      collapsed: true,
      diff: true,
    }),
  )
}

/**
 * Handles serializing an error if an action.payload.error is being passed as
 * an instance of Error
 * */
const serializeErrorMiddleware: Middleware = ({ getState, dispatch }) => {
  return (next) => (action) => {
    if (_.isPlainObject(action)) {
      if (action.payload) {
        if (action.payload instanceof Error) {
          const logMsg = `%c[store.ts][serializeErrorMiddleware] Serializing this error before it gets to redux`
          console.log(logMsg, `color:#00b406;font-weight:bold;`, action)
          return next({
            ...action,
            payload: serializeError(action.payload.error),
          })
        } else if (action.payload.error instanceof Error) {
          const logMsg = `%c[store.ts][serializeErrorMiddleware] Serializing this error before it gets to redux`
          console.log(logMsg, `color:#00b406;font-weight:bold;`, action)
          return next({
            ...action,
            payload: {
              ...action.payload,
              error: serializeError(action.payload.error),
            },
          })
        }
      }
    }
    return next(action)
  }
}

middlewares.push(serializeErrorMiddleware)

function createStore(preloadedState?: any) {
  const store = configureStore({
    middleware: middlewares,
    preloadedState,
    reducer: reducers,
  })

  return store
}

export default createStore
