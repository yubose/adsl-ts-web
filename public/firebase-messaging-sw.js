importScripts('https://www.gstatic.com/firebasejs/8.2.5/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.2.5/firebase-messaging.js')

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.

firebase.initializeApp({
  apiKey: 'AIzaSyCLZ-Dt3JAWN9PdihiYGuETs6K_30bSjEo',
  authDomain: 'aitmed-web-messaging.firebaseapp.com',
  projectId: 'aitmed-web-messaging',
  storageBucket: 'aitmed-web-messaging.appspot.com',
  messagingSenderId: '669708592038',
  appId: '1:669708592038:web:c9752e240c6d60761a6567',
  measurementId: 'G-BD4SJ9X3SL',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(function (payload) {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload,
  )
  // payload.from example --> "669708592038"
  const { collapseKey, data, from, notification } = payload
  const notificationTitle = notification.title || ''
  const notificationOptions = {
    body: notification.body || '',
    icon: 'favicon.ico',
  }
  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('push', (event /* PushEvent */) => {
  console.log(`Received push event`, event)
  const data = event.data // PushMessageData
  const currentTarget = event.currentTarget // ServiceWorkerGlobalScope
  const location = currentTarget.location // WorkerLocation
  const navigator = currentTarget.navigator // WorkerNavigator
  const connection = navigator.connection // NetworkInformation
  const storage = navigator.storage // StorageManager
  const { onLine, userAgent } = navigator
  const platform = navigator.platform // ex: "MacIntel"
  const userAgentData = navigator.userAgentData // NavigatorUAData
  const isMobile = userAgentData.mobile
  const self = target.self // ServiceWorkerGlobalScope
  const caches = self.caches // CacheStorage
})

self.addEventListener('notificationclick', function (event) {
  console.log(event)
  console.log(event)
  console.log(event)
  console.log(event)
  console.log(event)

  window.alert('You sent an event', event)
})
