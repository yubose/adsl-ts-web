//进行图像进度条和加载进度绑定
export default class UploadProgress{
    private _imageList = new Map()
    private _options
    constructor(opt?: Object){
        this._options = {
            strokeWidth: 3,
            strokeDashoffset: 110,
            ...opt
        }
    }

    generateProgress(key:string){
        const fragment = document.createDocumentFragment()
        const mask = document.createElement('div')
        mask.style.cssText = `
            position: absolute;
            display: flex;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: #707070;
            opacity: 0.5;
            z-index: 100;
        `

        const circleProgress = document.createElement('div')
        circleProgress.style.cssText = `
            display: flex;
            margin: auto;
            width: 20%;
            height: 20%;
        `
        const center = Math.ceil(circleProgress.offsetWidth/2)?Math.ceil(circleProgress.offsetWidth/2):20
        const svgNS = 'http://www.w3.org/2000/svg'
        const svg = document.createElementNS(svgNS,'svg')
        svg.setAttribute('xmlns:xlink',svgNS)
        svg.style.cssText = `
            width: 100%;
            height: 100%;
        `
        const circleBackground = document.createElementNS(svgNS,'circle')
        circleBackground.setAttribute('xmlns:xlink',svgNS)
        circleBackground.style.cssText = `
            cx: ${center};
            cy: ${center};
            r: ${center-this._options.strokeWidth};
            fill: none;
            stroke: #000000;
            stroke-width: ${this._options.strokeWidth};
        `

        const circleFront = document.createElementNS(svgNS,'circle')
        circleFront.setAttribute('xmlns:xlink',svgNS)
        circleFront.style.cssText = `
            cx: ${center};
            cy: ${center};
            r: ${center-this._options.strokeWidth};
            fill: none;
            stroke: #ffffff;
            stroke-width: ${this._options.strokeWidth};
            stroke-dasharray: ${this._options.strokeDashoffset};
            stroke-dashoffset: ${this._options.strokeDashoffset};
            animation: circle 3s infinite;
            transform:rotate(-90deg);
            transform-origin: center;
            transform-box:fill-box;
            transition: all 1s;
        `
        svg.appendChild(circleBackground)
        svg.appendChild(circleFront)
        circleProgress.appendChild(svg)
        mask.appendChild(circleProgress)
        fragment.appendChild(mask)

        this._imageList.set(key,{circleFront,mask})

        return fragment
    }

    emitProgress(key:string,progress:number){
        if(this._imageList.size>0 && this._imageList.has(key)){
            const {mask,circleFront} = this._imageList.get(key)
            if(mask.style.visibility === 'hidden'){
                mask.style.visibility = 'visible'
            }
            this.setPercent(circleFront,progress)
            if(progress === 101){
                mask.parentElement.removeChild(mask)
                // mask.remove()
            }
        }
    }

    private setPercent=(circle:HTMLElement,progress:number)=>{
        const progressLen=this._options.strokeDashoffset
        if(progress>100) return;
        circle.style['stroke-dashoffset']= progressLen - (progressLen/100)*progress
    }


}