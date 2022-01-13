import * as mock from 'noodl-ui-test-utils'
import * as nt from 'noodl-types'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import { nuiEmitTransaction, NUI, Viewport, Store } from 'noodl-ui'
import { Page as NOODLDOMPage } from 'noodl-ui-dom'
import parseUrl from '../../utils/parseUrl'

const getMockAppConfig = () =>
  ({
    baseUrl: '${cadlBaseUrl}',
    assetsUrl: '${cadlBaseUrl}assets/',
    languageSuffix: {
      zh_CN: '_cn',
      es_ES: '_es',
      unknown: '_en',
    },
    fileSuffix: '.yml',
    startPage: 'SignIn',
    preload: ['BasePage', 'BaseCSS', 'BaseDataModel'],
    page: [
      'AppointmentLobby',
      'MeetingRoomInvited',
      'PatientDashboard',
      'PaymentConfirmation',
      'Welcome',
    ],
  } as nt.AppConfig)

describe(`parseUrl`, () => {
  const url1 =
    'https://patd2.aitmed.io/index.html?PatientDashboard-AppointmentLobby=&checkoutId=CBASEIGrkuMqWQ0rWU0uNr5lhWg&transactionId=fv5IWel6vEOdjHRQ0Zp29EJ4CsLZY'

  describe(url1, () => {
    it(`should parse the url expectedly`, () => {
      const appConfig = getMockAppConfig()
      const parsed = parseUrl(appConfig, url1)
      expect(parsed).to.have.property(
        'base',
        'https://patd2.aitmed.io/index.html',
      )
      expect(parsed).to.have.property('hasParams').to.be.true
      expect(parsed).to.have.property('hostname').to.eq('patd2.aitmed.io')
      expect(parsed)
        .to.have.property('pages')
        .to.include.members(['SignIn', 'PatientDashboard', 'AppointmentLobby'])
      expect(parsed)
        .to.have.property('pageUrl')
        .to.eq(
          'https://patd2.aitmed.io/index.html?PatientDashboard-AppointmentLobby',
        )
      expect(parsed)
        .to.have.property('params')
        .to.be.an('object')
        .to.have.property('checkoutId', 'CBASEIGrkuMqWQ0rWU0uNr5lhWg')
      expect(parsed.params).to.have.property(
        'transactionId',
        'fv5IWel6vEOdjHRQ0Zp29EJ4CsLZY',
      )
      expect(parsed).to.have.property('startPage').to.eq('AppointmentLobby')
    })
  })

  const url2 =
    'https://patd3.aitmed.io/index.html?PaymentConfirmation&checkoutId=CBASEA-CoyDU93GMkzTJ6t-mb9A&transactionId=hSq8q3A6k4kNmZGG1IDJmDbsQwAZY'

  describe(url2, () => {
    it(`should parse the url expectedly`, () => {
      const appConfig = getMockAppConfig()
      const parsed = parseUrl(appConfig, url2)
      expect(parsed).to.have.property(
        'base',
        'https://patd3.aitmed.io/index.html',
      )
      expect(parsed).to.have.property('hasParams').to.be.true
      expect(parsed).to.have.property('hostname').to.eq('patd3.aitmed.io')
      expect(parsed)
        .to.have.property('pages')
        .to.include.members(['SignIn', 'PaymentConfirmation'])
      expect(parsed)
        .to.have.property('pageUrl')
        .to.eq('https://patd3.aitmed.io/index.html?PaymentConfirmation')
      expect(parsed)
        .to.have.property('params')
        .to.be.an('object')
        .to.have.property('checkoutId', 'CBASEA-CoyDU93GMkzTJ6t-mb9A')
      expect(parsed.params).to.have.property(
        'transactionId',
        'hSq8q3A6k4kNmZGG1IDJmDbsQwAZY',
      )
      expect(parsed).to.have.property('startPage').to.eq('PaymentConfirmation')
    })
  })

  const url3 = 'http://127.0.0.1:3000/index.html?MeetingRoomInvited'

  describe(url3, () => {
    it(`should parse the url expectedly`, () => {
      const appConfig = getMockAppConfig()
      const parsed = parseUrl(appConfig, url3)
      expect(parsed).to.have.property(
        'base',
        'http://127.0.0.1:3000/index.html',
      )
      expect(parsed).to.have.property('hasParams').to.be.false
      // expect(parsed).to.have.property('hostname').to.eq('127.0.0.1')
      // expect(parsed)
      //   .to.have.property('pages')
      //   .to.include.members(['SignIn', 'MeetingRoomInvited'])
      // expect(parsed)
      //   .to.have.property('pageUrl')
      //   .to.eq('http://127.0.0.1:3000/index.html?MeetingRoomInvited')
      // expect(parsed).to.have.property('startPage').to.eq('MeetingRoomInvited')
    })
  })

  const url4 = `https://patd3.aitmed.io/index.html?PaymentConfirmation=&checkoutId=CBASEGgNoO4yMDXtGxoZf3Q0hG0&transactionId=rt1gucryhQv4MEZ4tHoZnKdpVIRZY`

  it(
    u.italic(
      `should parse through the random "=" sign right behind PaymentConfirmation in the url`,
    ),
    () => {
      let pageUrl = 'index.html?'
      let startPage = 'SignIn'
      let page = ['SignIn', 'PaymentConfirmation']
      const parsedUrl = parseUrl(
        {
          languageSuffix: {},
          fileSuffix: '.yml',
          assetsUrl: `$\\{cadlBaseUrl}`,
          baseUrl: `https://public.aitmed.com/cadl/admindd7.14/`,
          page,
          preload: [],
          startPage: 'SignIn',
        },
        url4,
      )

      if (parsedUrl.hasParams) {
        pageUrl = parsedUrl.pageUrl
        if (u.isArr(['SignIn', 'PaymentConfirmation'])) {
          if (!page.includes(parsedUrl.startPage)) {
            // Fall back to the original start page if it is an invalid page
            startPage = startPage || startPage || ''
            pageUrl = 'index.html?'
          }
        }
        pageUrl = pageUrl + parsedUrl?.paramsStr
      }

      expect(parsedUrl).to.have.property('startPage', 'PaymentConfirmation')
      expect(parsedUrl)
        .to.have.property('pages')
        .to.include.members(['SignIn', 'PaymentConfirmation'])
      expect(parsedUrl.params).to.have.property(
        'checkoutId',
        'CBASEGgNoO4yMDXtGxoZf3Q0hG0',
      )
      expect(parsedUrl.params).to.have.property(
        'transactionId',
        'rt1gucryhQv4MEZ4tHoZnKdpVIRZY',
      )
      expect(parsedUrl.pageUrl).to.eq(
        'https://patd3.aitmed.io/index.html?PaymentConfirmation',
      )
    },
  )
})
