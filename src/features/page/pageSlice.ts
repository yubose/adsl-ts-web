import _ from 'lodash'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { forEachEntries } from 'utils/common'
import * as T from 'app/types/pageTypes'
import { renderStatus } from '../../constants'

export interface PageSliceState {
  previousPage: string
  currentPage: string
  modal: T.PageModalState
  renderState: {
    status: T.PageRenderStatus
    rootNode: T.PageRootNodeState
    components: T.PageComponentsRenderState
    cached: boolean
    snapshot: 'received' | 'not.received'
  }
}

export const initialPageState: PageSliceState = {
  previousPage: '',
  currentPage: '',
  modal: {
    id: '',
    opened: false,
    context: null,
    props: {},
  },
  renderState: {
    status: '',
    rootNode: {
      id: '',
      initializing: false,
      initialized: false,
      initializeError: null,
    },
    components: {
      rendering: false,
      rendered: false,
      renderError: null,
    },
    cached: false,
    snapshot: 'not.received',
  },
}

const page = createSlice({
  name: 'page',
  initialState: initialPageState,
  reducers: {
    setInitiatingPage(state) {
      // Resets the render state as wel
      _.assign(state.renderState, initialPageState.renderState, {
        status: renderStatus.initiating,
      })
    },
    setInitializingRootNode(state) {
      state.renderState['status'] = renderStatus.initializingRootNode
      // Resets the root node state as well
      _.assign(
        state.renderState.rootNode,
        initialPageState.renderState.rootNode,
        { initializing: true },
      )
    },
    setInitializedRootNode(state) {
      state.renderState['status'] = renderStatus.initializedRootNode
      state.renderState.rootNode['initializing'] = false
      state.renderState.rootNode['initialized'] = true
    },
    setInitializeRootNodeFailed(
      state,
      { payload }: PayloadAction<null | Error>,
    ) {
      state.renderState['status'] = renderStatus.initializeRootNodeFailed
      state.renderState.rootNode['initializing'] = false
      state.renderState.rootNode['initializeError'] = payload
    },
    setRenderingComponents(state) {
      state.renderState['status'] = renderStatus.renderingComponents
      // Resets the component render state as well
      _.assign(
        state.renderState.components,
        initialPageState.renderState.components,
        { rendering: true },
      )
    },
    setRenderedComponents(state) {
      state.renderState['status'] = renderStatus.renderedComponents
      // Resets the component render state as well
      _.assign(
        state.renderState.components,
        initialPageState.renderState.components,
        { rendered: true },
      )
    },
    setRenderComponentsFailed(state, { payload }: PayloadAction<null | Error>) {
      state.renderState['status'] = renderStatus.renderComponentsFailed
      state.renderState.components['rendering'] = false
      state.renderState.components['renderError'] = payload
    },
    setPageCached(state) {
      state.renderState['status'] = renderStatus.cached
      state.renderState['cached'] = true
    },
    setReceivedSnapshot(state) {
      state.renderState['status'] = renderStatus.receivedSnapshot
      state.renderState['snapshot'] = 'received'
    },
    setPage(state, { payload }: PayloadAction<string>) {
      if (state.currentPage !== state.previousPage) {
        state['previousPage'] = state.currentPage
      }
      state['currentPage'] = payload
      // state.request[payload] = getRequestState()
    },
    openModal(
      state,
      { payload = {} }: PayloadAction<Partial<T.PageModalState>>,
    ) {
      state.modal.opened = true
      forEachEntries(payload, (key, value) => {
        // @ts-expect-error
        state.modal[key] = value
      })
    },
    closeModal: (state) => void _.assign(state.modal, initialPageState.modal),
  },
})

export const {
  openModal,
  closeModal,
  setPage,
  setInitiatingPage,
  setInitializingRootNode,
  setInitializedRootNode,
  setInitializeRootNodeFailed,
  setRenderingComponents,
  setRenderedComponents,
  setRenderComponentsFailed,
  setPageCached,
  setReceivedSnapshot,
  setRendered,
} = page.actions

export default page.reducer
