import * as u from '@jsmanifest/utils'

export type CSSResourceLink<S extends string = string> = `${S}.css`
export type JSResourceLink<S extends string = string> = `${S}.js`

/**
 * Takes a url and renders a DOM node corresponding to the type of resource it is
 *
 * For example, if id is "https://www.somewebsite.com/somestyles.min.css", it will create a link element if there isn't already one existent in the document head.
 *
 * This currently supports only css or javascript
 *
 * @param id string
 * @returns HTMLLinkElement | HTMLScriptElement | undefined
 */
function renderResource<Id extends string>(
  id: `${Id}.css`,
): HTMLLinkElement | null

function renderResource<Id extends string>(
  id: `${Id}.js`,
): HTMLScriptElement | null

function renderResource<Id extends string>(id: `${Id}.css` | `${Id}.js`) {
  if (u.isStr(id)) {
    if (id.endsWith('.css')) {
      let node = document.head.querySelector(
        `link[href="${id}"]`,
      ) as HTMLLinkElement | null

      if (!node) {
        node = document.createElement('link')
        node.onload = (evt) => {
          console.info(`%cLoaded CSS element to head`, `color:#00b406;`, {
            event: evt,
            href: id,
          })
        }

        node.rel = 'stylesheet'
      }

      if (!document.head.contains(node)) {
        node.href = id
        document.head.appendChild(node)
      }
      return node
    } else if (id.endsWith('.js')) {
      let node = document.getElementById(id) as HTMLScriptElement | null

      if (!node) {
        node = document.createElement('script')
        node.onload = (evt) => {
          console.info(`%cLoaded SCRIPT element to body`, `color:#00b406;`, {
            event: evt,
            src: id,
          })
        }

        node.id = id
      }

      if (node) {
        if (!document.body.contains(node)) {
          node.src = id
          document.body.appendChild(node)
        }
      }
      return node
    }
  }
}

export default renderResource
