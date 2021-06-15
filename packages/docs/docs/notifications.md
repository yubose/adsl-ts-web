---
id: notifications
title: Notifications
sidebar_position: 3
---

## Register

### Common props

- title
- description
- icon
- onClick
- registerEvent

### Receiver receives invite to meeting

- registerEvent `onNewMeetingInvite`

### Receiver is notified there is a new message in the chatroom

- registerEvent `onNewMessage`
- did

### Receiver is notified of a new document that is uploaded/shared to them

- registerEvent: `onNewDocument`
- did

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

```ts
interface AppNotificationMessageObject {
  title?: string;
  description?: string;
  icon?: string;
  did?: string;
}
```

## `onNewDocument`

```js
NUI.use({
  register: [
    {
      name: "onNewDocument",
      async fn() {
        //
      },
    },
    {
      name: "onNewMessage",
      async fn() {
        //
      },
    },
    {
      name: "onNewMeetingInvite",
      async fn() {
        //
      },
    },
  ],
});
```

- `NUI.use({ register: <> })`

### Handling register events

```js
const onNewMessage = {
  callImmediately: true,
  async fn(action, options) {},
  useReturnValue: true,
};

const registerEvents = {};
```

### Register components

`NUI` by default can take a `register` component and create a register object with a default callback function that calls all action handlers of type `"register"`.

The insert behavior may differ in the following scenarios:

1. There is already an existing custom handler function for that register event (in this case the default callback will be created to favor the custom one instead)
2. There is not a custom handler function (by default, this will create the default callback)
