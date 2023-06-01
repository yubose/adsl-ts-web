import DataSource from "../dataSource/data"
import infoTemplate from "../dataSource/infoTemplate"
import { SharpType } from "./config"
import sharpHtml from "./sharpHtml"
import { toReg } from "./utils"

const atReg = /@\[[\w '\(\)]+\]/g
// const sharpReg = /#\[[\w]+\]/g
const sharpTypeReg = /#\[\w+:[^:]+:[^:]+\]/g
const atSplit = /[@\[\]]/g
const sharpSplit = /[#\[\]]/g

// const removeReg = /[^\w ]/g

// const atTemplateReg = /@\[[^:]+:\w+\]/g

export const matchChar = (html) => {
    const atKeywords = html.match(atReg)
    // console.log(atKeywords)
    atKeywords && atKeywords.forEach(item => {
        let regstr = item.replace(atSplit, '')
        if(DataSource.has(regstr)) 
            html = html.replace(
                new RegExp(`@\\[${toReg(regstr)}\\]`, 'g'), 
                `<span style="color:#2988e6;font-weight: bold;">${item.replace()}</span>`
            )
    })

    const sharpTypeKeywords = html.match(sharpTypeReg)
    sharpTypeKeywords && sharpTypeKeywords.forEach(item => {
        let regstr = item.replace(sharpSplit, '')
        let regarr = regstr.split(/:/g)
        html = sharpHtml({
            type: regarr[0] as SharpType,
            html: html,
            split: item,
            config: {
                title: regarr[1] as string,
                placeholder: regarr[2] as string
            }
        })
        if(/@\([\*]\)/.test(regarr[1])) {
            html = html.replace(regarr[1], `
            <div style="
                color:#333333;
                font-size: 1.039vw;
                font-weight: 600;
            "><span>${regarr[1].replace(/@\([\*]\)/, '')} </span><span style="color: red"> *</span>
            </div>`)
        }
    })

    // const asserts = window.app.nui.getAssetsUrl()

    // const sharpKeywords = html.match(sharpReg)
    // sharpKeywords && sharpKeywords.forEach(item => {
    //     let regstr = item.replace(sharpSplit, '')
    //     if(infoTemplate.has(regstr)) {
    //         html = html.replace(item, infoTemplate.get(regstr)?.replace("@[ASSERTS]", asserts))
    //     }
    // })

    // const atTemplateKeywords = html.match(atTemplateReg)
    // atTemplateKeywords && atTemplateKeywords.forEach(item => {
    //     let regstr = item.replace(atSplit, '')
    //     let title = regstr.split(":")[0]
    //     let key = regstr.split(":")[1]
    //     if(atMap.has(key)) html = html.replace(
    //         item,
    //         `<div style="display: grid; grid-template-columns: 1fr 1fr;">
    //             <div>${title}</div>
    //             <input value="${atMap.get(key)}" />
    //         </div>`
    //     )
    // })

    html = html.replace(/<p><\/p>/g, '')

    return html
}