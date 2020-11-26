import { expect } from 'chai'
import EmitAction from './EmitAction'

describe('EmitAction', () => {
  describe('setDataKey', () => {
    it('should use the key as the value if only 1 arg and its not an object', () => {
      const emitAction = new EmitAction({
        emit: { dataKey: { var1: 'g' }, actions: [] },
      })
      emitAction.setDataKey('HELLO')
      expect(emitAction.dataKey).to.eq('HELLO')
      emitAction.setDataKey(null)
    })

    it('should use the key as an object of key/values if only 1 arg and its an object', () => {
      const dataKey = { var1: 'g' }
      const emitAction = new EmitAction({
        emit: { dataKey, actions: [] },
      })
      expect(emitAction).to.have.property('dataKey').eq(dataKey)
      emitAction.setDataKey({ abc: 'hello', var3: 'itemObject' })
      expect(emitAction.dataKey).to.have.property('abc').to.eq('hello')
      expect(emitAction.dataKey).to.have.property('var3').to.eq('itemObject')
    })

    it('should set the key and value', () => {
      const emitAction = new EmitAction({
        emit: { dataKey: { var1: 'g', var2: 'f', var5: 'asd' }, actions: [] },
      })
      expect(emitAction.dataKey).to.have.keys('var1', 'var2', 'var5')
      emitAction.setDataKey('var5', 1099)
      expect(emitAction.dataKey).to.have.property('var5').eq(1099)
    })
  })

  describe('clearDataKey', () => {
    it('should clear the whole dataKey ', () => {
      const emitAction = new EmitAction({
        emit: { dataKey: { var1: 'g' }, actions: [] },
      })
      expect(emitAction.dataKey).to.have.property('var1', 'g')
      emitAction.clearDataKey()
      expect(emitAction.dataKey).to.be.undefined
    })

    it('should clear the dataKey property only', () => {
      const emitAction = new EmitAction({
        emit: { dataKey: { var1: 'g', var2: 'f', var5: 'asd' }, actions: [] },
      })
      expect(emitAction.dataKey).to.include.keys('var1', 'var2', 'var5')
      emitAction.clearDataKey('var2')
      expect(emitAction.dataKey).to.include.keys('var1', 'var5')
      expect(emitAction.dataKey).to.not.include.keys('var2')
    })
  })
})
