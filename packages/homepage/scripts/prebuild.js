const u = require('@jsmanifest/utils')
const { generate } = require('./generate')
const fs = require('fs-extra')
const path = require('path')

const log = console.log

;(async () => {
  try {
    log(`${u.cyan('Generating components')}`)

    const { components, nui } = await generate({
      patches: ['addEventListener', 'removeEventListener'].reduce(
        (acc, evtName) => {
          acc[evtName] = (args) => {
            const evtTargetLabel = u.yellow('EventTarget')
            const hashLabel = u.magenta('#')
            const label = `${evtTargetLabel}${hashLabel}${u.white(evtName)}`
            if (args.wasPatched) {
              log(`${label} is already patched.`)
            } else {
              log(`${label} ${u.green('patched!')}`)
            }
          }
          return acc
        },
        {},
      ),
    })

    await fs.writeJson(
      path.resolve(
        path.join(
          process.cwd(),
          './src/resources/data/homepage-components.json',
        ),
      ),
      components,
      {
        spaces: 2,
      },
    )

    log(`${u.cyan('Components generated')}`)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
})()
