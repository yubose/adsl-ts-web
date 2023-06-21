import { SharpOption, SharpType } from "./config"

const sharpHtml = (opts: SharpOption) => {
    let Asterisk = ``
    let type = opts.type.replace(/\*/g, '')
    switch (type) {
        case "TextView":
            if(opts.type?.endsWith("*")) 
                Asterisk = `<span style="color: red"> *</span>`
            return opts.html.replace(
                opts.split, 
                `<div style="margin: 15px 0;">
                    <div style="
                        margin: 15px 0;
                        color:#333333;
                        font-weight: 600;
                    ">${opts.config.title}${Asterisk}</div>
                    <textarea 
                        type="text" 
                        style="
                            box-sizing: border-box;
                            width: 100%;
                            text-indent: 0.8em;
                            min-height: 80px;
                            border-color: rgb(222,222,222);
                            color: rgb(51,51,51);
                            outline: none;
                            border-style: solid;
                            border-width: thin;
                            border-radius: 4px;
                            line-height: 40px;
                        "
                        placeholder="${opts.config.placeholder}"
                        readonly
                    ></textarea>
                </div>`
            )
        case "TextField": 
            if(opts.type?.endsWith("*")) 
                Asterisk = `<span style="color: red"> *</span>`
            return opts.html.replace(
                opts.split,
                `<div style="margin: 15px 0;">
                    <div style="
                        margin: 15px 0;
                        color:#333333;
                        font-weight: 600;
                    ">${opts.config.title}${Asterisk}</div>
                    <input 
                        type="text" 
                        style="
                            box-sizing: border-box;
                            width: 100%;
                            text-indent: 0.8em;
                            height: 40px;
                            border-color: rgb(222,222,222);
                            color: rgb(51,51,51);
                            outline: none;
                            border-style: solid;
                            border-width: thin;
                            border-radius: 4px;
                        " 
                        placeholder="${opts.config.placeholder}"
                        readonly
                    ></input>
                </div>`
            )
        case "Signature":
            return opts.html.replace(
                opts.split,
                `
                <div style="
                    color: #333333;
                    font-weight: 600;
                    wordBreak: keep-all
                ">
                    Signature
                </div>
                <div style="
                    margin: 15px 0;
                    width: 480px;
                    height: 160px;
                    background-color: #ffffff;
                    border: 2px dashed #a9a9a9;
                    border-radius: 0px;
                    outline: none;
                ">
                    <div style="
                        position: relative;
                        top: 90px;
                        width: 390px;
                        height: 24px;
                        margin: auto;
                        font-size: 1.54vw;
                        z-index: 1;
                        border-width: 1px;
                        border-color: #707070;
                        border-style: none none solid;
                        outline: none;
                        display: flex;
                        align-items: center;
                        justify-content: flex-start;
                    ">X</div>
                </div>
                `
            )
        default:
            // console.log(opts)
            // return opts.html
            return opts.html.replace(
                opts.split,
                `<div style="margin: 15px 0;">
                    <div style="
                        margin: 15px 0;
                        color:#333333;
                        font-weight: 600;
                    ">${opts.type}</div>
                    <textarea 
                        type="text" 
                        style="
                            box-sizing: border-box;
                            width: 100%;
                            text-indent: 0.8em;
                            min-height: 80px;
                            border-color: rgb(222,222,222);
                            color: rgb(51,51,51);
                            outline: none;
                            border-style: solid;
                            border-width: thin;
                            border-radius: 4px;
                            line-height: 40px;
                        "
                        placeholder="Enter here"
                        readonly
                    ></textarea>
                </div>`
            )
    }
}

export default sharpHtml