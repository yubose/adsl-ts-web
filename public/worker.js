/// <reference lib="WebWorker" />
/// <reference lib="WebWorker.ImportScripts" />

const tag = `[ServiceWorker]`
/** @type { ServiceWorkerGlobalScope } self */
const worker = this
console.log(worker)
console.log(worker)
console.log(worker)
console.log(worker)
/**
 * @param { ExtendableEvent } event
 */
self.oninstall = (event) => {
  console.log(`%c${tag} oninstall`, `color:aquamarine;`, event)
}

/**
 * @param { ExtendableEvent } event
 */
self.onactivate = (event) => {
  console.log(`%c${tag} onactivate`, `color:aquamarine;`, event)
}

/**
 * @param { ExtendableMessageEvent } event
 */
self.onmessage = (event) => {
  console.log(`%c${tag} onmessage`, `color:aquamarine;`, event)
}

/**
 * @param { FetchEvent } event
 */
self.onfetch = (event) => {
  console.log(`%c${tag} onfetch`, `color:aquamarine;`, event)
}

/**
 * @param { PushEvent } event
 */
self.onpush = (event) => {
  console.log(`%c${tag} onpush`, `color:aquamarine;`, event)
}

worker.addEventListener('message', (event) => {
  console.log(
    `%c${tag} addEventListener NEW MESSAGE`,
    `color:aquamarine;`,
    event,
  )
})
