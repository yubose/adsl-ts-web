export default class SelfDialog{
    el?: HTMLDivElement
    insert(message, options):void {
        const {confirmButtonText,confirmButtonCallback} = options
        const fragment = document.createDocumentFragment()
        const dialog_background = document.createElement('div')
        const dialog_container = document.createElement('div')
        const dialog_header = document.createElement('div')
        const dialog_header_span = document.createElement('span')
        dialog_header_span.innerText = 'Tips'

        const dialog_body = document.createElement('div')
        const dialog_body_span = document.createElement('span')
        dialog_body_span.innerText = message

        const dialog_footer = document.createElement('div')

        const dialog_footer_confirmButton = document.createElement('button')
        dialog_footer_confirmButton.innerText = confirmButtonText || 'Confirm'


        // 控制样式
        this.css(dialog_background, {
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'right': '0',
            'bottom': '0',
            'background-color': 'rgba(0, 0, 0, 0.2)',
            'z-index': '999999999',
            'direction': 'ltr',
            'font-synthesis': 'none',
            'text-rendering': 'optimizeLegibility',
            '-webkit-font-smoothing': 'antialiased',
        })

        this.css(dialog_container, {
            'width': '30%',
            'max-width': "600px",
            'position': 'relative',
            'top': '40%',
            'left': '50%',
            'transform': 'translate(-50%, -50%)',
            'background': '#ffffff',
            'box-shadow': '0px 12px 32px 4px rgba(0, 0, 0, .04), 0px 8px 20px rgba(0, 0, 0, .08)',
            'box-sizing': 'border-box',
            'border-radius': '2px',
        })

        this.css(dialog_header, {
            'padding': '20px',
            'padding-bottom':' 10px'
        })

        this.css(dialog_header_span, {
            'font-size': '24px',
            'line-height': '24px',
            'color': '#000000',
            'box-sizing': 'border-box'
        })

        this.css(dialog_body, {
            'padding': '20px',
            'padding-bottom':' 10px'
        })

        this.css(dialog_body_span, {
            'font-size': '18px',
            'line-height': '30px',
            'color': '#606266',
            'box-sizing': 'border-box'
        })

        this.css(dialog_footer, {
            'padding': '20px',
            'padding-top': '10px',
            'text-align': 'right',
            'box-sizing': 'border-box',
        })
        this.css(dialog_footer_confirmButton, {
            'margin-left': '12px',
            'vertical-align': 'middle',
            'color': '#ffffff',
            'background-color': '#3f79c9',
            'height': '32px',
            'white-space': 'nowrap',
            'cursor': 'pointer',
            'font-size': '14px',
            'border-radius': '4px',
            'text-align': 'center',
            'display': 'inline-flex',
            'justify-content': 'center',
            'align-items': 'center',
            'line-height': '1',
            'padding': '8px 15px',
            'outline': 'none',
            'font-weight': '500',
            'transition': '.1s',
            'border-color': '#3f79c9',
            'border-width': '0'

        })

        // 内部结构套入
        fragment.appendChild(dialog_background)
        dialog_background.appendChild(dialog_container)
        dialog_container.appendChild(dialog_header)
        dialog_header.appendChild(dialog_header_span)
        dialog_container.appendChild(dialog_body)
        dialog_body.appendChild(dialog_body_span)
        dialog_container.appendChild(dialog_footer)
        dialog_footer.appendChild(dialog_footer_confirmButton)


        // 整体显示到页面内
        this.el = dialog_background
        document.getElementsByTagName('body')[0].appendChild(fragment)

        // 确定绑定点击事件删除标签
        dialog_footer_confirmButton.onclick = function() {
            if (typeof confirmButtonCallback === 'function') {
                confirmButtonCallback()
            }
        }
    }
    
    css(targetObj, cssObj):void {
        var str = targetObj.getAttribute("style") ? targetObj.getAttribute('style') : '';
        for (var i in cssObj) {
            str += i + ':' + cssObj[i] + ';';
        }
        targetObj.style.cssText = str;
    }

    destroy():void{
        const { el } = this
        if (!el)
            return

        el.style.opacity = '0'
        el.style.visibility = 'hidden'
        el.style.transform = 'translateY(10px)'


        setTimeout(() => {
            el.remove()
        }, 150)
    }

}


