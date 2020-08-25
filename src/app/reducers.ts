import { combineReducers } from '@reduxjs/toolkit'
import appSlice, { initialState as appState } from 'features/app'
import authSlice, { initialState as authState } from 'features/auth'
import meetingSlice, { initialState as meetingState } from 'features/meeting'
import pageSlice, { initialState as pageState } from 'features/page'

export const rootInitialState = {
  app: appState,
  auth: authState,
  meeting: meetingState,
  page: pageState,
}

const rootReducer = combineReducers({
  app: appSlice,
  auth: authSlice,
  meeting: meetingSlice,
  page: pageSlice,
})

export default rootReducer
