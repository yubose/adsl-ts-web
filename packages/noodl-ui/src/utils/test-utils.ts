import { actionFactory, componentFactory } from 'noodl-ui-test-utils'
import get from 'lodash/get'
import * as u from '@jsmanifest/utils'
import * as nu from 'noodl-utils'
import * as nt from 'noodl-types'
import type NuiPage from '../Page'
import nui from '../noodl-ui'
import Viewport from '../Viewport'
import * as t from '../types'

export { nui }

export const baseUrl = 'https://google.com/'
export const assetsUrl = `${baseUrl}assets/`
export const viewport = new Viewport()
export const ui = { ...actionFactory, ...componentFactory }

const isNil = (v: any) => v === null || v === undefined || v === ''

export function createOn(
  getRoot = () => ({} as Record<string, Record<string, any>>),
): t.On {
  return {
    // @ts-expect-error
    if: ({ component, page, key, value }) => {
      if (u.isStr(value) && nt.Identify.reference(value)) {
        const datapath = nu.trimReference(value)
        if (nt.Identify.localKey(datapath)) {
          if (page?.page) {
            let value = get(getRoot()?.[page.page], datapath)
            if (nt.Identify.reference(value)) {
            }
          }
        } else {
          return get(getRoot(), datapath)
        }
      }
    },
    reference: (args) => {
      const { page, value } = args
      if (nt.Identify.reference(value)) {
        const datapath = nu.trimReference(value)
        if (nt.Identify.localKey(datapath)) {
          if (page?.page) {
            return get(getRoot()?.[page.page], datapath)
          }
        } else {
          return get(getRoot(), datapath)
        }
      }
    },
  }
}

export function createDataKeyReference({
  page = nui.getRootPage(),
  pageName = page.page,
  pageObject,
}: {
  page?: NuiPage
  pageName?: string
  pageObject?: Record<string, any>
}) {
  if (isNil(page.viewport.width)) page.viewport.width = 375
  if (isNil(page.viewport.height)) page.viewport.height = 667
  pageObject = {
    ...nui.getRoot()[pageName],
    ...pageObject,
  }
  if (page.page !== pageName) page.page = pageName
  const root = { ...nui.getRoot(), [pageName]: pageObject }
  nui.use({ getRoot: () => root })
  return { page }
}

export function getPresetPageObjects() {
  const getGenderListObject = () => [
    { key: 'Gender', value: 'Male' },
    { key: 'Gender', value: 'Female' },
    { key: 'Gender', value: 'Other' },
  ]

  return {
    get Cereal() {
      const ifObject = {
        if: [() => {}, '.Donut.thumbnail', '.HelloPage.icon'],
      }
      return {
        data: {
          thumbnail: '.Donut.thumbnail',
        },
        components: [
          ui.view({
            style: { shadow: 'true' },
            children: [
              ui.image({ path: ifObject }),
              ui.page({
                path: 'Tiger',
                style: {
                  shadow: 'true',
                  width: '0.2',
                  top: '0.1',
                },
              }),
            ],
          }),
        ],
      }
    },
    get Donut() {
      const formData = { password: 'fruits', fullName: 'Mark Twain' }
      return {
        formData,
        thumbnail: 'red.png',
        components: [
          ui.view({
            viewTag: 'donutContainer',
            children: [
              ui.textField({
                onChange: [
                  ui.emitObject({
                    dataKey: 'Donut.formData.password',
                  }),
                ],
              }),
              ui.button({
                text: `Go to Donut page`,
                onClick: [ui.gotoObject('Donut')],
              }),
              ui.divider({ id: 'divider' }),
              ui.label({
                text: '..fullName',
              }),
            ],
          }),
        ],
      }
    },
    get Hello() {
      return { formData: { password: 'abc123', components: [] } }
    },
    get Sun() {
      return {
        key: '.Cereal.data.thumbnail',
        formData: {
          profile: {
            user: {
              firstName: 'Henry',
              lastName: 'Gonzalez',
              email: 'henry@gmail.com',
              otherNames: ['mike', 'luke'],
            },
          },
        },
        viewTag: '.Hello.formData.password',
      }
    },
    get Cloud() {
      return {
        mainThumbnail: 'naruto.png',
        messages: [
          {
            text: 'good morning',
            user: 'apple123',
            thumbnail: '...mainThumbnail',
          },
          {
            text: 'it is not morning yet',
            user: 'bob123',
            thumbnail: '.Sun.key',
          },
        ],
      }
    },
    get Tiger() {
      const iteratorVar = 'pencil'
      const listObject = getGenderListObject()
      return {
        icon: 'edit.svg',
        components: [
          ui.view({
            children: [
              ui.list({
                contentType: 'listObject',
                listObject,
                iteratorVar,
                children: [
                  ui.listItem({
                    [iteratorVar]: '',
                    children: [
                      ui.label({ dataKey: 'pencil.key' }),
                      ui.select({ options: `${iteratorVar}.doc` } as any),
                      ui.textField({ dataKey: 'pencil.value' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ui.button({
            text: 'Submit',
            onClick: [ui.emitObject(), ui.evalObject(), ui.gotoObject('Abc')],
          }),
          ui.textField({ dataKey: `..icon`, placeholder: `Icon URL` }),
        ],
      }
    },
  }
}
