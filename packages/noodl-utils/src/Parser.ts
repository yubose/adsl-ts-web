import * as t from './types'
import * as u from './_internal'

class NoodlUtilsParser {
  destination(
    destination: string | undefined,
    {
      denoter = '^',
      duration = 350,
    }: { denoter?: string; duration?: number } = {},
  ) {
    const result: t.ParsedDestinationObject = {
      destination: '',
      duration,
      id: '',
    }

    if (u.isStr(destination)) {
      if (destination.includes(denoter)) {
        const denoterIndex = destination.indexOf(denoter)
        result.isSamePage = denoterIndex === 0
        // "^SignIn"
        if (result.isSamePage) {
          result.destination = ''
          result.id = destination.replace(denoter, '')
        }
        // "SignIn^redTag"
        else {
          let parts = destination.split(denoter)[1]?.split(';')
          let propKey = ''
          let serialized = parts[1] || ''
          if (serialized.startsWith(';')) {
            serialized = serialized.replace(';', '')
          }
          result.id = parts[0] || ''
          result.destination = destination.substring(0, denoterIndex)
          serialized
            .split(':')
            .forEach((v, index) =>
              index % 2 === 1
                ? (result[propKey] = v)
                : index % 2 === 0
                ? (propKey = v)
                : undefined,
            )
        }
      }
      // "SignIn"
      else {
        result.destination = destination
        result.isSamePage = false
      }
    } else {
      result.destination = ''
    }
    return result
  }

  /**
   * Parses a NOODL destination, commonly received from goto
   * or pageJump actions as a string. The return value (for now) is
   * intended to be directly assigned to page.pageUrl (subject to change)
   * The target string to analyze here is the "destination" which might come
   * in various forms such as:
   *    GotoViewTag#redTag
   *
   * @param { string } pageUrl - Current page url (should be page.pageUrl from the Page instance)
   * @param { string } options.destination - Destination
   * @param { string } options.startPage
   */
  queryString({
    destination = '',
    pageUrl = '',
    startPage = '',
  }: {
    destination: string
    pageUrl: string
    startPage?: string
  }) {
    const base = 'index.html?'
    pageUrl = pageUrl.startsWith(base) ? pageUrl : pageUrl + base
    let separator = pageUrl.endsWith('?') ? '' : '-'
    if (destination !== startPage) {
      const questionMarkIndex = pageUrl.indexOf(`?${destination}`)
      const hyphenIndex = pageUrl.indexOf(`-${destination}`)
      if (questionMarkIndex !== -1) {
        pageUrl = pageUrl.substring(0, questionMarkIndex + 1)
        separator = pageUrl.endsWith('?') ? '' : '-'
      } else if (hyphenIndex !== -1) {
        pageUrl = pageUrl.substring(0, hyphenIndex)
        separator = pageUrl.endsWith('?') ? '' : '-'
      }
      pageUrl += `${separator}${destination}`
    } else {
      pageUrl = base
    }
    return pageUrl
  }
}

export default NoodlUtilsParser
