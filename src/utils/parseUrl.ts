import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'

const getBase = (s: string) =>
  s.includes('?') ? s.substring(0, s.indexOf('?')) : s

const getParamsAndPages = (url: URL) => {
  const entries = [...url.searchParams.entries()]
  return u.reduce(
    entries,
    (acc, [key, value]) => {
      if (value === '') {
        acc.pages.push(...key.split('-'))
      } else {
        acc.params[key] = value
      }
      return acc
    },
    { pages: [] as string[], params: {} },
  )
}

/**
 * Parses the URL to determine the start url and start page.
 * Useful when users are coming from an outside link
 * (ex: being redirected after submitting a payment)
 *
 * In order of precedence:
    1. Determine the initial action by URL
    2. Determine the initial action by page in cache
    3. Determine the initial action by start page
 *
 * @param appConfig cadlEndpoint object
 * @param value url string
 */
function parseUrl(appConfig: nt.AppConfig, value = '') {
  if(value.includes('&checkoutId=')){
    const index = value.indexOf('&checkoutId=')
    value = value.substring(0,index)
  }
  const url = new URL(value)
  const { params, pages } = getParamsAndPages(url)

  const base = getBase(url.href)
  const keys = u.keys(params) as string[]
  let noodlPathname = pages.join('-')

  appConfig.startPage && pages.unshift(appConfig.startPage)

  let startPage = pages[pages.length - 1]
  let pageUrl = base

  pageUrl.endsWith('index.html') && (pageUrl = `${pageUrl}?`)
  pageUrl = `${pageUrl}${noodlPathname}`

  //get page with params
  const pageParts = value.split('-')
  let currentPage = ''
  if (pageParts.length > 1) {
    currentPage = pageParts[pageParts.length - 1]
  } else {
    const baseArr = pageParts[0].split('?')
    if (baseArr.length > 1 && baseArr[baseArr.length - 1] !== '') {
      currentPage = baseArr[baseArr.length - 1]
    }
  }

  let paramsStr = ''
  if (Object.keys(params)) {
    u.reduce(
      Object.keys(params),
      (acc, key) => (paramsStr = `${paramsStr}&${key}=${params[key]}`),
      {},
    )
  }

  const result = {
    base,
    hasParams: !!keys.length,
    hostname: url.hostname,
    noodlPathname,
    pages,
    pageUrl,
    params,
    startPage,
    url: url.href,
    currentPage: currentPage,
    paramsStr: paramsStr,
  }

  return result
}

export default parseUrl
