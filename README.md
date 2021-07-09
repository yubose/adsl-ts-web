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

- [ ] PasswordRecoveryHelper (Jiahao)
- [x] Font size (Elaine)
- [x] fixed path not being appended to assets url for iteratorVar paths
- [ ] redraw transition (`effect: slideLeft`)
- [ ] support borderRadius in noodl unit (ex: "0.1") (relative to screen size)
- [ ] curry func utility to finalize parsings

## Accounts

| app    | phone #    | password |
| ------ | ---------- | -------- |
| admin  | 8882005050 | password |
| patd   | 8884240000 | 12345    |
| prod   | 8885550010 | password |
| meet4d | 8882465555 | 142251   |
| meet4d | 8882468491 | 142251   |
| meet4d | 8882461234 | 142251   |
