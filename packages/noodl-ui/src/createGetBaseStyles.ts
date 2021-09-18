// @ts-nocheck
import * as u from '@jsmanifest/utils'
import curry from 'lodash/curry'
import merge from 'lodash/merge'
import NuiViewport from './Viewport'
import { NuiComponent } from './types'

const createGetBaseStyles = curry(
  (getRoot: () => Record<string, any>, component: NuiComponent.Instance) => {
    const origStyle = component?.blueprint?.style || {}
    const styles = { ...origStyle } as any

    if (NuiViewport.isNil(origStyle?.top) || origStyle?.top === 'auto') {
      styles.position = 'relative'
    } else {
      styles.position = 'absolute'
    }
    origStyle?.position == 'fixed' && (styles.position = 'fixed')

    u.isNil(origStyle.height) && (styles.height = 'auto')

    return merge(
      { ...getRoot()?.Style, position: 'absolute', outline: 'none' },
      origStyle,
      styles,
    )
  },
)

export default createGetBaseStyles
