import _ from 'lodash'
import sinon from 'sinon'
import MockAxios from 'axios-mock-adapter'
import NOODLUIDOM from 'noodl-ui-dom'
import { expect } from 'chai'
import { screen } from '@testing-library/dom'
import { NOODLComponent, NOODLPluginComponent } from 'noodl-ui'
import axios from '../app/axios'
import noodluidom from '../app/noodl-ui-dom'
import {
  assetsUrl,
  noodl,
  queryByDataKey,
  queryByDataListId,
  queryByDataName,
  queryByDataUx,
  queryByDataValue,
} from '../utils/test-utils'
import './dom'

const mockAxios = new MockAxios(axios)

let container: HTMLDivElement
let parser: NOODLUIDOM

beforeEach(() => {
  container = document.createElement('div')
  parser = new NOODLUIDOM()
})

afterEach(() => {
  // console.info(prettyDOM(container))
})

describe('dom', () => {
  describe('component type: "plugin"', () => {
    xit('should have ran the js script retrieved from the XHR request', () => {
      const spy = sinon.spy()
      const testNode = document.createElement('div')
      testNode.id = 'testing'
      testNode.onclick = spy
      testNode.addEventListener('click', spy)
      document.body.appendChild(testNode)
      const pathname = '/somejsfile.js'
      const url = `${assetsUrl}${pathname}`
      const content = `var s = 54;
      const abc = document.getElementById('testing');
      abc.click();
      console.info(abc)`
      mockAxios.onGet(url).reply(200, content)
      const component = {
        type: 'plugin',
        path: '/somejsfile.js',
      } as NOODLPluginComponent
      const resolvedComponent = noodl.resolveComponents(component)[0]
      noodluidom.parse(resolvedComponent)
      testNode.removeEventListener('click', spy)
      expect(spy.called).to.be.true
    })
  })

  it('should attach the id', () => {
    const resolvedComponent = noodl.resolveComponents({
      type: 'button',
      style: {},
    })[0]
    noodluidom.parse({ ...resolvedComponent, id: 'abc123' })
    expect(document.getElementById('abc123')).to.exist
  })

  it('should attach the src attribute', () => {
    const resolvedComponent = noodl.resolveComponents({
      type: 'image',
      path: 'img123.jpg',
      style: {},
    })[0]
    noodluidom.parse(resolvedComponent)
    expect(document.querySelector(`img[src="${assetsUrl}img123.jpg"]`)).to.exist
  })

  it('should attach the video format', () => {
    const resolvedComponent = noodl.resolveComponents({
      type: 'video',
      videoFormat: 'video/mp4',
      style: {},
    })[0]
    noodluidom.parse(resolvedComponent)
    expect(document.querySelector(`video[type="video/mp4"]`)).to.exist
  })

  it('should attach the "poster" value', () => {
    const poster = 'https://www.abc.com/myposter.jpg'
    const resolvedComponent = noodl.resolveComponents({
      type: 'video',
      videoFormat: 'video/mp4',
      poster,
      style: {},
    })[0]
    noodluidom.parse(resolvedComponent)
    expect(document.querySelector(`video[poster="${poster}"]`)).to.exist
  })

  it('should attach placeholders', () => {
    const placeholder = 'my placeholder'
    const resolvedComponent = noodl.resolveComponents({
      type: 'textField',
      style: {},
      placeholder,
    })[0]
    noodluidom.parse(resolvedComponent)
    expect(screen.getByPlaceholderText(placeholder)).to.exist
  })

  _.forEach(
    [
      ['data-listid', queryByDataListId],
      ['data-name', queryByDataName],
      ['data-key', queryByDataKey],
      ['data-ux', queryByDataUx],
      ['data-value', queryByDataValue],
    ],
    ([key, queryFn]) => {
      it(`should attach ${key}`, () => {
        noodluidom.parse({
          type: 'li',
          noodlType: 'listItem',
          id: 'id123',
          [key as string]: 'abc123',
        })
        expect((queryFn as Function)(document.body, 'abc123')).to.exist
      })
    },
  )

  it('should show a default value for select elements', () => {
    const component = {
      type: 'select',
      'data-name': 'country',
      options: ['abc', '+52', '+86', '+965'],
    } as NOODLComponent
    const resolvedComponent = noodl.resolveComponents(component)[0]
    noodluidom.parse(resolvedComponent)
    const select = queryByDataName(document.body, 'country')
    expect(select.value).to.equal('abc')
  })

  it("should use the data-value as a data value element's value", () => {
    const dataKey = 'formData.greeting'
    const component = {
      type: 'textField',
      placeholder: 'hello, all',
      id: 'id123',
      'data-key': 'formData.greeting',
      'data-value': 'my value',
    } as NOODLComponent
    const resolvedComponent = noodl.resolveComponents(component)[0]
    noodluidom.parse(resolvedComponent)
    const input = queryByDataKey(document.body, dataKey)
    expect(input.value).to.equal('my value')
  })

  it('should use data-value as text content if present for other elements (non data value elements)', () => {
    const dataKey = 'formData.greeting'
    const component = {
      type: 'label',
      placeholder: 'hello, all',
      id: 'id123',
      'data-key': 'formData.greeting',
      'data-value': 'my value',
    } as NOODLComponent
    const resolvedComponent = noodl.resolveComponents(component)[0]
    noodluidom.parse(resolvedComponent)
    const label = queryByDataKey(document.body, dataKey)
    expect(label.value).to.be.undefined
    expect(label?.innerHTML).to.equal('my value')
  })

  it('should use placeholder as text content if present (and also there is no data-value available) for other elements (non data value elements)', () => {
    const dataKey = 'formData.greeting'
    const component = {
      type: 'label',
      id: 'id123',
      'data-key': 'formData.greeting',
      placeholder: 'my placeholder',
    } as NOODLComponent
    const resolvedComponent = noodl.resolveComponents(component)[0]
    noodluidom.parse(resolvedComponent)
    const label = queryByDataKey(document.body, dataKey)
    expect(label.value).to.be.undefined
    expect(label?.innerHTML).to.equal('my placeholder')
  })

  it('should create the select option children when rendering', () => {
    const component = {
      type: 'select',
      options: ['abc', '123', 5, 1995],
      id: 'myid123',
    } as NOODLComponent
    const resolvedComponent = noodl.resolveComponents(component)[0]
    noodluidom.parse(resolvedComponent)
    _.forEach(resolvedComponent.options, (option, index) => {
      expect(
        document.querySelector(`option[value="${component.options[index]}"]`),
      ).to.exist
    })
  })

  it('should create a "source" element and attach the src attribute for video components', () => {
    const component = {
      type: 'video',
      path: 'pathology.mp4',
      videoFormat: 'mp4',
      id: 'id123',
    } as NOODLComponent
    const resolvedComponent = noodl.resolveComponents(component)[0]
    noodluidom.parse(resolvedComponent)
    const sourceElem = document.body?.querySelector('source')
    expect(sourceElem?.getAttribute('src')).to.equal(assetsUrl + component.path)
  })

  it('should show the password invisible icon to toggle off next', () => {
    const pwVisible = 'makePasswordVisiable.png'
    const pwInvisible = 'makePasswordInvisible.png'
    const component = {
      type: 'textField',
      contentType: 'password',
      style: {},
      placeholder: 'Type your password',
      'data-key': 'formData.password',
    } as NOODLComponent
    const resolvedComponent = noodl.resolveComponents(component)[0]
    noodluidom.parse(resolvedComponent)
    screen.debug()
    expect(document.querySelector(`input[type="text"]`)).to.exist
    expect(document.querySelector(`img[src="${assetsUrl}${pwInvisible}"]`))
  })

  xit('should show the password hidden icon', () => {
    //
  })

  describe('data-value elements (input/select/textarea/etc)', () => {})
})
