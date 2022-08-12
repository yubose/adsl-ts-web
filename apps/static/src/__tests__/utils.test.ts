import deref from '../utils/deref'

describe(`uti`, () => {
  it(`[deref] should deeply resolve the reference`, () => {
    const root = {
      Topo: { fruit: '.Abc.fruit.0.abc' },
      Abc: { fruit: [{ abc: '123' }] },
    }
    const result = deref({ ref: root.Topo.fruit, root, rootKey: 'Topo' })
    expect(result).toEqual('123')
  })
})
