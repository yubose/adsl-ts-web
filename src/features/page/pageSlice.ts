import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface PageState {
  previousPage: string
  currentPage: string
}

export const initialPageState: PageState = {
  previousPage: '',
  currentPage: '',
}

const page = createSlice({
  name: 'page',
  initialState: initialPageState,
  reducers: {
    setCurrentPage(state, { payload }: PayloadAction<string>) {
      if (state.currentPage !== state.previousPage) {
        state['previousPage'] = state.currentPage
      }
      state['currentPage'] = payload
    },
  },
})

export const { setCurrentPage } = page.actions

export default page.reducer
