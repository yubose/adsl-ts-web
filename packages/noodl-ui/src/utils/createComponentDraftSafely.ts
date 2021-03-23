import isPlainObject from 'lodash/isPlainObject'
import { ComponentType } from 'noodl-types'
import { createDraft, isDraft } from 'immer'
import { WritableDraft } from 'immer/dist/internal'
import { NUIComponent } from '../types'

/**
 * A helper utility to safely create a draft component
 * @param { Component.CreateType } component - Component type, component instance, or a plain component JS object
 */
function createComponentDraftSafely(
  component: NUIComponent.CreateType,
): WritableDraft<NUIComponent.Proxy> {
  let value: WritableDraft<NUIComponent.Proxy> | undefined
  let type: ComponentType | undefined
  // Already a drafted component
  if (isDraft(component)) {
    value = component as WritableDraft<NUIComponent.Proxy>
    value['type'] = type
    type = value.type as ComponentType
  }
  // Component type
  else if (typeof component === 'string') {
    type = component as ComponentType
    const proxiedComponent = { type } as NUIComponent.Proxy
    value = createDraft(proxiedComponent) as WritableDraft<NUIComponent.Proxy>
  }
  // Component instance
  else if (typeof component.toJSON === 'function') {
    const proxiedComponent = component.toJSON() as NUIComponent.Proxy
    value = createDraft(proxiedComponent) as WritableDraft<NUIComponent.Proxy>
    type = proxiedComponent.type as ComponentType
  }
  // Proxied component
  else if (isPlainObject(component)) {
    type = component.type || (component.type as ComponentType)
    value = createDraft({
      ...component,
      type,
    } as NUIComponent.Proxy) as WritableDraft<NUIComponent.Proxy>
  }
  // Create an empty draft
  else {
    value = createDraft({} as any) as WritableDraft<NUIComponent.Proxy>
  }
  if (!value.type && type) value['type'] = type

  return value as WritableDraft<NUIComponent.Proxy>
}

export default createComponentDraftSafely
