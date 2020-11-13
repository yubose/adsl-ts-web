import fs, { WriteOptions } from 'fs-extra'
import path from 'path'
import { IComponentTypeObject } from 'noodl-ui'

export function saveOutput(filepath: string, data: any, options: WriteOptions) {
  fs.writeJsonSync(path.resolve(path.join(process.cwd(), filepath)), data, {
    spaces: 2,
    ...options,
  })
}

export function getViewComponent({
  children,
  ...args
}: Partial<IComponentTypeObject>) {
  return { type: 'view', children, ...args } as Partial<IComponentTypeObject>
}

export function getListObject1(...args: any[]) {
  return Array.isArray(args[0])
    ? args[0]
    : ([
        { fruit: 'apple', name: 'michael', color: 'red' },
        { fruit: 'banana', name: 'harry', color: 'cyan' },
        { fruit: 'orange', name: 'sally', color: 'pink' },
        { fruit: 'pear', name: 'foo', color: 'magenta' },
        ...args,
      ] as any[])
}

export function getListComponent1({
  iteratorVar,
  listObject = getListObject1(),
  ...args
}: Partial<IComponentTypeObject> = {}) {
  // We'll just only take the first 3 dataKeys for testing
  const dataKeys = Object.keys(listObject[0]).slice(0, 3)
  return {
    type: 'list',
    listObject,
    iteratorVar,
    children: [
      {
        type: 'listItem',
        children: [
          { type: 'label', dataKey: `${iteratorVar}.${dataKeys[0]}` },
          {
            type: 'view',
            children: [
              {
                type: 'label',
                dataKey: `${iteratorVar}.${dataKeys[1]}`,
                children: [
                  {
                    type: 'view',
                    children: [
                      {
                        type: 'textField',
                        dataKey: `${iteratorVar}.${dataKeys[2]}`,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    ...args,
  } as Partial<IComponentTypeObject>
}
