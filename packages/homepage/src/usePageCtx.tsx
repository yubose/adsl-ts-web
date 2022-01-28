import createCtx from './utils/createCtx'
import { PageContext } from './types'

const [usePageCtx, Provider] = createCtx<PageContext>()

export { Provider }
export default usePageCtx
