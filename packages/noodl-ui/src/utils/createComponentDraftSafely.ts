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
  let noodlType: ComponentType | undefined
  // Already a drafted component
  if (isDraft(component)) {
    value = component as WritableDraft<ProxiedComponent>
    value['noodlType'] = noodlType
    noodlType = value.noodlType as ComponentType
  }
  // Component type
  else if (typeof component === 'string') {
    noodlType = component as ComponentType
    const proxiedComponent = { type: noodlType, noodlType } as ProxiedComponent
    value = createDraft(proxiedComponent) as WritableDraft<ProxiedComponent>
  }
  // Component instance
  else if (typeof component.toJS === 'function') {
    const proxiedComponent = component.toJS() as ProxiedComponent
    value = createDraft(proxiedComponent) as WritableDraft<ProxiedComponent>
    noodlType = proxiedComponent.noodlType as ComponentType
  }
  // Proxied component
  else if (isPlainObject(component)) {
    noodlType = component.noodlType || (component.type as ComponentType)
    value = createDraft({
      ...component,
      noodlType,
    } as ProxiedComponent) as WritableDraft<ProxiedComponent>
  }
  // Create an empty draft
  else {
    value = createDraft({} as any) as WritableDraft<ProxiedComponent>
  }
  if (!value.noodlType && noodlType) value['noodlType'] = noodlType

  return value as WritableDraft<ProxiedComponent>
}

export default createComponentDraftSafely
