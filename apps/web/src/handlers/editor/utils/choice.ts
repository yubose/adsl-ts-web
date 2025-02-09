import { IDomEditor } from "@wangeditor/editor"
import Swal from "sweetalert2"
import { DATA } from "./editorChoiceMap"
import { textSharpSplitChar, textSharpSplitReg } from "./textSharp"
import { getUuid, insertNode } from "./utils"

const downSvg = `url(data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IjIyMjU2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cGF0aCBkYXRhLW5hbWU9Ikljb24gaW9uaWMtaW9zLWFycm93LWRvd24iIGQ9Ik05LjYxNSAxMS40MThsNC44NDItNC43MjZhLjkyOC45MjggMCAwIDEgMS4yOTMgMCAuODg0Ljg4NCAwIDAgMSAwIDEuMjY0bC01LjQ4NyA1LjM1NGEuOTMuOTMgMCAwIDEtMS4yNjIuMDI2TDMuNDc2IDcuOTZhLjg4Mi44ODIgMCAwIDEgMC0xLjI2NC45MjguOTI4IDAgMCAxIDEuMjkzIDB6IiBmaWxsPSIjNGI0YjRiIi8+PHBhdGggZGF0YS1uYW1lPSIyMjk2OSIgZmlsbD0ibm9uZSIgb3BhY2l0eT0iLjk5OSIgZD0iTTAgMGgyMHYyMEgweiIvPjwvc3ZnPg==)`
const upSvg = `url(data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IjIyMjU2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cGF0aCBkYXRhLW5hbWU9Ikljb24gaW9uaWMtaW9zLWFycm93LWRvd24iIGQ9Ik05LjYxNSA4LjU4M2w0Ljg0MiA0LjcyNmEuOTI4LjkyOCAwIDAgMCAxLjI5MyAwIC44ODQuODg0IDAgMCAwIDAtMS4yNjRsLTUuNDg3LTUuMzU0YS45My45MyAwIDAgMC0xLjI2Mi0uMDI2TDMuNDc2IDEyLjA0YS44ODIuODgyIDAgMCAwIDAgMS4yNjQuOTI4LjkyOCAwIDAgMCAxLjI5MyAweiIgZmlsbD0iIzRiNGI0YiIvPjxwYXRoIGRhdGEtbmFtZT0iMjI5NjkiIGZpbGw9Im5vbmUiIG9wYWNpdHk9Ii45OTkiIGQ9Ik0wIDBoMjB2MjBIMHoiLz48L3N2Zz4=)`
const addSvg = `data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IjIyMjYzIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cGF0aCBkYXRhLW5hbWU9IjIzNTAyIiBkPSJNOSAwYTkgOSAwIDEgMCA5IDkgOS4wMTEgOS4wMTEgMCAwIDAtOS05em0wIDE3LjIxOEE4LjIxOCA4LjIxOCAwIDEgMSAxNy4yMTggOSA4LjIyNyA4LjIyNyAwIDAgMSA5IDE3LjIxOHoiIGZpbGw9IiNjMWMxYzEiLz48cGF0aCBkYXRhLW5hbWU9IjIzNTAzIiBkPSJNMTMuNjk3IDguNjEzaC00LjN2LTQuM2EuMzkyLjM5MiAwIDEgMC0uNzg0IDB2NC4zaC00LjNhLjM5Mi4zOTIgMCAxIDAgMCAuNzg0aDQuM3Y0LjNhLjM5Mi4zOTIgMCAxIDAgLjc4NCAwdi00LjNoNC4zYS4zOTIuMzkyIDAgMSAwIDAtLjc4NHoiIGZpbGw9IiNjMWMxYzEiLz48L3N2Zz4=`
const reduceSvg = `data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IjIyMjY0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cGF0aCBkYXRhLW5hbWU9IjIzNTA0IiBkPSJNOSAxOGE5IDkgMCAxIDEgOS05IDkuMDI2IDkuMDI2IDAgMCAxLTkgOXpNOSAuOUE4LjEgOC4xIDAgMSAwIDE3LjEgOSA4LjA2NiA4LjA2NiAwIDAgMCA5IC45eiIgZmlsbD0iI2MxYzFjMSIvPjxwYXRoIGRhdGEtbmFtZT0iMjM1MDUiIGQ9Ik0xMy42MTIgOS40NUg0LjM4N2EuNDUuNDUgMCAwIDEgMC0uOWg5LjMzOGEuNDg0LjQ4NCAwIDAgMSAuNDUuNDVjMCAuMjI1LS4zMzguNDUtLjU2My40NXoiIGZpbGw9IiNjMWMxYzEiLz48L3N2Zz4=`

const choice = ({
    editor,
    selection,
    target = undefined
}: {
    editor: IDomEditor
    selection
    target?: HTMLElement | undefined
}) => {

    const isChange = target instanceof HTMLElement
    let title = ''
    let isRequired = ''
    let type = 'Radio'
    let choiceDataArray = new Array<DATA>()
    let inputBoxes = new Array<HTMLInputElement>()
    if(isChange) {
        title = target.innerText.split(textSharpSplitReg)[1];
        isRequired = target.innerText.split(textSharpSplitReg)[0].includes("*") ? "checked" : "";
        type = target.innerText.split(textSharpSplitReg)[0].replace(/[#*]/g, "")
        const dataArray = target.getAttribute("data-array")
        const arr = (dataArray ? dataArray : "").split(textSharpSplitReg)
        arr.shift()
        arr.pop()
        // console.log(getHTMLDataArray(target.outerHTML), arr)
        for(let i = 0; i < arr.length; i+=2) {
            choiceDataArray.push({
                title: arr[i],
                check: arr[i+1]
            })
        }
    }
    
    Swal.fire({
        html: `
            <div style="
                font-size:24px;
                text-align: start;
                margin: 10px 0;
                font-weight:bold;
            ">Choice</div>
            <div style="
                text-align: start;
                font-weight:bold;
                color:#33333;
                font-size: 16px;
                font-weight: 600;
            ">Title text<span style="color:red">*</span></div>
            <input 
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
                    margin-top: 6px;
                "
                id="w-editor_title"
                placeholder="Enter here"
            />
            <div style="
                width: 100%;
                height: 40px;
                margin-top: 10px;
            ">
                <div style="
                    text-indent: 0.8em;
                    border-color: rgb(222,222,222);
                    color: rgb(51,51,51);
                    cursor: pointer;
                    font-size: 16px;
                    width: 32%;
                    height: 40px;
                    line-height: 30px;
                    border-style: solid;
                    border-width: thin;
                    border-radius: 4px;
                    text-align: start;
                    box-sizing: border-box;
                    position: absolute;
                ">
                    <div 
                        id="w-e_choiceType",
                        style="
                            background: ${downSvg};
                            background-repeat: no-repeat;
                            background-position: right;
                            margin: 5px;
                        "
                    >${type}</div>
                    <div 
                        id="w-e_choiceTypes"
                        style="
                            display:none;
                            position:relative;
                            border-color: rgb(222,222,222);
                            color: rgb(51,51,51);
                            background: #ffffff;
                            border-style: solid;
                            border-width: thin;
                            border-radius: 4px;
                            width: 100%;
                            box-shadow: 0px 2px 5px #ccc;
                            overflow: hidden;
                        "
                    >
                        <div style="padding: 5px;" class="w-e_search-item">Radio</div>
                        <div style="padding: 5px;" class="w-e_search-item">Checkbox</div>
                        <div style="padding: 5px;" class="w-e_search-item">Drop Down Box</div>
                    </div>
                </div>
                <div style="
                    display: flex;
                    width: 20%;
                    position: relative;
                    left: 40%;
                    height: 40px;
                    align-items: center;
                ">
                    <input 
                        style= "
                            width: 18px;
                            height: 18px;
                            margin-top: 2px;
                            margin-left: 2px;
                            cursor: pointer;
                        "
                        type="checkbox"  
                        id="w-editor_require"
                        ${isRequired}
                    />
                    <div style="
                        text-align: start;
                        margin-left: 10px;
                    ">Required</div>
                </div>
            </div>
            <div style="
                margin-top: 20px;
                width: 100%;
                display: flex;
            ">
                <div style="
                    width: 88%;
                    text-align: start;
                    font-weight:bold;
                    color:#33333;
                    font-size: 16px;
                    font-weight: 600;
                ">Option text</div>
                <div style="
                    width: 12%;
                    text-align: center;
                    color:#333333;
                    font-size: 16px;
                ">Default</div>
            </div>
            <div 
                id="w-e_choiceTitles"
                class="w-e_scroll-box"
                style="
                    min-height: 135px;
                    max-height: 250px;
                    overflow: scroll;
                "
            >
            </div>
        `,
        width: 600,
        // confirmButtonColor: '#4983d0',
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        allowOutsideClick: false,
        customClass: {
            confirmButton: "w-editor_popup_confirm",
            cancelButton: "w-editor_popup_cancel",
            closeButton: "w-editor_popup_close",
            actions: "w-editor_popup_actions",
            container: "w-editor_swal_container",
            validationMessage: "w-e_swal_validatMsg",
            htmlContainer: "w-e_search-container",
        },
        preConfirm: () => {
            let hasValue = judgeDateArray()
            if(hasValue) {
                const repetitionSet = getRepetition()
                if(repetitionSet.size === 0) {
                    let title = (<HTMLInputElement>document.getElementById("w-editor_title")).value
                    let choiceType = (<HTMLInputElement>document.getElementById("w-e_choiceType")).innerText
                    let required = (<HTMLInputElement>document.getElementById("w-editor_require")).checked
                    if(title !== '') {
                        return {
                            title,
                            choiceType,
                            required,
                            list: choiceDataArray
                        }
                    } else {
                        setTimeout(() => {
                            confirmButton.setAttribute("disabled", "true")
                        })
                        return false
                    }
                } else if(repetitionSet.size !== 0) {
                    showTip(repetitionMsg)
                    inputBoxes.forEach(item => {
                        if(repetitionSet.has(item.value)) {
                            item.style.borderColor = "red"
                        }
                    })
                    setTimeout(() => {
                        confirmButton.setAttribute("disabled", "true")
                    })
                    return false
                }
            } else {
                showTip(hasValueMsg)
                setTimeout(() => {
                    confirmButton.setAttribute("disabled", "true")
                })
                return false
            }
        }
    }).then(res => {
        // console.log(res)
        if(res.isConfirmed && res.value) {
            let s = ``
            const str = res.value?.required ? '*' : ''
            const value = res.value
            s = `#${value?.choiceType}${str}${textSharpSplitChar}${value?.title}${textSharpSplitChar}`
            insertNode({editor, type: "sharpblock", value: s, selection, choiceArray: choiceDataArray, isChange})
        }
    })

    const choiceType = document.getElementById("w-e_choiceType") as HTMLDivElement
    const choiceTypes = document.getElementById("w-e_choiceTypes") as HTMLDivElement
    const choiceTitles = document.getElementById("w-e_choiceTitles") as HTMLDivElement
    const titleInput = document.getElementById("w-editor_title") as HTMLInputElement
    const confirmButton = Swal.getConfirmButton() as HTMLButtonElement
    titleInput.focus()
    let choiceTitleList = new Array<HTMLDivElement>()

    const LiItem = `
        <div style="
            width: 10%;
            height: 40px;
            display: flex;
            justify-content: space-evenly;
            align-items: center;
        ">
            <img id="w-e_addButton--TITLEID--" style="cursor:pointer" src="${addSvg}" />
            <img id="w-e_reduceButton--TITLEID--" style="cursor:pointer" src="${reduceSvg}" />
        </div>
        <div style="
            width: 12%;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
        ">
            <input 
                id="w-editor_check--TITLEID--"
                style= "
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                "
                type="checkbox"
                --TITLECHECK--
            />
        </div>
    `

    const createLI = (data?: DATA) => {
        const LI = document.createElement("div")
        LI.style.cssText = `
            display: flex;
            margin-top: 5px;
        `
        const uuid = getUuid()
        const input = document.createElement("input")
        input.id = `w-editor_title${uuid}`
        input.value = data?.title ? data?.title.replace(/&quot;/g, "\"") : ""
        // console.log(input.value)
        input.type = "text"
        input.style.cssText = `
            box-sizing: border-box;
            width: 78%;
            text-indent: 0.8em;
            height: 40px;
            border-color: rgb(222,222,222);
            color: rgb(51,51,51);
            outline: none;
            border-style: solid;
            border-width: thin;
            border-radius: 4px;
        `
        LI.innerHTML = 
            LiItem
            .replace(/--TITLEID--/g, `${uuid}`)
            // .replace(/--TITLEVALUE--/g, `${data?.title ? data?.title.replaceAll("\"", "&quot;") : ""}`)
            .replace(/--TITLECHECK--/g, `${data?.check ? data.check : ""}`)
        LI.insertBefore(input, LI.children[0])
        // const ipt = LI.children[0] as HTMLInputElement
        // if(data) ipt.setAttribute("value", data.title)
        return LI
    }

    const update = () => {
        choiceTitles.innerHTML = ""
        choiceTitleList.forEach((item, index) => {
            item.setAttribute("alt", `${index}`);
            (item.children[0] as HTMLInputElement).placeholder = `Option ${index+1}`;
            choiceTitles.appendChild(item)
        })
    }

    const getDataArray = () => {
        choiceDataArray = new Array<DATA>()
        choiceTitleList.forEach((item: HTMLDivElement) => {
            // console.log(item.getElementsByTagName("input"))
            const inputs = item.getElementsByTagName("input")
            inputBoxes.push(inputs[0])
            choiceDataArray.push({
                title: inputs[0].value.replace(/"/g, "&quot;"),
                check: inputs[1].checked ? "checked" : ""
            })
        })
    }

    const judgeDateArray = () => {
        getDataArray()
        const length = choiceDataArray.length
        for(let i = 0; i < length; i++) {
            if(choiceDataArray[i].title !== "") {
                return true
            }
        }
        return false
    }

    const getRepetition = () => {
        getDataArray()
        const set = new Set<string>()
        const repetitionSet = new Set<string>()
        choiceDataArray.forEach(item => {
            if(item.title !== '') {
                if(set.has(item.title)) {
                    repetitionSet.add(item.title)
                } else {
                    set.add(item.title)
                }
            }
        })
        return repetitionSet
    }

    if(choiceDataArray.length === 0) {
        for(let i = 0; i < 3; i++) {
            choiceTitleList.push(createLI())
            update()
        }
    } else {
        choiceDataArray.forEach(item => {
            choiceTitleList.push(createLI(item))
            update()
        })
    }
    
    const reduceMsg = "Please keep at least one option"
    const repetitionMsg = "Option repetition!"
    const hasValueMsg = "Please enter at least one option"

    const showTip = (Msg: string) => {
        Swal.showValidationMessage(Msg)
        setTimeout(() => {
            Swal.resetValidationMessage()
        }, 2000)
    }

    let isShow = true
    choiceType.addEventListener("click", (event) => {
        if(isShow) {
            choiceType.style.backgroundImage = upSvg
            choiceTypes.style.display = "block"
            const children = choiceTypes.children
            for(let i = 0; i < children.length; i++) {
                const child = children.item(i) as HTMLDivElement
                if(child.innerText === type) {
                    child.style.background = '#f4f4f4'
                } else {
                    child.style.background = '#ffffff'
                }
            }
        } else {
            choiceType.style.backgroundImage = downSvg
            choiceTypes.style.display = "none"
        }
        isShow = !isShow
    })

    choiceTypes.addEventListener("click", (event) => {
        // console.log(event.target)
        if(event.target !== choiceTypes) {
            choiceType.style.backgroundImage = downSvg
            choiceType.innerText = (event.target as HTMLDivElement).innerText
            type = choiceType.innerText
            choiceTypes.style.display = "none"
            isShow = true
            getDataArray()
            switch(choiceType.innerText) {
                case "Radio":
                case "Drop Down Box":
                    let isUpdate = new Array<number>()
                    choiceDataArray.forEach((item: DATA, idx: number) => {
                        if(item.check === "checked") {
                            isUpdate.push(idx)
                        }
                    })
                    isUpdate.forEach((item, index) => {
                        if(index !== 0){
                            const inputs = choiceTitleList[item].getElementsByTagName('input')
                            inputs[1].checked = false
                        }
                    })
                    break
                case "Checkbox":
                default:
                    break
            }
        }
    })

    const splitArray = (index: number, isRemove: boolean = false) => {
        const arr1 = choiceTitleList.slice(0, index)
        if(!isRemove){
            const arr2 = choiceTitleList.slice(index, choiceTitleList.length)
            return [arr1, arr2]
        } else {
            const arr2 = choiceTitleList.slice(index+1, choiceTitleList.length)
            return [arr1, arr2]
        }
    }

    const validationMessage = Swal.getValidationMessage() as HTMLElement

    choiceTitles.addEventListener("click", (event) => {
        const target = event.target as HTMLElement
        if(target.id.startsWith("w-e_addButton")) {
            const indexDom = target.parentNode?.parentNode as HTMLDivElement
            const index = parseInt(indexDom.getAttribute("alt") as string)
            const splitList = splitArray(index+1)
            choiceTitleList = splitList[0].concat([createLI()], splitList[1])
            update();
            (choiceTitleList[index+1].children.item(0) as HTMLElement ).focus()
        } else if(target.id.startsWith("w-e_reduceButton")) {
            if(choiceTitleList.length > 1) {
                const indexDom = target.parentNode?.parentNode as HTMLDivElement
                const index = parseInt(indexDom.getAttribute("alt") as string)
                const splitList = splitArray(index, true)
                choiceTitleList = [...splitList[0], ...splitList[1]]
                update()
            } else {
                showTip(reduceMsg)
            }
        } else if(target.id.startsWith("w-editor_check")) {
            getDataArray()
            switch(choiceType.innerText) {
                case "Radio":
                case "Drop Down Box":
                    let isUpdate = new Array<number>()
                    const indexDom = target.parentNode?.parentNode as HTMLDivElement
                    const index = parseInt(indexDom.getAttribute("alt") as string)
                    choiceDataArray.forEach((item: DATA, idx: number) => {
                        if(item.check === "checked" && idx !== index) {
                            isUpdate.push(idx)
                        }
                    })
                    isUpdate.forEach(item => {
                        const inputs = choiceTitleList[item].getElementsByTagName('input')
                        inputs[1].checked = false
                    })
                    break
                case "Checkbox":
                default:
                    break
            }
        }
    })

    validationMessage.addEventListener("click", () => {
        Swal.resetValidationMessage()
    })

    titleInput.value = title
    titleInput.focus()
    if(titleInput.value === "") {
        // titleInput.style.borderColor = "#ff0000"
        confirmButton?.setAttribute("disabled", "true")
    }
    titleInput.addEventListener("input", () => {
        const title = titleInput.value
        if(title !== '') {
            titleInput.style.borderColor = "rgb(222,222,222)"
            // Swal.enableButtons()
            confirmButton?.removeAttribute("disabled")
        } else {
            titleInput.style.borderColor = "#ff0000"
            // Swal.disableButtons()
            confirmButton?.setAttribute("disabled", "true")
        }
        titleInput.value = title.replace(/\|-|-\|/g, "")
    })

    choiceTitles.addEventListener("input", (event) => {
        getDataArray()
        const target = event.target as HTMLInputElement
        if(new Set(inputBoxes).has(target)) {
            const hasValue = judgeDateArray()
            if(!hasValue) {
                showTip(hasValueMsg)
                confirmButton.setAttribute("disabled", "true")
            } else {
                const repetitionSet = getRepetition()
                if(repetitionSet.size > 0) {
                    showTip(repetitionMsg)
                    inputBoxes.forEach(item => {
                        if(repetitionSet.has(item.value)) {
                            item.style.borderColor = "red"
                        }
                    })
                    confirmButton.setAttribute("disabled", "true")
                } else {
                    Swal.resetValidationMessage()
                    titleInput.value !== '' && confirmButton.removeAttribute("disabled")
                    inputBoxes.forEach(item => {
                        item.style.borderColor = "#dedede"
                    })
                }
            }
            target.value = target.value.replace(/\|-|-\|/g, "")
        }
    })
}

export default choice