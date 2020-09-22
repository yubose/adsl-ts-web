import _ from 'lodash'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { forEachEntries } from 'utils/common'
import { SerializedError } from 'app/types'
import { AuthStatus } from '.'

export interface AuthState {
  cache: {
    [key: string]: any
  }
  isCreating: boolean
  isRetrieving: boolean
  status: AuthStatus
  verification: {
    code: null | number
    error: Error | null
    pending: boolean
    timedOut: boolean
  }
}

export const initialAuthState: AuthState = {
  cache: {}, // Cached signin/signup form values to help with the complexity in the login flow
  isCreating: false,
  isRetrieving: false,
  status: null,
  verification: {
    code: null,
    pending: false,
    error: null,
    timedOut: false,
  },
}

const auth = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    /* -------------------------------------------------------
      ---- User state
    -------------------------------------------------------- */
    setAuthStatus(state, { payload }: PayloadAction<AuthState['status']>) {
      state.status = payload
    },
    setRetrievingUserState(state, { payload }: PayloadAction<boolean>) {
      state.isRetrieving = payload
    },
    setIsCreatingAccount(
      state,
      { payload: isCreating }: PayloadAction<boolean>,
    ) {
      state.isCreating = isCreating
    },
    /* -------------------------------------------------------
      ---- Verification
    -------------------------------------------------------- */
    setVerificationCode(state, { payload: code }: PayloadAction<number>) {
      state.verification.code = code
    },
    setVerificationCodePending(
      state,
      {
        payload: pending,
      }: PayloadAction<boolean | { pending: boolean; code?: number }>,
    ) {
      if (_.isBoolean(pending)) {
        if (pending) {
          _.assign(state.verification, {
            code: null,
            pending: true,
            timedOut: false,
          })
        } else {
          state.verification.pending = false
        }
      } else if (_.isObjectLike(pending)) {
        state.verification.pending = pending.pending
        if (pending.code != null) {
          state.verification.code = pending.code
        }
      }
    },
    setVerificationCodeError(
      state,
      { payload: error }: PayloadAction<null | SerializedError>,
    ) {
      state.verification.error = error
    },
    setVerificationCodeTimedOut(
      state,
      { payload: timedOut }: PayloadAction<boolean>,
    ) {
      state.verification.timedOut = timedOut
    },
    /* -------------------------------------------------------
      ---- Other
    -------------------------------------------------------- */
    mergeCacheAuthValues(state, { payload }: PayloadAction<any>) {
      forEachEntries(payload, (key, value) => {
        state.cache[key as keyof AuthState['cache']] = value
      })
    },
  },
})

export const {
  mergeCacheAuthValues,
  setAuthStatus,
  setIsCreatingAccount,
  setRetrievingUserState,
  setVerificationCode,
  setVerificationCodePending,
  setVerificationCodeError,
  setVerificationCodeTimedOut,
} = auth.actions

export default auth.reducer
