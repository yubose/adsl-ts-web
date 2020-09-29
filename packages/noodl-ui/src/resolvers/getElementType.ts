import _ from 'lodash'
import { NOODLComponentType, Resolver } from '../types'

/**
 * Resolves a component's html tag name by evaluating the NOODL "type" property
 * @param { Component } component
 * @param { ResolverConsumerOptions } options
 * @return { void }
 */
const getElementType: Resolver = (component) => {
  // NOTE: component.get('type') is specially modified to return the
  // noodl component type and not our parsed one
  component.set('type', getType(component.get('type') as NOODLComponentType))
}

function getType(noodlComponentType: string): string {
  switch (noodlComponentType) {
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
      console.log(
        `%cNone of the node types matched with "${noodlComponentType}". Perhaps it needs to be ' +
        'supported? (Defaulting to "div" instead)`,
        'color:#e74c3c;font-weight:bold;',
      )
      return 'div'
  }
}

export default getElementType
