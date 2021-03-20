import isPlainObject from 'lodash/isPlainObject'
import { createDraft, isDraft } from 'immer'
import { WritableDraft } from 'immer/dist/internal'
import {
  ComponentCreationType,
  ComponentType,
  ProxiedComponent,
} from '../types'

/**
 * A helper utility to safely create a draft component
 * @param { ComponentCreationType } component - Component type, component instance, or a plain component JS object
 */
function createComponentDraftSafely(
  component: ComponentCreationType,
): WritableDraft<ProxiedComponent> {
  let value: WritableDraft<ProxiedComponent> | undefined
  let type: ComponentType | undefined
  // Already a drafted component
  if (isDraft(component)) {
    value = component as WritableDraft<ProxiedComponent>
    value['type'] = type
    type = value.type as ComponentType
  }
  // Component type
  else if (typeof component === 'string') {
    type = component as ComponentType
    const proxiedComponent = { type: type, type } as ProxiedComponent
    value = createDraft(proxiedComponent) as WritableDraft<ProxiedComponent>
  }
  // Component instance
  else if (typeof component.toJS === 'function') {
    const proxiedComponent = component.toJS() as ProxiedComponent
    value = createDraft(proxiedComponent) as WritableDraft<ProxiedComponent>
    type = proxiedComponent.type as ComponentType
  }
  // Proxied component
  else if (isPlainObject(component)) {
    type = component.type || (component.type as ComponentType)
    value = createDraft({
      ...component,
      type,
    } as ProxiedComponent) as WritableDraft<ProxiedComponent>
  }
  // Create an empty draft
  else {
    value = createDraft({} as any) as WritableDraft<ProxiedComponent>
  }
  if (!value.type && type) value['type'] = type

  return value as WritableDraft<ProxiedComponent>
}

export default createComponentDraftSafely
