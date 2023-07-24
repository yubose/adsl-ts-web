interface REQUIRED {
    key: string
    title: string
}

const BaseJson = {
    formData: {
        DataAndTime: {
            flag: '',
            value: ''
        }
    },
    imgCanvas: {
        option: {
            id: '',
            fileName: '',
            imgPath: ''
        },
        dataKey: ``
    },
    required: new Array<REQUIRED>(),
    components: {
        
    }
}

export default BaseJson