import { NUI, NUITrigger } from 'noodl-ui'

NUI.cache.actions.emit.set('postMessage' as NUITrigger, [])

export const nui = NUI
export const cache = NUI.cache
