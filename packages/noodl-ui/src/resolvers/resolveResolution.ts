import * as u from '@jsmanifest/utils'
import * as nu from 'noodl-utils'
import get from 'lodash/get'
import { Identify } from 'noodl-types'
import Resolver from '../Resolver'
import cache from '../_cache'
import isNUIPage from '../utils/isPage'
import * as c from '../constants'
import * as n from '../utils/noodl'

const resolutionResolver = new Resolver('resolveResolution')

resolutionResolver.setResolver(async function resolutionResolver(
  component,
  { callback, getRoot, page },
  next,
) {
  // callback?.(component)

  return next?.()
})

export default resolutionResolver
