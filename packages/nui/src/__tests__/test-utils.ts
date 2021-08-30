import { actionFactory, componentFactory } from 'noodl-ui-test-utils'
import Nui from '../nui'
import NuiPage from '../Page'
import Viewport from '../Viewport'

export const assetsUrl = 'https://something.com/assets/'
export const nui = Nui
export const viewport = new Viewport()
export const ui = { ...actionFactory, ...componentFactory }
