import { ComponentInstance, ResolverFn } from '../types'

/**
 * Resolves a component's html tag name by evaluating the NOODL "type" property
 */
const getElementType: ResolverFn = (component) => {
  // NOTE: component.get('type') is specially modified to return the
  // noodl component type and not our parsed one
  component.set('type', getTagName(component))
  component.set(
    'noodlType',
    component.original.noodlType || component.original.type,
  )
}

export function getTagName(component: ComponentInstance): string {
  switch (component?.noodlType) {
    case 'br':
      return 'br'
    case 'chart':
      return 'div'
    case 'button':
      return 'button'
    case 'date':
    // @ts-expect-error
    case 'dateSelect':
    case 'searchBar':
    case 'textField':
      return 'input'
    case 'divider':
      return 'hr'
    case 'image':
      return 'img'
    case 'label':
      return 'div'
    case 'list':
      return 'ul'
    case 'listItem':
      return 'li'
    case 'page':
      return 'iframe'
    case 'plugin':
      return 'div'
    case 'pluginHead':
    case 'pluginBodyTop':
    case 'pluginBodyTail':
      return 'script'
    case 'select':
      return 'select'
    case 'scrollView':
      return 'div'
    case 'textView':
      return 'textarea'
    case 'chart':
    case 'footer':
    case 'header':
    case 'map':
    case 'popUp':
    case 'register':
    case 'view':
      return 'div'
    case 'video':
      return 'video'
    default:
      console.log(
        `%cNone of the node types matched with "${component?.noodlType}". Perhaps it needs to be ' +
        'supported? (Defaulting to "div" instead)`,
        'color:#e74c3c;font-weight:bold;',
        { component: component?.toJS?.(), noodlType: component?.noodlType },
      )
      return 'div'
  }
}

export default getElementType
