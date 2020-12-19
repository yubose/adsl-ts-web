import _ from 'lodash'
import sinon from 'sinon'
import userEvent from '@testing-library/user-event'
import { expect } from 'chai'
import { queryByText, screen, waitFor } from '@testing-library/dom'
import { Component, List, ListItem, NOODLComponent } from 'noodl-ui'
import {
  assetsUrl,
  noodlui,
  queryByDataKey,
  getAllByDataKey,
  page,
} from '../utils/test-utils'
import { getListComponent1 } from './helpers'

describe('dom', () => {
  describe('textBoard', () => {
    it('should be in the correct form in the DOM', () => {
      const noodlComponent = {
        type: 'label',
        textBoard: [
          { text: 'Medical Records' },
          { br: null },
          { text: 'Upload an image or document' },
        ],
      } as NOODLComponent
      const view = page.render({ type: 'view', children: [noodlComponent] })
        .components[0]
      const label = view.child()
      const node = document.getElementById(label.id)
      const children = node?.children as HTMLCollection
      expect(children[0].tagName).to.equal('LABEL')
      expect(children[1].tagName).to.equal('BR')
      expect(children[2].tagName).to.equal('LABEL')
      expect(screen.getByText('Medical Records')).to.exist
      expect(screen.getByText('Upload an image or document')).to.exist
    })
  })
  describe('component type: "list"', () => {
    describe('when freshly rendering to the DOM', () => {
      it('should have the data-listid attribute', () => {
        page.render({ type: 'list', listObject: [], iteratorVar: 'hello' })
        expect(document.querySelector('ul')).to.exist
        expect(document.querySelector('ul')?.dataset).to.have.property('listid')
      })

      it('should start with no children if listObject is empty', () => {
        page.render({
          type: 'view',
          children: [
            {
              type: 'list',
              listObject: [],
              iteratorVar: 'hello',
              children: [{ type: 'listItem' }],
            },
          ],
        })
        const listElem = document.querySelector('ul') as HTMLUListElement
        expect(listElem.children).to.have.lengthOf(0)
      })

      it('should start with some list item childrens if listObject has items', () => {
        page.render({
          type: 'view',
          children: [
            {
              type: 'list',
              listObject: [
                { fruits: ['apple'] },
                { fruits: ['banana'] },
                { fruits: ['grape'] },
                { fruits: ['pear'] },
              ],
              iteratorVar: 'hello',
              children: [{ type: 'listItem' }],
            },
          ],
        })
        const listElem = document.querySelector('ul')
        expect(listElem?.children).to.have.lengthOf(4)
      })
    })

    it(
      'should show populated data values from deeply nested children ' +
        'expectedly to the DOM',
      () => {
        page.render({
          type: 'view',
          children: [
            {
              type: 'list',
              iteratorVar: 'hello',
              listObject: [
                { title: 'apple', color: 'red', count: 5 },
                { title: 'banana', color: 'yellow', count: 1 },
              ],
              children: [
                {
                  type: 'listItem',
                  children: [
                    { type: 'label', dataKey: 'hello.title' },
                    {
                      type: 'view',
                      children: [
                        { type: 'label', dataKey: 'hello.color' },
                        {
                          type: 'view',
                          children: [{ type: 'label', dataKey: 'hello.count' }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }).components[0]
        const rootNode = page.rootNode as HTMLElement
        const titleLabels = getAllByDataKey('hello.title', rootNode) as any
        const colorLabel2 = getAllByDataKey('hello.color', rootNode) as any
        const textFields = getAllByDataKey('hello.count', rootNode) as any
        expect(titleLabels[0].dataset.value).to.equal('apple')
        expect(colorLabel2[0].dataset.value).to.equal('red')
        expect(textFields[0].dataset.value).to.equal('5')
        expect(titleLabels[1].dataset.value).to.equal('banana')
        expect(colorLabel2[1].dataset.value).to.equal('yellow')
        expect(textFields[1].dataset.value).to.equal('1')
      },
    )

    xit('should append a new list item node if a data object is added', async () => {
      const noodlList = getListComponent1({ iteratorVar: 'cat' }) as any
      const { components } = page.render({
        type: 'view',
        children: [noodlList],
      })
      const listSize = noodlList.listObject.length
      const li = document.querySelectorAll('li')
      const component = components[0].child() as List
      expect(li).to.have.lengthOf(listSize)
      component.addDataObject(
        Object.entries(noodlList.listObject[0]).reduce((acc, [k, v], index) => {
          acc[k] = index
          return acc
        }, {} as any),
      )
      await waitFor(() => {
        expect(document.querySelectorAll('li')).to.have.lengthOf(listSize + 1)
      })
    })

    xit(
      'should be able to use the api to allow us to remove the corresponding ' +
        'list item node if its dataObject was removed',
      () => {
        const { components } = page.render({
          type: 'view',
          children: [
            {
              type: 'list',
              listObject: [
                { fruits: 'apple' },
                { fruits: 'banana' },
                { fruits: 'orange' },
              ],
              iteratorVar: 'hello',
              children: [{ type: 'listItem' }],
            },
          ],
        })
        const view = components[0]
        const list = view.child() as List
        const ul = document.getElementById(list.id)
        expect(ul?.children).to.have.lengthOf(3)
        list.removeDataObject(0)
        expect(ul?.children).to.have.lengthOf(2)
      },
    )

    describe('when updating data objects and list items', () => {
      let component: List

      beforeEach(() => {
        const iteratorVar = 'hello'
        const { components } = page.render({
          type: 'view',
          children: [
            {
              type: 'list',
              listObject: [
                { fruits: 'apple' },
                { fruits: 'banana' },
                { fruits: 'orange' },
              ],
              iteratorVar,
              children: [
                {
                  type: 'listItem',
                  children: [{ type: 'label', dataKey: 'hello.fruits' }],
                  viewTag: 'fruitTag',
                },
              ],
            },
          ],
        })
        const parent = components[0]
        component = parent.child()
      })

      describe('by index', () => {
        xit('should update the corresponding list item node that is referencing the dataObject', () => {
          expect(queryByText(document.body, 'pear')).not.to.exist
          component.updateDataObject(1, { fruits: 'pear' })
          expect(queryByText(document.body, 'pear')).to.exist
        })

        xit('should redraw the images', () => {
          //
        })
      })

      xdescribe('by function query', () => {
        it('should update the corresponding list item node that is referencing the dataObject', () => {
          expect(queryByText(document.body, 'orange')).to.exist
          expect(queryByText(document.body, 'grape')).not.to.exist
          component.updateDataObject(2, { fruits: 'grape' })
          expect(queryByText(document.body, 'orange')).not.to.exist
          expect(queryByText(document.body, 'grape')).to.exist
        })
      })

      describe('by reference', () => {
        xit('should update the corresponding list item node that is referencing the dataObject', () => {})
      })
    })
  })

  describe('type: "textField" with contentType: "password"', () => {
    const dataKey = 'formData.greeting'
    const greeting = 'good morning'
    let eyeOpened = 'makePasswordVisiable.png'
    let eyeClosed = 'makePasswordInvisible.png'
    let regexTitlePwVisible = /click here to hide your password/i
    let regexTitlePwInvisible = /click here to reveal your password/i
    const noodlComponent = {
      type: 'textField',
      contentType: 'password',
      dataKey,
      placeholder: 'your password',
    } as NOODLComponent

    beforeEach(() => {
      noodlui
        .use({ getRoot: () => ({ formData: { greeting } }) })
        .setPage('SignIn')
    })

    it('should start off with hidden password mode for password inputs', async () => {
      page.render({
        type: 'view',
        children: [{ type: 'textField', contentType: 'password' }],
      })
      const input = await screen.findByTestId('password')
      expect(input).to.exist
      expect((input as HTMLInputElement).type).to.equal('password')
    })

    it('should start off showing the eye closed icon', async () => {
      page.render(noodlComponent)
      await waitFor(() => {
        const img = document.getElementsByTagName('img')[0]
        expect(img.getAttribute('src')).to.eq(assetsUrl + eyeClosed)
      })
    })

    it('should flip the eye icon to open when clicked', async () => {
      page.render(noodlComponent)
      const eyeContainer = await screen.findByTitle(regexTitlePwInvisible)
      let img = document.querySelector('img')
      expect(img).to.exist
      expect(img?.getAttribute('src')).not.to.eq(assetsUrl + eyeOpened)
      await waitFor(() => {
        img = document.querySelector('img')
        expect(img?.getAttribute('src')).to.eq(assetsUrl + eyeClosed)
      })
      expect(eyeContainer).to.exist
      eyeContainer.click()
      img?.click()
    })
  })

  it('should update the value of input', () => {
    const dataKey = 'formData.phoneNumber'
    noodlui
      .use({
        getRoot: () => ({ formData: { phoneNumber: '88814565555' } }),
      })
      .setPage('SignIn')
    page.render({
      type: 'textField',
      dataKey,
      placeholder: 'Enter your phone number',
    })
    const input = queryByDataKey(document.body, dataKey) as HTMLInputElement
    expect(input.value).to.eq('88814565555')
    userEvent.clear(input)
    userEvent.type(input, '6262465555')
    expect(input.value).to.equal('6262465555')
  })

  xit('should update the value of dataset.value', async () => {
    const dataKey = 'formData.phoneNumber'
    noodlui
      .use({
        getRoot: () => ({
          SignIn: { formData: { phoneNumber: '882465812' } },
        }),
      })
      .setPage('SignIn')
    page.render({
      type: 'textField',
      dataKey,
      placeholder: 'Enter your phone number',
    })
    const input = queryByDataKey(document.body, dataKey) as HTMLInputElement
    await waitFor(() => {
      expect(input.dataset.value).to.eq('882465812')
      input.click()
      userEvent.type(input, '6262465555')
    })
    await waitFor(() => {
      expect(input.dataset.value).to.equal('6262465555')
    })
  })
})

it('should target the viewTag component/node if available', async () => {
  let currentPath = 'male.png'
  const imagePathSpy = sinon.spy(async () => currentPath)
  const viewTag = 'genderTag'
  const iteratorVar = 'itemObject'
  const listObject = [
    { key: 'gender', value: 'Male' },
    { key: 'gender', value: 'Female' },
    { key: 'gender', value: 'Other' },
  ]
  const redrawSpy = sinon.spy(noodlui.getCbs('builtIn').redraw[0])
  noodlui.actionsContext = { noodl: {} }
  noodlui.removeCbs('emit')
  noodlui.getCbs('builtIn').redraw[0] = redrawSpy
  noodlui
    .setPage('SignIn')
    .use({
      actionType: 'emit',
      trigger: 'onClick',
      fn: async () => {
        currentPath = currentPath === 'male.png' ? 'female.png' : 'male.png'
      },
    })
    .use({ actionType: 'emit', trigger: 'path', fn: imagePathSpy })
    .use({ getAssetsUrl: () => assetsUrl, getRoot: () => ({ SignIn: {} }) })
  const view = page.render({
    type: 'view',
    children: [
      {
        type: 'list',
        iteratorVar,
        listObject,
        children: [
          {
            type: 'listItem',
            viewTag,
            children: [
              {
                type: 'image',
                path: { emit: { dataKey: 'f', actions: [] } },
                onClick: [
                  { emit: { dataKey: '', actions: [] } },
                  {
                    actionType: 'builtIn',
                    funcName: 'redraw',
                    viewTag: 'genderTag',
                  },
                ],
              },
              { type: 'label', dataKey: 'gender.value' },
            ],
          },
        ],
      },
    ],
  } as any).components[0]
  const list = view.child() as List
  const listItem = list.child() as ListItem
  const image = listItem.child() as Component
  expect(image.get('src')).not.to.eq(assetsUrl + 'male.png')
  document.getElementById(image.id)?.click()
  await waitFor(() => {
    expect(redrawSpy).to.have.been.called
    expect(document.querySelector('img')?.getAttribute('src')).to.eq(
      assetsUrl + 'female.png',
    )
  })
})
