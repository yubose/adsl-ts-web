import _ from 'lodash'
import sinon from 'sinon'
import MockAxios from 'axios-mock-adapter'
import { expect } from 'chai'
import { prettyDOM, screen, waitFor } from '@testing-library/dom'
import { NOODLComponent, NOODLPluginComponent } from 'noodl-ui'
import axios from '../app/axios'
import {
  assetsUrl,
  noodlui,
  queryByDataKey,
  queryByDataListId,
  queryByDataName,
  queryByDataUx,
  queryByDataValue,
  page,
  toDOM,
} from '../utils/test-utils'

const mockAxios = new MockAxios(axios)

describe('dom', () => {
  describe('component type: list', () => {
    xit('', () => {
      //
    })
  })

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
      page.render(component)
      testNode.removeEventListener('click', spy)
      expect(spy.called).to.be.true
    })
  })

  xdescribe('component type: "video"', () => {
    it('should attach poster if present', () => {
      const component = {
        type: 'video',
        poster: 'my-poster.jpeg',
      } as NOODLComponent
      const { components } = page.render(component)

      expect(components[0].node.getAttribute('poster')).to.equal(
        `${assetsUrl}${component.poster}`,
      )
    })

    it('should have object-fit set to "contain"', () => {
      const component = {
        type: 'video',
      } as NOODLComponent
      page.render(component)
      const node = document.querySelector('video')
      expect(node?.style.objectFit).to.equal('contain')
    })

    it('should create the source element as a child if the src is present', () => {
      const component = {
        type: 'video',
        path: 'asdloldlas.mp4',
      } as NOODLComponent
      page.render(component)
      const node = document.querySelector('video')
      const sourceEl = node?.querySelector('source')
      expect(sourceEl).to.exist
    })

    it('should have src set on the child source element instead of the video element itself', () => {
      const component = {
        type: 'video',
        path: 'asdloldlas.mp4',
      } as NOODLComponent
      page.render(component)
      const node = document.querySelector('video')
      const sourceEl = node?.querySelector('source')
      expect(node?.getAttribute('src')).not.to.equal(assetsUrl + component.path)
      expect(sourceEl?.getAttribute('src')).to.equal(assetsUrl + component.path)
    })

    it('should have the video type on the child source element instead of the video element itself', () => {
      const component = {
        type: 'video',
        path: 'abc123.png',
        videoFormat: 'mp4',
      } as NOODLComponent
      page.render(component)
      const node = document.querySelector('vide')
      const sourceEl = node?.querySelector('source')
      expect(node?.getAttribute('type')).not.to.equal(component.videoFormat)
      expect(sourceEl?.getAttribute('type')).to.equal(
        `video/${component.videoFormat}`,
      )
    })

    it('should include the "browser not supported" message', () => {
      const component = {
        type: 'video',
        path: 'abc.jpeg',
        videoFormat: 'mp4',
      } as NOODLComponent
      toDOM(page.render(component) as any)
      expect(screen.getByText(/sorry/i)).to.exist
    })
  })

  xit('should attach the id', () => {
    const resolvedComponent = page.render({
      type: 'button',
      style: {},
    })[0]
    noodlui.parse({ ...resolvedComponent, id: 'abc123' })
    expect(document.getElementById('abc123')).to.exist
  })

  xit('should attach the src attribute', () => {
    const resolvedComponent = page.render({
      type: 'image',
      path: 'img123.jpg',
      style: {},
    })[0]
    noodlui.parse(resolvedComponent)
    expect(document.querySelector(`img[src="${assetsUrl}img123.jpg"]`)).to.exist
  })

  xit('should attach the "poster" value', () => {
    const poster = 'https://www.abc.com/myposter.jpg'
    const resolvedComponent = page.render({
      type: 'video',
      videoFormat: 'video/mp4',
      poster,
      style: {},
    })[0]
    noodlui.parse(resolvedComponent)
    expect(document.querySelector(`video[poster="${poster}"]`)).to.exist
  })

  xit('should attach placeholders', () => {
    const placeholder = 'my placeholder'
    const resolvedComponent = page.render({
      type: 'textField',
      style: {},
      placeholder,
    })
    noodlui.parse(resolvedComponent)
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
      xit(`should attach ${key}`, () => {
        noodlui.parse({
          type: 'li',
          noodlType: 'listItem',
          id: 'id123',
          [key as string]: 'abc123',
        })
        expect((queryFn as Function)(document.body, 'abc123')).to.exist
      })
    },
  )

  xit('should show a default value for select elements', () => {
    const component = {
      type: 'select',
      'data-name': 'country',
      options: ['abc', '+52', '+86', '+965'],
    } as NOODLComponent
    const resolvedComponent = page.render(component)
    noodlui.parse(resolvedComponent)
    const select = queryByDataName(document.body, 'country')
    // @ts-expect-error
    expect(select?.value).to.equal('abc')
  })

  xit("should use the data-value as a data value element's value", () => {
    const dataKey = 'formData.greeting'
    const component = {
      type: 'textField',
      placeholder: 'hello, all',
      id: 'id123',
      'data-key': 'formData.greeting',
      'data-value': 'my value',
    } as NOODLComponent
    const resolvedComponent = page.render(component)
    noodlui.parse(resolvedComponent)
    const input = queryByDataKey(document.body, dataKey)
    // @ts-expect-error
    expect(input.value).to.equal('my value')
  })

  xit('should use data-value as text content if present for other elements (non data value elements)', () => {
    const dataKey = 'formData.greeting'
    const component = {
      type: 'label',
      placeholder: 'hello, all',
      id: 'id123',
      'data-key': 'formData.greeting',
      'data-value': 'my value',
    } as NOODLComponent
    const resolvedComponent = page.render(component)
    noodlui.parse(resolvedComponent)
    const label = queryByDataKey(document.body, dataKey)
    // @ts-expect-error
    expect(label.value).to.be.undefined
    expect(label?.innerHTML).to.equal('my value')
  })

  xit('should use placeholder as text content if present (and also there is no data-value available) for other elements (non data value elements)', () => {
    const dataKey = 'formData.greeting'
    const component = {
      type: 'label',
      id: 'id123',
      'data-key': 'formData.greeting',
      placeholder: 'my placeholder',
    } as NOODLComponent
    const resolvedComponent = page.render(component)
    noodlui.parse(resolvedComponent)
    const label = queryByDataKey(document.body, dataKey)
    // @ts-expect-error
    expect(label.value).to.be.undefined
    expect(label?.innerHTML).to.equal('my placeholder')
  })

  xit('should create the select option children when rendering', () => {
    const component = {
      type: 'select',
      options: ['abc', '123', 5, 1995],
      id: 'myid123',
    } as NOODLComponent
    const resolvedComponent = page.render(component)
    noodlui.parse(resolvedComponent)
    _.forEach(resolvedComponent.options, (option, index) => {
      expect(
        document.querySelector(`option[value="${component.options[index]}"]`),
      ).to.exist
    })
  })

  xit('should create a "source" element and attach the src attribute for video components', () => {
    const component = {
      type: 'video',
      path: 'pathology.mp4',
      videoFormat: 'mp4',
      id: 'id123',
    } as NOODLComponent
    const resolvedComponent = page.render(component)
    noodlui.parse(resolvedComponent)
    const sourceElem = document.body?.querySelector('source')
    expect(sourceElem?.getAttribute('src')).to.equal(assetsUrl + component.path)
  })

  describe('type: "textField" with contentType: "password"', () => {
    let eyeOpened = 'makePasswordVisiable.png'
    let eyeClosed = 'makePasswordInvisible.png'
    let regexTitlePwVisible = /click here to hide your password/i
    let regexTitlePwInvisible = /click here to reveal your password/i
    const noodlComponent = {
      type: 'textField',
      contentType: 'password',
      placeholder: 'your password',
    } as NOODLComponent

    xit('should start off with hidden password mode for password inputs', async () => {
      page.render(noodlComponent)
      const input = (await screen.findByTestId('password')) as HTMLInputElement
      expect(input).to.exist
      expect(input.type).to.equal('password')
    })

    xit('should start off showing the eye closed icon', async () => {
      page.render({
        type: 'textField',
        contentType: 'password',
        placeholder: 'your password',
      })
      const eyeIcon = await waitFor(
        () => document.getElementsByTagName('img')[0],
      )
      console.info(prettyDOM())
      expect(eyeIcon).to.exist
      // expect(eyeIcon?.getAttribute('src')?.includes(eyeClosed)).to.be.true
    })

    xit('should flip the eye icon to open when clicked', async () => {
      page.render(noodlComponent)
      console.info(prettyDOM())
      const eyeContainer = await screen.findByTitle(regexTitlePwInvisible)
      const eyeIcon = await waitFor(() => document.querySelector(`img`))
      expect(eyeContainer).to.exist
      expect(eyeIcon?.src.includes(eyeClosed)).to.be.true
      eyeContainer.click()
      eyeIcon?.click()
      expect(eyeIcon?.src).to.equal(eyeOpened)
      expect(regexTitlePwVisible.test(eyeContainer.title)).to.be.true
    })
  })

  xit('should show the password hidden icon', () => {
    //
  })

  describe('data-value elements (input/select/textarea/etc)', () => {})
})
