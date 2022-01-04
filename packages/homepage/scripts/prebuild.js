const u = require('@jsmanifest/utils')
const { getGenerator } = require('./generator')
const fs = require('fs-extra')
const path = require('path')

const log = console.log

;(async () => {
  try {
    log(`${u.cyan('Generating components')}`)

    const { components, nui, page, sdk, transform } = await getGenerator({
      configKey: 'www',
      on: {
        patch: u.reduce(
          ['addEventListener', 'removeEventListener'],
          (acc, evtName) => {
            /**
             * @argument { object } args
             * @param { boolean } args.wasPatched
             */
            acc[evtName] = function (args) {
              let label = ''

              label += u.yellow('EventTarget')
              label += u.magenta('#')
              label += u.white(evtName)

              args.wasPatched
                ? log(`${label} is already patched.`)
                : log(`${label} ${u.green('patched!')}`)
            }
            return acc
          },
          {},
        ),
      },
      startPage: 'HomePage',
      viewport: { width: 1024, hight: 768 },
    })

    /**
     *
     * @param { nt.ComponentObject | nt.ComponentObject[] } value
     * @returns { Promise<import('./generator').NuiComponent[] }
     */
    async function transformAllComponents(value) {
      const components = []
      const componentsList = u.filter(Boolean, u.array(value))
      const numComponents = componentsList.length
      for (let index = 0; index < numComponents; index++) {
        components.push(await transform(componentsList[index], index))
      }
      return components
    }

    const transformedComponents = await transformAllComponents(components)

    await fs.writeJson(
      path.resolve(
        path.join(
          process.cwd(),
          './src/resources/data/homepage-components.json',
        ),
      ),
      transformedComponents,
      { spaces: 2 },
    )

    log(`${u.cyan('Components generated')}`)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
})()
