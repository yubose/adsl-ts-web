import _ from 'lodash'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { forEachEntries } from 'utils/common'
import { ModalState } from 'app/types'

export interface PageState {
  previousPage: string
  currentPage: string
  modal: ModalState
}

export const initialPageState: PageState = {
  previousPage: '',
  currentPage: '',
  modal: {
    id: '',
    opened: false,
    context: null,
    props: {},
  },
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
    openModal(state, { payload = {} }: PayloadAction<Partial<ModalState>>) {
      state.modal.opened = true
      forEachEntries(payload, (key, value) => {
        // @ts-expect-error
        state.modal[key] = value
      })
    },
    closeModal(state) {
      _.assign(state.modal, initialPageState.modal)
    },
  },
})

export const { openModal, closeModal, setCurrentPage } = page.actions

export default page.reducer
