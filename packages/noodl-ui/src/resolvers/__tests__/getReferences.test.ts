import isEqual from 'lodash/isEqual'
import { expect } from 'chai'
import { createResolverTest } from '../../utils/test-utils'
import _getReferences from '../getReferences'

let rootMap: any

beforeEach(() => {
  rootMap = {
    ColorTheme: {
      blue: '0x3185c7ff',
      yellow: '0xfda512ff',
      highLightColor: '0x3185c7ff',
    },
    CustomStyle: {
      color: 'blue',
      background: 'magenta',
    },
    HeaderStyle: '.ButtonStyle',
    ButtonStyle: {
      shadow: true,
      '.ColorTheme': {
        yellow: 'yellow',
      },
      '.CustomStyle': {
        color: 'orange',
      },
    },
  }
})

let getReferences: any

beforeEach(() => {
  getReferences = createResolverTest(_getReferences)
})

describe('getReferences', () => {
  xit('should perform more operations on nested references if encountered', () => {
    const result = getReferences({ style: '.HeaderStyle' })
    expect(result.style).to.satisfy((style) => {
      return isEqual(style, {
        ...rootMap.ColorTheme,
        blue: '#3185c7ff',
        highLightColor: '#3185c7ff',
        yellow: 'yellow',
        color: 'orange',
        background: 'magenta',
      })
    })
  })
})
