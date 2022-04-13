# AiTmed NOODL Web

## Steps to update the @aitmed/cadl eCOS package to latest version

- npm install @aitmed/cadl@latest
- git add .
- git commit -a -m "update aitmed sdk"
- git push

## Install order in precedence to ensure build succeeds

1. noodl-types
2. noodl-utils + noodl-action-chain
3. noodl-ui-test-utils
4. noodl-ui + noodl-ui-dom

## Correct link to GitLab

- <https://gitlab.aitmed.com:443/frontend/aitmed-noodl-web.git/>

## Storage API

For local storage / caching use the functions at `src/utils/lf.ts`

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

## Accounts

| app       | phone #    | password    | who    | Notes            |
| --------- | ---------- | ----------- | ------ | ---------------- |
| aitmedPay | 8864567890 | 123         | dazhou |
| admin     | 8862005050 | password    |        |
| admin     | 7144480995 | Baby2020!   |        |
| admin     | 5594215342 | Family3496  | toni   |                  |
| admin     | 8864210047 | aitmed      | toni   |                  |
| admind2   | 8860000301 |             |        |
| admind2   | 8865509773 | 123         |        |
| admind2   | 8866006001 | password    |        |
| admind2   | 8866006002 | password    |        |
| admind2   | 2134628002 | letmein123! |        |
| admind2   | 8863870054 | aitmed      | liz    | Josh Urgent Care |
| admind2   | 8866540007 | 123         |        | yongjian         |
| admind2   | 8864565043 | 123         |        | chenchen         |
| admind2   | 8862320918 | 888666      |        | yuhan            |
| admind2   | 8862324378 | 888666      |        | austin           |
| patient   | 8872465555 | 123         | me     |                  |
| patient   | 8862325577 | 111         | yuhan  |                  |
| provider  | 8882465555 | 123         | me     |                  |
| provider  | 8882461211 | 123         | me     |                  |
| patd      | 8860081221 | letmein123! |        |
| patd      | 8864240000 | 12345       |        |
| patd2     | 8861122050 | 123         |        |
| patd3     | 8864565432 | 123         | jiahao |
| patd3     | 8862325577 | 111         | yuhan  |
| prod      | 8865550010 | password    |        |
| prod      | 8864210053 | aitmed      | toni   |
| meet      | 8882465555 | 123         | me     |
| meet      | 8882461211 | 123         | me     |
| meet4d    | 8862465555 | 142251      |        |
| meet4d    | 8862468491 | 142251      |        |
| meet4d    | 8862461234 | 142251      |        |

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

---

## 02/10/22 Flow

- Input:
  - `baseEl`
  - `el`
  - `pageHeight`
- Init
  - Let `offsetStart` be `0`
  - Let `offsetEnd` be `0`
- While `currEl`
  - Let `elHeight` be element's height
  - Let `accHeight` be the accumulating height
  - If `accHeight` > `offsetEnd`
    - If `currEl` has children
      - If `elHeight` < `pageHeight`
        - Flatten
      - Else if `elHeight` > `pageHeight`
        - Flatten _Recursion_ on children beginning with `currEl.firstChild`
    - Else if `currEl` does _not_ have children
      - Flatten
      - Set `offsetStart` to `accHeight`
      - Set `offsetEnd` to `pageHeight` + `elHeight`
  - Else if `accHeight` < `offsetEnd`

## Twilio handling todos

- [ParticipantNotFoundError](https://sdk.twilio.com/js/video/releases/2.21.0/docs/ParticipantNotFoundError.html)

```js
switch (error.code) {
  // 'Invalid Access Token header'
  case 20102:
    return toast(error.message, { type: 'error' })
  // 'Invalid Access Token'
  case 20101:
  // 'Access Token expired or expiration date invalid
  case 20104:
  // 'Access Token not yet valid'
  case 20105:
  // 'Invalid Access Token grants'
  case 20106:
  // 'Invalid Access Token signature'
  case 20107:
  // 'Invalid Access Token issuer/subject'
  case 20103:
    // TODO - Try reconnecting
    break
  // 'Signaling connection error'
  case 53000:
  // 'Signaling connection disconnected'
  case 53001:
  // 'Signaling connection timed out'
  case 53002:
  // 'Video server is busy'
  case 53006:
  // 'Room name is invalid'
  case 53100:
  // 'Room name is too long'
  case 53101:
  // 'Room name contains invalid characters'
  case 53102:
    // Raised whenever a Client is unable to connect to a Room
    // 'Unable to create Room'
    return toast(`The server was unable to create a room`, {
      type: 'error',
    })
  case 53103:
  // 'Unable to connect to Room'
  case 53104:
  // 'Room contains too many Participants'
  case 53105:
  // 'Room not found'
  case 53106:
    return toast(error.message, { type: 'error' })
  // 'The subscription operation requested is not supported for the Room type
  case 53117:
  // 'Participant identity is invalid'
  case 53200:
  // 'Participant identity is too long'
  case 53201:
  // 'Participant identity contains invalid characters'
  case 53202:
  // 'The maximum number of published tracks allowed in the Room at the same time has been reached'
  case 53203:
  // 'Participant not found'
  case 53204:
  // 'Participant disconnected because of duplicate identity'
  case 53205:
    return toast(error.message, { type: 'error' })
  // 'Track is invalid'
  case 53300:
  // 'Track name is invalid'
  case 53301:
  // 'Track name is too long'
  case 53302:
  // 'Track name contains invalid characters'
  case 53303:
  // 'Track name is duplicated'
  case 53304:
  // 'The server has reached capacity and cannot fulfill this request'
  case 53305:
  // 'No supported codec'
  case 53404:
    // TODO - Try re-creating the failed track
    return toast(
      `Could not find a supported codec when publishing a track. Check microphone/camera to see if they are working`,
      { type: 'error' },
    )
  // 'Media connection failed or Media activity ceased'
  case 53405:
  // 'Media connection failed due to DTLS handshake failure'
  case 53407:
    return toast(
      `Could not establish a secure connection with the server. Please refresh the page and try again, or try again later.`,
      { type: 'error' },
    )
  // Occurs during preflight test
  // 'Unable to acquire TURN credentials'
  case 53501:
  default:
    throw error instanceof Error ? error : new Error(String(error))
}
```
