import _ from 'lodash'
import sinon from 'sinon'
import userEvent from '@testing-library/user-event'
import MockAxios from 'axios-mock-adapter'
import { expect } from 'chai'
import { prettyDOM } from '@testing-library/dom'
import { queryByText, screen, waitFor } from '@testing-library/dom'
import {
  ActionChainActionCallbackOptions,
  EmitActionObject,
  IAction,
  IActionChainEmitTrigger,
  IComponentTypeInstance,
  IList,
  IListItem,
  NOODLComponent,
} from 'noodl-ui'
import axios from '../app/axios'
import {
  assetsUrl,
  noodlui,
  queryByDataKey,
  queryByDataListId,
  queryByDataName,
  queryByDataUx,
  queryByDataValue,
  queryByDataViewtag,
  getAllByDataKey,
  page,
  noodluidom,
} from '../utils/test-utils'
import { getListComponent1, saveOutput } from './helpers'

const mockAxios = new MockAxios(axios)

describe('dom', () => {
  describe('when creating any type of component', () => {
    it('should attach the id', () => {
      page.render({ type: 'button', style: {}, id: 'abc123' })
      expect(document.getElementById('abc123')).to.exist
    })
  })

  describe('component type: "label"', () => {
    it('should use data-value as text content if present for other elements (non data value elements)', () => {
      const dataKey = 'formData.greeting'
      const greeting = 'my greeting'
      noodlui.setRoot('SignIn', { formData: { greeting } }).setPage('SignIn')
      page.render({
        type: 'label',
        dataKey,
        placeholder: 'hello, all',
        id: 'id123',
      })
      const label = queryByDataKey(document.body, dataKey)
      // @ts-expect-error
      expect(label.value).to.be.undefined
      expect(label?.innerHTML).to.equal(greeting)
    })

    it('should use placeholder as text content if present (and also there is no data-value available) for other elements (non data value elements)', () => {
      const dataKey = 'formData.greeting'
      const placeholder = 'my placeholder'
      noodlui
        .setRoot('SignIn', { formData: { greeting: '' } })
        .setPage('SignIn')
      page.render({ type: 'label', dataKey, placeholder })
      const label = queryByDataKey(document.body, dataKey)
      // @ts-expect-error
      expect(label.value).to.be.undefined
      expect(label?.innerHTML).to.equal(placeholder)
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
        expect(listElem.children).to.have.lengthOf(4)
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
        const titleLabels = getAllByDataKey('hello.title', rootNode)
        const colorLabel2 = getAllByDataKey('hello.color', rootNode)
        const textFields = getAllByDataKey('hello.count', rootNode)
        expect(titleLabels[0].dataset.value).to.equal('apple')
        expect(colorLabel2[0].dataset.value).to.equal('red')
        expect(textFields[0].dataset.value).to.equal('5')
        expect(titleLabels[1].dataset.value).to.equal('banana')
        expect(colorLabel2[1].dataset.value).to.equal('yellow')
        expect(textFields[1].dataset.value).to.equal('1')
      },
    )

    it('should append a new list item node if a data object is added', () => {
      const noodlList = getListComponent1({ iteratorVar: 'cat' })
      const { components } = page.render({
        type: 'view',
        children: [noodlList],
      })
      const listSize = noodlList.listObject.length
      const li = document.querySelectorAll('li')
      const component = components[0].child() as IList
      expect(li).to.have.lengthOf(listSize)
      component.addDataObject(
        Object.entries(noodlList.listObject[0]).reduce((acc, [k, v], index) => {
          acc[k] = index
          return acc
        }, {} as any),
      )
      expect(document.querySelectorAll('li')).to.have.lengthOf(listSize + 1)
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
        const list = view.child() as IList
        const ul = document.getElementById(list.id)
        expect(ul?.children).to.have.lengthOf(3)
        list.removeDataObject(0)
        saveOutput('dom.test.json', view.toJS(), { spaces: 2 })
        expect(ul?.children).to.have.lengthOf(2)
      },
    )

    describe('when updating data objects and list items', () => {
      let component: IList

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

  describe('component type: image', () => {
    it('should attach the src attribute', () => {
      page.render({ type: 'image', path: 'img123.jpg', style: {} })
      expect(
        document.querySelector(`img[src="${noodlui.assetsUrl}img123.jpg"]`),
      ).to.exist
    })
  })

  xdescribe('component type: "plugin"', () => {
    it('should have ran the js script retrieved from the XHR request', async () => {
      const spy = sinon.spy()
      const div = document.createElement('div')
      div.id = 'testing'
      div.onclick = spy
      document.body.appendChild(div)
      const pathname = 'somejsfile.js'
      const url = `${assetsUrl}${pathname}`
      const content = `var s = 54;
      const abc = document.getElementById('testing');
      abc.click();`
      mockAxios.onGet(url).reply(200, content)
      page.render({ type: 'plugin', path: '/somejsfile.js' })
      await waitFor(() => {
        expect(spy.called).to.be.true
      })
    })
  })

  describe('component type: "select"', () => {
    it('should show a default value for select elements', () => {
      page.render({
        type: 'select',
        'data-name': 'country',
        options: ['abc', '+52', '+86', '+965'],
      })
      const select = queryByDataName(document.body, 'country') as any
      expect(select?.value).to.equal('abc')
    })

    it('should create the select option children when rendering', () => {
      const options = ['abc', '123', 5, 1995]
      page.render({ type: 'select', options, id: 'myid123' })
      _.forEach(options, (option, index) => {
        expect(document.querySelector(`option[value="${options[index]}"]`)).to
          .exist
      })
    })
  })

  describe('component type: "textField"', () => {
    it("should use the value computed from the dataKey as the element's value", () => {
      const dataKey = 'formData.greeting'
      const greeting = 'good morning'
      noodlui.setRoot('SignIn', { formData: { greeting } }).setPage('SignIn')
      page.render({ type: 'textField', placeholder: 'hello, all', dataKey })
      const input = queryByDataKey(document.body, dataKey) as any
      expect(input.value).to.equal(greeting)
    })

    it('should attach placeholders', () => {
      const placeholder = 'my placeholder'
      const dataKey = 'formData.greeting'
      const greeting = 'good morning'
      noodlui.setRoot('SignIn', { formData: { greeting } }).setPage('SignIn')
      page.render({ type: 'textField', dataKey, placeholder })
      expect(screen.getByPlaceholderText(placeholder)).to.exist
    })

    _.forEach(
      [
        ['data-listid', queryByDataListId],
        ['data-name', queryByDataName],
        ['data-key', queryByDataKey],
        ['data-ux', queryByDataUx],
        ['data-value', queryByDataValue],
        ['data-viewtag', queryByDataViewtag],
      ],
      ([key, queryFn]) => {
        it(`should attach ${key}`, () => {
          page.render({
            type: 'li',
            noodlType: 'listItem',
            id: 'id123',
            [key as string]: 'abc123',
          })
          expect((queryFn as Function)(document.body, 'abc123')).to.exist
        })
      },
    )

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
        noodlui.setRoot('SignIn', { formData: { greeting } }).setPage('SignIn')
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
        noodlui.setAssetsUrl(assetsUrl)
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
      noodlui.setRoot('SignIn', { formData: { phoneNumber: '88814565555' } })
      noodlui.setPage('SignIn')
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
      noodlui.setRoot('SignIn', { formData: { phoneNumber: '882465812' } })
      noodlui.setPage('SignIn')
      page.render({
        type: 'textField',
        dataKey,
        placeholder: 'Enter your phone number',
      })
      const input = queryByDataKey(document.body, dataKey) as HTMLInputElement
      expect(input.dataset.value).to.eq('')
      userEvent.type(input, '6262465555')
      expect(input.dataset.value).to.equal('6262465555')
    })
  })

  describe('component type: "video"', () => {
    it('should attach poster if present', () => {
      page.render({
        type: 'video',
        poster: 'my-poster.jpeg',
        videoFormat: 'mp4',
      })
      const node = document.querySelector('video')
      expect(node?.getAttribute('poster')).to.equal(
        `${assetsUrl}my-poster.jpeg`,
      )
    })

    it('should have object-fit set to "contain"', () => {
      page.render({ type: 'video', videoFormat: 'mp4' })
      const node = document.querySelector('video')
      expect(node?.style.objectFit).to.equal('contain')
    })

    it('should create the source element as a child if the src is present', () => {
      page.render({ type: 'video', path: 'asdloldlas.mp4', videoFormat: 'mp4' })
      const node = document.querySelector('video')
      const sourceEl = node?.querySelector('source')
      expect(sourceEl).to.exist
    })

    it('should have src set on the child source element instead of the video element itself', () => {
      const path = 'asdloldlas.mp4'
      page.render({ type: 'video', path, videoFormat: 'mp4' })
      const node = document.querySelector('video')
      const sourceEl = node?.querySelector('source')
      expect(node?.getAttribute('src')).not.to.equal(assetsUrl + path)
      expect(sourceEl?.getAttribute('src')).to.equal(assetsUrl + path)
    })

    it('should have the video type on the child source element instead of the video element itself', () => {
      page.render({ type: 'video', path: 'abc123.png', videoFormat: 'mp4' })
      const node = document.querySelector('video')
      const sourceEl = node?.querySelector('source')
      expect(node?.getAttribute('type')).not.to.equal('mp4')
      expect(sourceEl?.getAttribute('type')).to.equal(`video/mp4`)
    })

    it('should include the "browser not supported" message', () => {
      page.render({ type: 'video', path: 'abc.jpeg', videoFormat: 'mp4' })
      expect(screen.getByText(/sorry/i)).to.exist
    })

    it('should create a "source" element and attach the src attribute for video components', () => {
      const path = 'pathology.mp4'
      page.render({ type: 'video', path, videoFormat: 'mp4', id: 'id123' })
      const sourceElem = document.body?.querySelector('source')
      expect(sourceElem?.getAttribute('src')).to.equal(assetsUrl + path)
    })
  })

  xdescribe('when using redraw', () => {
    const iteratorVar = 'hello'
    let listObject: { key: 'Gender'; value: '' | 'Male' | 'Female' }[]
    let actionFnSpy = sinon.spy()
    let pathIfFnSpy = sinon.spy()
    let parent: IComponentTypeInstance
    let component: IList
    let injectedArgs: {
      dataObject: any
      listItem: IListItem
      iteratorVar: string
    }

    beforeEach(() => {
      listObject = [
        { key: 'Gender', value: 'Male' },
        { key: 'Gender', value: 'Female' },
      ]
      noodlui
      noodlui
        .setAssetsUrl(assetsUrl)
        .setRoot('Abc', { listData: { Gender: { Radio: listObject } } })
        .setPage('Abc')
      noodlui.use({
        actionType: 'emit',
        fn: async (
          action: IAction<EmitActionObject>,
          options: ActionChainActionCallbackOptions,
        ) => {
          actionFnSpy(action, options)
          const { emit } = action.original
          const { actions, dataKey } = emit
          const c = options.component as IComponentTypeInstance
          // Internal --- START
          const { dataObject = {} } = options
          const listIndex = c.get('listIndex')
          console.info('c', c.toJS())
          console.info('listIndex', listIndex)
          console.info('passedInDataObject', dataObject)
          console.info('stateDataObject', listObject[listIndex])
          if (dataObject.value === listObject[listIndex].value) {
            // listObject[listIndex].value =
          }
          listObject[listIndex] = dataObject
          // Internal --- END
          injectedArgs = {
            dataObject: options.dataObject,
            listItem: options.listItem,
            iteratorVar: options.iteratorVar,
          }
        },
      })
      parent = page.render({
        type: 'view',
        children: [
          {
            type: 'list',
            listObject,
            iteratorVar,
            children: [
              {
                type: 'listItem',
                [iteratorVar]: '',
                viewTag: 'genderTag',
                children: [
                  { type: 'label', dataKey: `${iteratorVar}.value` },
                  {
                    type: 'image',
                    viewTag: 'maleTag',
                    onClick: [
                      {
                        emit: {
                          dataKey: { var1: iteratorVar, var2: iteratorVar },
                          actions: [{ if: [{}, {}, {}] }],
                        },
                      },
                      {
                        actionType: 'builtIn',
                        funcName: 'redraw',
                        viewTag: 'genderTag',
                      },
                    ],
                    path: {
                      if: [
                        // (obj: typeof listObject[number]) =>
                        //   obj.value === 'Male',
                        pathIfFnSpy,
                        'male.png',
                        'female.png',
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      }).components[0]
      component = parent.child() as IList
    })

    after(() => {
      saveOutput('dom.test.json', parent.toJS(), { spaces: 2 })
    })

    it('should deeply recompute/redraw its descendants', () => {
      const ul = document.querySelector('ul')
      const [li1, li2] = Array.from(ul?.querySelectorAll('li') as any)
      const img1 = li1.querySelector('img') as HTMLImageElement
      const img2 = li2.querySelector('img') as HTMLImageElement
      img1.click()
      expect(pathIfFnSpy.called).to.be.true
      // expect(pathIfFnSpy.firstCall.args[0]).to.be.a('function')
    })

    xit("should be able to deeply recompute/redraw an html dom node's tree hierarchy", () => {
      const pageObject = { formData: { greeting: '12345' } }
      noodlui.setRoot('SignIn', pageObject).setPage('SignIn')
      const root = page.render({
        type: 'view',
        children: [
          {
            type: 'view',
            children: [
              { type: 'image', path: 'abc.png', style: { shadow: 'true' } },
              { type: 'label', dataKey: 'formData.greeting' },
            ],
          },
        ],
      }).components[0]

      const view = root.child()
      const [image, label] = view.children() as [
        IComponentTypeInstance,
        IComponentTypeInstance,
      ]

      const parentEl = document.getElementById(view.id)
      const imgEl = document.querySelector('img') as HTMLImageElement
      const labelEl = document.querySelector('label') as HTMLLabelElement

      expect(imgEl.src).to.equal(noodlui.assetsUrl + 'abc.png')
      expect(labelEl.textContent).to.equal('12345')

      image.set('src', noodlui.assetsUrl + 'followMe.jpeg')
      label.set('data-value', 'hehehee')

      expect(imgEl.src).not.to.eq(noodlui.assetsUrl + 'followMe.jpeg')
      expect(labelEl.textContent).not.to.eq('hehehee')

      noodluidom.redraw(parentEl, view)

      expect(imgEl.src).to.eq(noodlui.assetsUrl + 'followMe.jpeg')
      expect(labelEl.textContent).to.eq('hehehee')
    })
  })
})
