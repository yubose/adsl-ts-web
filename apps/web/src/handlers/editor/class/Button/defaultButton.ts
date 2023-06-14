import { IButtonMenu, IDomEditor } from '@wangeditor/editor'
import { buttonOptions } from '../options'

// interface KEYEVENT {
//     type: 'keydown'|'keyup'|'keypress'
//     key: string, 
//     callback: () => void, 
//     useCombination?: "alt"|"shift"|"ctrl"|"mate"
//     isDestroy?: boolean
// }

class DefaultButton implements IButtonMenu {   // TS 语法

    title: string
    tag: string
    iconSvg?: string
    // status: boolean
    // callback: (editor: IDomEditor, value: string | boolean) => void

    constructor(opts: buttonOptions) {
        this.title = opts.title // 自定义菜单标题
        this.iconSvg = opts.svg ? opts.svg : ''
        this.tag = 'button'
        // this.callback = opts.callback
        // this.status = false
        const classFunctions = opts.classFunctions 
        if(classFunctions !== undefined) {
            Object.keys(classFunctions).forEach(key => {
                if(classFunctions[key] instanceof Function)
                    this[key] = classFunctions[key]
            })
        }
    }

    // 获取菜单执行时的 value ，用不到则返回空 字符串或 false
    getValue(editor: IDomEditor): string | boolean {   // TS 语法
        // this.status = !this.status
        // return this.status
        return true
    }

    // 菜单是否需要激活（如选中加粗文本，“加粗”菜单会激活），用不到则返回 false
    isActive(editor: IDomEditor): boolean {  // TS 语法
        // return this.status
        return false
    }

    // 菜单是否需要禁用（如选中 H1 ，“引用”菜单被禁用），用不到则返回 false
    isDisabled(editor: IDomEditor): boolean {   // TS 语法
        return false
    }

    // 点击菜单时触发的函数
    exec(editor: IDomEditor, value: string | boolean) {   // TS 语法
        // if (this.isDisabled(editor)) return
        // editor.updateView()
        // this.callback(editor, value)
    }
}

export default DefaultButton