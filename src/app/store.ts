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
    reducer: reducers,
    middleware: middlewares,
  })

  return store
}

export default createStore
