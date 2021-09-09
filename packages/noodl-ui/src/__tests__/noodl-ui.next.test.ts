import * as mock from 'noodl-ui-test-utils'
import sinonChai from 'sinon-chai'
import get from 'lodash/get'
import chai, { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import { coolGold, italic, magenta } from 'noodl-common'
import { ComponentObject } from 'noodl-types'
import sinon from 'sinon'
import NOODLUI from '../noodl-ui'

chai.use(sinonChai)

function createPage({
  baseUrl = 'https://aitmed.com/',
  assetsUrl = baseUrl + 'assets/',
  component,
  name = 'SignIn',
  pageObject = {},
  root = {},
}: {
  baseUrl?: string
  assetsUrl?: string
  component?: ComponentObject
  name?: string
  pageObject?: Record<string, any>
  root?: Record<string, any>
} = {}) {
  component =
    component ||
    ({
      type: 'textView',
      viewTag: 'MyHelloTag',
      contentType: 'habla',
      children: [
        { type: 'label', dataKey: 'formData.password' },
        {
          type: 'button',
          text: 'submit',
          onClick: [
            { actionType: 'evalObject', object: sinon.spy() },
            { emit: { dataKey: { var2: 'formData.email' } } },
          ],
          style: { isHidden: true },
        },
        {
          type: 'view',
          children: [
            {
              type: 'textField',
              placeholder: {
                emit: {
                  dataKey: { var1: 'formData.gender' },
                  actions: [],
                },
              },
            },
          ],
        },
      ],
    } as ComponentObject)
  pageObject = {
    ...pageObject,
    formData: {
      email: 'pfft@gmail.com',
      password: 'cereal',
      gender: 'Male',
      ...pageObject?.formData,
    },
  }

  root = { [name]: pageObject, ...root }
  NOODLUI.use({
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => baseUrl,
    getPages: () => [name],
    getPreloadPages: () => [],
    getRoot: () => root,
  })
  const page = NOODLUI.createPage(name)
  page.viewport.width = 375
  page.viewport.height = 667
  return {
    assetsUrl,
    cache: NOODLUI.cache,
    component: NOODLUI.resolveComponents({ page, components: component }),
    page,
    pageObject,
    root,
  }
}

afterEach(() => {
  NOODLUI.cache.page.clear()
  Object.values({ ...NOODLUI.getActions(), ...NOODLUI.getBuiltIns() }).forEach(
    (v) => (v.length = 0),
  )
})

describe(coolGold('noodl-ui (next)'), () => {
  describe(italic(`dataKey`), () => {
    it.only(`should handle dataKeys`, async () => {
      NOODLUI.use({
        actionType: 'emit',
        trigger: 'placeholder',
        fn: async () => get(pageObject, 'formData.gender'),
      })
      const { component, pageObject } = createPage({
        root: { Style: { zIndex: 15000 } },
      })
      const label = component.child()
      expect(label.get('data-value')).to.eq(pageObject.formData.password)
      const textField = component.child(2).child()
      await waitFor(() => {
        expect(textField.get('data-placeholder')).to.eq(
          get(pageObject, textField.blueprint.placeholder.emit.dataKey.var1),
        )
      })
    })
  })

  describe(italic('dataValue'), () => {
    it(`should attach the result to ${magenta(`data-value`)}`, async () => {
      const spy = sinon.spy(async () => get(pageObject, 'formData.email'))
      NOODLUI.use({ actionType: 'emit', trigger: 'dataValue', fn: spy })
      const { component, pageObject } = createPage({
        name: 'Cereal',
        pageObject: { formData: { email: 'abc@gmail.com' } },
        component: {
          type: 'textField',
          dataValue: { emit: { dataKey: { var1: 'Cereal' }, actions: [] } },
        },
      })
      await waitFor(() => {
        expect(component.get('data-value')).to.eq(pageObject.formData.email)
      })
    })
  })

  describe(italic(`path / resource`), () => {
    it(`should attach the result to ${magenta('data-src')}`, () => {
      const { assetsUrl, component } = createPage({
        component: {
          type: 'scrollView',
          children: [
            { type: 'button', text: 'cancel' },
            {
              type: 'view',
              children: [
                { type: 'image', path: '..info.images.currentGender' },
                { type: 'video', resource: '..info.images.currentGender' },
                { type: 'video', path: '..info.images.currentGender' },
              ],
            },
          ],
        },
        pageObject: { info: { images: { currentGender: 'abc.png' } } },
        root: { Style: { zIndex: 15000 } },
      })
      const image = component.child(1).child()
      const video = component.child(1).child(1)
      const video2 = component.child(1).child(2)
      expect(image.get('data-src')).to.eq(assetsUrl + 'abc.png')
      expect(video.get('data-src')).to.eq(assetsUrl + 'abc.png')
      expect(video2.get('data-src')).to.eq(assetsUrl + 'abc.png')
    })

    it(`should handle if it is an emit object`, async () => {
      NOODLUI.use({
        actionType: 'emit',
        fn: async () => 'cheetos.jpeg',
        trigger: 'path',
      })
      const { assetsUrl, component } = createPage({
        component: {
          type: 'scrollView',
          children: [
            {
              type: 'view',
              children: [
                mock.getImageComponent({ path: mock.getEmitObject() }),
              ],
            },
          ],
        },
        pageObject: { info: { images: { currentGender: 'abc.png' } } },
        root: { Style: { zIndex: 15000 } },
      })
      await waitFor(() => {
        expect(component.child().child().get('data-src')).to.eq(
          `${assetsUrl}cheetos.jpeg`,
        )
      })
    })
  })

  describe(italic(`placeholder`), () => {
    it(`should attach the value onto ${magenta(
      'data-placeholder',
    )}`, async () => {
      NOODLUI.use({
        actionType: 'emit',
        trigger: 'placeholder',
        fn: async () => get(pageObject, 'formData.gender'),
      })
      const { component, pageObject } = createPage({
        component: {
          type: 'view',
          children: [
            { type: 'label', dataKey: 'formData.email' },
            {
              type: 'label',
              placeholder: {
                emit: { dataKey: 'formData.gender', actions: [] },
              },
            },
          ],
        },
        name: 'Cereal',
        pageObject: { formData: { gender: 'Male' } },
        root: { Style: { zIndex: 15000 } },
      })
      const label = component.child(1)
      await waitFor(() => {
        expect(label.get('data-placeholder')).to.eq(pageObject.formData.gender)
      })
    })
  })

  describe(italic('style'), () => {
    it(`should merge in base styles`, () => {
      const { component } = createPage({
        component: { type: 'view' },
        root: { Style: { zIndex: 15000 } },
      })
      const result = component.toJSON()
      expect(result.style).to.have.property('position', 'absolute')
      expect(result.style).to.have.property('outline', 'none')
      expect(result.style).to.have.property('zIndex', 15000)
    })
  })
})
