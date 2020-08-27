import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface MeetingState {
  status: null | 'in.progress' | 'completed'
}

export const initialMeetingState: MeetingState = {
  status: null,
}

const meeting = createSlice({
  name: 'meeting',
  initialState: initialMeetingState,
  reducers: {
    setStatus(state, { payload }: PayloadAction<MeetingState['status']>) {
      state.status = payload
    },
  },
})

export const { setStatus } = meeting.actions

export default meeting.reducer
