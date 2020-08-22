import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface MeetingState {
  status: null | 'in.progress' | 'completed'
}

export const initialState: MeetingState = {
  status: null,
}

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    setStatus(state, { payload }: PayloadAction<MeetingState['status']>) {
      state.status = payload
    },
  },
})

export const { setStatus } = meetingSlice.actions

export default meetingSlice.reducer
