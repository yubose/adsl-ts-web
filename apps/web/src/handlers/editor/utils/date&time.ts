import { IDomEditor } from "@wangeditor/editor"
import Swal from "sweetalert2"

const dateAndTime = ({
    editor,
    selection,
    target = undefined
}: {
    editor: IDomEditor
    selection
    target?: HTMLElement | undefined
}) => {

    const formatNum = (num: number) => {
        return num < 10 ? `0${num}` : `${num}`
    } 

    const checkSvg = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48ZyBkYXRhLW5hbWU9IjIxNzcwIiBmaWxsPSJub25lIj48cGF0aCBkYXRhLW5hbWU9Ijk1NjQiIGQ9Ik0yLjgwNyAxMS40OTRsNi4xMzIgNi4zNTIgMTEuOS0xMi4wNDMiIHN0cm9rZT0iIzk5OSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuOCIvPjxwYXRoIGRhdGEtbmFtZT0iMTk3MjYiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48L2c+PC9zdmc+`
    const time = new Date()
    const DATE = `${formatNum(time.getDate())}/${formatNum(time.getMonth()+1)}/${time.getFullYear()}`
    const TIME = `${formatNum(time.getHours())}:${formatNum(time.getMinutes())} ${time.getHours() < 12 ? 'AM' : 'PM'}`

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
                ">
                    <div style="width: 40%;">Date</div>
                    <div style="width: 55%;">${DATE}</div>
                    <div style="width: 5%;">
                        <img style="display: block;" src="${checkSvg}" />
                    </div>
                </div>
                <div style="
                    height: 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-align: start;
                    padding: 0 10px;
                ">
                    <div style="width: 40%;">Time</div>
                    <div style="width: 55%;">${TIME}</div>
                    <div style="width: 5%;">
                        <img style="display: block;" src="${checkSvg}" />
                    </div>
                </div>
                <div style="
                    height: 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-align: start;
                    padding: 0 10px;
                ">
                    <div style="width: 40%;">Date&Time</div>
                    <div style="width: 55%;">${DATE} ${TIME}</div>
                    <div style="width: 5%;">
                        <img style="display: block;" src="${checkSvg}" />
                    </div>
                </div>
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
    })
}

export default dateAndTime