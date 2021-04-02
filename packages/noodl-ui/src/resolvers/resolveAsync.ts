import { Identify, userEvent } from 'noodl-types'
import { ConsumerOptions, NUIComponent, NOODLUIActionObject } from '../types'
import Resolver from '../Resolver'
import { resolveAssetUrl } from '../utils/noodl'
import * as u from '../utils/internal'

const asyncResolver = new Resolver('resolveAsync')

async function resolveAsync(
  component: NUIComponent.Instance,
  { context, createActionChain, getAssetsUrl }: ConsumerOptions,
) {
  try {
    const original = component.blueprint || {}
    const { dataValue, path, placeholder } = original

    /* -------------------------------------------------------
      ---- DATAVALUE
    -------------------------------------------------------- */

    if (Identify.emit(dataValue)) {
      const ac = createActionChain('dataValue', [
        { emit: dataValue.emit, actionType: 'emit' },
      ])
      const results = await ac?.execute?.()
      const result = results.find((val) => !!val?.result)?.result
      component.edit({ 'data-value': result })
      component.emit('dataValue', result)
    }

    /* -------------------------------------------------------
      ---- PATH
    -------------------------------------------------------- */

    if (Identify.emit(path)) {
      const ac = createActionChain('path', [
        { emit: path.emit, actionType: 'emit' },
      ])
      const results = await ac.execute()
      let result = results?.find((val) => !!val?.result)?.result
      result = result ? resolveAssetUrl(result, getAssetsUrl()) : ''
      component.edit({ src: result })
      component.edit({ 'data-src': result })
      component.emit('path', result)
    }

    if (Identify.emit(placeholder)) {
      const ac = createActionChain('placeholder', [
        { emit: placeholder.emit, actionType: 'emit' },
      ])
      const results = await ac.execute?.()
      const result = results?.find((v) => !!v.result)?.result
      component.edit({ 'data-placeholder': result })
      component.emit('placeholder', result)
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

asyncResolver.setResolver((component, options, next) => {
  const original = component.blueprint || {}
  const { createActionChain } = options

  userEvent.forEach((eventType) => {
    if (original[eventType]) {
      const actionChain = createActionChain(
        eventType,
        original[eventType] as NOODLUIActionObject[],
      )
      component.edit({ [eventType]: actionChain })
    }
  })

  resolveAsync(component, options)
  /* -------------------------------------------------------
    ---- USER EVENTS (onClick, onHover, onBlur, etc)
  -------------------------------------------------------- */

  // userEvent.forEach((eventType) => {
  //   if (u.isArr(original[eventType]) || Identify.emit(original[eventType])) {
  //     const actionChain = createActionChain(
  //       eventType,
  //       u.array(original[eventType] as NOODLUIActionObject[]),
  //     )
  //     component.edit({ [eventType]: actionChain })
  //   }
  // })

  next?.()
})

export default asyncResolver
