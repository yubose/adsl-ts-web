import _ from 'lodash'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AppState {
  initialized: boolean
  isRoomEnvironment: boolean | null
}

export const initialAppState: AppState = {
  initialized: false,
  isRoomEnvironment: null,
}

const app = createSlice({
  name: 'app',
  initialState: initialAppState,
  reducers: {
    setInitialized(state, { payload }: PayloadAction<boolean | undefined>) {
      state.initialized = _.isUndefined(payload) ? true : payload
    },
    setRoomEnvironment(state, { payload }: PayloadAction<boolean>) {
      state.isRoomEnvironment = payload
    },
  },
})

export const { setInitialized, setRoomEnvironment } = app.actions

export default app.reducer

// toggleModal(
//   state,
//   { payload: options }: PayloadAction<AppModalOptions | false>,
// ) {
//   if (options !== undefined) {
//     // We will automatically assume they are opening if they don't pass an
//     //    obvious opened: true as params
//     if (typeof options === 'boolean') {
//       if (options !== state.modal.opened) {
//         if (options) {
//           state.modal.opened = true
//         } else {
//           // Reset modal back to initial closed state
//           Object.keys(initialState.modal).forEach((key: string) => {
//             // @ts-ignore
//             state.modal[key] = initialState.modal[key]
//           })
//           state.modal.opened = false
//         }
//       }
//     } else {
//       // Allow the caller to just pass in opened: false to close it
//       if (options.opened === false) {
//         if (state.modal.opened !== false) {
//           Object.keys(initialState.modal).forEach((key: string) => {
//             // @ts-ignore
//             state.modal[key] = initialState.modal[key]
//           })
//           state.modal.opened = false
//         }
//       } else {
//         if (state.modal.opened !== true) state.modal.opened = true
//         if (options.context) state.modal.context = options.context
//         if (options.data) state.modal.data = options.data
//         if (options.options) state.modal.options = options.options
//       }
//     }
//   }
// },
// updateModalOptions(
//   state,
//   { payload }: PayloadAction<{ [key: string]: any }>,
// ) {
//   Object.assign(state.modal.options, payload)
// },
