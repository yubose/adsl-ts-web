const reg =new RegExp(/(log.debug)|(log.info)|(trackProperty)|(console.log)|(log\.teal)|(log\.salmon)|(log\.grey)|(log\.func)|(log\.red)|(log\.hotpink)|(log\.orange)|(log\.green)/,"g")
module.exports = function(source) {
    let targetArr = source?.match(reg);
    if(targetArr?.length){
      targetArr.forEach(ele => {
        let numIndex = source.indexOf(ele);
        let index = numIndex+ele.length;
        if(source.at(index)==="("){
          let left = 1;
          let right = 0;
          for(let v = index+1;v<source.length;v++){
            if(source.at(v)==="("){
              left += 1;
            }else if(source.at(v) === ")"){
                right+=1;
              if(source.at(v)===")"&&(left===right)){
                if([",",";"].includes(source.at(v+1))){
                  v+=1;
                }
                source = source.slice(0,numIndex)+ source.slice(v+1,source.length);
                break;
            }
            }
          }
        }
      });
    }
    return source;
}
