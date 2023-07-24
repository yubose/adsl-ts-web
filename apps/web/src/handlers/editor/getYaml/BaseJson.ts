interface REQUIRED {
    key: string
    title: string
}

const BaseJson = {
    formData: {
        DataAndTime: {
            flag: '',
            value: ''
        },
        imgCanvas: {
            imgCanvasId: ``,
            imgCanvasDataKey: ``
        }
    },
    required: new Array<REQUIRED>(),
    components: {
        
    }
}

export default BaseJson