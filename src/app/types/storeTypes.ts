import { Action } from '@reduxjs/toolkit'
import { ThunkAction } from 'redux-thunk'
import reducers from '../reducers'
import store from '../store'

export type AppDispatch = typeof store.dispatch

export type AppThunk = ThunkAction<void, RootState, null, Action<string>>

export type RootState = ReturnType<typeof reducers>
