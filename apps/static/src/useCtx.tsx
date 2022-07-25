import createCtx from './utils/createCtx'
import { AppContext } from './types'

const [useCtx, Provider] = createCtx<AppContext>()

export { Provider }
export default useCtx
