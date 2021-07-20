import get from 'lodash/get'
import { Identify, userEvent } from 'noodl-types'
import { ConsumerOptions, NUIComponent, NUIActionObject } from '../types'
import { resolveAssetUrl } from '../utils/noodl'
import Resolver from '../Resolver'

const asyncResolver = new Resolver('resolveAsync')

async function resolveAsync(
  component: NUIComponent.Instance,
  { createActionChain, getAssetsUrl, getRoot, page }: ConsumerOptions,
) {
  try {
    const original = component.blueprint || {}
    const { dataValue, path, placeholder } = original

    /* -------------------------------------------------------
      ---- DATAVALUE
    -------------------------------------------------------- */

    if (Identify.folds.emit(dataValue)) {
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

    if (Identify.folds.emit(path)) {
      const ac = createActionChain('path', [
        { emit: path.emit, actionType: 'emit' },
      ])

      const results = await ac.execute()

      let result = results?.find((val) => !!val?.result)?.result

      if (Identify.component.page(component)) {
        //
      } else {
        result = result ? resolveAssetUrl(result, getAssetsUrl()) : ''
        component.edit({ src: result })
        component.edit({ 'data-src': result })
        component.emit('path', result)
      }
    }

    if (Identify.folds.emit(placeholder)) {
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

  /* -------------------------------------------------------
    ---- USER EVENTS (onClick, onHover, onBlur, etc)
  -------------------------------------------------------- */

  userEvent.forEach((eventType) => {
    if (original[eventType]) {
      const actionChain = createActionChain(
        eventType,
        original[eventType] as NUIActionObject[],
      )
      component.edit({ [eventType]: actionChain })
      component.style.cursor = "pointer"
    }

    if (original['onTextChange']) {
      const actionChain = createActionChain(
        'onInput',
        original['onTextChange'] as NUIActionObject[],
      )
      component.edit({ ['onInput']: actionChain })
    }
  })

  resolveAsync(component, options)

  next?.()
})

export default asyncResolver
