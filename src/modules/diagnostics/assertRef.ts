import y from 'yaml'
import { consts, is as coreIs } from '@noodl/core'
import { createAssert, deref } from '@noodl/yaml'

export default createAssert<y.Scalar<string>>(function assertRef({
  add,
  node,
  page,
  root,
}) {
  const derefed = deref({ node, root, rootKey: page })
  const isLocal = coreIs.localReference(derefed.reference)

  if (typeof derefed.value === 'undefined') {
    const locLabel = isLocal ? 'Local' : 'Root'
    const using = isLocal ? ` using root key '${page}'` : ''

    add({
      node,
      messages: [
        {
          type: consts.ValidatorType.ERROR,
          message: `${locLabel} reference '${derefed.reference}' was not resolvable${using}`,
        },
      ],
      page,
      ...derefed,
    })
  } else {
    node.value = derefed.value
    return node
  }
})
