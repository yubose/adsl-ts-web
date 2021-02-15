// import { placeholder } from '..'
import { RegisterOptions } from '../../types'
import * as echarts from 'echarts';
export default {
  name: '[noodl-ui-dom] chart',
  cond: 'chart',
  resolve(node: HTMLLabelElement, component) {
    const dataValue = component.get('data-value') || ''||('dataKey')
    console.dir(dataValue)
    var chartDom = node;
    chartDom.style.width = '400px'
    chartDom.style.height = '400px'
    var myChart = echarts.init(chartDom);
    var option = dataValue;
    option && myChart.setOption(option);
  },
} as RegisterOptions