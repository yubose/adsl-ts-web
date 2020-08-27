import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { createLogger } from 'redux-logger'
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

function createStore(preloadedState?: any) {
  const store = configureStore({
    middleware: middlewares,
    preloadedState,
    reducer: reducers,
  })

  return store
}

export default createStore
