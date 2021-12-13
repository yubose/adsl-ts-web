# AiTmed NOODL Web

## Steps to update the @aitmed/cadl eCOS package to latest version

- npm install @aitmed/cadl@latest
- git add .
- git commit -a -m "update aitmed sdk"
- git push

## Correct link to GitLab

- https://gitlab.aitmed.com:443/frontend/aitmed-noodl-web.git/

## Globals

These variables are available globally:

| Variable  | Description                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `echarts` | [Chart library](https://echarts.apache.org/examples/en/index.html)used for components of type `chart` |

## References

- [TypeScript DOM types](https://github.com/microsoft/TypeScript/blob/master/lib/lib.dom.d.ts)
- [Merge requests](https://gitlab.aitmed.com/help/user/project/merge_requests/index.md#checkout-merge-requests-locally)

### ecosDoc variations

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

## Goto Examples

```yaml
- goto: AbcDashboard^redTag
- goto: AbcDashboard^redTag;duration:15000 # slow scroll effect for 15 seconds
- goto: AbcDashboard^redTag;duration:0 # instantly scroll to element
- goto: AbcDashboard^redTag # defaulted to 350 ms
- goto: ^redTag # defaulted to 350 ms
- goto: ^redTag;duration:15000 # slow scroll effect for 15 seconds
```

## Emitting register events

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

---

## Todos

- [ ] Input focus for vcode input
- [ ] PasswordRecoveryHelper (Jiahao)
- [ ] redraw transition (`effect: slideLeft`)
- [ ] curry func utility to finalize parsings

## Accounts

| app     | phone #    | password    | who  | Notes            |
| ------- | ---------- | ----------- | ---- | ---------------- |
| admin   | 8882005050 | password    |      |
| admin   | 7144480995 | Baby2020!   |      |
| admin   | 5594215342 | Family3496  | toni |                  |
| admin   | 8884210047 | aitmed      | toni |                  |
| admind2 | 8880000301 |             |      |
| admind2 | 8885509773 | 123         |      |
| admind2 | 8886006001 | password    |      |
| admind2 | 8886006002 | password    |      |
| admind2 | 2134628002 | letmein123! |      |
| admind2 | 8883870054 | aitmed      | liz  | Josh Urgent Care |
| admind2 | 8886540007 | 123         |      | yongjian         |
| admind2 | 8884565043 | 123         |      | chenchen         |
| patd    | 8880081221 | letmein123! |      |
| patd    | 8884240000 | 12345       |      |
| patd2   | 8881122050 | 123         |      |
| prod    | 8885550010 | password    |      |
| prod    | 8884210053 | aitmed      | toni |
| meet4d  | 8882465555 | 142251      |      |
| meet4d  | 8882468491 | 142251      |      |
| meet4d  | 8882461234 | 142251      |      |

## Ecos types

- 1030
  - Id
- 1031
  - Does not require JWT
  - Generates JWT
  -
  - Secured login
- 1032
  - Auto secured login
  - Does not require JWT
  - With signature
- 1033
  - Owner login
  - Requires JWT
- bjwt --> Business jwt
- User 1110 login --> Checks relation between business and bjwt

## Login

- JWT expired --> 2 hours passed
- JWT not found --> server restarted

- Some apis like signing on does not provide a new jwt, but most do
- If an error occurred with jwt, attempt to relogin with an existing token

## Transactions

### Navigate

- App#navigate
  - ndom#request
    - Wrapped ndom func
      - `onRequestPageObject` (transactions.ts)
      - `getPageObject` (App.ts)

### `REQUEST_PAGE_OBJECT`

- Wrapped ndom func
  - `onRequestPageObject` (transactions.ts)
    - `getPageObject` (Ap

## Doc object

- Flags:
  - read (bit #2)
  - write (bit #3)
- Trash
- Sent
- Folder
  - creating (3840)
    - can create a tag (3589)
- Create
- bvid --> evid (creates message)
  - e10002
    - encryption key is placed here
    - doc msg type: d128
- Tag (3584)
  - Can be used to resolve conflicts (ex: person deletes the doc but the other person didnt)
  - uses fid to find folder tag
  - uses reid to find
- Draft
  - Goes in root notebook (since it is a personal file)
- There are now 2 notebooks (root and)

  - e10002 bvid --> evid

let index = 0
let currentPosition = 0
let pdfPageWidth = element width (453)
let pdfPageHeight = element height (899)
let overallHeight = 3033

- for each child of element
  - start loop with index as starting point
  - if child's height accumulated with `currentPosition` is _not_ larger than `pdfPageHeight`
    - add child's height to `currentPosition`
  - else if child's height accumulated with `currentPosition` is larger than `pdfPageHeight`
    - group all currently iterated children _not including the current child_
    - record the _top_ position of the _first_ grouped child
    - record the _bottom_ position of the _last_ grouped child
    - send grouped children along with the top and bottom to html2canvas where top is the scrollY and bottom is the Y crop
    - generate pdf
      - (onclone - html2canvas)
      - let clonePosition = 0
        - for each cloned child of cloned element
          - add cloned child's height to `clonePosition`
          - if cloned child's height accumulated with `clonePosition` is larger than the _bottom_ position of the last grouped (uncloned) child
            - hide the cloned child
    - reset `currentPosition` to 0
    - record the current child's index
    - restart (recursion) the call and:
      - make the start of the index the recorded index from the current child

## Debug tips

### Local gRPC server

- To reproduce `JWT_EXPIRED` error:
  1. Call `ce` using type `10` (clears cache then triggers jwt expired in server)

## error code 4 --> delay by 1+ seconds --> retry again

## 11/24/21

- Fixed error when populating strings and locations is null or undefined
- Debugging `replaceEvalObject` async in forEach
  - Used in initPage + runInit
  - Switch forEach loop with a better looping method
- Debugging `replaceIfObject` async in forEach
  - Used in initPage + runInit
  - Switch forEach loop with a better looping method

pushed @aitmed/cadl 1.0.450:

- the entire sdk is now sandboxed, we can start digging deeper into all the functions and behavior and understand/fix them in a very very very low level
- written unit tests on `populateKeys` --> this function is good and stable (also the most important in the sdk)
- fixed error when populating strings and locations is invalid
- fixed `replaceEvalObject` (unit tests exposed a hidden flaw in this func) async loop to use a better/accurate async way
  - this mainly used in `init` and `initPage`
  - this might have fixed some important random behavior on an `evalObject` _during init_ when a `goto` is called _while init is still running_
- unit tests on `populateString`
  - revealed 2 flaws on this function. this function is not doing what we expect so working on refactoring
- unit tests on `populateVars`
  - somewhat stable, but can be improved by implementing recursion on it
- unit tests on `lookUp` (needs to expand to support local root)
- unit tests on `replaceVars` (stable)

deployed:

- updated @aitmed/cadl sdk

## 11/24/21 backwards compatible subtype switching

if subtype is 0, we should automatically copy to type

if document subtype is 0, set it to -1 (backend will see this and set it to 0)
when we do cd and send api to backend, by this time all our bit is 0 (everything is 0). if so set these to -1

## 11/30/21

- Fixed a hidden issue in sdk where a doc is erased when merging a list of docs
- Fixed empty configUrl after logging out

## onChange call flow

1. should go through the handler created on `.addEventListener` from `noodl-ui-dom` first to update any data values accordingly
2. should then go to the handler created on `noodl-ui`
3. should call the `onChange` noodl function inside this call
4. should then end up back to the caller from `noodl-ui`

## 12/06/21

- Fixed evalObject firing twice (API change for DOM addEventListener)
- Fixed error for accessing reference strings for styles
