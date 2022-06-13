const u = require('@jsmanifest/utils')

class Head {
  static parse(str) {
    let parsed = str.split(' ')
    parsed[1] = parseInt(parsed[1])
    return parsed
  }

  constructor(str) {
    let parsed = Head.parse(str)
    let state = parsed[0]
    let location = parsed[1]
    this.update(state, location)
  }

  get status() {
    return `head state: ${this.state} | location: ${this.location}`
  }

  update(state, location) {
    this.state = state
    this.location = location
  }
}

class Tape {
  static parse(str) {
    return str.split(' ')
  }

  constructor(str) {
    this.tape = Tape.parse(str)
  }

  get status() {
    return this.tape.join(' ')
  }

  left() {
    this.tape.unshift('B')
  }

  right() {
    this.tape.push('B')
  }

  write(symb, location) {
    this.tape[location] = symb
  }
}

class TuringMachine {
  constructor(ruleset, tape, head) {
    this.ruleset = ruleset
    this.tape = tape
    this.head = head
  }

  get status() {
    return this.tape.status + ' || ' + this.head.status
  }

  run() {
    while (this.stepLookup()) {
      console.log(this.status)
      this.step()
    }

    console.log(`[Halt]`, this.status)
  }

  shiftHead(move) {
    if (this.head.location == 0 && move == 'L') {
      this.tape.left()
    } else if (this.head.location == this.tape.tape.length - 1 && move == 'R') {
      this.tape.right()
      this.head.location += 1
    } else if (move == 'L') {
      this.head.location -= 1
    } else {
      this.head.location += 1
    }
  }

  step() {
    let newState = this.stepLookup()[0]
    let newSymb = this.stepLookup()[1]
    let move = this.stepLookup()[2]

    this.tape.write(newSymb, this.head.location)
    this.head.state = newState
    this.shiftHead(move)
  }

  stepLookup() {
    if (
      this.ruleset[this.head.state] &&
      this.ruleset[this.head.state][this.tape.tape[this.head.location]]
    ) {
      return this.ruleset[this.head.state][this.tape.tape][this.head.location]
    } else {
      return false
    }
  }
}

function initialize(ruleset, tapeValue, headValue) {
  const tape = new Tape(tapeValue)
  const head = new Head(headValue)
  const machine = new TuringMachine(JSON.stringify(ruleset), tape, head)
  machine.run()
}

const ruleset = {
  s1: {
    0: ['s1', '0', 'R'],
    1: ['s1', '1', 'R'],
    B: ['s2', 'B', 'L'],
  },
  s2: {
    0: ['s3', '1', 'L'],
    1: ['s2', '0', 'L'],
    B: ['s3', '1', 'L'],
  },
  s3: {
    0: ['s3', '0', 'L'],
    1: ['s3', '1', 'L'],
    B: ['sh', 'B', 'R'],
  },
}

initialize(ruleset, '1 0 1 1', 's0 0')
