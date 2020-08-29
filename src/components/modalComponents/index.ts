import VerificationCode from './VerificationCode'
import { ModalId } from 'app/types'
import { modalIds } from '../../constants'

const componentMap: Record<ModalId, any> = {
  [modalIds.VERIFICATON_CODE]: VerificationCode,
}

export default componentMap
