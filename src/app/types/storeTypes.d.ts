import { Action } from '@reduxjs/toolkit'
import { ThunkAction } from 'redux-thunk'
import reducers from '../reducers'
import createStore from '../store'

export type AppStore = ReturnType<typeof createStore>

export type AppDispatch = AppStore['dispatch']

export type AppThunk = ThunkAction<void, RootState, null, Action<string>>

export type RootState = ReturnType<typeof reducers>
