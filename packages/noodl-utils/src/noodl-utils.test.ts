import * as u from '@jsmanifest/utils'
import { coolGold, italic, magenta } from 'noodl-common'
import { expect } from 'chai'
import * as n from '.'

describe(coolGold('createEmitDataKey'), () => {
  const dataObject = { key: 'gender', value: 'Female' }
  const pageObject = { genderInfo: dataObject }
  const root = { Global: {}, MeetingRoomCreate: pageObject }
  const orig = { var1: 'genderInfo', var2: 'genderInfo.key' }

  it('should attach the dataObjects from the paths', () => {
    const dataKey = n.createEmitDataKey(orig, [dataObject, pageObject, root])
    expect(dataKey).to.have.property('var1', dataObject)
    expect(dataKey).to.have.property('var2', 'gender')
  })

  it('should attach the dataObjects using a path', () => {
    const dataKey = n.createEmitDataKey(
      { var1: 'Global', var2: 'MeetingRoomCreate' },
      [dataObject, pageObject, root],
    )
    expect(dataKey).to.have.property('var1', root.Global)
    expect(dataKey).to.have.property('var2', root.MeetingRoomCreate)
  })

  it('should attach the dataObject using a string dataKey', () => {
    expect(
      n.createEmitDataKey('MeetingRoomCreate', [dataObject, pageObject, root]),
    ).to.eq(root.MeetingRoomCreate)
    expect(
      n.createEmitDataKey('genderInfo.value', [dataObject, pageObject, root]),
    ).to.eq('Female')
    expect(n.createEmitDataKey('genderInfo.value', pageObject)).to.eq('Female')
    expect(n.createEmitDataKey('key', dataObject)).to.eq('gender')
  })
})

describe(coolGold('excludeIteratorVar'), () => {
  const iteratorVar = 'itemObject'
  const tests = {
    [iteratorVar]: ``,
    [`${iteratorVar}.`]: ``,
    [`${iteratorVar}.....`]: `....`,
    [`${iteratorVar}.formData.password`]: `formData.password`,
    [`.formData.password`]: `.formData.password`,
    [`formData.password`]: `formData.password`,
    [`${iteratorVar}formData.${iteratorVar}.password`]: `formData.password`,
    [`${iteratorVar}...formData.${iteratorVar}.password`]: `..formData.password`,
  } as const

  u.entries(tests).forEach(([testStr, expectedResult]) => {
    it(`should return ${u.white(expectedResult)} for ${testStr}`, () => {
      expect(n.excludeIteratorVar(testStr as string, iteratorVar)).to.eq(
        expectedResult,
      )
    })
  })
})

describe(coolGold('findDataValue'), () => {
  let listObject = [
    { fruits: ['apple'], color: 'purple' },
    { fruits: ['banana'], color: 'red' },
  ]
  const pageObject = { hello: { name: 'Henry' }, listData: listObject }
  const root = { Bottle: pageObject, Global: { vertex: {} } }

  it('should be able to return the data object by using a page object', () => {
    expect(n.findDataValue(pageObject, 'hello.name')).to.eq('Henry')
  })

  it('should be able to return the data object by using a root object', () => {
    expect(n.findDataValue(root, 'Bottle')).to.eq(pageObject)
  })
})

// xdescribe(`findDataObject`, () => {
//   it(`should return the data object`, () => {
//     const obj = {
//       formData: {
//         items: {
//           ages: [1, 2, 10, 11, 48],
//           food: {
//             fruits: 'apple',
//             vegetables: { carrot: true, tomato: false },
//           },
//         },
//       },
//     }
//     const dataKey = 'formData.items.food.vegetables'
//   })

//   xit(`should not return the data value but the obj that is wrapping it instead`, () => {
//     //
//   })
// })

describe(coolGold('isRootDataKey'), () => {
  Object.entries({
    '..SignIn.formData': true,
    '.SignIn.formData': true,
    'SignIn.formData': true,
    ',SignIn.formData': false,
    'signIn.formData': false,
    sASKMSADSAD: false,
    '.signIn.formData': false,
    '..signIn.formData': false,
    '..,fsignIn.formData': false,
  }).forEach(([key, expectedResult]) => {
    it(`should return ${expectedResult} for "${key}"`, () => {
      expect(n.isRootDataKey(key)).to.be[expectedResult ? 'true' : 'false']
    })
  })
})

// describe(coolGold(`trimRefPrefix`), () => {
//   u.entries({
//     [`..formData.password`]: 'formData.password',
//     [`.formData.password`]: 'formData.password',
//     [`@=.formData.password`]: 'formData.password',
//     [`@formData.password`]: 'formData.password',
//     [`.....formData.password`]: 'formData.password',
//     [`  formData.password`]: 'formData.password',
//     [`formData.password`]: 'formData.password',
//   }).forEach(([testStr, expectedResult]) => {
//     it(`should trim the reference prefix for ${testStr}`, () => {
//       expect(n.trimRefPrefix(testStr)).to.eq(expectedResult)
//     })
//   })
// })
