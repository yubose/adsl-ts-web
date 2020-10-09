# AiTmed NOODL Web

## All noodl-ui related packages are now merged into this repo and managed by [lerna](https://github.com/lerna/lerna)

- `logsnap`
- `noodl-ui`
- `noodl-ui-dom`

This allows for faster compilation, faster load times and quicker development flow by symlinking the dependencies

## References

- [TypeScript DOM types](https://github.com/microsoft/TypeScript/blob/master/lib/lib.dom.d.ts)

## Todos

- PatientChartGeneralInfo --> redraw reference
- Support `path` objects
  - if
    - 1st item --> data to use
    - use this if true
    - use this if false
- viewport manager
- scroll manager
- history
- page cache rehydration
- autobind root/page updates on the `noodl-ui` lib
- find use cases for `page.rootNode.id`
- aspect ratio (viewport manager)
- scroll manager
- bugs
  - footer 4.0 --> 4.1 top value placement
  - input focus issue on androids

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

## Navigating pages

- Dispatch `setPage`
- `Page` is subscribed to `previousPage` + `currentPage`, so it will call `navigate` and `render` for the upcoming page

---

## Modal

### Toggling on/off

- Dispatch `openModal`
- Dispatch `closeModal`
- `Page` is subscribed to `modal.id` + `modal.opened`, so it will respond with `modal.hide` or other modal methods to manage it
