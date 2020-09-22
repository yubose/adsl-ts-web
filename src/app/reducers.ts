import { combineReducers } from '@reduxjs/toolkit'
import auth from 'features/auth/authSlice'
import meeting from 'features/meeting/meetingSlice'
import page from 'features/page/pageSlice'

export default combineReducers({
  auth,
  meeting,
  page,
})
