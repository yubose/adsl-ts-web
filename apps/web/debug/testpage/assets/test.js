let docBody = document.body;
let echartUrl = 'https://cdn.bootcdn.net/ajax/libs/echarts/5.0.0-beta.2/echarts.js';
let jqueryUrl = 'https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js';
let dataUSApi = 'https://api.covidtracking.com/v1/us/current.json';
let dataStatesApi = 'https://api.covidtracking.com/v1/states/current.json'
let FieldsUSA = ['Confirmed', 'Deaths', 'ConfirmIncrease', 'deathIncrease']
let FieldsStates = ['States', 'Confirmed', 'Deaths', 'ConfirmIncrease', 'deathIncrease']
let addscriptTag = (src) => {
  let script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.src = src;
  let scriptTag = document.getElementsByTagName('script')[0];
  scriptTag.parentNode.insertBefore(script, scriptTag);
}
addscriptTag(jqueryUrl);
addscriptTag(echartUrl);
let setBodyStyle = (node) => {
  node.style.width = '100%'
  node.style.position = "absoult"
}
let setUsStyle = (node) => {
  node.style.height = '200px'
  node.style.width = '100%'
  node.style.position = "relative"
  node.style.top = '10px';
}
let setTitleStyle = (node) => {
  node.style.width = '100%'
  node.style.position = "relative"
  node.style.top = '10px';
  node.style.display = 'flex';
  node.style.justifyContent = 'space-around';
}
let setStateStyle = (node) => {
  node.style.minHeight = '100px'
  node.style.width = '100%'
  node.style.position = "relative"
  node.style.top = '20px';
}
let setTrStyle = (node, color) => {
  node.style.minHeight = '60px'
  node.style.width = '100%'
  node.style.backgroundColor = color;
  node.style.textAlign = 'center';
  node.style.height = '60px';
}
let setMapStyle = (node) => {
  node.style.width = '100%';
  node.style.height = '800px';
  node.style.margin = 'auto'
}

let dynamicData = document.createElement('div');
let usaMap = document.createElement('div');
let usData = document.createElement('div');
let stateDate = document.createElement('div');
let usDateTitle = document.createElement('div');
let stateDateTitle = document.createElement('div');

let creatTableUSA = () => {
  let table = document.createElement('table');
  let tr = document.createElement('tr');
  setTrStyle(table, '#d9e2f3');
  setTrStyle(tr, '#d9e2f3');
  FieldsUSA.map(item => {
    let th = document.createElement('th');
    th.innerHTML = item;
    tr.appendChild(th);
  })
  table.append(tr);
  return table;
}
let creatTableStates = () => {
  let table = document.createElement('table');
  let tr = document.createElement('tr');
  setTrStyle(table, '#4472c4');
  setTrStyle(tr, '#4472c4');
  FieldsStates.map(item => {
    let th = document.createElement('th');
    th.innerHTML = item;
    tr.appendChild(th);
  })
  table.append(tr);
  return table;
}
let tableTitleUSA = creatTableUSA();
// 创建表格
let createTableRow = (data, color) => {
  let tr = document.createElement('tr');
  setTrStyle(tr, color);
  data.map(item => {
    let td = document.createElement('td');
    td.innerHTML = item;
    tr.appendChild(td);
  })
  return tr;
}
let tableTitleStates = creatTableStates();
usDateTitle.appendChild(tableTitleUSA);
usData.appendChild(usDateTitle);

stateDateTitle.appendChild(tableTitleStates);
stateDate.appendChild(stateDateTitle);

dynamicData.appendChild(usData);
dynamicData.appendChild(usaMap);
dynamicData.appendChild(stateDate);
// 创建节点
function myFunction() {
  var node = document.createElement("LI");
  var textnode = document.createTextNode("Water");
  node.appendChild(textnode);
  document.getElementById("myList").appendChild(node);
}
// 设置dom元素样式
setBodyStyle(dynamicData);
setUsStyle(usData);
setStateStyle(stateDate);
setTitleStyle(usDateTitle);
setMapStyle(usaMap);
let creatEle = (color, data) => {
  let newEle = document.createElement('div');
  newEle.innerHTML = data;
  setDataStyle(newEle, color);
  dynamicData.insertBefore(newEle, dynamicData.firstChild)
}
let getJsonData = (Apiurl) => {
  let promise = new Promise((res, rej) => {
    let httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', Apiurl, 'true');
    httpRequest.responseType = 'json';
    httpRequest.setRequestHeader('Accept', "application/json");
    httpRequest.onreadystatechange = handler;
    httpRequest.send();
    function handler() {
      if (this.readyState !== 4) {
        return;
      } else if (httpRequest.status == 200) {
        res(this.response);
      } else {
        rej(new Error(this.statusText));
      }
    }
  })
  return promise;
}
getJsonData(dataUSApi).then((data) => {
  // 获取到整个美国的数据
  let jsonData = data[0];
  console.log(jsonData);
  let useFulDate = [
    jsonData.positive,
    jsonData.death,
    jsonData.positiveIncrease,
    jsonData.deathIncrease]
  let row = createTableRow(useFulDate);
  setTrStyle(row, '#ffffff');
  tableTitleUSA.appendChild(row);
}, (err) => {
  console.log('There must be some error');
})
getJsonData(dataStatesApi).then((data) => {
  // 获取到整个美国的数据
  let jsonData = data;
  let mapUsData = [{
    name: "",
    data: ""
  }];
  let dataArray = new Array();
  console.log(jsonData);
  // console.log(jsonData.length);
  for (let i = 0; i < jsonData.length; i++) {
    let useFulDate = [
      jsonData[i].state,
      jsonData[i].positive,
      jsonData[i].death,
      jsonData[i].positiveIncrease,
      jsonData[i].deathIncrease]
    mapUsData[i] = {
      name: jsonData[i].state,
      value: jsonData[i].positive
    }
    dataArray[i] = jsonData[i].positive;
    if (i % 2 == 1) {
      let row = createTableRow(useFulDate, '#ffffff');
      setTrStyle(row);
      tableTitleStates.appendChild(row);
    } else {
      let row = createTableRow(useFulDate, '#d9e2f3');
      setTrStyle(row);
      tableTitleStates.appendChild(row);
    }
  }
  let maxNum = Math.max(...dataArray);
  let minNum = Math.min(...dataArray);
  mapData(usaMap, mapUsData,maxNum,minNum);
}, (err) => {
  console.log('There must be some error');
})

let mapData = (node, data, max, min) => {
  var myChart = echarts.init(node);
  myChart.showLoading();
  $.get('https://public.aitmed.com/commonRes/aitmed/USA.json', function (usaJson) {
    myChart.hideLoading();
    echarts.registerMap('USA', usaJson, {
      AK: {
        left: -131,
        top: 25,
        width: 15
      },
      HI: {
        left: -110,
        top: 28,
        width: 5
      },
      PR: {
        left: -76,
        top: 26,
        width: 2
      }
    });
    option = {
      title: {
        text: 'Covid-19 dynamic data in the United States',
        subtext: 'Data from https://covidtracking.com/about-data/sources',
        sublink: 'https://covidtracking.com/about-data/sources',
        left: 'right'
      },
      tooltip: {
        trigger: 'item',
        showDelay: 0,
        transitionDuration: 0.2,
        formatter: function (params) {
          var value = (params.value + '').split('.');
          value = value[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, '$1,');
          return params.seriesName + '<br/>' + params.name + ': ' + value;
        }
      },
      visualMap: {
        left: 'right',
        min: min,
        max: max,
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        },
        text: ['High', 'Low'],
        calculable: true
      },
      toolbox: {
        show: true,
        left: 'left',
        top: 'top',
        feature: {
          dataView: { readOnly: false },
          restore: {},
          saveAsImage: {}
        }
      },
      series: [
        {
          name: 'Number of confirmed CASES of COVID-19',
          type: 'map',
          roam: true,
          map: 'USA',
          emphasis: {
            label: {
              show: true
            }
          },
          textFixed: {
            AK: [20, -20]
          },
          data: data
        }
      ]
    };

    myChart.setOption(option);
  });
}
docBody.insertBefore(dynamicData, docBody.firstChild);
