process.stdout.write('\x1Bc')
const curry = require('lodash/curry')
const u = require('@jsmanifest/utils')
const { getGenerator } = require('./generator')
const fs = require('fs-extra')
const path = require('path')

const log = console.log

;(async () => {
  try {
    log(`${u.cyan('Generating components')}`)

    const getTraverse = curry(
      /**
       * @param { (key: string, value: any) => void } cb
       * @param { import('noodl-types').ComponentObject } bp
       */
      (cb, bp) => {
        let mergingProps

        for (const [key, value] of u.entries(bp)) {
          let props = cb(key, value)

          if (u.isObj(value)) {
            const res = getTraverse(cb, { ...mergingProps, ...props })
            res && (mergingProps = { ...mergingProps, [key]: props })
          } else if (u.isArr(value)) {
            mergingProps = {
              ...mergingProps,
              [key]: value.reduce((acc, c) => {
                // props = getTraverse(cb, c)
                // console.log({ c })
                // if (props) {
                //   if (u.isObj(props)) return acc.concat({ ...c, ...props })
                //   if (u.isArr(props)) return acc.concat([...c, ...props])
                //   return acc.concat(props)
                // }
                return acc.concat(c)
              }, []),
            }
          }
        }
        return mergingProps
      },
    )

    const { components, getGoto, nui, page, sdk, transform } =
      await getGenerator({
        configKey: 'www',
        on: {
          createComponent(comp, opts) {
            // const componentLabel = `[${comp.type}]`
            const path = opts.path || []
            const pathStr = path.join('.') || ''
            const mergingProps = traverse(comp.blueprint)
            if (mergingProps) return mergingProps
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

    const traverse = getTraverse((key, value) => {
      if (key.startsWith('=.builtIn')) {
        if (u.isObj(value)) {
          try {
            const processed = sdk.processPopulate({
              source: value,
              lookFor: ['.', '..', '=', '~'],
              pageName: 'HomePage',
              withFns: false,
            })

            // console.dir(processed, { depth: Infinity })
            return processed
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
