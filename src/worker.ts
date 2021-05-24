/// <reference lib="WebWorker" />
/// <reference lib="WebWorker.ImportScripts" />
// import CADL from '@aitmed/cadl'

const tag = `[ServiceWorker]`

// @ts-expect-error
self.oninstall = (event: ExtendableEvent) => {
  console.log(`%c${tag} oninstall`, `color:aquamarine;`, event)
}

// @ts-expect-error
self.onactivate = (event: ExtendableEvent) => {
  console.log(`%c${tag} onactivate`, `color:aquamarine;`, event)
}

self.addEventListener('message', function onWorkerMessage(evt) {
  // const sdk = new CADL({
  //   aspectRatio: 1,
  //   cadlVersion: 'test',
  //   configUrl: `https://public.aitmed.com/config/meet4d.yml`,
  // })
  // console.log(sdk)
  console.log(`%c${tag} onmessage`, `color:aquamarine;`, {
    thisValue: this,
    event: evt,
  })
})

// @ts-expect-error
self.onfetch = (event: FetchEvent) => {
  console.log(`%c${tag} onfetch`, `color:aquamarine;`, event)
}

// @ts-expect-error
self.onpush = (event: PushEvent) => {
  console.log(`%c${tag} onpush`, `color:aquamarine;`, event)
}
