/// <reference lib="WebWorker" />

importScripts('https://www.gstatic.com/firebasejs/8.2.5/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.2.5/firebase-messaging.js')

declare const self: ServiceWorkerGlobalScope

// @ts-expect-error
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

self.addEventListener('activate', function (extEvt) {
  log(`${tag} Activated`, style, {
    eventPhase: extEvt.eventPhase,
    timestamp: extEvt.timeStamp,
    type: extEvt.type,
  })
})

self.addEventListener('install', function (extEvt) {
  log(`${tag} Installed`, style, {
    eventPhase: extEvt.eventPhase,
    timestamp: extEvt.timeStamp,
    type: extEvt.type,
  })
})

self.addEventListener('languagechange', function (evt) {
  log(`${tag} Language updated`, style, {
    eventPhase: evt.eventPhase,
    timestamp: evt.timeStamp,
    type: evt.type,
  })
})

self.addEventListener('online', function (evt) {
  log(`${tag} Online`, style, {
    eventPhase: evt.eventPhase,
    timestamp: evt.timeStamp,
    type: evt.type,
  })
})

self.addEventListener('offline', function (evt) {
  log(`${tag} Offline`, style, {
    eventPhase: evt.eventPhase,
    timestamp: evt.timeStamp,
    type: evt.type,
  })
})

self.addEventListener('fetch', function (evt) {
  log(`${tag} onfetch`, style, {
    clientId: evt.clientId,
    request: evt.request,
    resultingClientId: evt.resultingClientId,
    type: evt.type,
    timestamp: evt.timeStamp,
  })
})

self.addEventListener('message', function (msgEvt) {
  log(`${tag} Message event`, {
    crossOriginIsolated: self.crossOriginIsolated,
    location: self.location,
    origin: self.origin,
    data: msgEvt.data,
  })
  msgEvt.source?.postMessage('THANK YOU FOR THE MESSAGE')
})

self.addEventListener(`messageerror`, function (msgEvt) {
  log(`${tag} Message event error`, style, {
    data: msgEvt.data,
    origin: msgEvt.origin,
    ports: msgEvt.ports,
    source: msgEvt.source,
    timestamp: msgEvt.timeStamp,
  })
})

self.addEventListener('notificationclick', function (notifEvt) {
  log(`${tag} Notification clicked`, style, {
    action: notifEvt.action,
    notification: {
      title: notifEvt.notification.title,
      body: notifEvt.notification.body,
      data: notifEvt.notification.data,
      dir: notifEvt.notification.dir,
      icon: notifEvt.notification.icon,
      lang: notifEvt.notification.lang,
      tag: notifEvt.notification.tag,
    },
    timestamp: notifEvt.timeStamp,
    type: notifEvt.type,
  })
})

self.addEventListener('notificationclose', function (notifEvt) {
  log(`${tag} Notification closed`, style, {
    action: notifEvt.action,
    notification: {
      title: notifEvt.notification.title,
      body: notifEvt.notification.body,
      data: notifEvt.notification.data,
      dir: notifEvt.notification.dir,
      icon: notifEvt.notification.icon,
      lang: notifEvt.notification.lang,
      tag: notifEvt.notification.tag,
    },
    timestamp: notifEvt.timeStamp,
    type: notifEvt.type,
  })
})

self.addEventListener('push', function (pushEvt) {
  log(`${tag} Push event`, style, {
    data: pushEvt.data,
    timestamp: pushEvt.timeStamp,
    type: pushEvt.type,
  })

  const data = pushEvt.data // PushMessageData
  const currentTarget = pushEvt.currentTarget // ServiceWorkerGlobalScope
  const location = pushEvt?.target?.location // WorkerLocation
  const navigator = currentTarget?.navigator // WorkerNavigator
  const connection = navigator.connection // NetworkInformation
  const storage = navigator.storage // StorageManager
  const { onLine, userAgent } = navigator
  const platform = navigator.platform // ex: "MacIntel"
  const userAgentData = navigator.userAgentData // NavigatorUAData
  const isMobile = userAgentData.mobile
  // const self = target.self // ServiceWorkerGlobalScope
  const caches = self.caches // CacheStorage
})

self.addEventListener('error', function (errEvt) {
  log(`${tag} Error`, style, {
    error: errEvt.error,
    message: errEvt.message,
    timestamp: errEvt.timeStamp,
    type: errEvt.type,
    filename: errEvt.filename,
    column: errEvt.colno,
  })
})

self.addEventListener('rejectionhandled', async function (rejEvt) {
  log(`${tag} Promise rejection handled`, style, {
    promise: await rejEvt.promise,
    reason: rejEvt.reason,
    timestamp: rejEvt.timeStamp,
    type: rejEvt.type,
  })
})

self.addEventListener('unhandledrejection', async function (unRejEvt) {
  log(`${tag} Promise rejection unhandled`, style, {
    eventPhase: unRejEvt.eventPhase,
    promise: await unRejEvt.promise,
    reason: unRejEvt.reason,
    timestamp: unRejEvt.timeStamp,
    type: unRejEvt.type,
  })
})

export default null
