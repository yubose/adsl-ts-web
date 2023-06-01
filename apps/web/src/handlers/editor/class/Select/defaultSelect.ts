import { IDomEditor, ISelectMenu } from '@wangeditor/editor'
import { selectOptions, VALUE } from "../options"

export default class DefaultSelect implements ISelectMenu {
    title: string
    tag: string
    width?: number
    options: Array<VALUE>
    // callback: (editor: IDomEditor, value: string | boolean) => void
    constructor(opts: selectOptions) {
        this.title = opts.title
        this.tag = 'select'
        this.width = opts.width ? opts.width : 60
        // this.options = [{ value: this.title, text: this.title }, ...opts.options]
        this.options = opts.options
        const classFunctions = opts.classFunctions 
        if(classFunctions !== undefined) {
            Object.keys(classFunctions).forEach(key => {
                if(classFunctions[key] instanceof Function)
                    this[key] = classFunctions[key]
            })
        }
    }

    // 下拉框的选项
    getOptions(editor: IDomEditor) {   // TS 语法
        return this.options
    }

    // 菜单是否需要激活（如选中加粗文本，“加粗”菜单会激活），用不到则返回 false
    isActive(editor: IDomEditor): boolean {    // TS 语法
        return false
    }

    // 获取菜单执行时的 value ，用不到则返回空 字符串或 false
    getValue(editor: IDomEditor): string | boolean {    // TS 语法
        // return 'shanghai' // 匹配 options 其中一个 value
        // return this.title
        return this.options[0].value
    }

    // 菜单是否需要禁用（如选中 H1 ，“引用”菜单被禁用），用不到则返回 false
    isDisabled(editor: IDomEditor): boolean {   // TS 语法
        return false
    }

    // 点击菜单时触发的函数
    exec(editor: IDomEditor, value: string | boolean) {   // TS 语法
        // Select menu ，这个函数不用写，空着即可
        // this.callback(editor, value)
    }
}