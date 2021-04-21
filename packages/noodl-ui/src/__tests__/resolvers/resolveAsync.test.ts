import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import { ComponentObject } from 'noodl-types'
import { waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import NUI from '../../noodl-ui'

function resolveComponent(component: ComponentObject) {
  const page = NUI.createPage({
    name: 'Hello',
    viewport: { width: 375, height: 667 },
  })

  return {
    component: NUI.resolveComponents({ components: component, page }),
    page,
  }
}

describe(coolGold(`resolveAsync`), () => {
  it(`should only run the provided callback once per action`, async () => {
    const spy = sinon.spy()
    NUI.use({ evalObject: spy })
    const { component } = resolveComponent(
      mock.getLabelComponent({
        onClick: [mock.getEvalObjectAction(), mock.getEvalObjectAction()],
      }),
    )
    await component.get('onClick')?.execute({})
    expect(spy).to.be.calledTwice
  })

  it(`should only run the provided callback once per emit action`, async () => {
    const trigger = 'onChange'
    const spy = sinon.spy()
    NUI.use({ emit: { [trigger]: spy } })
    const { component } = resolveComponent(
      mock.getLabelComponent({
        [trigger]: [
          mock.getEvalObjectAction(),
          mock.getEmitObject(),
          mock.getEvalObjectAction(),
        ],
      }),
    )
    await component.get(trigger)?.execute({})
    expect(spy).to.be.calledOnce
  })
})
