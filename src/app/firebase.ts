import firebase from 'firebase/app'
import { firebase as firebaseConfiguration } from './config'
import 'firebase/auth'
import 'firebase/messaging'

export function isSupported() {
  return firebase.messaging.isSupported()
}

export default process.env.NODE_ENV === 'test'
  ? null
  : firebase.initializeApp(firebaseConfiguration.webPatient.config)
