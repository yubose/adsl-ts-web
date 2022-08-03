## Building the Static Web App (Homepage) - _Last Updated 05/03/22_

1. `git clone http://gitlab.aitmed.com/frontend/aitmed-noodl-web.git`
2. `cd aitmed-noodl-web`
3. `git checkout dev2`
4. `npm install -f`
5. The static app will be built to: `./packages/homepage/public`. The files in this folder are the files we upload to an s3 bucket
6. To upload to s3 go to the `public` folder (`cd packages/homepage/public` or `cd ./public` if you are in the homepage folder)
7. Run `aws s3 sync . s3://public.aitmed.com/static/www/4.06.x/`
8. Go to AWS CloudFront and update the resource path

The app will be built using config `www` by default. To build with a different config like `mob.yml` pass `CONFIG=mob` to env variables when running `npm run build`

<!-- aws s3 sync . s3://public.aitmed.com/static/www/4.06.9/ -->

> Example:

On Mac:

```bash
lerna exec --scope homepage \"CONFIG=mob npm run build\"
```

or

```bash
export CONFIG=mob
lerna exec --scope homepage \"npm run build\"
```

On Windows:

```bash
lerna exec --scope homepage \"set CONFIG=mob && npm run build\"
```

<!-- April 15, 2022 -- -->

<!-- # right now, we are only able to build static page if the noodl file set does not contain dynamic info retrieved from backend. -->

<!-- 1. lerna clean
2. rm -rf node_module
3. npm install
4. cd packages/homepage
5. export CONFIG=www
6. npm run build;npm run build // to run the same build command twice.
7. cd public
8. aws s3 sync . s3://public.aitmed.com/static/www/4.06.x/
9. go to aws cloudFront update the resource path.
   k -->

## Steps to update the @aitmed/cadl eCOS package to latest version

- `npm install @aitmed/cadl@latest -f`
- `git add .`
- `git commit -a -m "updated aitmed sdk"`
- `git push`

## Install order in precedence to ensure build succeeds

1. `noodl-types`
2. `noodl-utils` + `noodl-action-chain`
3. `noodl-ui-test-utils`
4. `noodl-ui` + `noodl-ui-dom`

## Correct link to GitLab

- <https://gitlab.aitmed.com:443/frontend/aitmed-noodl-web.git>

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
- goto:
    destination: SignIn
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

## Test Accounts

| app         | phone #    | password    | who    | Notes            |
| ----------- | ---------- | ----------- | ------ | ---------------- |
| aitmedPay   | 8864567890 | 123         | dazhou |
| admin       | 8862005050 | password    |        |
| admin       | 7144480995 | Baby2020!   |        |
| admin       | 5594215342 | Family3496  | toni   |                  |
| admin       | 8864210047 | aitmed      | toni   |                  |
| admind      | 8865550418 | 123         |        | chenchen         |
| admind2     | 8860000301 |             |        |
| admind2     | 8865509773 | 123         |        |
| admind2     | 8866006001 | password    |        |
| admind2     | 8866006002 | password    |        |
| admind2     | 2134628002 | letmein123! |        |
| admind2     | 8863870054 | aitmed      | liz    | Josh Urgent Care |
| admind2     | 8866540007 | 123         |        | yongjian         |
| admind2     | 8864565043 | 123         |        | chenchen         |
| admind2     | 8862320918 | 888666      |        | yuhan            |
| admind2     | 8862324378 | 888666      |        | austin           |
| superadmin  | 8883202761 | 123         |        | dazhou           |
| superadmind | 8864567890 | 123         |        | elizabeth        |
| patient     | 8872465555 | 123         | me     |                  |
| patient     | 8862325577 | 111         | yuhan  |                  |
| patd2       | 8864565432 | 123         | jiahao |                  |
| provider    | 8882465555 | 123         | me     |                  |
| provider    | 8882461211 | 123         | me     |                  |
| patd        | 8860081221 | letmein123! |        |
| patd        | 8864240000 | 12345       |        |
| patd2       | 8861122050 | 123         |        |
| patd2       | 8864565432 | 123         | jiahao | albh3            |
| patd3       | 8862325577 | 111         | yuhan  |
| prod        | 8865550010 | password    |        |
| prod        | 8864210053 | aitmed      | toni   |
| meet        | 8882465555 | 123         | me     |
| meet        | 8882461211 | 123         | me     |
| meet4d      | 8862465555 | 142251      |        |
| meet4d      | 8862468491 | 142251      |        |
| meet4d      | 8862461234 | 142251      |        |

## Ecos types

- 1030
  - Id
- 1031
  - Does not require JWT
  - Generates JWT
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

## Login (Outdated)

- JWT expired --> 2 hours passed
- JWT not found --> server restarted

- Some apis like signing on does not provide a new jwt, but most do
- If an error occurred with jwt, attempt to relogin with an existing token

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

## Debug tips

### Local gRPC server

- To reproduce `JWT_EXPIRED` error:
  1. Call `ce` using type `10` (clears cache then triggers jwt expired in server)

## Error code 4 --> delay by 1+ seconds --> retry again

## onChange call flow

1. should go through the handler created on `.addEventListener` from `noodl-ui-dom` first to update any data values accordingly
2. should then go to the handler created on `noodl-ui`
3. should call the `onChange` noodl function inside this call
4. should then end up back to the caller from `noodl-ui`

## Todos

- Generic data-view-model input type checking (04/26/22)
