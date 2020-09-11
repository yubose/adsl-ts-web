import { createSlice, PayloadAction, SerializedError } from '@reduxjs/toolkit'
import { onRequestStateChange } from 'utils/common'

const onConnectStateChange = onRequestStateChange(
  'connecting',
  'connected',
  'connectError',
  'connectTimedOut',
)

export interface MeetingState {
  connecting: boolean
  connected: boolean
  connectError: SerializedError | null
  connectTimedOut: boolean
}

export const initialMeetingState: MeetingState = {
  connecting: false,
  connected: false,
  connectError: null,
  connectTimedOut: false,
  nodeState
}

const meeting = createSlice({
  name: 'meeting',
  initialState: initialMeetingState,
  reducers: {
    connecting(state) {
      onConnectStateChange(state)
      state.connecting = true
    },
    connected(state) {
      onConnectStateChange(state)
      state.connected = true
    },
    connectError(state, { payload }: PayloadAction<null | Error>) {
      onConnectStateChange(state)
      state.connectError = payload
    },
    connectTimedOut(state) {
      onConnectStateChange(state)
      state.connectTimedOut = true
    },
  },
})

export const {
  connecting,
  connected,
  connectError,
  connectTimedOut,
} = meeting.actions

export default meeting.reducer
