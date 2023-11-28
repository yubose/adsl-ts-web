import { MapKind } from "noodl-yaml/dist/constants"
import DataSource from "../dataSource/data"
import infoTemplate from "../dataSource/infoTemplate"
import { SharpType } from "./config"
import sharpHtml from "./sharpHtml"
import { textSharpRegStr, textSharpGetReg, textSharpSplitRegG, choiceSharpRegStr, choiceSharpGetReg, choiceArrayStr } from "./textSharp"
import { decode, toReg } from "./utils"

// const atReg = /@\[[\w '\(\)]+\]/g
// const sharpReg = /#\[[\w]+\]/g
// const sharpTypeReg = /#\[\w+\|-|\[\s\S]+\|-|\[\s\S]+\]/g
// const atSplit = /[@\[\]]/g
// const sharpSplit = /[#\[\]]/g

// const removeReg = /[^\w ]/g

// const atTemplateReg = /@\[[^:]+:\w+\]/g

// const HeadHtml = `
//     <div style="
//         width:100%;
//         height: 30px;
//         font-size: 20px;
//         font-weight: bold;
//         color: #005795;
//         border-bottom: 2px solid #005795;
//         margin-top: 10px;
//     ">
//         --Title--
//     </div>
//     <div id="Content"></div>
// `


// export const matchChar = (html) => {
//     const atKeywords = html.match(atReg)
//     // console.log(atKeywords)
//     atKeywords && atKeywords.forEach(item => {
//         let regstr = item.replace(atSplit, '')
//         if(DataSource.has(regstr)) 
//             html = html.replace(
//                 new RegExp(`@\\[${toReg(regstr)}\\]`, 'g'), 
//                 `<span style="color:#2988e6;font-weight: bold;border: 2px solid #ccc;border-radius: 4px;padding: 4px;">${item.replace()}</span>`
//             )
//     })

//     const sharpTypeKeywords = html.match(sharpTypeReg)
//     sharpTypeKeywords && sharpTypeKeywords.forEach(item => {
//         let regstr = item.replace(sharpSplit, '')
//         let regarr = regstr.split(/:/g)
//         html = sharpHtml({
//             type: regarr[0] as SharpType,
//             html: html,
//             split: item,
//             config: {
//                 title: regarr[1] as string,
//                 placeholder: regarr[2] as string
//             }
//         })
//         if(/@\([\*]\)/.test(regarr[1])) {
//             html = html.replace(regarr[1], `
//             <div style="
//                 color:#333333;
//                 font-size: 1.039vw;
//                 font-weight: 600;
//             "><span>${regarr[1].replace(/@\([\*]\)/, '')} </span><span style="color: red"> *</span>
//             </div>`)
//         }
//     })

//     const asserts = window.app.nui.getAssetsUrl()

//     const sharpKeywords = html.match(sharpReg)
//     sharpKeywords && sharpKeywords.forEach(item => {
//         let regstr = item.replace(sharpSplit, '')
//         if(infoTemplate.has(regstr)) {
//             html = html.replace(item, infoTemplate.get(regstr)?.replace("@[ASSERTS]", asserts))
//         }
//     })

//     // const atTemplateKeywords = html.match(atTemplateReg)
//     // atTemplateKeywords && atTemplateKeywords.forEach(item => {
//     //     let regstr = item.replace(atSplit, '')
//     //     let title = regstr.split(":")[0]
//     //     let key = regstr.split(":")[1]
//     //     if(atMap.has(key)) html = html.replace(
//     //         item,
//     //         `<div style="display: grid; grid-template-columns: 1fr 1fr;">
//     //             <div>${title}</div>
//     //             <input value="${atMap.get(key)}" />
//     //         </div>`
//     //     )
//     // })

//     // if(title === '') title = "Template Name"

//     html = html.replace(/<p><\/p>/g, '')

//     return html
// }

// const atBlockReg = /<span data-w-e-type="atblock" data-w-e-is-void data-w-e-is-inline data-value="[\w '\(\)]+">@[\w '\(\)]+<\/span>/g
// const sharpBlockReg = /<button is-sharp>#[\w*]+:[^:]+:[^:]+<\/button>/g

export const matchBlock = (html) => {
    html = decode(html)
    const REG = `<span data-w-e-type="--type--" data-w-e-is-void(="")? --isInline-- data-value="--key--">--key--<\/span>`

    const atBlockReg = new RegExp(
        REG
        .replace(/--type--/g, 'atblock')
        .replace(/--key--/g, `@[\\w '\\(\\)]+`)
        .replace(/--isInline--/g, `data-w-e-is-inline(="")?`), 'g')
    const atKeywords = html.match(atBlockReg)
    atKeywords && atKeywords.forEach(item => {
        const texts = item.match(/>@[\w '\(\)]+</g)
        const text = texts[0].replace(/[@><]/g, '')
        if(DataSource.has(text)) {
            if(text === "Input Box(Short)") {
                html = html.replace(
                    new RegExp(toReg(item), 'g'),
                    `
                        <input style="
                            box-sizing: border-box;
                            text-indent: 0.8em;
                            height: 24px;
                            border-color: rgb(222,222,222);
                            color: rgb(51,51,51);
                            outline: none;
                            border-style: solid;
                            border-width: thin;
                            border-radius: 4px;
                        " readonly />
                    `
                )
            } else {
                html = html.replace(
                    new RegExp(toReg(item), 'g'),
                    `<span style="
                        color:#2988e6;
                        font-weight: bold;
                        border: thin solid #ccc;
                        border-radius: 4px;
                        padding: 0px 4px;
                        margin: 0px 2px;
                    ">@${text}</span>`
                )
            }
        }
    })

    const sharpTextBlockReg = new RegExp(
        REG
        .replace(/--type--/g, 'sharpblock')
        .replace(/--key--/g, textSharpRegStr)
        .replace(/--isInline--/g, `data-key="[a-zA-Z0-9]+"`), 'g')
    const sharpTextKeywords = html.match(sharpTextBlockReg)
    sharpTextKeywords && sharpTextKeywords.forEach(item => {
        const texts = item.match(textSharpGetReg)
        // const text = texts[0].replace(/[#><]/g, '')
        const text = texts[0].slice(2, texts[0].length-1)
        const arr = text.split(textSharpSplitRegG)
        html = sharpHtml({
            type: arr[0] as SharpType,
            html: html,
            split: item,
            config: {
                title: arr[1] as string,
                placeholder: arr[2] as string
            }
        })
    })

    const sharpChoiceBlockReg = new RegExp(
        REG
        .replace(/--type--/g, 'sharpblock')
        .replace(/--key--/g, choiceSharpRegStr)
        .replace(/--isInline--/g, `data-key="[a-zA-Z0-9]+" data-array="${choiceArrayStr}"`), 'g')
    const sharpChoiceKeywords = html.match(sharpChoiceBlockReg)
    sharpChoiceKeywords && sharpChoiceKeywords.forEach(item => {
        const texts = item.match(choiceSharpGetReg)
        // const text = texts[0].replace(/[#><]/g, '')
        const text = texts[0].slice(2, texts[0].length-1)
        const arr = text.split(textSharpSplitRegG)
        html = sharpHtml({
            type: arr[0] as SharpType,
            html: html,
            split: item,
            config: {
                title: arr[1] as string,
                placeholder: arr[2] as string
            }
        })
    })

    const sharpDateTimeBlockReg = new RegExp(
        REG
        .replace(/--type--/g, 'sharpblock')
        .replace(/--key--/g, choiceSharpRegStr)
        .replace(/--isInline--/g, `data-key="[a-zA-Z0-9]+"`), 'g')
    const sharpDateTimeKeywords = html.match(sharpDateTimeBlockReg)
    sharpDateTimeKeywords && sharpDateTimeKeywords.forEach(item => {
        const texts = item.match(choiceSharpGetReg)
        // const text = texts[0].replace(/[#><]/g, '')
        const text = texts[0].slice(2, texts[0].length-1)
        const arr = text.split(textSharpSplitRegG)
        html = sharpHtml({
            type: arr[0] as SharpType,
            html: html,
            split: item,
            config: {
                title: arr[1] as string
            }
        })
    })

    const SharpBlockReg = new RegExp(
        REG
        .replace(/--type--/g, 'sharpblock')
        .replace(/--key--/g, `#[\\w /]+`)
        .replace(/--isInline--/g, `data-key="[a-zA-Z0-9]+"`), 'g')
    const sharpKeywords = html.match(SharpBlockReg)
    sharpKeywords && sharpKeywords.forEach(item => {
        const text = item.match(/>#[\w /]+</g)[0].replace(/[#><]/g, '')
        html = sharpHtml({
            type: text,
            html,
            split: item,
            config: {}
        })
    })

    const MarkeableImageReg = /<img src="data:image\/[a-zA-Z]*;base64,[A-Za-z0-9+/=]+" alt="[0-9a-zA-Z]+" data-href="(markeable)?" style="width: [0-9]+(.[0-9]+)?px;height: [0-9]+(.[0-9]+)?px;"(\/)?>/g
    const markeableImagewords = html.match(MarkeableImageReg)
    markeableImagewords && markeableImagewords.forEach(item => {
        const href = item.match(/data-href="(markeable)?"/)[0].replace(/data-href=/, "").replace(/"/g, '')
        const width = item.match(/width: [0-9]+(.[0-9]+)?px/g)[0].replace(/width: /, '').replace(/["px]/g, '')
        if(href === "markeable")
            html = html.replace(item, `
                <span style="display: inline-block;max-width: 80%;width: ${width}px;">
                    <span style="color: #F8AE29;margin-bottom: 8px;font-size: 14px;font-weight: normal;white-space: nowrap;">(Markeable when using the template)</span><br>
                    ${item}
                </span>
            `)
        else 
            html = html.replace(item, `
                <span style="display: inline-block;max-width: 80%;width: ${width}px;">
                    ${item}
                </span>
            `)
    })

    html = html.replace(/<p><\/p>/g, '')

    return html
}