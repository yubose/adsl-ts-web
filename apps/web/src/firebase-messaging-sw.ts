/// <reference lib="WebWorker" />

declare var self: ServiceWorkerGlobalScope

import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'

self.__WB_MANIFEST
// precacheAndRoute(self.__WB_MANIFEST)
// registerRoute(
//   new RegExp(`/\\.(css|html|yml|mp4|min\\.js)$/`),
//   new StaleWhileRevalidate(),
// )
// registerRoute(({ request }) => {
//   return request.destination === 'script' || request.destination === 'style'
// }, new StaleWhileRevalidate())

importScripts('https://www.gstatic.com/firebasejs/8.2.5/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.2.5/firebase-messaging.js')

// @ts-expect-error
firebase.initializeApp({
  apiKey: 'AIzaSyCjNVKmHuDKra5Ct1MKAJ5fI0iQ3UnK7Ho',
  authDomain: 'aitmessage.firebaseapp.com',
  databaseURL: 'https://aitmessage.firebaseio.com',
  projectId: 'aitmessage',
  storageBucket: 'aitmessage.appspot.com',
  messagingSenderId: '121837683309',
  appId: '1:121837683309:web:c74076cea3ba35c35f3564',
})

// @ts-expect-error
const messaging = firebase.messaging()

// const handler = messaging.onBackgroundMessage(function (payload) {
//   console.log('[serviceWorker.js] Received background message ', payload)
//   // payload.from example --> "669708592038"
//   const { collapseKey, data, from, notification = {} } = payload
//   const notificationTitle = notification.title || ''
//   const notificationOptions = {
//     body: notification.body || '',
//     icon: 'favicon.ico',
//   }
//   // self.registration.showNotification(notificationTitle, notificationOptions)
// })

const style = `color:#C04000;font-weight:500;`
const tag = `%c[serviceWorker]`
const log = console.log

self.addEventListener('install', function (evt) {
  console.log(`${tag} install`, evt)
  // evt.waitUntil(
  //   caches
  //     .open('v1')
  //     .then(function (cache) {
  //       console.log('caching - getting')
  //       return cache.addAll(['/react-redux/a.js'])
  //     })
  //     .catch(function (error) {
  //       console.log('error', error)
  //     }),
  // )
})

self.addEventListener('activate', function (evt) {
  log(`${tag} activate`, evt)
})

// If a newer service worker sends a message to an older one,
// we'll update the old one immediately
self.addEventListener('message', function (messageEvent) {
  log(`${tag} message`, messageEvent)
  if (messageEvent.data === 'skipWaiting') return this.skipWaiting()
})

self.addEventListener('fetch', function onFetch(event) {
  // log(`${tag} fetch (${event.request.url})`)

  // event.respondWith(
  //   (async () => {
  //     if (
  //       event.request.mode === 'navigate' &&
  //       event.request.method === 'GET' &&
  //       registration.waiting &&
  //       (await clients.matchAll()).length < 2
  //     ) {
  //       registration.waiting.postMessage('skipWaiting')
  //       return new Response('', { headers: { Refresh: '0' } })
  //     }
  //     return (await caches.match(event.request)) || fetch(event.request)
  //   })(),
  // )
})

self.addEventListener('notificationclick', function (evt) {
  const { data } = evt.notification

  log(`${tag} Notification clicked`, style, {
    action: evt.action,
    notification: {
      title: evt.notification.title,
      body: evt.notification.body,
      data: evt.notification.data,
      dir: evt.notification.dir,
      icon: evt.notification.icon,
      lang: evt.notification.lang,
      tag: evt.notification.tag,
    },
    timestamp: evt.timeStamp,
    type: evt.type,
    evt,
  })

  if (data?.type === 'update-click') {
    evt.notification.close()
    this.registration.waiting?.postMessage({ type: 'send-skip-waiting' })
  }
})

self.addEventListener('push', function (pushEvt) {
  log(`${tag} Push`, style, {
    data: pushEvt.data,
    timestamp: pushEvt.timeStamp,
    type: pushEvt.type,
    pushEvt,
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

self.addEventListener('online', function (evt) {
  log(`${tag} online`, evt)
})

self.addEventListener('offline', function (evt) {
  log(`${tag} offline`, evt)
})

self.addEventListener('error', function (errEvt) {
  log(`${tag} error`, errEvt)
})

self.addEventListener('messageerror', function (evt) {
  log(`${tag} messageerror`, evt)
})

self.addEventListener('rejectionhandled', function (evt) {
  log(`${tag} rejectionhandled`, evt)
})

self.addEventListener('unrejectionhandled', function (evt) {
  log(`${tag} unrejectionhandled`, evt)
})

// self.addEventListener(
//   'notificationclose',
//   /** @type { ServiceWorkerGlobalScope['onnotificationclose'] } */
//   function (evt) {
//     log(`${tag} Notification closed`, style, {
//       action: evt.action,
//       notification: {
//         title: evt.notification.title,
//         body: evt.notification.body,
//         data: evt.notification.data,
//         dir: evt.notification.dir,
//         icon: evt.notification.icon,
//         lang: evt.notification.lang,
//         tag: evt.notification.tag,
//       },
//       timestamp: evt.timeStamp,
//       type: evt.type,
//     })
//   },
// )
