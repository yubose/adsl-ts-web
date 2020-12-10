import Logger from 'logsnap'
import firebase from 'firebase/app'
// import 'firebase/auth'
import 'firebase/messaging'

const log = Logger.create('firebase.ts')
const messaging = firebase.messaging()

const vapidKey =
  'BMVzqbFGARITrYSAi2mPaEMEl6WFBzkliYC8r92Ru3SGtyywC7t4boMPlwnFIeNSEBSyaxV6ue_uo2SMf7rdEHs'

const config = {
  apiKey: 'AIzaSyCjNVKmHuDKra5Ct1MKAJ5fI0iQ3UnK7Ho',
  authDomain: 'aitmessage.firebaseapp.com',
  databaseURL: 'https://aitmessage.firebaseio.com',
  projectId: 'aitmessage',
  storageBucket: 'aitmessage.appspot.com',
  messagingSenderId: '121837683309',
  appId: '1:121837683309:web:7fda76efe79928215f3564',
}

firebase.initializeApp(config)

export { messaging }

export async function getToken() {
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
