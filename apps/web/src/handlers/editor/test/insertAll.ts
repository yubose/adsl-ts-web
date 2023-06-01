import { IDomEditor } from "@wangeditor/editor";
import DataSource from "../dataSource/data";

const insertAll = (editor: IDomEditor) => {
    let html = ''
    DataSource.forEach((value, key) => {
        html += `<p>@[${key}]</p>`
    })
    editor.setHtml(html)
}

export default insertAll