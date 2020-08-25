import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AppState {
  previousPage: string
  currentPage: string
}

export const initialState: AppState = {
  previousPage: '',
  currentPage: '',
}

const app = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentPage(state, { payload }: PayloadAction<string>) {
      if (state.currentPage !== state.previousPage) {
        state['previousPage'] = state.currentPage
      }
      state['currentPage'] = payload
    },
  },
})

export const { setCurrentPage } = app.actions

export default app.reducer
