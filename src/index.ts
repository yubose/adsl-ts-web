import NOODL, {
  ActionChainActionCallbackOptions,
  color,
  getDataFields,
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
  getChildren,
  getColors,
  getEventHandlers,
  getFontAttrs,
  getPosition,
  getReferences,
  getStylesByElementType,
  getSizes,
  getTransformedAliases,
  getTransformedStyleAliases,
  NOODLComponent,
  NOODLChainActionBuiltInObject,
  NOODLChainActionObject,
  ResolverConsumerOptions,
} from 'noodl-ui'
import { cadl } from 'app/client'
import mockSigninPg from './mockSigninPg.json'
import './styles.css'

let noodl: ReturnType<typeof NOODL>

async function initializeApp() {
  await cadl.init()
  noodl = new NOODL()
  noodl
    .init()
    .setRoot(cadl.root)
    .setAssetsUrl(cadl.assetsUrl || '')
    .setPage({
      name: 'MeetingRoomCreate',
      object: mockSigninPg['MeetingRoomCreate'],
    })
    .setResolvers([
      getDataFields,
      getElementType,
      getAlignAttrs,
      getBorderAttrs,
      getCustomDataAttrs,
      getChildren,
      getColors,
      getEventHandlers,
      getFontAttrs,
      getPosition,
      getReferences,
      getStylesByElementType,
      getSizes,
      getTransformedAliases,
      getTransformedStyleAliases,
    ])
}

initializeApp()
