import path from 'path'
import { actionFactory, componentFactory } from 'noodl-ui-test-utils'

export const ui = { ...actionFactory, ...componentFactory }

export function getFixturePath(...paths: string[]) {
  return path.join(__dirname, 'fixtures', ...paths)
}

export function getPathToConfig() {
  return getFixturePath('meetd2.yml')
}

export function getPathToCadlEndpoint() {
  return getFixturePath('cadlEndpoint.yml')
}

export function getPathToBaseCss() {
  return getFixturePath('BaseCSS.yml')
}

export function getPathToBaseDataModel() {
  return getFixturePath('BaseDataModel.yml')
}

export function getPathToBasePage() {
  return getFixturePath('BasePage.yml')
}

export function getPathToSignInPage() {
  return getFixturePath('SignIn.yml')
}

export function getRoot() {
  const root = {
    Cereal: {
      formData: {
        user: {
          firstName: `Bob`,
          lastName: `Le`,
          age: 30,
          email: `bob@gmail.com`,
          nicknames: [`Pizza Guy`, `Tooler`, `Framer`],
        },
      },
    },
    get Tiger() {
      const genders = [
        { key: 'gender', value: 'Female' },
        { key: 'gender', value: 'Male' },
        { key: 'gender', value: 'Unknown' },
      ]
      let iteratorVar = 'itemObject'
      let currentEventName = 'Los Angeles County Fair'
      return {
        genders,
        info: {
          currentEventName,
        },
        components: [
          ui.view({
            children: [
              ui.label({ dataKey: `Cereal.formData.user.firstName` }),
              ui.list({
                iteratorVar,
                contentType: 'listObject',
                children: [
                  ui.listItem({
                    [iteratorVar]: '',
                    children: [
                      ui.label({ dataKey: `${iteratorVar}.value` }),
                      ui.textField({
                        dataKey: `${iteratorVar}.value`,
                        placeholder: `Edit gender`,
                      }),
                      ui.divider(),
                      ui.label(`...currentEventName`),
                      ui.button({
                        text: 'Get ticket',
                        style: {
                          left: '0.12',
                          marginTop: '0.5',
                          width: '0.8',
                          height: '0.09',
                          isHidden: false,
                        },
                      }),
                    ],
                  }),
                ],
              }),
              ui.image({ path: 'abc.png' }),
              ui.video({ path: 'movie.mkv' }),
            ],
          }),
        ],
      }
    },
  }

  return root as Record<string, any> & typeof root
}
