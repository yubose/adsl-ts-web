export function getTagName(component: any): string {
  switch (component.type) {
    case 'br':
      return 'br'
    case 'button':
      return 'button'
    case 'date':
    case 'dateSelect':
    case 'searchBar':
    case 'textField':
      return 'input'
    case 'divider':
      return 'hr'
    case 'image':
      return 'img'
    case 'label':
      return 'label'
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
    case 'footer':
    case 'header':
    case 'popUp':
    case 'view':
      return 'div'
    case 'video':
      return 'video'
    default:
      return 'div'
  }
}

/**
 * Resolves a component's html tag name by evaluating the NOODL "type" property
 */
export default {
  name: 'getElementType',
  resolve({ component, original }) {
    console.log(`[getElementType] HELLO`)
    // NOTE: component.get('type') is specially modified to return the
    // noodl component type and not our parsed one
    if (component) {
      component.type = original.type
      component.noodlType = original.type
    }
  },
}
