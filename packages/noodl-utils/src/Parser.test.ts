import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import * as mock from 'noodl-ui-test-utils'
import Parser from './Parser'

describe(coolGold(`Parser`), () => {
  let parse: Parser

  beforeEach(() => {
    parse = new Parser()
  })

  describe(italic('destination'), () => {
    u.eachEntries(
      {
        '^RedTag': {
          msg: `should result to { isSamePage: true, id: 'RedTag' }`,
          props: { isSamePage: true, id: 'RedTag', destination: '' },
        },
        GotoSignIn: {
          msg: `should result to { isSamePage: false, id: '' }`,
          props: { isSamePage: false, id: '', destination: 'GotoSignIn' },
        },
        'Soda^RedTag': {
          msg: `should result to { isSamePage: false, id: 'RedTag' }`,
          props: { isSamePage: false, id: 'RedTag', destination: 'Soda' },
        },
      } as const,
      (destination, { msg, props }) => {
        it(msg, () => {
          const obj = parse.destination(destination)
          u.eachEntries(props, (key, value) => expect(obj[key]).to.eq(value))
        })
      },
    )
  })

  describe(italic(`queryString`), () => {
    u.eachEntries(
      {
        RedTag: {
          msg: `should result to %s from %dest`,
          result: `index.html?RedTag`,
        },
      } as const,
      (destination, { msg, result }) => {
        it(msg.replace('%dest', destination).replace('%s', result), () => {
          const pageUrl = parse.queryString({
            destination,
            pageUrl: 'index.html?',
            startPage: 'SignIn',
          })
          expect(pageUrl).to.eq(result)
        })
      },
    )
  })
})
