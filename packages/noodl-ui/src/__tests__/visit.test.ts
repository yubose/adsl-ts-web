import { expect } from 'chai'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as t from '../types'
import * as nu from 'noodl-utils'
import { nui, ui } from '../utils/test-utils'
import visit from '../utils/visit'

describe.skip(u.italic('visit'), () => {
  it(`should visit the component and all of its children in order`, async () => {
    const iteratorVar = 'itemObject'
    const listObject = [
      { key: 'gender', value: 'Female' },
      { key: 'gender', value: 'Male' },
      { key: 'gender', value: 'Other' },
    ]
    const component = await nui.resolveComponents(
      ui.view({
        children: [
          ui.list({
            contentType: 'listObject',
            iteratorVar,
            listObject,
            children: [
              ui.listItem({
                children: [
                  ui.label('Good morning'),
                  ui.textField({
                    dataKey: 'formData.password',
                    placeholder: 'Enter your password',
                  }),
                  ui.button({
                    onClick: [
                      ui.emitObject({
                        dataKey: { var1: 'formData' },
                        actions: [{}, {}, {}],
                      }),
                      { goto: 'MeetingRoom' },
                      { actionType: 'evalObject', object: () => {} },
                      {
                        actionType: 'popUp',
                        popUpView: 'greyPopUp',
                        wait: true,
                      },
                    ],
                  }),
                  ui.view({
                    children: [
                      ui.textField({ dataKey: `${iteratorVar}.value` }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ui.select({ options: ['1AM', '2AM'] }),
          ui.popUpComponent({ popUpView: 'helloPopUp' }),
          ui.view({
            children: [
              ui.view({
                children: [
                  ui.image('abc.png'),
                  ui.scrollView({ children: [ui.label('Submitting')] }),
                ],
              }),
            ],
          }),
        ],
      }),
    )

    const spy = sinon.spy()
    visit(component, spy)
    const expectedCallCount = 27
    const expectedComponentTypeCallOrder = [
      'view',
      'list',
      'listItem',
      'label',
      'textField',
      'button',
      'view',
      'textField',
      'listItem',
      'label',
      'textField',
      'button',
      'view',
      'textField',
      'listItem',
      'label',
      'textField',
      'button',
      'view',
      'textField',
      'select',
      'popUp',
      'view',
      'view',
      'image',
      'scrollView',
      'label',
    ]
    expect(spy).to.have.callCount(expectedCallCount)
    const calls = spy.getCalls()
    calls.forEach((call, index) =>
      expect(call.firstArg.type).to.eq(expectedComponentTypeCallOrder[index]),
    )
  })
})
