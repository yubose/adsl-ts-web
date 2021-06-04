# AiTmed NOODL Web

## Steps to update the @aitmed/cadl eCOS package to latest version

- npm install @aitmed/cadl@latest
- git add .
- git commit -a -m "update aitmed sdk"
- git push

## Globals

These variables are available globally:

| Variable  | Description                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `echarts` | [Chart library](https://echarts.apache.org/examples/en/index.html)used for components of type `chart` |

## References

- [TypeScript DOM types](https://github.com/microsoft/TypeScript/blob/master/lib/lib.dom.d.ts)
- [Merge requests](https://gitlab.aitmed.com/help/user/project/merge_requests/index.md#checkout-merge-requests-locally)

## Todos

- select options is now an array of objs
  - optionKey
  - dataKey gets set the object
- images with an empty `src` attribute showing the "special" border. disable it or make it invisible in `stable` env
- firebase [CDN](https://firebase.google.com/docs/web/setup#node.js-apps_1)
- twilio [CDN](https://www.twilio.com/docs/video/javascript)

## Notes

- MeetingChat notification
  - A goes to ContactsList to select B
  - A invites B
  - A goes to MeetingChat
  - B receives the invitation
  - Server sends notification with payload of document id (`did`)
  - A receives notification. Pass `did` to emit call

## Download feat. (ref: DocumentDetail)

- Pass builtIn fn
- Receive `ecosObj` to determine the mime type
- Show a (generic) popup for the download
  - Let them select a location to save to
  - Let them rename the file if needed

### `Note` ecosDoc

- Creating a comment on a note (DocumentDetail)
- Creating a note
  - Params to sdk:
    - title
    - content
    - targetRoomName
    - mediaType: text/plain
    - type: "1025"
  - Params response received from sdk:
    - title
    - data
    - targetRoomName
    - type: application/json
    - type: 1025
    - subtype:
      - mediaType: 8 (TextMediaType)

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

## Lib Todos

- have the same path/resource resolve logic for "poster" prop
- make output from resolved components as plain objs instead with some getInstance getter

## Goto Examples

```yml
- goto: AbcDashboard^redTag
- goto: AbcDashboard^redTag;duration:15000 # slow scroll effect for 15 seconds
- goto: AbcDashboard^redTag;duration:0 # instantly scroll to element
- goto: AbcDashboard^redTag # defaulted to 350 ms
- goto: ^redTag # defaulted to 350 ms
- goto: ^redTag;duration:15000 # slow scroll effect for 15 seconds
```

## Positioning

| When the component: | Value          |
| ------------------- | -------------- |
| Has `top`           | `absolute`     |
| Missing `top`       | `relative`     |
| Has `marginTop`     | _set to value_ |
| Missing `marginTop` | `0px`          |

## Hide/Show

- When a component is _hidden_ and has `position: relative`, _don't_ hold the space
- When a component has `position: absolute`, _hold_ the space

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

## Correctly clearing the console

```bash
process.stdout.write('\x1Bc')
```

### Data corrupted

- after creating room
  - cannot even leave room
  - room doesnt close when going out
