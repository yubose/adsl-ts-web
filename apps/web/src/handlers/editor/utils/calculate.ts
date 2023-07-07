class Calculate {
    #count: number
    constructor() {
        this.#count = 0
    }
    add() {
        this.#count++
    }
    reset(num: number) {
        this.#count = num
    }
    get count() {
        return this.#count
    }
}

let calc: Calculate | null

const CalculateInit = () => {
    calc = new Calculate()
}

const getCalc = () => {
    return calc
}

export {
    Calculate,
    CalculateInit,
    getCalc
}