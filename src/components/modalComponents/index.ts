import VerificationCode from './VerificationCode'
import { PageModalId } from 'app/types'
import { modalIds } from '../../constants'

const componentMap: Record<PageModalId, any> = {
  [modalIds.VERIFICATON_CODE]: VerificationCode,
}

export default componentMap
