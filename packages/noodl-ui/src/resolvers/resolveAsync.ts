import { Identify, userEvent } from 'noodl-types'
import type { ConsumerOptions, NuiComponent, NUIActionObject } from '../types'
import { resolveAssetUrl } from '../utils/noodl'
import Resolver from '../Resolver'

const asyncResolver = new Resolver('resolveAsync')

async function resolveAsync(
  component: NuiComponent.Instance,
  { createActionChain, getAssetsUrl, on }: ConsumerOptions,
) {
  const original = component.blueprint || {}
  const { dataValue, path, placeholder } = original

  /* -------------------------------------------------------
      ---- DATAVALUE
    -------------------------------------------------------- */

  if (Identify.folds.emit(dataValue)) {
    const ac = createActionChain('dataValue', [
      { emit: dataValue.emit, actionType: 'emit' },
    ])
    on?.actionChain && ac.use(on.actionChain)
    const results = await ac?.execute?.()
    const result = results.find((val) => !!val?.result)?.result
    component.edit({ 'data-value': result })
    await component.emit('data-value', result)
  }

  /* -------------------------------------------------------
      ---- PATH
    -------------------------------------------------------- */

  if (Identify.folds.emit(path)) {
    const ac = createActionChain('path', [
      { emit: path.emit, actionType: 'emit' },
    ])
    on?.actionChain && ac.use(on.actionChain)
    const results = await ac.execute()
    let result = results?.find((val) => !!val?.result)?.result

    if (Identify.component.page(component)) {
      //
    } else {
      result = result ? resolveAssetUrl(result, getAssetsUrl()) : ''
      debugger
      component.edit({ src: result })
      component.edit({ 'data-src': result })
      component.emit('path', result)
    }
  }

  if (Identify.folds.emit(placeholder)) {
    const ac = createActionChain('placeholder', [
      { emit: placeholder.emit, actionType: 'emit' },
    ])
    on?.actionChain && ac.use(on.actionChain)
    const results = await ac.execute?.()
    const result = results?.find((v) => !!v.result)?.result
    component.edit({ 'data-placeholder': result })
    component.emit('placeholder', result)
  }
}

asyncResolver.setResolver(async (component, options, next) => {
  try {
    const original = component.blueprint || {}
    const { createActionChain, on } = options

    /* -------------------------------------------------------
    ---- USER EVENTS (onClick, onHover, onBlur, etc)
  -------------------------------------------------------- */

    // @ts-expect-error
    userEvent.concat('postMessage').forEach((eventType) => {
      if (original[eventType]) {
        const actionChain = createActionChain(
          eventType,
          original[eventType] as NUIActionObject[],
        )
        on?.actionChain && actionChain.use(on.actionChain)
        component.edit({ [eventType]: actionChain })
        // @ts-expect-error
        eventType !== 'postMessage' && (component.style.cursor = 'pointer')
      }

      if (original.onTextChange) {
        const actionChain = createActionChain('onInput', original.onTextChange)
        component.edit({ ['onInput']: actionChain })
        on?.actionChain && actionChain.use(on.actionChain)
      }
    })

    /* -------------------------------------------------------
      ---- POST MESSAGE (From page component)
    -------------------------------------------------------- */

    // if (Identify.folds.emit(original?.postMessage?.emit)) {
    //   component.edit({
    //     postMessage: createActionChain('postMessage', [
    //       { emit: original.postMessage.emit, actionType: 'emit' },
    //     ]),
    //   })
    // }

    await resolveAsync(component, options)
    return next?.()
  } catch (error) {
    console.error(error)
    throw error
  }
})

export default asyncResolver
