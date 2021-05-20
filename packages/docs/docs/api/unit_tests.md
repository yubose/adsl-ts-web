---
sidebar_label: Unit tests
title: Unit tests
---

## Testing dynamically injected objects from an `evalObject`

1. Use the return value of an `evalObject`'s `object` function

```js
import { getApp } from '../utils/test-utils'

it(`should handle dynamically injected objects from evalObject actions`, () => {
  const popUpView = `minimizeVideoChat`
  const app = await getApp({
    navigate: true,
    pageName: 'Cereal',
    components: [
      mock.getPopUpComponent({ global: true, popUpView }),
      mock.getButtonComponent({
        id: 'button',
        onClick: [
          mock.getEvalObjectAction({
            object: async () => ({ abort: true }),
          }),
          mock.getPopUpAction(popUpView),
        ],
      }),
    ],
  })
  const button = app.cache.component.get('button')
  const buttonElem = getFirstByElementId(button)
  const globalElem = getFirstByGlobalId(popUpView)
  const popUpSpy = sinon.spy(app.actions.popUp[0], 'fn')
  expect(buttonElem).to.exist
  expect(globalElem).to.exist
  expect(dom.isVisible(globalElem)).to.be.false
  buttonElem.click()
  await waitFor(() => {
    expect(popUpSpy).to.be.calledOnce
    expect(dom.isVisible(getFirstByGlobalId(popUpView))).to.be.true
  })
})
```
