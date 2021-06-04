---
id: usage
sidebar_position: 2
---

# Usage

```js
import { NUI } from 'noodl-ui'
import NDOM from 'noodl-ui-dom'

window.addEventListener('load', async (evt) => {
  const { default: SDK } = await import('@aitmed/cadl')

  const sdk = new SDK({
    configUrl: `https://public.aitmed.com/config/meet4d.yml`,
    aspectRatio: 1,
    cadlVersion: 'test',
  })

  await sdk.init()

  const ndom = new NDOM()
  const page = ndom.createPage() // Initiates a page and appended its root node to document.body
})
```

## Notes

- viewport `width` and `height` needs to be initiated to fallback from `window.innerWidth` and `window.innerHeight`
- ndom page `status` says `rendered` when it doesnt have any components
- setting ndom `page.components = [...]` with actual components renders DOM nodes on the page. but `nui` page object returns no components. they not synced
  - setting ndom `page.components = [...]` works for plain component objects (?)
  - setting ndom `page.components = [...]` also works for component instances. this is confusing. make one way to do it and not both
- make `page.components =` accept single components
- `getBaseStyles` crashes if no args
- `getConsumerOptions` crashes if no args
- `nui` should take in a `config` and use it to assign their getters
  - `getAssetsUrl`
  - `getBaseUrl`
  - `getPlugins`
  - `getPreloadPages`
  - `getPages`
- console logging improvements
  - `ActionsCache`
  - `ComponentCache`
  - `PageCache`
  - `RegisterCache`
  - `TransactionCache`
- `nui.createActionChain` with no args is initiated with undefined as its only item in `this.actions`
- `nui.createSrc` should return empty string instead of `undefined`
- `nui.createPlugin` should not throw. handle it gracefully instead
- `ndom.createGlobalRecord` throws when no args

### Sdk

- `this.root.builtIn.goto is not a function` when `goto` function isn't provided for initPage builtIn
