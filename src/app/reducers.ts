import { combineReducers } from '@reduxjs/toolkit'
// import app from 'features/app/appSlice'
import auth from 'features/auth/authSlice'
import meeting from 'features/meeting/meetingSlice'
import page from 'features/page/pageSlice'
// import app, { initialAppState } from 'features/app'
// import auth, { initialAuthState } from 'features/auth'
// import meeting, { initialMeetingState } from 'features/meeting'
// import page, { initialPageState } from 'features/page'

// export const rootInitialState = {
//   app: initialAppState,
//   auth: initialAuthState,
//   meeting: initialMeetingState,
//   page: initialPageState,
// }

export default combineReducers({
  // app,
  meeting,
  page,
  auth,
})
