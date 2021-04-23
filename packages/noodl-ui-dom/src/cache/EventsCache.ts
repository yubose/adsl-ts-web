import { ICache } from 'noodl-ui'

type EventName = string
type EventItem = (...args: any[]) => any
type EventsMap = Map<EventName, EventItem[]>
type EventsCacheStore = Map<string, EventsMap>

class EventsCache implements ICache {
  #cache: EventsCacheStore = new Map();

  [Symbol.iterator]() {
    const items = [] as { id: string; evtKey: EventName; items: EventItem[] }[]

    for (const [elemId = '', evtMap] of this.#cache.entries()) {
      for (const [evtKey = '', evtItems = []] of evtMap.entries()) {
        items.push({ id: elemId, evtKey, items: evtItems })
      }
    }

    items.reverse()

    return {
      next: () => {
        return {
          value: items.pop(),
          done: !items.length,
        }
      },
    }
  }

  clear(node?: HTMLElement | null) {
    const clearNode = (n?: HTMLElement | null) => {
      if (n) {
        if (n.dataset?.globalid) {
          return
        }
        for (const [evtKey, items] of this.#cache.get(n.id)?.entries() || []) {
          items.forEach((item) => {
            n.removeEventListener(evtKey, item)
          })
          console.log(
            `%cRemoved ${items.length} "${evtKey}" event listeners`,
            `color:#95a5a6;`,
          )
        }
      }
    }

    if (node?.id && this.#cache.has(node.id)) {
      clearNode(node)
    } else {
      for (const [elemId, evtMap] of this.#cache) {
        node = document.getElementById(elemId)
        clearNode(node)
        evtMap.clear()
        this.#cache.delete(elemId)
      }
    }
  }

  has<E extends EventName>(elemId: string | undefined, evtKey: E) {
    return !!(
      elemId &&
      evtKey &&
      this.#cache.has(elemId) &&
      this.#cache.get(elemId)?.has(evtKey)
    )
  }

  get<E extends EventName>(elemId: string | undefined, evtKey: E): EventItem[]
  get(elemId: string | undefined): EventsMap
  get(): EventsCacheStore
  get<E extends EventName = EventName>(elemId?: string, evtKey?: E) {
    if (elemId) {
      let evtMap = this.#cache.get(elemId)
      if (!evtMap) {
        this.#cache.set(elemId, new Map())
        evtMap = this.#cache.get(elemId)
      }
      if (evtKey) {
        let items = evtMap?.get(evtKey)
        if (!items) {
          items = []
          evtMap?.set(evtKey, items)
        }
        return evtMap?.get(evtKey) || []
      }
      return this.#cache.get(elemId)
    }
    return this.#cache
  }

  set(elemId: string, evtKey: EventName, items: EventItem[]) {
    this.get(elemId).set(evtKey, items)
  }

  get length() {
    let value = 0

    for (const evts of this.#cache.values()) {
      for (const evt of evts.values()) {
        value += evt.length
      }
    }
    return value
  }
}

export default EventsCache
