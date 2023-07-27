import { IToolbarConfig, Boot, IModuleConf, IDomEditor, DomEditor, SlateElement, SlateTransforms } from "@wangeditor/editor";
import DefaultButton from "./class/Button/defaultButton";
import DefaultSelect from "./class/Select/defaultSelect";
import { inputPopUp } from "./utils/popUp";
import searchPopUp from "./utils/search";
import getImageObject from "./utils/svg";
import withBlock from "./node/plugIn";
import { renderAtBlock, renderSharpBlock } from "./node/node";
import { AtBlockToHtml, SharpBlockToHtml } from "./node/nodeToHtml";
import { parseAtBlockHtml, parseSharpBlockHtml } from "./node/parseNode";
import selectTemplate from "./utils/selectTemplate";


// const input = document.createElement('input')
// input.type = 'file'
// input.click()
// input.onchange = () => {
//     // console.log(input.files)
//     if(input.files) {
//         const file = input.files[0] as File
//         const reader = new FileReader
//         reader.onload = e => {
//             console.log(e.target?.result)
//             const node = {
//                 type: "image",
//                 alt: file.name,
//                 src: e.target?.result,
//                 href: '',
//                 children: [
//                     {text: ''}
//                 ]
//             }
//             editor.insertNode(node)
//         }
//         reader.readAsDataURL(file)
//     }
// }

const DynamicFields = new DefaultButton({
    title: "Dynamic Fields",
    classFunctions: {
        exec: (editor: IDomEditor, value: string | boolean) => {
            // editor.insertText(`-editing-@[]-editing-`)
            const selection = editor.selection
            searchPopUp({
                editor, 
                selection
            })
        }
    }
})
const DynamicFieldsConf = {
    key: DynamicFields.title,
    factory() {
        return DynamicFields
    }
}

type ImageElement = SlateElement & {
    src: string
    alt: string
    url: string
    href: string
}

function imageIsActive(editor: IDomEditor) {
    const imageElem = DomEditor.getSelectedNodeByType(editor, 'image') as ImageElement
    if(imageElem === null) return false
    return imageElem.href === "markeable"
}

function imageExec(editor: IDomEditor, value: string | boolean) {
    const imageElem = DomEditor.getSelectedNodeByType(editor, 'image') as ImageElement
    if(imageElem === null) return false
    let node: Partial<ImageElement> = {}
    if(imageElem.href === "markeable") {
        node = {
            href: ""
        }
    } else {
        node = {
            href: "markeable"
        }
    }
    SlateTransforms.setNodes(
        editor,
        node,
        {
            at: DomEditor.findPath(editor, imageElem)
        }
    )
}

const imageIsMarkeable = new DefaultButton({
    title: "Markeable",
    svg: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16.004" height="15" viewBox="0 0 16.004 15">
        <path id="路径_23518" data-name="路径 23518" d="M65.413,127.625a1.6,1.6,0,0,0-1.6,1.6v9.611a1.6,1.6,0,0,0,1.6,1.6h5.24l.254-1.068H65.413a.532.532,0,0,1-.534-.534v-.989l3.794-4.28,3.81,4.022.75-.758-.634-.673,1.368-1.543.709.742.746-.758-1.476-1.565-2.084,2.349-3.214-3.391-3.768,4.246v-7.011a.533.533,0,0,1,.534-.534H77.152a.533.533,0,0,1,.534.534v3.762a2.035,2.035,0,0,1,.213-.025h.053a2.8,2.8,0,0,1,.8.167v-3.9a1.6,1.6,0,0,0-1.6-1.6Zm9.071,2.136a1.068,1.068,0,1,0,1.067,1.068A1.071,1.071,0,0,0,74.484,129.761Zm3.418,4.276a1.34,1.34,0,0,0-.95.4L71.974,139.5l-.742,3.12,3.118-.739.1-.108,4.96-4.876a1.353,1.353,0,0,0,.009-1.915l-.559-.564A1.334,1.334,0,0,0,77.9,134.036Zm.009,1.059a.279.279,0,0,1,.2.088l.559.56a.272.272,0,0,1,0,.4l-4.852,4.767-1.15.28.275-1.151,4.772-4.855A.267.267,0,0,1,77.911,135.1Z" transform="translate(-63.813 -127.625)" fill="#4b4b4b"/>
    </svg>
    `,
    classFunctions: {
        isActive: imageIsActive,
        exec: imageExec
    }
})

const imageIsMarkeableConf = {
    key: imageIsMarkeable.title,
    factory() {
        return imageIsMarkeable
    }
}



const renderAtBlockConf = {
    type: 'atblock', // 新元素 type ，重要！！！
    renderElem: renderAtBlock,
}

const atBlockToHtmlConf = {
    type: 'atblock', // 新元素的 type ，重要！！！
    elemToHtml: AtBlockToHtml,
}

const parseAtBlockHtmlConf = {
    selector: 'span[data-w-e-type="atblock"]', // CSS 选择器，匹配特定的 HTML 标签
    parseElemHtml: parseAtBlockHtml,
}

const renderSharpBlockConf = {
    type: 'sharpblock', // 新元素 type ，重要！！！
    renderElem: renderSharpBlock,
}

const sharpBlockToHtmlConf = {
    type: 'sharpblock', // 新元素的 type ，重要！！！
    elemToHtml: SharpBlockToHtml,
}

const parseSharpBlockHtmlConf = {
    selector: 'span[data-w-e-type="sharpblock"]', // CSS 选择器，匹配特定的 HTML 标签
    parseElemHtml: parseSharpBlockHtml,
}

const mod = {
    editorPlugin: withBlock,
    renderElems: [renderAtBlockConf, renderSharpBlockConf],
    elemsToHtml: [atBlockToHtmlConf, sharpBlockToHtmlConf],
    parseElemsHtml: [parseAtBlockHtmlConf, parseSharpBlockHtmlConf]
}

Boot.registerMenu(DynamicFieldsConf)

Boot.registerMenu(imageIsMarkeableConf)

Boot.registerModule(mod)

const registerToolbar = () => {

    const random = Date.now().toString(32)

    const templateSelect = new DefaultSelect({
        title: 'template' + random,
        width: 100,
        options: [
            {value: "Insert", text: "Insert", styleForRenderMenuList: { display: "none" }},
            {value: "TextShort", text: `Input Box(Short)`, styleForRenderMenuList: getImageObject('textShort')},
            {value: "TextField", text: `Input Box(Single Line)`, styleForRenderMenuList: getImageObject('textField')},
            {value: "TextView", text: `Input Box(Mutiline)`, styleForRenderMenuList: getImageObject('textView')},
            {value: "Choice", text: "Choice", styleForRenderMenuList: getImageObject('choice')},
            {value: "Diagnosis", text: `Diagnosis`, styleForRenderMenuList: getImageObject('diagnosis')},
            {value: "Patient/Guardian Signature", text: `Patient/Guardian Signature`, styleForRenderMenuList: getImageObject('patient/guardian signature')},
            {value: "Provider Signature", text: `Provider Signature`, styleForRenderMenuList: getImageObject('signature')},
            {value: "Date&Time", text: `Date&Time`, styleForRenderMenuList: getImageObject('dateAndTime')},
            {value: "Image", text: "Image", styleForRenderMenuList: getImageObject('image')},
            {value: "Image(Markeable)", text: "Image(Markeable)", styleForRenderMenuList: getImageObject('markeableImage')},
        ],
        classFunctions: {
            exec: (editor: IDomEditor, value: string | boolean) => {
                // const selection = editor.selection
                // switch(value) {
                //     case "TextView":
                //         // editor.insertText(`-editing-#[textView:editableTitle:editableText]-editing
                //         inputPopUp(editor, value, selection)
                //         break
                //     case "TextField":
                //         // editor.insertText(`-editing-#[textField:editableTitle:editableText]-editing-`)
                //         inputPopUp(editor, value, selection)
                //         break
                //     case "Signature":
                //         insertNode(editor, "sharpblock", `#${value}`, selection)
                //         break
                //     default:
                //         editor.insertText('')
                // }
                selectTemplate(editor, value)
            }
        }
    })

    const InfoSelect = new DefaultSelect({
        title: "info" + random,
        width: 60,
        options: [
            {value: "Info", text: "Info", styleForRenderMenuList: { display: "none" }},
            {value: "FacilityInfo", text: "FacilityInfo", styleForRenderMenuList: getImageObject('facilityInfo')},
            {value: "PatientInfo", text: "PatientInfo", styleForRenderMenuList: getImageObject('patientInfo')},
            {value: "ProviderInfo", text: "ProviderInfo", styleForRenderMenuList: getImageObject('providerInfo')},
        ],
        classFunctions: {
            exec: (editor: IDomEditor, value: string | boolean) => {
                // editor.insertText(`#[${value}]`)
                // switch(value) {
                //     case "FacilityInfo":
                //         SlateTransforms.insertNodes(editor, FacilityInfo, {
                //             voids: true
                //         })
                //         break
                //     case "PatientInfo":
                //         SlateTransforms.insertNodes(editor, PatientInfo, {
                //             voids: true
                //         })
                //         break
                //     case "ProviderInfo":
                //         SlateTransforms.insertNodes(editor, ProviderInfo, {
                //             voids: true
                //         })
                //         break
                //     default:
                //         break
                // }
                selectTemplate(editor, value)
                // editor.insertBreak()
                // editor.focus(true)
            }
        }
    })

    const templateConf = {
        key: templateSelect.title,
        factory() {
            return templateSelect
        }
    }

    const InfoSelectConf = {
        key: InfoSelect.title,
        factory() {
            return InfoSelect
        }
    }

    const module: Partial<IModuleConf> = {
        menus: [templateConf, InfoSelectConf]
    }

    Boot.registerModule(module)

    const toolbarConfig: Partial<IToolbarConfig> = {
        toolbarKeys: [
            "headerSelect",
            // "blockquote",
            "|",
            // "bold",
            // "underline",
            // "italic",
            // "clearStyle",
            // "|",
            // {
            //     "key": "group-more-style",
            //     "title": "更多",
            //     "iconSvg": "<svg viewBox=\"0 0 1024 1024\"><path d=\"M204.8 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z\"></path><path d=\"M505.6 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z\"></path><path d=\"M806.4 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z\"></path></svg>",
            //     "menuKeys": [
            //         // "through",
            //         // "code",
            //         // "sup",
            //         // "sub",
            //         "clearStyle"
            //     ]
            // },
            // "color",
            // "bgColor",
            // "|",
            // "fontSize",
            // "fontFamily",
            // "lineHeight",
            // "|",
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
            // {
            //     "key": "group-indent",
            //     "title": "缩进",
            //     "iconSvg": "<svg viewBox=\"0 0 1024 1024\"><path d=\"M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z\"></path></svg>",
            //     "menuKeys": [
            //         "indent",
            //         "delIndent"
            //     ]
            // },
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
            "insertTable",
            "divider",
            "|",
            "undo",
            "redo",
            "|",
            "fullScreen",
            "|",
            InfoSelect.title,
            templateSelect.title,
            DynamicFields.title,
        ]
    }
    return {
        toolbarConfig,
        templateSelect,
        InfoSelect
    }
}

export default registerToolbar

export {
    DynamicFields
}

// export default toolbarConfig