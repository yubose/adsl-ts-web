import _ from 'lodash'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { forEachEntries, SerializedError } from 'utils/common'
import { ModalState, RequestState } from 'app/types'
import { getRequestState } from './utils'

export interface PageState {
  request: {
    [pageName: string]: RequestState<SerializedError>
  }
  previousPage: string
  currentPage: string
  modal: ModalState
}

export const initialPageState: PageState = {
  request: {},
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
    setRequestStatus(
      state,
      {
        payload,
      }: PayloadAction<Partial<Partial<RequestState> & { pageName: string }>>,
    ) {
      const { pageName, ...reqState } = payload
      if (pageName) {
        state.request[pageName] = getRequestState(reqState)
      }
    },
    setPage(state, { payload }: PayloadAction<string>) {
      if (state.currentPage !== state.previousPage) {
        state['previousPage'] = state.currentPage
      }
      state['currentPage'] = payload
      state.request[payload] = getRequestState()
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

export const { openModal, closeModal, setPage, setRequestStatus } = page.actions

export default page.reducer
