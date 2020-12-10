import Logger from 'logsnap'

const log = Logger.create('firebase.ts')

const vapidKey =
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

export async function getToken(messaging) {
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
