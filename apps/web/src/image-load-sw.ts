declare var self: ServiceWorkerGlobalScope

import pako from 'pako'
import axios from 'axios'

self.__WB_MANIFEST

function base64ToUint8Array(base64String:string){
    const base64 = atob(base64String); // 将 Base64 字符串解码为二进制数据
    const bytes = new Uint8Array(base64.length);
    for (let i = 0; i < base64.length; i++) {
        bytes[i] = base64.charCodeAt(i);
    }
    return bytes
}

function ungzip(data: Uint8Array){
    return pako.ungzip(data)
}
function uint8ArrayToBlob(data:Uint8Array,type:string){
    const blob = new Blob([data], {type: type})
    return blob
}

async function downloadDocumentFromS3({
    url,
  }) {
    try {
      const { data } = await axios.get(url)
      return data
    } catch (error) {
      throw 'ERROR_DOWNLOADING_FROM_AWS_S3'
    }
  }


addEventListener('message',async function(e){
    const {id,type,isZipped,url} = e.data
    const base64String = await downloadDocumentFromS3({url})
    let data = base64ToUint8Array(base64String)
    if (isZipped) data = ungzip(data)
    const blob = await uint8ArrayToBlob(data,type)
    this.postMessage({
        id,
        blob
    })

})