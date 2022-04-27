import createCtx from '@/utils/createCtx'
import type { RootObjectContext } from './types'
const [useRootObjectCtx, RootObjectProvider] = createCtx<RootObjectContext>()
export { useRootObjectCtx, RootObjectProvider }
