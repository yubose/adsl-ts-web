import { expect } from 'chai'
import sinon from 'sinon'
import * as n from './noodl'

describe('noodl (utils)', () => {
  it('should call the callback everytime a nested child is encountered', () => {
    const spy = sinon.spy()
    const component = {
      children: [
        {
          // args[0]
          a: true,
          children: [
            {
              //args[1]
              b: true,
              children: [
                {
                  //args[2]
                  c: true,
                  children: [
                    //args[3]
                    { children: { lastChild: true } as any },
                  ],
                  lastChild: false,
                },
              ],
            },
          ],
        },
      ],
    } as any
    n.forEachDeepChildren(component, spy)
    const args = spy.args
    expect(args[0][1]).to.equal(component.children[0])
    expect(args[0][1]).to.have.property('a', true)
    expect(args[1][1]).to.equal(component.children[0].children[0])
    expect(args[2][1]).to.equal(component.children[0].children[0].children[0])
    expect(args[3][1]).to.equal(
      component.children[0].children[0].children[0].children[0],
    )
    expect(args[4][1]).to.equal(
      component.children[0].children[0].children[0].children[0].children,
    )
  })
})
