import { IToolbarConfig, Boot, IModalMenu, IModuleConf, IDomEditor } from "@wangeditor/editor";
import DefaultButton from "./class/Button/defaultButton";
import DefaultSelect from "./class/Select/defaultSelect";
import keypress from "@atslotus/keypress"
import { inputPopUp } from "./utils/popUp";
import searchPopUp from "./utils/search";

// let isUseTemplate = false

// const baseInfoSelect = new DefaultSelect({
//     title: 'baseInfo',
//     width: 80,
//     options: [
//         { value: "baseInfo", text: 'baseInfo', styleForRenderMenuList: {display: "none"} },
//         { value: 'Date', text: "Date" }
//     ],
//     callback: (editor, value) => {
//         isUseTemplate ? editor.insertText(`@[editable:${value}]`) : editor.insertText(`@[${value}]`)
//         let html = editor.getHtml()
//         // html = /@\[w+\]/g.match
//     }
// })

// const patientInfoSelect = new DefaultSelect({
//     title: 'patientInfo',
//     width: 110,
//     options: [
//         { value: "patientInfo", text: 'patientInfo', styleForRenderMenuList: {display: "none"} },
//         { value: 'patientName', text: '<svg t="1685063168889" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8645" width="24" height="24"><path d="M921.6 102.4v358.4h-256V102.4h256M358.4 102.4v153.6H102.4V102.4h256m0 460.8v358.4H102.4v-358.4h256m563.2 204.8v153.6h-256v-153.6h256m0-768h-256c-56.32 0-102.4 46.08-102.4 102.4v358.4c0 56.32 46.08 102.4 102.4 102.4h256c56.32 0 102.4-46.08 102.4-102.4V102.4c0-56.32-46.08-102.4-102.4-102.4zM358.4 0H102.4C46.08 0 0 46.08 0 102.4v153.6c0 56.32 46.08 102.4 102.4 102.4h256c56.32 0 102.4-46.08 102.4-102.4V102.4c0-56.32-46.08-102.4-102.4-102.4z m0 460.8H102.4c-56.32 0-102.4 46.08-102.4 102.4v358.4c0 56.32 46.08 102.4 102.4 102.4h256c56.32 0 102.4-46.08 102.4-102.4v-358.4c0-56.32-46.08-102.4-102.4-102.4z m563.2 204.8h-256c-56.32 0-102.4 46.08-102.4 102.4v153.6c0 56.32 46.08 102.4 102.4 102.4h256c56.32 0 102.4-46.08 102.4-102.4v-153.6c0-56.32-46.08-102.4-102.4-102.4z" fill="#2c2c2c" p-id="8646"></path></svg>patientName' },
//         { value: 'patientBirth', text: "patientBirth" },
//         { value: 'patientPhone', text: "patientPhone" },
//         { value: 'patientEmail', text: "patientEmail" },
//         { value: 'patientAddress', text: "patientAddress" }
//     ],
//     callback: (editor, value) => {
//         isUseTemplate ? editor.insertText(`@[editable:${value}]`) : editor.insertText(`@[${value}]`)
//     }
// })

let useHotKey = false
const kp = new keypress()

const templateSelect = new DefaultSelect({
    title: 'template',
    width: 100,
    options: [
        {value: "Common", text: "Common", styleForRenderMenuList: { display: "none" }},
        {value: "textField", text: "textField"},
        {value: "textView", text: "textView"}
    ],
    classFunctions: {
        exec: (editor: IDomEditor, value: string | boolean) => {
            switch(value) {
                case "textView":
                    editor.insertText(`-editing-#[textView:editableTitle:editableText]-editing-`)
                    inputPopUp(editor, value)
                    break
                case "textField":
                    editor.insertText(`-editing-#[textField:editableTitle:editableText]-editing-`)
                    inputPopUp(editor, value)
                    break
                default:
                    editor.insertText('')
            }
        }
    }
})

const DynamicFields = new DefaultButton({
    title: "Dynamic Fields",
    // svg: `<svg t="1685414367710" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2400" width="24" height="24"><path d="M912.072815 946.738335c-4.78498 0-9.56996-1.824555-13.220093-5.475711L650.662083 693.076078c-0.285502-0.285502-0.561795-0.579191-0.827855-0.883113l-6.979972-7.948019c-6.671956-7.594979-6.096858-19.11843 1.297552-26.012444 32.130791-29.958312 57.424874-65.413825 75.181283-105.379049 18.374486-41.35692 27.691689-85.472674 27.691689-131.122363 0-86.355787-33.628912-167.542854-94.691639-228.604558-61.062727-61.062727-142.249795-94.691639-228.604558-94.691639s-167.541831 33.628912-228.604558 94.691639c-61.062727 61.062727-94.691639 142.249795-94.691639 228.604558s33.628912 167.542854 94.691639 228.604558c61.062727 61.062727 142.249795 94.691639 228.604558 94.691639 26.15059 0 52.16508-3.130294 77.326133-9.301853 5.090948-1.353834 73.4038-19.189038 120.842229-14.809287 10.282181 0.948605 17.847483 10.05296 16.899902 20.335141s-10.047844 17.853623-20.335141 16.899902c-41.659819-3.845585-107.272165 13.571087-107.930151 13.747095-0.125867 0.033769-0.251733 0.065492-0.3776 0.097214-28.132734 6.91755-57.20998 10.425444-86.425372 10.425444-48.684816 0-95.922676-9.538237-140.402727-28.352745-42.953278-18.166755-81.523735-44.172035-114.644063-77.290317-33.119305-33.119305-59.123562-71.691809-77.29134-114.644063-18.813484-44.479027-28.352745-91.716888-28.352745-140.401704s9.53926-95.922676 28.352745-140.402727c18.167778-42.953278 44.172035-81.524758 77.29134-114.644063 33.119305-33.119305 71.690786-59.123562 114.644063-77.29134 44.480051-18.813484 91.717911-28.352745 140.402727-28.352745s95.922676 9.53926 140.401704 28.352745c42.953278 18.167778 81.524758 44.173059 114.644063 77.29134 33.118282 33.119305 59.123562 71.690786 77.29134 114.644063 18.813484 44.480051 28.351722 91.717911 28.351722 140.402727 0 50.912553-10.399861 100.136651-30.91101 146.305157-17.285688 38.906102-40.96704 73.973782-70.526263 104.47547l242.313791 242.310721c7.302313 7.30129 7.302313 19.138896 0.001023 26.440186C921.642774 944.912757 916.857794 946.738335 912.072815 946.738335z" fill="#515151" p-id="2401"></path><path d="M165.576059 421.887656c-0.696872 0-1.400906-0.038886-2.110057-0.118704-10.260691-1.152243-17.645892-10.404977-16.493649-20.666692 4.838192-43.080168 17.974373-83.934644 39.046295-121.429607 5.058203-9.002025 16.457834-12.19781 25.458835-7.139607 9.002025 5.058203 12.19781 16.45681 7.139607 25.458835-18.605753 33.108049-30.207999 69.202105-34.484396 107.282399C183.060269 414.827867 174.967964 421.887656 165.576059 421.887656z" fill="#515151" p-id="2402"></path></svg>`,
    classFunctions: {
        exec: (editor: IDomEditor, value: string | boolean) => {
            editor.insertText(`-editing-@[]-editing-`)
            searchPopUp(editor)
        }
    }
})

const InfoSelect = new DefaultSelect({
    title: "info",
    width: 60,
    options: [
        {value: "Info", text: "Info", styleForRenderMenuList: { display: "none" }},
        {value: "FacilityInfo", text: "FacilityInfo"},
        {value: "ProviderInfo", text: "ProviderInfo"},
        {value: "PatientInfo", text: "PatientInfo"},
    ],
    classFunctions: {
        exec: (editor: IDomEditor, value: string | boolean) => {
            editor.insertText(`#[${value}]`)
        }
    }
})

const useHotKeyButton = new DefaultButton({
    title: "Hot Key",
    classFunctions: {
        getValue: (editor: IDomEditor): string | boolean => {
            useHotKey = !useHotKey
            return useHotKey
        },
        isActive: (editor: IDomEditor): boolean => {  
            return useHotKey
        },
        exec: (editor: IDomEditor, value: string | boolean) => {
            editor.updateView()
            if(value) {
                kp.listen({
                    type: 'keydown',
                    key: '@',
                    useCombination: 'shift',
                    callback: () => {
                        const editor = window.app.root.editor
                        editor.insertText(`-editing-@[]-editing-`)
                        searchPopUp(editor)
                    }
                })
                // kp.listen({
                //     type: 'keydown',
                //     key: '#',
                //     useCombination: 'shift',
                //     callback: () => {
                        
                //     }
                // })
            } else {
                kp.clean()
            }
        }
    }
})

// const useTemplateButton = new DefaultButton({
//     title: 'useTemplate\nctrl + Q',
//     svg: `<svg t="1685063168889" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8645" width="24" height="24"><path d="M921.6 102.4v358.4h-256V102.4h256M358.4 102.4v153.6H102.4V102.4h256m0 460.8v358.4H102.4v-358.4h256m563.2 204.8v153.6h-256v-153.6h256m0-768h-256c-56.32 0-102.4 46.08-102.4 102.4v358.4c0 56.32 46.08 102.4 102.4 102.4h256c56.32 0 102.4-46.08 102.4-102.4V102.4c0-56.32-46.08-102.4-102.4-102.4zM358.4 0H102.4C46.08 0 0 46.08 0 102.4v153.6c0 56.32 46.08 102.4 102.4 102.4h256c56.32 0 102.4-46.08 102.4-102.4V102.4c0-56.32-46.08-102.4-102.4-102.4z m0 460.8H102.4c-56.32 0-102.4 46.08-102.4 102.4v358.4c0 56.32 46.08 102.4 102.4 102.4h256c56.32 0 102.4-46.08 102.4-102.4v-358.4c0-56.32-46.08-102.4-102.4-102.4z m563.2 204.8h-256c-56.32 0-102.4 46.08-102.4 102.4v153.6c0 56.32 46.08 102.4 102.4 102.4h256c56.32 0 102.4-46.08 102.4-102.4v-153.6c0-56.32-46.08-102.4-102.4-102.4z" fill="#2c2c2c" p-id="8646"></path></svg>`,
//     callback: (editor, value) => {
//         // console.log(value)
//         isUseTemplate = value as boolean
//     }
// })

// const kp = new keypress()
// kp.listen({
//     type: 'keydown',
//     key: 'Q',
//     useCombination: 'ctrl',
//     callback: () => {
//         console.log("TEST")
//         useTemplateButton.status = true
//         isUseTemplate = true
//         window["app"]["root"].editor.updateView()
//     }
// })

// const baseInfoConf = {
//     key: baseInfoSelect.title,
//     factory() {
//         return baseInfoSelect
//     }
// }

// const patientInfoConf = {
//     key: patientInfoSelect.title,
//     factory() {
//         return patientInfoSelect
//     }
// }

// const kp = new keypress()
// kp.listen({
//     type: 'keydown',
//     key: '@',
//     useCombination: 'shift',
//     callback: () => {
//         const editor = window.app.root.editor
//         editor.insertText(`-editing-@[]-editing-`)
//         searchPopUp(editor)
//     }
// })

const templateConf = {
    key: templateSelect.title,
    factory() {
        return templateSelect
    }
}

const DynamicFieldsConf = {
    key: DynamicFields.title,
    factory() {
        return DynamicFields
    }
}

const InfoSelectConf = {
    key: InfoSelect.title,
    factory() {
        return InfoSelect
    }
}

const useHotKeyConf = {
    key: useHotKeyButton.title,
    factory() {
        return useHotKeyButton
    }
}


// const useTemplateConf = {
//     key: useTemplateButton.title,
//     factory() {
//         return useTemplateButton
//     }
// }

const module: Partial<IModuleConf> = {
    // menus: [baseInfoConf, patientInfoConf, templateConf, useTemplateConf],
    menus: [templateConf, DynamicFieldsConf, InfoSelectConf, useHotKeyConf]
}

Boot.registerModule(module)

const toolbarConfig: Partial<IToolbarConfig> = {
    toolbarKeys: [
        "headerSelect",
        "blockquote",
        "|",
        "bold",
        "underline",
        "italic",
        {
            "key": "group-more-style",
            "title": "更多",
            "iconSvg": "<svg viewBox=\"0 0 1024 1024\"><path d=\"M204.8 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z\"></path><path d=\"M505.6 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z\"></path><path d=\"M806.4 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z\"></path></svg>",
            "menuKeys": [
                "through",
                // "code",
                // "sup",
                // "sub",
                "clearStyle"
            ]
        },
        "color",
        "bgColor",
        "|",
        "fontSize",
        // "fontFamily",
        // "lineHeight",
        "|",
        // "bulletedList",
        // "numberedList",
        // "todo",
        {
            "key": "group-justify",
            "title": "对齐",
            "iconSvg": "<svg viewBox=\"0 0 1024 1024\"><path d=\"M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z\"></path></svg>",
            "menuKeys": [
                "justifyLeft",
                "justifyRight",
                "justifyCenter",
                "justifyJustify"
            ]
        },
        {
            "key": "group-indent",
            "title": "缩进",
            "iconSvg": "<svg viewBox=\"0 0 1024 1024\"><path d=\"M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z\"></path></svg>",
            "menuKeys": [
                "indent",
                "delIndent"
            ]
        },
        "|",
        // {
        //     "key": "group-image",
        //     "title": "图片",
        //     "iconSvg": "<svg viewBox=\"0 0 1024 1024\"><path d=\"M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z\"></path></svg>",
        //     "menuKeys": [
        //         "insertImage",
        //         "uploadImage"
        //     ]
        // },
        // {
        //     "key": "group-video",
        //     "title": "视频",
        //     "iconSvg": "<svg viewBox=\"0 0 1024 1024\"><path d=\"M981.184 160.096C837.568 139.456 678.848 128 512 128S186.432 139.456 42.816 160.096C15.296 267.808 0 386.848 0 512s15.264 244.16 42.816 351.904C186.464 884.544 345.152 896 512 896s325.568-11.456 469.184-32.096C1008.704 756.192 1024 637.152 1024 512s-15.264-244.16-42.816-351.904zM384 704V320l320 192-320 192z\"></path></svg>",
        //     "menuKeys": [
        //         "insertVideo",
        //         "uploadVideo"
        //     ]
        // },
        // "|",
        // "insertTable",
        "divider",
        "|",
        "undo",
        "redo",
        "|",
        // baseInfoSelect.title,
        // patientInfoSelect.title,
        // useTemplateButton.title,
        // "|",
        "fullScreen",
        "|",
        InfoSelect.title,
        templateSelect.title,
        DynamicFields.title,
        useHotKeyButton.title
    ]
}

export default toolbarConfig