import yaml from 'yaml'
import Logger from 'logsnap'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/messaging'

const log = Logger.create('firebase.ts')

export const vapidKey =
  'BMVzqbFGARITrYSAi2mPaEMEl6WFBzkliYC8r92Ru3SGtyywC7t4boMPlwnFIeNSEBSyaxV6ue_uo2SMf7rdEHs'

export const firebaseConfig = {
  apiKey: 'AIzaSyCjNVKmHuDKra5Ct1MKAJ5fI0iQ3UnK7Ho',
  authDomain: 'aitmessage.firebaseapp.com',
  databaseURL: 'https://aitmessage.firebaseio.com',
  projectId: 'aitmessage',
  storageBucket: 'aitmessage.appspot.com',
  messagingSenderId: '121837683309',
  appId: '1:121837683309:web:7fda76efe79928215f3564',
}

export const webPushCertificatesKeyPair =
  'BMVzqbFGARITrYSAi2mPaEMEl6WFBzkliYC8r92Ru3SGtyywC7t4boMPlwnFIeNSEBSyaxV6ue_uo2SMf7rdEHs'

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
