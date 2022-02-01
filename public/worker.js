importScripts('nui.js')

const tag = `[worker]`
const AUTHENTICATED = 'AUTHENTICATED'
const COMPONENTS_PARSED = 'COMPONENTS_PARSED'
const DOM_LOADED = 'DOM_LOADED'
const ON_INIT_SDK = 'ON_INIT_SDK'
const PARSE_COMPONENTS = 'PARSE_COMPONENTS'

self.addEventListener(
  'message',
  /**
   * @param { MessageEvent } evt
   */
  function onMessage(evt) {
    console.log(`%c${tag} Message`, `color:#00b406;font-weight:bold;`, evt)
    const { data } = evt
    console.log(`%c${tag} nui`, nui)

    if (data) {
      if (typeof data === 'object') {
        const { type } = data

        if (type === AUTHENTICATED) {
          console.log(`%c${tag} You are authed`, `color:#00b406;`)
        } else if (type === ON_INIT_SDK) {
          console.log(
            `%c${tag} Received signal that sdk was initiated`,
            `color:hotpink;`,
          )
        } else if (type === PARSE_COMPONENTS) {
          const { components = [] } = data
          console.log(
            `%c${tag} Parsing ${components.length} components`,
            `color:#00b406;`,
            data,
          )

          /**
           * @param { import('noodl-types').ComponentObject } component
           */
          const parse = (component) => {
            //
          }

          const parsedComponents = components.map(parse)

          this.postMessage({
            type: COMPONENTS_PARSED,
            parsedComponents,
          })
        }
      }
    }
  },
)

self.addEventListener(
  'messageerror',
  /**
   * @param { MessageEvent } evt
   */
  function onMessageError(evt) {
    console.log(`%c[self] Message error`, `color:tomato;font-weight:bold;`, evt)
  },
)
