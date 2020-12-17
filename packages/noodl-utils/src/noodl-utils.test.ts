import { expect } from 'chai'
import * as n from '.'

describe('createEmitDataKey', () => {
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

describe('findDataValue', () => {
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

describe('isBoolean', () => {
  it('should return true', () => {
    expect(n.isBoolean(true)).to.be.true
  })
  it('should return true', () => {
    expect(n.isBoolean('true')).to.be.true
  })
  it('should return true', () => {
    expect(n.isBoolean(false)).to.be.true
  })
  it('should return true', () => {
    expect(n.isBoolean('false')).to.be.true
  })
  it('should return false', () => {
    expect(n.isBoolean('balse')).to.be.false
  })
})

describe('isBreakLineTextBoardItem', () => {
  it('should return false', () => {
    expect(n.isBreakLineTextBoardItem({ text: 'hello' })).to.be.false
  })

  it('should return true', () => {
    expect(n.isBreakLineTextBoardItem({ br: undefined })).to.be.true
  })

  it('should return true', () => {
    expect(n.isBreakLineTextBoardItem('br')).to.be.true
  })
})
