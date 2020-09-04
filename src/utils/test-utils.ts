import domTestingLib from '@testing-library/dom'

const { queryHelpers } = domTestingLib

export const queryByDataKey = queryHelpers.queryByAttribute.bind(
  null,
  'data-key',
)

export const queryByDataUx = queryHelpers.queryByAttribute.bind(null, 'data-ux')
