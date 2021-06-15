---
sidebar_label: Actions
title: Actions
---

## Handling actions

```js
import { findDataValue } from 'noodl-utils'
import { Identify } from 'noodl-types'
import { NUI } from 'noodl-ui'

const handleOnChangeEmit = (action, options) => {
  try {
    const { ref: actionChain, getRoot, page } = options
    const { dataKey } = action
    let dataValue

    if (typeof dataKey === 'object') {
      for (const [key, value] of Object.entries(dataKey)) {
        if (typeof value === 'string') {
          if (Identify.reference(value)) {
            dataValue = findDataValue(
              [() => getRoot(), () => getRoot()[page.page]],
              value,
            )
          }
        }
      }
    } else if (typeof dataKey === 'string') {
      dataValue = findDataValue(
        [() => getRoot(), () => getRoot()[page.page]],
        dataKey,
      )
    }

    // Do something with dataValue
  } catch (error) {
    throw error
  }
}

NUI.use({})
```
