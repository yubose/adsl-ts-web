import { SharpOption, SharpType } from "./config"
import { textSharpSplitReg } from "./textSharp"
import { getHTMLDataArray, getUuid } from "./utils"

const circleSvg = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48ZyBkYXRhLW5hbWU9IjcwOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYjdiN2I3Ij48Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iOCIgc3Ryb2tlPSJub25lIi8+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjcuNSIvPjwvZz48L3N2Zz4=`
const circleDefault = `data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IjE2NiAzIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48ZyBkYXRhLW5hbWU9IjcwOCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDA1Nzk1IiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjgiIGN5PSI4IiByPSI4IiBzdHJva2U9Im5vbmUiLz48Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iNyIgZmlsbD0ibm9uZSIvPjwvZz48Y2lyY2xlIGRhdGEtbmFtZT0iNzEwIiBjeD0iNCIgY3k9IjQiIHI9IjQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQgNCkiIGZpbGw9IiMwMDU3OTUiLz48L3N2Zz4=`
const checkSvg = `data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IjE2NCA1NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PGcgZGF0YS1uYW1lPSIxODE1MyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZGVkZWRlIj48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHJ4PSIyIiBzdHJva2U9Im5vbmUiLz48cmVjdCB4PSIuNSIgeT0iLjUiIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgcng9IjEuNSIvPjwvZz48L3N2Zz4=`
const checkDefault = `data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IjE2NCA1MyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHJlY3QgZGF0YS1uYW1lPSIxODE1MyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzAwNTc5NSIvPjxnIGRhdGEtbmFtZT0iMTAzNzIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuMyI+PHBhdGggZGF0YS1uYW1lPSIxNDI3IiBkPSJNNC41IDhsMiAyIi8+PHBhdGggZGF0YS1uYW1lPSIxNDI4IiBkPSJNMTEuNSA1bC01IDUiLz48L2c+PC9zdmc+`
const upSvg = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNC43OTQiIGhlaWdodD0iMTAuNzk0IiB2aWV3Qm94PSIwIDAgMjQuNzk0IDEwLjc5NCI+PGcgZGF0YS1uYW1lPSI4NjkzIiBmaWxsPSJub25lIiBzdHJva2U9IiNiY2JjYmMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyIj48cGF0aCBkYXRhLW5hbWU9IjEzNjEiIGQ9Ik0xLjM5NyA5LjM5N2wxMS04Ii8+PHBhdGggZGF0YS1uYW1lPSIxMzYyIiBkPSJNMjMuMzk3IDkuMzk3bC0xMS04Ii8+PC9nPjwvc3ZnPg==`
const downSvg = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNC43OTQiIGhlaWdodD0iMTAuNzk0IiB2aWV3Qm94PSIwIDAgMjQuNzk0IDEwLjc5NCI+PGcgZGF0YS1uYW1lPSI4NjkzIiBmaWxsPSJub25lIiBzdHJva2U9IiNiY2JjYmMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyIj48cGF0aCBkYXRhLW5hbWU9IjEzNjEiIGQ9Ik0xLjM5NyAxLjM5N2wxMSA4Ii8+PHBhdGggZGF0YS1uYW1lPSIxMzYyIiBkPSJNMjMuMzk3IDEuMzk3bC0xMSA4Ii8+PC9nPjwvc3ZnPg==`
const timeSvg = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNi40MzIiIGhlaWdodD0iMTYuNDA3IiB2aWV3Qm94PSIwIDAgMTYuNDMyIDE2LjQwNyI+PHBhdGggZGF0YS1uYW1lPSI4NjM0IiBkPSJNOC4yMTYgMTQuODczYTYuNjcgNi42NyAwIDEgMSA2LjY4LTYuNjcgNi42ODMgNi42ODMgMCAwIDEtNi42OCA2LjY3bTAtMTQuNjc0YTggOCAwIDEgMCA4LjAxNiA4IDguMDE5IDguMDE5IDAgMCAwLTguMDE2LThtLjY2OCA3Ljg3NlY0LjIwMmEuNjY4LjY2OCAwIDAgMC0xLjMzNiAwdjQuMTVhLjY2NC42NjQgMCAwIDAgLjIuNDcybDIuMjQgMi4yMzZhLjY2OC42NjggMCAwIDAgLjk0NS0uOTQzem0wIDAiIGZpbGw9IiMyOTg4ZTYiIHN0cm9rZT0iIzI5ODhlNiIgc3Ryb2tlLXdpZHRoPSIuNCIvPjwvc3ZnPg==`
const dateSvg = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNC4yMyIgaGVpZ2h0PSIxNC44ODQiIHZpZXdCb3g9IjAgMCAxNC4yMyAxNC44ODQiPjxwYXRoIGRhdGEtbmFtZT0iSWNvbiBpb25pYy1tZC1jYWxlbmRhciIgZD0iTTExLjI2NSA4LjA2Mkg3LjcwOHYzLjcyMWgzLjU1N3pNMTAuMDc5IDB2MS4yNEg0LjE1VjBIMi4zNzJ2MS4yNGgtLjg5QTEuNTIyIDEuNTIyIDAgMCAwIDAgMi43OTF2MTAuNTQyYTEuNTIyIDEuNTIyIDAgMCAwIDEuNDgyIDEuNTVoMTEuMjY1YTEuNTIyIDEuNTIyIDAgMCAwIDEuNDgyLTEuNTVWMi43OTFhMS41MjIgMS41MjIgMCAwIDAtMS40ODItMS41NWgtLjg4OVYwem0yLjY2OCAxMy4zMzNIMS40ODJWNS4xMTZoMTEuMjY1eiIgZmlsbD0iIzI5ODhlNiIvPjwvc3ZnPg==`

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
                            min-height: 48px;
                            border-color: rgb(222,222,222);
                            color: rgb(51,51,51);
                            outline: none;
                            border-style: solid;
                            border-width: thin;
                            border-radius: 4px;
                            line-height: 24px;
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
                            height: 24px;
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
                const dropDownID = getUuid()
                dropDownStr += `<div style="margin: 15px 0;position: relative;">`
                dropDownStr +=  `
                    <div style="
                        margin-top: 15px;
                        color:#333333;
                        font-weight: 600;
                    ">${opts.config.title}${Asterisk}</div>
                `
                dropDownStr += `
                <div style="
                    width: 100%;
                    min-height: 24px;
                    outline: none;
                    border: 1px solid rgb(222,222,222);
                    border-radius: 4px;
                    color: rgb(51,51,51);
                    margin-top: 2px;
                    display: flex;
                    justify-content: space-between;
                    padding: 0 10px;
                    box-sizing: border-box;
                    cursor: pointer;
                    word-break: break-word;
                " onclick="
                    ((event) => {
                        const img = document.getElementById('w-e_select_img${dropDownID}')
                        const select = document.getElementById('w-e_select${dropDownID}')
                        if(select.style.display === 'none') {
                            select.style.display = 'block'
                            img.src = '${upSvg}'
                            const selectChild = select.children
                            const value = document.getElementById('w-e_select_value${dropDownID}')
                            for(let i = 0; i < selectChild.length; i++){
                                const item = selectChild.item(i)
                                if(value.getAttribute('data-key') === item.getAttribute('data-key')) {
                                    item.style.background = '#1e90ff'
                                    item.style.color = '#ffffff'
                                } else {
                                    item.style.background = '#ffffff'
                                    item.style.color = '#333333'
                                }
                            }
                        } else {
                            select.style.display = 'none'
                            img.src = '${downSvg}'
                        }
                    })(event)
                ">
                    <div id="w-e_select_value${dropDownID}"__DATAKEY__>__REPLACE__</div>
                    <img id="w-e_select_img${dropDownID}" width="16px" src="${downSvg}">
                </div>`
                // let hasSeleted = false
                let selectStr = 'Select'
                let dataKeyStr = ''
                let optionStr = `
                <div id="w-e_select${dropDownID}" style="
                    width: 100%;
                    min-height: 24px;
                    outline: none;
                    border: 1px solid rgb(222,222,222);
                    border-radius: 4px;
                    color: rgb(51,51,51);
                    margin-top: 2px;
                    display: none;
                    box-sizing: border-box;
                    cursor: pointer;
                    overflow: hidden;
                    position: absolute;
                    z-index: 10;
                " onclick="
                    ((event) => {
                        const value = document.getElementById('w-e_select_value${dropDownID}')
                        const img = document.getElementById('w-e_select_img${dropDownID}')
                        const select = document.getElementById('w-e_select${dropDownID}')
                        value.setAttribute('data-key', event.target.getAttribute('data-key'))
                        value.innerText = event.target.innerText
                        select.style.display = 'none'
                        img.src = '${downSvg}'
                    })(event)
                ">
                `
                for(let i = 0; i < dropDownArray.length; i += 2) {
                    const title = dropDownArray[i]
                    const check = dropDownArray[i+1]
                    if(title !== "") {
                        let selected = check === "" ? "" : "selected"
                        const dataKey = getUuid()
                        // if(selected) hasSeleted = true
                        if(selected){ 
                            selectStr = title
                            dataKeyStr = ` data-key="${dataKey}"`
                        }
                        optionStr += `
                            <div class="w-e_select_option" value="${title}" style="word-break: break-word;" data-key="${dataKey}">${title}</div>
                        `
                    }
                }
                optionStr += `</div>`
                dropDownStr = dropDownStr.replace("__DATAKEY__", dataKeyStr).replace("__REPLACE__", selectStr)
                // if(!hasSeleted) optionStr = `<option style="display: none" "selected">Select</option>` + optionStr
                dropDownStr += optionStr
                dropDownStr += `</div>`
            } else {
                dropDownStr = opts.split
            }
            return opts.html.replace(opts.split, dropDownStr)
        case "Time": 
            if(opts.type?.endsWith("*")) 
                Asterisk = `<span style="color: red"> *</span>`
            return opts.html.replace(opts.split, `
                <div style="margin: 15px 0;">
                    <div style="
                        margin: 15px 0;
                        color:#333333;
                        font-weight: 600;
                    ">${opts.config.title}${Asterisk}</div>
                    <div style="
                        width: 48%;
                        height: 24px;
                    "></div>
                </div>
            `)
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