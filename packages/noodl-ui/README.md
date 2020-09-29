# noodl-ui

> React library for working with NOODL pages

[![NPM](https://img.shields.io/npm/v/noodl-ui.svg)](https://www.npmjs.com/package/noodl-ui) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save noodl-ui
```

### Todos

- type: `listFooter`
- type: `scrollView`
- type: `searchBar`
- Format phone # in inputs
- make type: `scrollView` in sync with innerHeight height
- `border: { color: "0x00000" }`
- new component:
- new concept: `lastTop`
  - most likely used for `scrollView` components
  - for `listItem` under `scrollView` (or `list`)
- `color` stays at 0x0000000
- `borderWidth` missing px unit
- `fontSize` missing px unit

#### Action triggers

- `onClick`

##### Event handler data types (outdated)

- `string`: Provide our own custom function
- `Array`: Provide our own custom function
  - It represents a _chain of actions_
  - Each action in the action chain can have these possible `actionType`s:
    1. `builtIn` - Provide our own function and logic to achieve the goal
    2. `ecosConnection` - Communicating with the eCOS
    3. `pageJump` - Navigating to a page
    4. `updateObject` - Updates the global root object afer receiving its data

#### YAML Document Node Interfaces

| Name                     | TS type                                     | YAML Node |
| ------------------------ | ------------------------------------------- | --------- |
| Action chain (key/value) | { [key: string]: NOODLChainActionObject[] } | YAMLPair  |
| Action chain             | NOODLChainActionObject[]                    | YAMLSeq   |
| Action object            | NOODLChainActionObject                      | YAMLMap   |

#### Custom integrations

- Some components are attached with the prop `data-ux` for UX interactions between the library and web apps

#### Keep tabs for

https://github.com/epoberezkin/fast-deep-equal/
https://github.com/FormidableLabs/react-fast-compare
