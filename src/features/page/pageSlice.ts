import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AppState {
  currentPage: string
}

export const initialState: AppState = {
  currentPage: '',
}

const app = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentPage(state, { payload }: PayloadAction<string>) {
      state['currentPage'] = payload
    },
  },
})

export const { setCurrentPage } = app.actions

export default app.reducer
