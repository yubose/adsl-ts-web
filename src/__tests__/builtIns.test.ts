import _ from 'lodash'
import sinon from 'sinon'
import { expect } from 'chai'
import { findChild } from 'noodl-ui'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { noodlui, noodluidom, page } from '../utils/test-utils'

describe('builtIns', () => {
  describe('redraw', () => {
    let iteratorVar = 'hello'
    let listObject: { key: 'gender'; value: 'Male' | 'Female' | 'Other' }[]
    let timeSpanOptions: string[]
    let noodlComponents: any

    beforeEach(() => {
      timeSpanOptions = ['00:00', '00:30']
      listObject = [
        { key: 'gender', value: 'Male' },
        { key: 'gender', value: 'Female' },
        { key: 'gender', value: 'Other' },
      ]
      noodlComponents = {
        type: 'view',
        children: [
          {
            type: 'list',
            iteratorVar,
            listObject,
            contentType: 'listObject',
            children: [
              {
                type: 'listItem',
                viewTag: 'fruit',
                [iteratorVar]: '',
                children: [{ type: 'label', dataKey: `${iteratorVar}.value` }],
              },
            ],
          },
          {
            type: 'view',
            children: [
              {
                type: 'select',
                contentType: 'TimeCode',
                dataKey: 'BookingSlotsSelect',
                options: [10, 15, 30, 45, 60],
                required: 'true',
                onChange: [
                  { emit: { actions: [] } },
                  {
                    actionType: 'builtIn',
                    funcName: 'redraw',
                    viewTag: 'AvailableTimeTag',
                  },
                ],
              },
              { type: 'label', text: 'Available Time' },
              {
                type: 'view',
                style: {},
                children: [
                  {
                    type: 'select',
                    dataKey: 'AvailableTime.timeStart',
                    viewTag: 'AvailableTimeTag',
                    options: timeSpanOptions,
                    required: 'true',
                  },
                  {
                    type: 'select',
                    viewTag: 'AvailableTimeTag',
                    options: timeSpanOptions,
                    required: 'true',
                    dataKey: 'AvailableTime.timeEnd',
                    style: { left: '0.45' },
                  },
                ],
              },
            ],
          },
        ],
      } as any
    })

    it('should be able to grab list consumer components with the viewTag', async () => {
      const emitCall = sinon.spy()
      const redrawSpy = sinon.spy(noodluidom, 'redraw')
      noodlui.init({ actionsContext: { noodl: { emitCall }, noodluidom } })
      // noodlui.getCbs('builtIn').redraw = [spy]
      const view = page.render(noodlComponents).components[0]
      const select = findChild(
        view,
        (c) => c.get('dataKey') === 'BookingSlotsSelect',
      )
      const node = document.getElementById(select.id) as HTMLSelectElement
      await select?.action.onChange()
      await waitFor(() => {
        expect(redrawSpy.called).to.be.true
      })
      redrawSpy.restore()
    })

    xit('should be able to grab non list consumer components with the viewTag', async () => {
      const pageName = 'SelectRedraw'
      const pageObject = {
        ScheduleSettingsTemp: {
          TimeSpan: timeSpanOptions,
        },
      }
      const onChangeSpy = sinon.spy(async () => {
        timeSpanOptions.push(...['01:00', '01:30', '02:00'])
      })
      const redrawFn = noodlui.getCbs('builtIn')?.redraw[0]
      const spy = sinon.spy(redrawFn)
      noodlui
        .setPage(pageName)
        .use({ actionType: 'emit', fn: onChangeSpy, trigger: 'onChange' })
        .use({
          getRoot: () => ({ [pageName]: pageObject }),
          getPageObject: () => pageObject,
        } as any)
      const view = page.render(noodlComponents)
      await waitFor(() => {
        expect(spy).to.have.been.called
      })
    })

    xit('should pair the corresponding node with each grabbed component', () => {
      //
    })
  })
})
