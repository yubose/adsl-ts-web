class NavigateRequest {
  reqs: any[] = []

  register(val) {
    if (!this.reqs.length) this.reqs.push(val)
    else this.reqs[this.reqs.length - 1].next = val
    return this
  }

  execute(...args: any[]) {
    let req = this.reqs.shift()

    while (typeof req === 'function') {
      req(...args)
      req = req.next
    }
  }
}

const req = new NavigateRequest()
let count = 0

req
  .register(() => null)
  .register(() => {
    console.log(`Current count: ${++count}`)
  })

req.execute()

export default NavigateRequest
