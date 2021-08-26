import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import { ComponentObject } from 'noodl-types'
import { expect } from 'chai'
import { coolGold } from 'noodl-common'
import { ui } from '../../utils/test-utils'
import NUI from '../../noodl-ui'
import { waitFor } from '@testing-library/dom'

async function resolveComponent(component: ComponentObject) {
  const page = NUI.createPage({
    name: 'Hello',
    viewport: { width: 375, height: 667 },
  })

  return {
    component: await NUI.resolveComponents({ components: component, page }),
    page,
  }
}

describe(coolGold(`resolveAsync`), () => {
  it(`should only run the provided callback once per action`, async () => {
    const spy = sinon.spy()
    NUI.use({ evalObject: spy })
    const { component } = await resolveComponent(
      ui.label({
        onClick: [ui.evalObject(), ui.evalObject()],
      }),
    )
    await component.get('onClick').execute({})
    await waitFor(() => {
      expect(spy).to.be.calledTwice
    })
  })

  it(`should only run the provided callback once per emit action`, async () => {
    const trigger = 'onChange'
    const spy = sinon.spy()
    NUI.use({ emit: { [trigger]: spy } })
    const { component } = await resolveComponent(
      ui.label({
        [trigger]: [ui.evalObject, mock.getFoldedEmitObject(), ui.evalObject],
      }),
    )
    await component.get(trigger)?.execute({})
    await waitFor(() => expect(spy).to.be.calledOnce)
  })
})
