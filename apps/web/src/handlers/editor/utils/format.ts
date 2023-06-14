const removeReg = /[^\w ]/g

const formatKey = (str: string, isSharp = false) => {
    const arr = str.replace(removeReg, ' ').split(/ /)
    let key = ''
    arr.forEach((item: string) => {
        if(item !== ''){
            item = item.toLowerCase()
            item = item.replace(item[0], item[0].toUpperCase())
            key += item
        }
    })
    if(isSharp) key += "Sharp"
    return key
}

export default formatKey