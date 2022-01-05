process.stdout.write('\x1Bc')
const curry = require('lodash/curry')
const u = require('@jsmanifest/utils')
const nu = require('noodl-utils')
const { getGenerator } = require('./generator')
const fs = require('fs-extra')
const has = require('lodash/has')
const get = require('lodash/get')
const set = require('lodash/set')
const path = require('path')

const log = console.log
const BUILTIN_EVAL_TOKEN = '=.'

;(async () => {
  try {
    log(`${u.cyan('Generating components')}`)

    const getTraverse = curry(
      /**
       * @param { (key: string, value: any, parent: Record<string, any>) => void } cb
       * @param { import('noodl-types').ComponentObject } bp
       */
      (cb, bp, path = []) => {
        if (u.isObj(bp)) {
          const entries = u.entries(bp)
          const numEntries = entries.length
          for (let index = 0; index < numEntries; index++) {
            const [key, value] = entries[index]
            cb(key, value, bp, path.concat(key))
            getTraverse(cb, value, path.concat(key))
          }
        } else if (u.isArr(bp)) {
          bp.forEach((b, i) => getTraverse(cb, b, path.concat(i)))
        }
      },
    )

    const { components, getGoto, nui, page, sdk, transform } =
      await getGenerator({
        configKey: 'www',
        on: {
          createComponent(comp, opts) {
            // const componentLabel = `[${comp.type}]`
            const path = opts.path || []
            traverse(comp.blueprint, path)
            // const logArgs = [
            //   comp.type,
            //   opts.parent?.type || '',
            //   u.isNum(opts?.index) ? opts.index : null,
            // ]
            // if (u.isStr(comp.blueprint.path)) logArgs.push(comp.blueprint.path)
            // else if (comp.blueprint.viewTag)
            //   logArgs.push(comp.blueprint.viewTag)
            // console.log(logArgs)
            // if (comp.blueprint.onClick) {
            //   let goto = getGoto(comp.blueprint.onClick)
            //   if (goto) {
            //     if ('goto' in goto) {
            //       comp.set('onClick', { actions: [goto], trigger: 'onClick' })
            //     }
            //   }
            // }
          },
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

    const paths = []

    const traverse = getTraverse((key, value, parent, path) => {
      if (key.startsWith('=.builtIn')) {
        // key = key.replace(BUILTIN_EVAL_TOKEN, '')
        path[path.length - 1] = key.replace(BUILTIN_EVAL_TOKEN, '')
        const pathStr = path.join('.')
        paths.push(pathStr)

        // log([key, value, parent, pathStr])

        if (u.isObj(value)) {
          try {
            // const processed = sdk.processPopulate({
            //   source: value,
            //   lookFor: ['.', '..', '=', '~'],
            //   pageName: 'HomePage',
            //   withFns: false,
            // })
            // console.dir(processed, { depth: Infinity })
            // return processed
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error))
            console.error(
              `[key:${key}-${u.yellow(err.name)}] ${u.red(err.message)}`,
              value,
            )
          }
        }
      }
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

    log(components)

    for (let path of paths) {
      let builtInKey = ''
      let indexOfBuiltInKey = path.indexOf('builtIn')
      // log(path)
      if (indexOfBuiltInKey > -1) {
        builtInKey = path.substring(indexOfBuiltInKey)
        path = path.substring(0, indexOfBuiltInKey - 1)
        // log(`${builtInKey} - ${path}`)
      }

      path = [
        ...path.split('.'),
        ...(builtInKey ? [`${BUILTIN_EVAL_TOKEN}${builtInKey}`] : []),
      ]

      log(has(components, path), path)
      log(get(components, path))
    }

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
