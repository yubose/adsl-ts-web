# AiTmed NOODL Web

#update to use latest aitmed/cadl sdk

# added by Austin Yu 10/23/2020

npm install @aitmed/cadl@latest
git add .
git commit -a -m "update aitmed sdk"
git push

## All noodl-ui related packages are now merged into this repo and managed by [lerna](https://github.com/lerna/lerna)

- `noodl-ui`
- `noodl-ui-dom`
- `noodl-utils`

This allows for faster compilation, faster load times and quicker development flow by symlinking the dependencies

## Globals

These variables are available globally:

| Variable  | Description                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `echarts` | [Chart library](https://echarts.apache.org/examples/en/index.html) used for components of type `chart` |

## References

- [TypeScript DOM types](https://github.com/microsoft/TypeScript/blob/master/lib/lib.dom.d.ts)
- [Merge requests](https://gitlab.aitmed.com/help/user/project/merge_requests/index.md#checkout-merge-requests-locally)

## Configs

- `meet.yml` --> test.aitmed.com (React)
- `meet11.yml` / `cadltest.yml` --> devtest.aitmed.com
  - aitcom_11
- `meet2d.yml` --> cadltest.aitmed.io
- `testpage.yml`
- `message.yml`

## Todos

- select options is now an array of objs
  - optionKey
  - dataKey gets set the object
- url routing
  - `aitmed.com/SignIn-MeetingRoomInvited-Dashboard` etc. etc
  - back button detection
  - max 10 entries
  - final goal: compress/decompress with base64
- images with an empty `src` attribute showing the "special" border. disable it or make it invisible in `stable` env
- viewport top in yml not implemented
- if obj expressions
  - ex: `itemObject.value == "Female"` (string) --> grab itemObject, compare `.value` prop with `==`
- history
- bugs
  - footer 4.0 --> 4.1 top value placement
  - input focus issue on androids
- contentType: timer
  - inc/dec value at `dataKey` every second

## Notes

- redraw
  - remove --> give a key --> removes the object
- `${itemObject.key}`
- register action
  - config: message
  - ref pages: ChatPage
  - builtIn: funcName `hide` and `show`
  - contentType: `hidden`
  - type: `ecosDoc`
    - property: `ecosObj`
    - Page ref: `DocumentDetail`
  - 1025 = Attachment (comment or note) to an existing doc object

### `ecosDoc` component shapes

#### Image

```html
<iframe class="ecosdoc">
  <img class="ecosdoc-image" src="blob:....."></img>
</iframe>
```

#### Pdf

```html
<iframe class="ecosdoc" src="blob:....."></iframe>
```

#### Text

```html
<iframe class="ecosdoc">
  <div class="ecosdoc-text">
    <div class="ecosdoc-text-title"></div>
    <div class="ecosdoc-text-body"></div>
  </div>
</iframe>
```

#### Video

```html
TBH
```

## Lib Todos

- have the same path/resource resolve logic for "poster" prop
- make output from resolved components as plain objs instead with some getInstance getter

## Initialization (somewhat outdated)

1. `noodl` client (sdk/api)
2. `store`
3. `Viewport`
4. `App` (needs `store` and `Viewport`)
   - Retrieves + sets auth state
5. `Page` (needs `store`)
   - Subscribes to store:
     1. `state.page.previousPage` + `state.page.currentPage`
     2. `state.page.modal.id` + `state.page.modal.opened`
   - Register listeners:
     1. `onBeforePageChange`
        - Initializes `noodl-ui` client
     2. `onBeforePageRender`
        - Refreshes `noodl-ui` client (`root` + `page` object)
6. `noodl-ui` client (ui)
7. Register listener `viewport.onResize`
8. Run `page.navigate`
   1. Initializes page on `noodl` sdk
   2. Refreshes `noodl-ui` client with `root` + `page`
   3. Renders components
   4. Returns snapshot of:
      1. Page name
      2. Page object
      3. Page NOODL DOM components
9. View tag scrolling
   1. `goto: #genderTag` --> scroll to node with the `genderTag` viewTag
   2. `pageName#genderTag` --> navigate to page then scroll to the `genderTag` viewTag
10. emit return value as toast --> `{ toast: { message: '', style: {} } }`

## Navigating pages

- Dispatch `setPage`
- `Page` is subscribed to `previousPage` + `currentPage`, so it will call `navigate` and `render` for the upcoming page

---

## Modal

### Toggling on/off

- Dispatch `openModal`
- Dispatch `closeModal`
- `Page` is subscribed to `modal.id` + `modal.opened`, so it will respond with `modal.hide` or other modal methods to manage it

## Debugging Meeting (unable to see remote participant)

1. window .on event: `load`
2. action: `evalObject`
3. action: `goto`
4. requesting page change
   - current: `VideoChat`
   - previous: `ManageMeeting`
   - requesting: `MeetingDocumentsShared`
5. (onStart) rendering DOM for `MeetingDocumentsShared`
6. (onBeforePageRender) rendering components

## Twilio SID mapping

| sid | name |
| --- | ---- |

PA9211e55522d08dd12bff0cb845cd9d6f | 8882465555 (Laptop - main)
PA66a90e64872904394caf2891b69880f0 | 8882468491 (Laptop - 2nd)
PA15c1e191d9ad973fb473c12c471a3882 | 8882468491
PA0e4bd0e3c2d8bc33b7c372f83320084c | 8882468491
PAc1893f64325658d1acec25e99a158da7 | 8882462345 (Desktop)

## Firebase

1091

Subtypes
-- | --
1 | Android
2 | Web

## goto examples

```yml
- goto: AbcDashboard^redTag
- goto: AbcDashboard^redTag;duration:15000 # slow scroll effect for 15 seconds
- goto: AbcDashboard^redTag;duration:0 # instantly scroll to element
- goto: AbcDashboard^redTag # defaulted to 350 ms
- goto: ^redTag # defaulted to 350 ms
- goto: ^redTag;duration:15000 # slow scroll effect for 15 seconds
```

## Tools

### Reference lifecycle results

1. yml
2. sdk
3. noodl-ui

compose = (...fns) --> (arg) --> fns.reduceRight
(acc, fn) -->
fn(stepFn)
fn(stepFn)
fn(stepFn)
fn(stepFn)
fn(stepFn)
-->

if (top) --> absolute
if (no top) --> relative
if marginTop --> marginTop

for hide/show builtIn:
if hide and relative, dont hold the space
if absolute, hold the space

## Register

```js
import { NUI } from 'noodl-ui'

NUI.use({
  register: {
    name: 'twilioOnPeopleJoin',
    fn: async (registerObj, params) => {
      // ...
    },
  },
})

// Sometime later
NUI.emit({
  type: 'register',
  args: {
    name: 'twilioOnPeopleJoin',
    params: { token: 'abcdefghijklmnop.....xyz' },
  },
})
  .then((result) => {
    console.log(result)
  })
  .catch((err) => {
    console.error(err)
  })
```

// Correctly clears the console (tested on MAC)
process.stdout.write('\x1Bc')
