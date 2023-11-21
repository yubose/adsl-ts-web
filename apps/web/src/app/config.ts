export const firebase = {
  webOld: {
    vapidKey:
      'BEb8QpoY40PkX-CNNH218EIe30xVh1SQSTm0vsQVXDrto42Hh1Q7rxK_bAmEFQfeIwYg7pldhdKF25IXWMd2HiE',
    config: {
      apiKey: 'AIzaSyCLZ-Dt3JAWN9PdihiYGuETs6K_30bSjEo',
      authDomain: 'aitmed-web-messaging.firebaseapp.com',
      projectId: 'aitmed-web-messaging',
      storageBucket: 'aitmed-web-messaging.appspot.com',
      messagingSenderId: '669708592038',
      appId: '1:669708592038:web:c9752e240c6d60761a6567',
      measurementId: 'G-BD4SJ9X3SL',
    },
  },
  webPatient: {
    serverKey:
      'AAAAHF4Xgm0:APA91bFXlxSS6cnuPu7plm5ToLEo0X6hUFco4CbAQh1_do5sSKyrCQuCkPo2fRxoSt-rjlwBripKiml1bZ_jEIS2qIEDFLZL3YNU3j5w9Zroe_5Rvs4x41uKWQuAndGUR7CGFZcPcKU_',
    vapidKey:
      'BMVzqbFGARITrYSAi2mPaEMEl6WFBzkliYC8r92Ru3SGtyywC7t4boMPlwnFIeNSEBSyaxV6ue_uo2SMf7rdEHs',
    // keypair pkey: lwMn-7X-lc1hfNP4k_j9HYWWr1vGzORRGewVx6hP28s
    config: {
      apiKey: 'AIzaSyCjNVKmHuDKra5Ct1MKAJ5fI0iQ3UnK7Ho',
      authDomain: 'aitmessage.firebaseapp.com',
      databaseURL: 'https://aitmessage.firebaseio.com',
      projectId: 'aitmessage',
      storageBucket: 'aitmessage.appspot.com',
      messagingSenderId: '121837683309',
      appId: '1:121837683309:web:c74076cea3ba35c35f3564',
    },
  },
  webProvider: {
    apiKey: 'AIzaSyCjNVKmHuDKra5Ct1MKAJ5fI0iQ3UnK7Ho',
    authDomain: 'aitmessage.firebaseapp.com',
    databaseURL: 'https://aitmessage.firebaseio.com',
    projectId: 'aitmessage',
    storageBucket: 'aitmessage.appspot.com',
    messagingSenderId: '121837683309',
    appId: '1:121837683309:web:d8f3b3733a65a6fb5f3564',
  },
} as const


let _square
switch (process.env.PLATEFORM_ENV) {
  case 'com':
    _square = {
      appId: 'sq0idp-mfW2Mc6WUxEdLbxntQEu1A',
      locationId: 'LP1ZFHGWKM7KR'
    }
    break;
  case 'd':
    _square = {
      appId: 'sandbox-sq0idb-CirdOVOXW8NUECTbqI1Bbg',
      locationId: 'L3P65NPGFEZVP'
    }
    break;
  case 'cn':
    _square = {
      appId: 'sandbox-sq0idb-CirdOVOXW8NUECTbqI1Bbg',
      locationId: 'L3P65NPGFEZVP'
    }
    break;

  default:
    _square = {
      appId: 'sandbox-sq0idb-CirdOVOXW8NUECTbqI1Bbg',
      locationId: 'L3P65NPGFEZVP'
    }
    break;
}
_square = {
  appId: 'sq0idp-mfW2Mc6WUxEdLbxntQEu1A',
  locationId: 'LP1ZFHGWKM7KR'
}
export const Square = _square