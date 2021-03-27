import { expect } from 'chai'
import userEvent from '@testing-library/user-event'
import { onSelectFile } from '../../utils/dom'

describe('dom (utils)', () => {
  describe('onSelectFile (passing in an existing input)', () => {
    xit('should be able to receive the image file and status: selected', async () => {
      const input = document.createElement('input')
      const result = await onSelectFile(input)
      const file = new File(['hello'], 'myFile.png', { type: 'image/png' })
      userEvent.upload(input, file)
      expect(input.files?.[0]).to.equal(file)
      expect(result.files?.[0]).to.equal(file)
      expect(result.status).to.equal('selected')
      expect(result.status).not.to.equal('canceled')
    })
  })
})
