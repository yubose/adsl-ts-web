import { SharpOption, SharpType } from "./config"
import { textSharpSplitReg } from "./textSharp"
import { getHTMLDataArray } from "./utils"

const circleSvg = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48ZyBkYXRhLW5hbWU9IjcwOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYjdiN2I3Ij48Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iOCIgc3Ryb2tlPSJub25lIi8+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjcuNSIvPjwvZz48L3N2Zz4=`
const circleDefault = `data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IjE2NiAzIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48ZyBkYXRhLW5hbWU9IjcwOCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDA1Nzk1IiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjgiIGN5PSI4IiByPSI4IiBzdHJva2U9Im5vbmUiLz48Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iNyIgZmlsbD0ibm9uZSIvPjwvZz48Y2lyY2xlIGRhdGEtbmFtZT0iNzEwIiBjeD0iNCIgY3k9IjQiIHI9IjQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQgNCkiIGZpbGw9IiMwMDU3OTUiLz48L3N2Zz4=`
const checkSvg = `data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IjE2NCA1NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PGcgZGF0YS1uYW1lPSIxODE1MyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZGVkZWRlIj48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHJ4PSIyIiBzdHJva2U9Im5vbmUiLz48cmVjdCB4PSIuNSIgeT0iLjUiIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgcng9IjEuNSIvPjwvZz48L3N2Zz4=`
const checkDefault = `data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IjE2NCA1MyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHJlY3QgZGF0YS1uYW1lPSIxODE1MyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzAwNTc5NSIvPjxnIGRhdGEtbmFtZT0iMTAzNzIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuMyI+PHBhdGggZGF0YS1uYW1lPSIxNDI3IiBkPSJNNC41IDhsMiAyIi8+PHBhdGggZGF0YS1uYW1lPSIxNDI4IiBkPSJNMTEuNSA1bC01IDUiLz48L2c+PC9zdmc+`

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
        case "Diagnosis":
            return opts.html.replace(
                opts.split,
                `
                <div style="
                    width: 100%;
                ">
                    <div style="
                        width: 100%;
                        display:flex;
                        justify-content:space-between;
                        font-size: 18px;
                        font-weight: 600;
                    ">
                        <div style="
                            color: rgb(51, 51, 51);
                        ">Diagnoses</div>
                        <div style="
                            color: rgb(41, 136, 230);
                            text-decoration: underline;
                        ">Recommend Diagnoses</div>
                    </div>
                    <div style="
                        width: 100%;
                        display:flex;
                        justify-content:space-between;
                        margin-top: 15px;
                    ">
                        <div style="
                            width: 45%;
                        ">
                            <div style="
                                border-color: rgb(222,222,222);
                                color: rgb(51,51,51);
                                outline: none;
                                border-style: solid;
                                border-width: thin;
                                border-radius: 4px;
                                display:flex;
                            ">
                                <img 
                                    src="__replace__searchGray.svg"
                                    style="margin-left: 10px;"
                                />
                                <input 
                                    type="text" 
                                    style="
                                        width: 100%;
                                        box-sizing: border-box;
                                        text-indent: 0.8em;
                                        height: 40px;
                                        border: none;
                                        outline: none;
                                    " 
                                    placeholder="Search"
                                    readonly
                                ></input>
                            </div>
                        </div>
                        <div style="
                            width: 45%;
                        ">
                            <input 
                                type="text" 
                                style="
                                    width: 100%;
                                    box-sizing: border-box;
                                    text-indent: 0.8em;
                                    height: 40px;
                                    border-color: rgb(222,222,222);
                                    color: rgb(51,51,51);
                                    outline: none;
                                    border-style: solid;
                                    border-width: thin;
                                    border-radius: 4px;
                                " 
                                placeholder="Description"
                                readonly
                            ></input>
                        </div>
                    </div>
                    <div style="
                        wdith: 100%;
                        margin-top: 15px;
                    ">
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
                    </div>
                    <div style="
                        margin-top: 15px;
                        width: 18%;
                        height: 40px;
                        border: 1px solid rgb(0, 87, 149);
                        color: rgb(0, 87, 149);
                        font-size: 18px;
                        border-radius: 4px;
                        display:flex;
                        align-items:center;
                        justify-content: space-around;
                    ">
                        <img 
                            src="__replace__addCircleDeepBlue.svg"
                            style="
                                height: 18.84px;
                            "/>
                        <div>Add More</div>
                    </div>
                </div>
                `
            )
        case "Radio":
            let radioStr = ``
            // console.log(getHTMLDataArray(opts.split), getHTMLDataArray(opts.split).split(textSharpSplitReg))
            const radioArray = getHTMLDataArray(opts.split).split(textSharpSplitReg)
            radioArray.shift()
            radioArray.pop()
            if(opts.type?.endsWith("*")) 
                Asterisk = `<span style="color: red"> *</span>`
            if(radioArray.length > 0){
                radioStr += `<div style="margin: 15px 0;">`
                radioStr +=  `
                    <div style="
                        margin-top: 15px;
                        color:#333333;
                        font-weight: 600;
                    ">${opts.config.title}${Asterisk}</div>
                `
                for(let i = 0; i < radioArray.length; i+=2) {
                    const title = radioArray[i]
                    const check = radioArray[i+1]
                    if(title !== ""){
                        let img = check === "" ? circleSvg : circleDefault
                        radioStr += `
                            <div style="
                                display: flex;
                                margin-top: 2px;
                            ">
                                <img src="${img}" />
                                <div style="margin-left: 10px;">${title}</div>
                            </div>
                        `
                    }
                }
                radioStr += `</div>`
            } else {
                radioStr = opts.split
            }
            return opts.html.replace(opts.split, radioStr)
        case "Checkbox":
            let checkboxStr = ``
            const checkboxArray = getHTMLDataArray(opts.split).split(textSharpSplitReg)
            checkboxArray.shift()
            checkboxArray.pop()
            if(opts.type?.endsWith("*")) 
                Asterisk = `<span style="color: red"> *</span>`
            if(checkboxArray.length >= 0){
                checkboxStr += `<div style="margin: 15px 0;">`
                checkboxStr +=  `
                    <div style="
                        margin-top: 15px;
                        color:#333333;
                        font-weight: 600;
                    ">${opts.config.title}${Asterisk}</div>
                `
                for(let i = 0; i < checkboxArray.length; i+=2) {
                    const title = checkboxArray[i]
                    const check = checkboxArray[i+1]
                    if(title !== ""){
                        let img = check === "" ? checkSvg : checkDefault
                        checkboxStr += `
                            <div style="
                                display: flex;
                                margin-top: 2px;
                            ">
                                <img src="${img}" />
                                <div style="margin-left: 10px;">${title}</div>
                            </div>
                        `
                    }
                }
                checkboxStr += `</div>`
            } else {
                checkboxStr = opts.split
            }
            return opts.html.replace(opts.split, checkboxStr)
        case "Drop Down Box": 
            let dropDownStr = ''
            let dropDownArray = getHTMLDataArray(opts.split).split(textSharpSplitReg)
            dropDownArray.shift()
            dropDownArray.pop()
            if(opts.type?.endsWith("*")) 
                Asterisk = `<span style="color: red"> *</span>`
            if(dropDownArray.length > 0) {
                dropDownStr += `<div style="margin: 15px 0;">`
                dropDownStr +=  `
                    <div style="
                        margin-top: 15px;
                        color:#333333;
                        font-weight: 600;
                    ">${opts.config.title}${Asterisk}</div>
                `
                dropDownStr += `<select style="
                    width: 100%;
                    height: 24px;
                    outline: none;
                    border: 1px solid rgb(222,222,222);
                    border-radius: 4px;
                    color: color: rgb(51,51,51);
                    margin-top: 2px;
                ">`
                let hasSeleted = false
                let optionStr = ``
                for(let i = 0; i < dropDownArray.length; i += 2) {
                    const title = dropDownArray[i]
                    const check = dropDownArray[i+1]
                    if(title !== "") {
                        let selected = check === "" ? "" : "selected"
                        if(selected) hasSeleted = true
                        optionStr += `
                            <option value="${title}" ${selected}>${title}</option>
                        `
                    }
                }
                if(!hasSeleted) optionStr = `<option style="display: none" "selected">Select</option>` + optionStr
                dropDownStr += optionStr
                dropDownStr += `</select>`
                dropDownStr += `</div>`
            } else {
                dropDownStr = opts.split
            }
            return opts.html.replace(opts.split, dropDownStr)
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