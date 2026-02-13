import { View as TaroView, Text as TaroText, Button as TaroButton } from '@tarojs/components'
import { useMemo } from 'react'
import { useStore, Log } from '../../store/useStore'
import dayjs from 'dayjs'
import Taro from '@tarojs/taro'

const View = TaroView as any
const Text = TaroText as any
const Button = TaroButton as any

export default function Moments() {
  const { logs } = useStore()

  const moments = useMemo(() => {
    const list = logs.filter(l => l.type === 'magnet-moment').sort((a, b) => b.timestamp - a.timestamp)
    const groups: { date: string, display: string, items: Log[] }[] = []
    
    list.forEach(item => {
        const d = dayjs(item.timestamp)
        const dateKey = d.format('YYYY-MM-DD')
        let g = groups.find(x => x.date === dateKey)
        if (!g) {
            let display = d.format('MM月DD日')
            if (d.isSame(dayjs(), 'day')) display = '今天'
            else if (d.isSame(dayjs().subtract(1, 'day'), 'day')) display = '昨天'
            g = { date: dateKey, display, items: [] }
            groups.push(g)
        }
        g.items.push(item)
    })
    return groups
  }, [logs])

  const copyMoments = () => {
    let text = moments.map(g => {
        return `## ${g.display}\n` + g.items.map(i => `- ${i.description.replace('磁贴时刻: ', '')} (+${i.amount})`).join('\n')
    }).join('\n\n')
    Taro.setClipboardData({ data: text })
  }

  return (
    <View className="min-h-screen bg-bg-pink font-sans pb-24">
        {/* Header */}
        <View className="sticky top-0 z-20 bg-bg-pink/95 backdrop-blur-sm px-6 py-4 shadow-sm border-b border-pink-100 flex items-center justify-between">
            <Text className="text-xl font-bold text-gray-800">📸 美好时光</Text>
            <View className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-bold" onClick={copyMoments}>导出</View>
        </View>

        <View className="p-6 relative">
            <View className="absolute left-10 top-8 bottom-0 w-0.5 bg-gradient-to-b from-pink-200 to-transparent"></View>
            
            {moments.map(group => (
                <View key={group.date} className="mb-8 relative">
                    <View className="flex items-center mb-4 relative z-10">
                        <View className="w-8 h-8 rounded-full bg-pink-100 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-pink-500 ml-6 mr-4">📅</View>
                        <Text className="text-sm font-bold text-gray-500 bg-white/60 px-3 py-1 rounded-full">{group.display}</Text>
                    </View>
                    <View className="space-y-4 pl-14 pr-2">
                        {group.items.map(m => (
                            <View key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 relative">
                                <View className="flex justify-between items-start">
                                    <Text className="text-gray-800 text-sm leading-relaxed font-medium">{m.description.replace('磁贴时刻: ', '')}</Text>
                                    <View className="flex flex-col items-end ml-3 shrink-0">
                                        <Text className="bg-yellow-50 text-yellow-600 font-bold text-xs px-2 py-1 rounded-lg border border-yellow-100">+{m.amount}</Text>
                                        <Text className="text-xxs text-gray-400 mt-1">{dayjs(m.timestamp).format('HH:mm')}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            ))}
            
            {moments.length === 0 && (
                <View className="text-center py-20 opacity-50">暂无记录</View>
            )}
        </View>
    </View>
  )
}