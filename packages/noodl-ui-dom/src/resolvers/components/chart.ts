// import { placeholder } from '..'
import { RegisterOptions } from '../../types'
import * as echarts from 'echarts';
export default {
  name: '[noodl-ui-dom] chart',
  cond: 'chart',
  resolve(node: HTMLLabelElement, component) {
    const dataValue = component.get('data-value') || ''||('dataKey')
    const chartDom = node;
    chartDom.style.width = component.getStyle('width')
    chartDom.style.height = component.getStyle('height')
    var myChart = echarts.init(chartDom);
    var option = dataValue;
    option && myChart.setOption(option);
  },
} as RegisterOptions