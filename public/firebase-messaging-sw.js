importScripts('https://www.gstatic.com/firebasejs/8.2.5/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.2.5/firebase-messaging.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCjNVKmHuDKra5Ct1MKAJ5fI0iQ3UnK7Ho',
  authDomain: 'aitmessage.firebaseapp.com',
  databaseURL: 'https://aitmessage.firebaseio.com',
  projectId: 'aitmessage',
  storageBucket: 'aitmessage.appspot.com',
  messagingSenderId: '121837683309',
  appId: '1:121837683309:web:7fda76efe79928215f3564',
})

// @ts-expect-error
const messaging = firebase.messaging()

messaging.onBackgroundMessage(function (payload) {
  console.log('[serviceWorker.js] Received background message ', payload)
  // payload.from example --> "669708592038"
  const { collapseKey, data, from, notification = {} } = payload
  const notificationTitle = notification.title || ''
  const notificationOptions = {
    body: notification.body || '',
    icon: 'favicon.ico',
  }
  self.registration.showNotification(notificationTitle, notificationOptions)
})

const style = `color:#C04000;font-weight:500;`
const tag = `%c[serviceWorker]`
const log = console.log

self.addEventListener(
  'fetch',
  /** @type { ServiceWorkerGlobalScope['onfetch'] } */
  function (evt) {
    log(`${tag} onfetch`, style, {
      clientId: evt.clientId,
      request: evt.request,
      resultingClientId: evt.resultingClientId,
      type: evt.type,
      timestamp: evt.timeStamp,
    })
  },
)

// self.addEventListener(
//   'push',
//   /** @type { ServiceWorkerGlobalScope['onpush'] } */
//   function (pushEvt) {
//     log(`${tag} Push event`, style, {
//       data: pushEvt.data,
//       timestamp: pushEvt.timeStamp,
//       type: pushEvt.type,
//     })

//     const data = pushEvt.data // PushMessageData
//     const currentTarget = pushEvt.currentTarget // ServiceWorkerGlobalScope
//     const location = pushEvt?.target?.location // WorkerLocation
//     const navigator = currentTarget?.navigator // WorkerNavigator
//     const connection = navigator.connection // NetworkInformation
//     const storage = navigator.storage // StorageManager
//     const { onLine, userAgent } = navigator
//     const platform = navigator.platform // ex: "MacIntel"
//     const userAgentData = navigator.userAgentData // NavigatorUAData
//     const isMobile = userAgentData.mobile
//     // const self = target.self // ServiceWorkerGlobalScope
//     const caches = self.caches // CacheStorage
//   },
// )

// self.addEventListener(
//   'notificationclick',
//   /** @type { ServiceWorkerGlobalScope['onnotificationclick'] } */
//   function (notifEvt) {
//     log(`${tag} Notification clicked`, style, {
//       action: notifEvt.action,
//       notification: {
//         title: notifEvt.notification.title,
//         body: notifEvt.notification.body,
//         data: notifEvt.notification.data,
//         dir: notifEvt.notification.dir,
//         icon: notifEvt.notification.icon,
//         lang: notifEvt.notification.lang,
//         tag: notifEvt.notification.tag,
//       },
//       timestamp: notifEvt.timeStamp,
//       type: notifEvt.type,
//     })
//   },
// )

// self.addEventListener(
//   'notificationclose',
//   /** @type { ServiceWorkerGlobalScope['onnotificationclose'] } */
//   function (notifEvt) {
//     log(`${tag} Notification closed`, style, {
//       action: notifEvt.action,
//       notification: {
//         title: notifEvt.notification.title,
//         body: notifEvt.notification.body,
//         data: notifEvt.notification.data,
//         dir: notifEvt.notification.dir,
//         icon: notifEvt.notification.icon,
//         lang: notifEvt.notification.lang,
//         tag: notifEvt.notification.tag,
//       },
//       timestamp: notifEvt.timeStamp,
//       type: notifEvt.type,
//     })
//   },
// )
