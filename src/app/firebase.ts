import Logger from 'logsnap'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/messaging'

const log = Logger.create('firebase.ts')

export const vapidKey =
  'BEb8QpoY40PkX-CNNH218EIe30xVh1SQSTm0vsQVXDrto42Hh1Q7rxK_bAmEFQfeIwYg7pldhdKF25IXWMd2HiE'

export const firebaseConfig = {
  apiKey: 'AIzaSyCLZ-Dt3JAWN9PdihiYGuETs6K_30bSjEo',
  authDomain: 'aitmed-web-messaging.firebaseapp.com',
  projectId: 'aitmed-web-messaging',
  storageBucket: 'aitmed-web-messaging.appspot.com',
  messagingSenderId: '669708592038',
  appId: '1:669708592038:web:c9752e240c6d60761a6567',
  measurementId: 'G-BD4SJ9X3SL',
}

export const serverKeys = [
  'AAAAHF4Xgm0:APA91bG8hNVW5QOMN38vbPYDWP0GW1mlVlimZ9yVbAPRR_X9Udyu-NqluX27qBFMKdbHqhuvmfooos2E75UvCNfL4V-niDGv1eFf1ySPEVHl_E-YGSD8KGEJGtKCjObLfhtOcyaPCDkm',
  'AAAAHF4Xgm0:APA91bFXlxSS6cnuPu7plm5ToLEo0X6hUFco4CbAQh1_do5sSKyrCQuCkPo2fRxoSt-rjlwBripKiml1bZ_jEIS2qIEDFLZL3YNU3j5w9Zroe_5Rvs4x41uKWQuAndGUR7CGFZcPcKU_',
]

// Your Sender ID can be used for both server keys and legacy server key tokens.
export const senderId = '121837683309'

export async function getToken(messaging: any) {
  log.func('getToken')
  try {
    const token = await messaging.getToken({ vapidKey })
    log.grey(`Firebase messaging token received as: ${token}`)
    if (token) {
    } else {
      // Show permission request.
      log.red(
        'No registration token available. Request permission to generate one.',
      )
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err)
    window.alert(`[${err.name}]: ${err.message}`)
  }
}

const app = firebase.initializeApp(firebaseConfig)

export default app
