import { expect } from 'chai'
import { WritableDraft } from 'immer/dist/internal'
import { ComponentType, PlainObject } from '../types'

const newComponent = <S extends new (...args: any[]) => any>(superclass: S) =>
  class extends superclass {
    #props: WritableDraft<PlainObject>
    type: ComponentType

    constructor(...args: any[]) {
      super(...args)
    }
  }

describe(`newComponent`, () => {
  xit(`hello`, () => {
    //
  })
})
