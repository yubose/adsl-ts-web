import chai, { expect } from 'chai'
import * as u from '@jsmanifest/utils'
import sinon from 'sinon'
import y from 'yaml'
import Root from '../DocRoot'
import merge from '../transformers/merge'
import NoodlYamlChai from './noodl-yaml-chai'

chai.use(NoodlYamlChai)

let root: Root

beforeEach(() => {
  root = new Root()
  root.set(
    'Topo',
    new y.Document({
      formData: {
        password: '123',
        email: 'pfft@gmail.com',
        currentIcon: '..icon',
      },
      icon: 'arrow.svg',
    }),
  )
  root.set(
    'SignIn',
    new y.Document({
      formData: { profile: { username: 'hello123', email: 'pfft@gmail.com' } },
      components: [
        { type: 'button', text: '..greeting' },
        {
          type: 'view',
          children: [
            { type: 'label', text: '.SignIn.email' },
            { type: 'textField', dataKey: 'SignIn.email' },
          ],
        },
      ],
    }),
  )
})

describe.only(`merge`, () => {
  it(`should merge map node props`, () => {
    process.stdout.write('\x1Bc')
    const doc = new y.Document({
      fruits: new y.Scalar('apple'),
      path: 'abc.png',
    })
    const node = doc.contents as y.YAMLMap
    const result = merge(node, '.SignIn.formData.profile', { root })
    console.log(node)
  })
})
