import _ from 'lodash'
import { createDraft, isDraft } from 'immer'
import { WritableDraft } from 'immer/dist/internal'
import { IComponentType, NOODLComponentType, ProxiedComponent } from '../types'

/**
 * A helper utility to safely create a draft component
 * @param { IComponentType } component - Component type, component instance, or a plain component JS object
 */
function createComponentDraftSafely(
  component: IComponentType,
): WritableDraft<ProxiedComponent> {
  let value: WritableDraft<ProxiedComponent> | undefined
  let noodlType: NOODLComponentType | undefined
  // Already a drafted component
  if (isDraft(component)) {
    value = component as WritableDraft<ProxiedComponent>
    value['noodlType'] = noodlType
    noodlType = value.noodlType as NOODLComponentType
  }
  // Component type
  else if (_.isString(component)) {
    noodlType = component
    const proxiedComponent = { type: noodlType, noodlType } as ProxiedComponent
    value = createDraft(proxiedComponent) as WritableDraft<ProxiedComponent>
  }
  // Component instance
  else if (_.isFunction(component.toJS)) {
    const proxiedComponent = component.toJS() as ProxiedComponent
    value = createDraft(proxiedComponent) as WritableDraft<ProxiedComponent>
    noodlType = proxiedComponent.noodlType as NOODLComponentType
  }
  // Proxied component
  else if (_.isPlainObject(component)) {
    noodlType = component.noodlType || (component.type as NOODLComponentType)
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
