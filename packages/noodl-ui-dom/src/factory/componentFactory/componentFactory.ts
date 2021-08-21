/**
 * A component factory work-in-progress (WIP)
 *
 * This is created to achieve and accomplice complex functionality
 * for components (such as ComponentPage for page components)
 *
 * However this is planned to spawn other critical instances like the
 * SignaturePad for the signature functionality
 */
import * as u from '@jsmanifest/utils'
import { OrArray } from '@jsmanifest/typefest'
import { Page as NUIPage } from 'noodl-ui'
import ComponentPage from './ComponentPage'
import NDOMPage from '../../Page'
import * as c from '../../constants'
import * as t from '../../types'

const ARIA_LABELLEDBY = 'aria-labelledby'
const ARIA_HIDDEN = 'aria-hidden'
const ARIA_LABEL = 'aria-label'
const CONTENT_SECURITY_POLICY = 'Content-Security-Policy'

const componentFactory = (function () {
  return {
    createComponentPage(...args: ConstructorParameters<typeof ComponentPage>) {
      return new ComponentPage(...args)
    },
  }
})()

export default componentFactory
