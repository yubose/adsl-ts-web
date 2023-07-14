import { IDomEditor } from "@wangeditor/editor"
import Swal from "sweetalert2"
import { textSharpSplitChar, textSharpSplitReg } from "./textSharp"
import { insertNode } from "./utils"

const dateAndTime = ({
    editor,
    selection,
    target = undefined
}: {
    editor: IDomEditor
    selection
    target?: HTMLElement | undefined
}) => {

    const isChange = target instanceof HTMLElement
    let type = `Date`
    let title = ''
    let isRequired = ''
    // let currentTime = ''
    if(isChange) {
        type = target.innerText.split(textSharpSplitReg)[0].replace(/[#*]/g, "")
        title = target.innerText.split(textSharpSplitReg)[1];
        isRequired = target.innerText.split(textSharpSplitReg)[0].includes("*") ? "checked" : "";
        // currentTime = target.innerText.split(textSharpSplitReg)[0].includes("$") ? "checked" : "";
    }

    const formatNum = (num: number) => {
        return num < 10 ? `0${num}` : `${num}`
    } 

    const checkSvg = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48ZyBkYXRhLW5hbWU9IjIxNzcwIiBmaWxsPSJub25lIj48cGF0aCBkYXRhLW5hbWU9Ijk1NjQiIGQ9Ik0yLjgwNyAxMS40OTRsNi4xMzIgNi4zNTIgMTEuOS0xMi4wNDMiIHN0cm9rZT0iIzk5OSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuOCIvPjxwYXRoIGRhdGEtbmFtZT0iMTk3MjYiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48L2c+PC9zdmc+`
    const time = new Date()
    const DATE = `${formatNum(time.getDate())}/${formatNum(time.getMonth()+1)}/${time.getFullYear()}`
    const TIME = `${formatNum(time.getHours() <= 12 ? time.getHours() : time.getHours() - 12)}:${formatNum(time.getMinutes())} ${time.getHours() < 12 ? 'AM' : 'PM'}`

    Swal.fire({
        html: `
            <div style="
                font-size:24px;
                text-align: start;
                margin: 10px 0;
                font-weight:bold;
            ">Date&Time</div>
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
                    border-color: #dedede;
                    color: rgb(51,51,51);
                    outline: none;
                    border-style: solid;
                    border-width: thin;
                    border-radius: 4px;
                    margin-top: 6px;
                "
                id="w-editor_title"
                placeholder="Enter here"
                value="${title}"
            />
            <div style="
                text-align: start;
                font-weight:bold;
                color:#33333;
                font-size: 16px;
                font-weight: 600;
                margin-top: 10px;
            ">Select type</div>
            <div id="w-editor_select" style="
                box-shadow: 0px 3px 3px #CCCCCC;
                border-radius: 4px;
                overflow: auto;
                cursor: pointer;
                font-size: 16px;
            ">
                <div style="
                    height: 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-align: start;
                    padding: 0 10px;
                " alt="Date" class="w-e_search-item">
                    <div style="width: 40%;" alt="Date">Date</div>
                    <div style="width: 55%;" alt="Date">${DATE}</div>
                    <div style="width: 5%;" alt="Date">
                        <img style="display: block;" src="${checkSvg}" alt="Date"/>
                    </div>
                </div>
                <div style="
                    height: 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-align: start;
                    padding: 0 10px;
                " alt="Time" class="w-e_search-item">
                    <div style="width: 40%;" alt="Time">Time</div>
                    <div style="width: 55%;" alt="Time">${TIME}</div>
                    <div style="width: 5%;" alt="Time">
                        <img style="display: block;" src="${checkSvg}" alt="Time"/>
                    </div>
                </div>
                <div style="
                    height: 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-align: start;
                    padding: 0 10px;
                " alt="Date&Time" class="w-e_search-item">
                    <div style="width: 40%;" alt="Date&Time">Date&Time</div>
                    <div style="width: 55%;" alt="Date&Time">${DATE} ${TIME}</div>
                    <div style="width: 5%;" alt="Date&Time">
                        <img style="display: block;" src="${checkSvg}" alt="Date&Time"/>
                    </div>
                </div>
            </div>
            <!-- <div style="
                display: flex;    
                align-items: center;
                margin-top: 15px;
                font-size: 16px;
            ">
                <input 
                    id="w-editor_currentTime"
                    style= "
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                    "
                    type="checkbox"
                />
                <div style="
                    margin-left: 8px;
                ">Current time</div>
            </div>
            <div style="
                margin-left: 26px;
                margin-top: 5px;
                text-align: start;
                font-size: 14px;
                color: #999999;
            ">The user's filling time will be auto-filled in</div> -->
            <div style="
                display: flex;    
                align-items: center;
                margin-top: 10px;
                font-size: 16px;
            ">
                <input 
                    id="w-editor_require"
                    style= "
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                    "
                    type="checkbox"
                    ${isRequired}
                />
                <div style="
                    margin-left: 8px;
                ">Required</div>
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
            let title = (<HTMLInputElement>document.getElementById("w-editor_title")).value
            // let currentTime = (<HTMLInputElement>document.getElementById("w-editor_currentTime")).checked
            let required = (<HTMLInputElement>document.getElementById("w-editor_require")).checked
            return {
                type,
                title,
                // currentTime,
                required
            }
        }
    }).then(res => {
        // console.log(res)
        if(res.isConfirmed && res.value) {
            let s = ``
            const str = res.value?.required ? '*' : ''
            // const currentTime = res.value?.currentTime ? '$' : ''
            const value = res.value
            s = `#${value?.type}${str}${textSharpSplitChar}${value?.title}${textSharpSplitChar}`
            insertNode({editor, type: "sharpblock", value: s, selection, isChange})
        }
    })

    const confirmButton = Swal.getConfirmButton() as HTMLButtonElement
    const typeSelector = document.getElementById('w-editor_select') as HTMLDivElement
    const typeClidren = typeSelector.children
    const titleElement = document.getElementById('w-editor_title') as HTMLInputElement

    const refreshType = () => {
        for(let i = 0; i < typeClidren.length; i++) {
            const child = typeClidren.item(i) as HTMLDivElement
            const childType = child.getAttribute("alt")
            if(type === childType) {
                child.style.background = "#f4f4f4"
                if(child.getElementsByTagName('img').length > 0)
                    child.getElementsByTagName('img')[0].style.display = "block"
            } else {
                child.style.background = "#ffffff"
                if(child.getElementsByTagName('img').length > 0)
                    child.getElementsByTagName('img')[0].style.display = "none"
            }
        }
    }
    refreshType()
    if(titleElement.value === '') {
        confirmButton.setAttribute("disabled", "true")
    }

    typeSelector.addEventListener("click", (event) => {
        const target = event.target as HTMLDivElement
        const selectType = target.getAttribute("alt")
        if(selectType) {
            type = selectType
            refreshType()
        }
    })

    titleElement.addEventListener('input', () => {
        if(titleElement.value === '') {
            titleElement.style.borderColor = "#ff0000"
            confirmButton.setAttribute("disabled", "true")
        } else {
            titleElement.style.borderColor = "#dedede"
            confirmButton.removeAttribute("disabled")
        }
    })

}

export default dateAndTime