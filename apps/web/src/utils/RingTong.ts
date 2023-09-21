class RingTong{
    #audio:HTMLAudioElement
    constructor(){
        this.#audio = new Audio('ring.mp3')
        this.#audio.loop = true
    }
    play(){
        this.#audio.play()
    }
    stop(){
        this.#audio.pause()
        this.#audio.currentTime = 0
    }
}

export default RingTong