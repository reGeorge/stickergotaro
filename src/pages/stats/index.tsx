import { View as TaroView, Text as TaroText } from '@tarojs/components'
import { useMemo } from 'react'
import { useStore } from '../../store/useStore'
import * as echarts from 'echarts/core';
import { EChart as TaroEChart } from 'echarts-taro3-react';
import dayjs from 'dayjs'

const View = TaroView as any
const Text = TaroText as any
const EChart = TaroEChart as any

// 注意：实际项目中需要在入口处注册 ECharts 组件，这里为了简化省略
// import { LineChart, PieChart } from 'echarts/charts';
// ... echarts.use(...)

export default function Stats() {
  const { logs } = useStore()

  // 1. Calculate Week Stats
  const weekData = useMemo(() => {
    const days = Array.from({length: 7}, (_, i) => dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD'))
    const data = days.map(day => {
        const dayLogs = logs.filter(l => dayjs(l.timestamp).format('YYYY-MM-DD') === day)
        const income = dayLogs.reduce((acc, l) => l.amount > 0 ? acc + l.amount : acc, 0)
        const expense = Math.abs(dayLogs.reduce((acc, l) => l.amount < 0 ? acc + l.amount : acc, 0))
        return { day, income, expense }
    })
    
    const totalIncome = data.reduce((acc, d) => acc + d.income, 0)
    const totalExpense = data.reduce((acc, d) => acc + d.expense, 0)

    return { days, data, totalIncome, totalExpense, net: totalIncome - totalExpense }
  }, [logs])

  // 2. Line Chart Option
  const lineOption = {
    grid: { top: 10, right: 10, bottom: 20, left: 30 },
    xAxis: {
        type: 'category',
        data: weekData.days.map(d => d.slice(5)),
        axisLine: { show: false },
        axisTick: { show: false }
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed' } }
    },
    series: [
        { type: 'line', data: weekData.data.map(d => d.income), itemStyle: { color: '#3b82f6' }, smooth: true, showSymbol: false },
        { type: 'line', data: weekData.data.map(d => d.expense), itemStyle: { color: '#ef4444' }, smooth: true, lineStyle: { type: 'dashed' }, showSymbol: false }
    ]
  }

  // 3. Pie Chart Logic
  const pieOption = useMemo(() => {
    const recentLogs = logs.filter(l => l.amount > 0) // Simplify for all time to ensure data
    const groups: {[key: string]: number} = {}
    recentLogs.forEach(l => {
        let key = '其他'
        if (l.type === 'bonus') key = '全垒打'
        else if (l.type === 'mood') key = '心情'
        else if (l.type === 'magnet-moment') key = '时刻'
        else if (l.description.includes('完成约定')) key = l.description.replace('完成约定: ', '').slice(0, 4)
        groups[key] = (groups[key] || 0) + l.amount
    })
    const data = Object.entries(groups).map(([name, value]) => ({ name, value }))
    
    return {
        series: [{
            type: 'pie',
            radius: ['50%', '80%'],
            data: data,
            label: { show: false }
        }]
    }
  }, [logs])

  return (
    <View className="min-h-screen bg-bg-blue p-4 pb-24 font-sans">
        <Text className="text-lg font-bold text-gray-800 ml-2 mb-4 block">数据统计</Text>

        {/* Summary */}
        <View className="grid grid-cols-3 gap-3 px-2 mb-6">
            <View className="bg-blue-50 p-3 rounded-2xl text-center border border-blue-100">
                <Text className="text-xxs text-blue-400 font-bold mb-1 block">近7天收入</Text>
                <Text className="text-lg font-bold text-blue-600">+{weekData.totalIncome}</Text>
            </View>
            <View className="bg-red-50 p-3 rounded-2xl text-center border border-red-100">
                <Text className="text-xxs text-red-400 font-bold mb-1 block">近7天支出</Text>
                <Text className="text-lg font-bold text-red-600">{weekData.totalExpense}</Text>
            </View>
            <View className="bg-green-50 p-3 rounded-2xl text-center border border-green-100">
                <Text className="text-xxs text-green-400 font-bold mb-1 block">净增长</Text>
                <Text className="text-lg font-bold text-green-600">{weekData.net}</Text>
            </View>
        </View>

        {/* Charts */}
        <View className="bg-white m-2 p-4 rounded-3xl shadow-sm border border-gray-100 mb-4">
            <Text className="font-bold text-gray-800 text-sm mb-4 block">📈 收支趋势</Text>
            <View className="w-full h-48">
                <EChart echarts={echarts} option={lineOption} />
            </View>
        </View>

        <View className="bg-white m-2 p-4 rounded-3xl shadow-sm border border-gray-100">
            <Text className="font-bold text-gray-800 text-sm mb-4 block">📊 收入来源</Text>
            <View className="w-full h-48 flex items-center justify-center">
                 <EChart echarts={echarts} option={pieOption} />
            </View>
        </View>
    </View>
  )
}