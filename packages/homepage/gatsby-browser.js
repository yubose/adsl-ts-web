import { enablePatches } from 'immer'
enablePatches()
import 'react-toastify/dist/ReactToastify.css'
import wrapWithProviders from './wrapWithProviders'
export const wrapRootElement = wrapWithProviders
