/**
 * All functions in this file will be registered as getter accessors in the window object during runtime
 */
import * as u from '@jsmanifest/utils'
import * as lib from 'noodl-ui'
import { Account, cache as sdkCache } from '@aitmed/cadl'
import get from 'lodash/get'
import partial from 'lodash/partial'
import partialRight from 'lodash/partialRight'
import pick from 'lodash/pick'
import unary from 'lodash/unary'
import { trimReference } from 'noodl-utils'
import getDeepTotalHeight from './getDeepTotalHeight'
import getElementTreeDimensions from './getElementTreeDimensions'
import ExportPdf from '../modules/ExportPdf'
import { copyToClipboard, exportToPDF, fromClipboard, toast } from './dom'
import * as lf from './lf'
import type App from '../App'
import is from './is'

export function getWindowDebugUtils(app: App) {
  const navigate = (destination: string) => () => app.navigate(destination)

  function filterComponentCache<Arg>(
    fn: (arg: Arg, obj: lib.ComponentCacheObject) => boolean,
  ) {
    return (arg: Arg): any => app.cache.component.filter(partial(fn, arg))
  }

  const o = {
    Account,
    cp: copyToClipboard,
    ExportPdf,
    exportToPDF,
    getDeepTotalHeight,
    getElementTreeDimensions,
    sdkCache,
    toast,
    ...pick(lib, [
      'findByDataAttrib',
      'findByDataKey',
      'findByElementId',
      'findByGlobalId',
      'findByPlaceholder',
      'findBySelector',
      'findBySrc',
      'findByViewTag',
      'findByUX',
      'findWindow',
      'findWindowDocument',
      'findFirstByClassName',
      'findFirstByDataKey',
      'findFirstByElementId',
      'findFirstBySelector',
      'findFirstByViewTag',
    ]),
    // Inlined function implementations
    componentCache: {
      findComponentsWithKeys: (...keys: string[]) => {
        const regexp = new RegExp(`(${keys.join('|')})`)
        return app.cache.component.filter((obj) =>
          Array.from(
            new Set(
              u
                .keys(obj?.component?.blueprint || {})
                .concat(u.keys(obj?.component?.props || {})),
            ),
          ).some((key) => regexp.test(key)),
        )
      },
      findByComponentType: filterComponentCache<string>(
        (type, obj) => obj.component?.type === type,
      ),
      findById: filterComponentCache<string>(
        (id, obj) => obj.component?.id === id,
      ),
      findByPopUpView: filterComponentCache<string>(
        (popUpView, obj) => obj.component?.blueprint?.popUpView === popUpView,
      ),
      findByViewTag: filterComponentCache<string>(
        (viewTag, obj) => obj.component?.blueprint?.viewTag === viewTag,
      ),
    },
    currentUser: () => app.root.Global?.currentUser,
    findArrOfMinSize: function findArrOfMinSize(
      root = {} as Record<string, any>,
      size: number,
      path = [] as (string | number)[],
    ) {
      const results = [] as { arr: any[]; path: (string | number)[] }[]

      if (Array.isArray(root)) {
        const count = root.length

        if (count >= size) results.push({ arr: root, path })

        for (let index = 0; index < count; index++) {
          const item = root[index]
          results.push(...findArrOfMinSize(item, size, path.concat(index)))
        }
      } else if (
        root &&
        typeof root === 'object' &&
        typeof root !== 'function'
      ) {
        for (const [key, value] of Object.entries(root)) {
          results.push(...findArrOfMinSize(value, size, path.concat(key)))
          // if (Array.isArray(value)) {
          // } else {}
        }
      }

      return results
    },
    /**
     * Retrieve value of a reference or a regular data path (using root object)
     * If no argument is passed in this will turn into an asynchronous function
     * that will use the data from clipboard as the data
     */
    get: (path: string) => {
      const getValue = (str: string) => {
        let path = trimReference(str)
        return get(
          (is.reference(str) && is.localReference(str)) ||
            (!is.reference(str) && is.localKey(path))
            ? app.root[app.currentPage]
            : app.root,
          path,
        )
      }
      if (!path) {
        return fromClipboard()
          .then((path) => {
            if (!path) {
              console.error(
                new Error(
                  `Nothing was passed in and nothing was in the clipboard`,
                ),
              )
            } else {
              const value = getValue(path)
              console.log(value)
              window['v'] = value
              return value
            }
          })
          .catch(console.error)
      } else {
        const value = getValue(path)
        window['v'] = value
        console.log(value)
        return value
      }
    },
    getDataValues: () =>
      u.reduce(
        u.array(lib.findByDataKey()),
        (acc, el) => {
          if (el) {
            if (el.dataset.value === '[object Object]') {
              const component = app.cache.component.get(el.id)?.component
              const value = component.get('data-value')
              if (u.isPromise(value)) {
                value.then((result) => (acc[el.dataset.key as string] = result))
              } else acc[el.dataset.key as string] = value
            } else {
              acc[el.dataset.key as string] =
                'value' in el ? (el as any).value : el.dataset.value
            }
          }
          return acc
        },
        {} as Record<string, any>,
      ),
    mainView: partialRight(unary(lib.findFirstByViewTag), 'mainView'),
    pdfViewTag: partialRight(unary(lib.findFirstByViewTag), 'pdfViewTag'),
    tableView: partialRight(unary(lib.findFirstByViewTag), 'tableView'),
    scrollView: partialRight(unary(lib.findFirstByClassName), 'scroll-view'),
    lf,
    goto: {
      AbsentNoteReview: navigate('AbsentNoteReview'),
      BlankNoteReview: navigate('BlankNoteReview'),
      DWCFormRFAReview: navigate('DWCFormRFAReview'),
      EvaluationNoteReview: navigate('EvaluationNoteReview'),
      InitEvalReportReview: navigate('InitEvalReportReview'),
      PatientConsentFormHIPPAReview: navigate('PatientConsentFormHIPPAReview'),
      ProgressReportReview: navigate('ProgressReportReview'),
      PROneReview: navigate('PROneReview'),
      PRTwoReview: navigate('PRTwoReview'),
      PrescriptionShared: navigate('PrescriptionShared'),
      SurgeryAuthorizationReview: navigate('SurgeryAuthorizationReview'),
      Cov19ResultsAndFluResultsReview: navigate(
        'Cov19ResultsAndFluResultsReview',
      ),
      WorkStatusFormReview: navigate('WorkStatusFormReview'),
    },
    goToPaymentUrl4: () =>
      (window.location.href =
        'http://127.0.0.1:3000/index.html?PaymentConfirmation=&checkoutId=CBASEGgNoO4yMDXtGxoZf3Q0hG0&transactionId=rt1gucryhQv4MEZ4tHoZnKdpVIRZY'),
    pageTable: () => {
      const pagesList = [] as string[]
      const result = [] as { page: string; ndom: number; nui: number }[]
      const getKey = (page: lib.NDOMPage | lib.Page) =>
        page.page === '' ? 'unknown' : page.page

      const nuiCachePageEntries = [...app.cache.page.get().values()]
      const ndomPagesEntries = u.entries(app.ndom.pages)

      const add = (
        index: number,
        page: lib.NDOMPage | lib.Page,
        ndomOrNui: 'ndom' | 'nui',
      ) => {
        const pageKey = getKey(page)
        if (!pagesList.includes(pageKey)) pagesList.push(pageKey)
        if (!result[index]) result[index] = { ndom: 0, nui: 0, page: pageKey }
        result[index][ndomOrNui]++
        result[index].page = pageKey
      }

      for (const [ndomOrNui, entries] of [
        ['nui', nuiCachePageEntries],
        ['ndom', ndomPagesEntries],
      ] as const) {
        const numEntries = entries.length
        const lastKey = ndomOrNui === 'nui' ? 'page' : 1
        for (let index = 0; index < numEntries; index++) {
          add(index, entries[lastKey], ndomOrNui)
        }
      }

      return result
    },
    uid: () => app.root.Global?.currentUser?.vertex?.uid,
  }

  return o
}

export function findComponentsWithKeys(this: App, ...keys: string[]) {
  const regexp = new RegExp(`(${keys.join('|')})`)
  return this.cache.component.filter((obj) =>
    Array.from(
      new Set(
        ...u
          .keys(obj?.component?.blueprint || {})
          .concat(u.keys(obj?.component?.props || {})),
      ),
    ).some((key) => regexp.test(key)),
  )
}
