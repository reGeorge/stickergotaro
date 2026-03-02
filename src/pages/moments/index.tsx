import { View as TaroView, Text as TaroText, Button as TaroButton, Input as TaroInput, Textarea as TaroTextarea } from '@tarojs/components'
import { useMemo, useState } from 'react'
import { useStore, Log } from '../../store/useStore'
import dayjs from 'dayjs'
import Taro from '@tarojs/taro'

const View = TaroView as any
const Text = TaroText as any
const Button = TaroButton as any
const Input = TaroInput as any
const Textarea = TaroTextarea as any

export default function Moments() {
  const { logs, deleteLog, updateLog, importConfig } = useStore()
  
  // 编辑状态
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLog, setEditingLog] = useState<Partial<Log> | null>(null)
  
  const handleDeleteMoment = (logId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条美好记录吗？删除后无法恢复，磁贴数量也会相应调整。',
      confirmText: '确定删除',
      confirmColor: '#ef4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          deleteLog(logId)
          Taro.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  }
  
  const openEditModal = (log: Log) => {
    setEditingLog({ ...log })
    setShowEditModal(true)
  }
  
  const saveEdit = () => {
    if (!editingLog || !editingLog.description) {
      Taro.showToast({ title: '请填写内容', icon: 'none' })
      return
    }
    if (!editingLog.amount || editingLog.amount < 1) {
      Taro.showToast({ title: '磁贴数量至少为1', icon: 'none' })
      return
    }
    
    updateLog(editingLog.id!, {
      description: editingLog.description,
      amount: editingLog.amount
    })
    Taro.showToast({ title: '修改成功！', icon: 'success' })
    setShowEditModal(false)
    setEditingLog(null)
  }

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

  const handleImport = () => {
    Taro.showActionSheet({
      itemList: ['从剪贴板导入'],
      success: () => {
        Taro.getClipboardData({
          success: (res) => {
            const text = res.data
            if (!text || !text.includes('##')) {
              Taro.showToast({ title: '格式错误', icon: 'none' })
              return
            }

            try {
              const lines = text.split('\n')
              const newLogs: Log[] = []
              let currentDate = dayjs() // 默认今天

              // 解析日期映射
              const parseDateHeader = (header: string): dayjs.Dayjs | null => {
                const today = dayjs()
                if (header.includes('今天')) return today
                if (header.includes('昨天')) return today.subtract(1, 'day')
                if (header.includes('前天')) return today.subtract(2, 'day')
                // 匹配 MM月DD日 格式
                const match = header.match(/(\d{1,2})月(\d{1,2})日/)
                if (match) {
                  return dayjs().month(parseInt(match[1]) - 1).date(parseInt(match[2]))
                }
                return null
              }

              for (const line of lines) {
                const trimmed = line.trim()
                // 日期行 ## 02月22日
                if (trimmed.startsWith('## ')) {
                  const date = parseDateHeader(trimmed.replace('## ', ''))
                  if (date) currentDate = date
                  continue
                }
                // 内容行 - 内容 (+数字)
                const itemMatch = trimmed.match(/^- (.+) \((\+?\d+)\)$/)
                if (itemMatch) {
                  const description = itemMatch[1]
                  const amount = parseInt(itemMatch[2])
                  newLogs.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    type: 'magnet-moment',
                    amount,
                    description: `磁贴时刻: ${description}`,
                    timestamp: currentDate.valueOf()
                  })
                }
              }

              if (newLogs.length > 0) {
                importConfig('logs', newLogs)
                Taro.showToast({ title: `导入 ${newLogs.length} 条记录！`, icon: 'success' })
              } else {
                Taro.showToast({ title: '未解析到记录', icon: 'none' })
              }
            } catch (e) {
              Taro.showToast({ title: '解析失败', icon: 'none' })
            }
          }
        })
      }
    })
  }

  return (
    <View className="min-h-screen bg-bg-pink font-sans pb-24">
        {/* Header */}
        <View className="sticky top-0 z-20 bg-bg-pink/95 backdrop-blur-sm px-6 py-4 shadow-sm border-b border-pink-100 flex items-center justify-between">
            <Text className="text-xl font-bold text-gray-800">📸 美好时光</Text>
            <View className="flex items-center gap-2">
                <View className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold active:bg-green-200" onClick={handleImport}>
                    <Text>📥 导入</Text>
                </View>
                <View className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-bold active:bg-pink-200" onClick={copyMoments}>
                    <Text>📋 导出</Text>
                </View>
            </View>
        </View>

        <View className="p-6 relative">
            {/* 时间轴垂直线条 - 自适应高度 */}
            <View className="absolute left-10 top-8 bottom-0 w-0.5 bg-gradient-to-b from-pink-200 via-pink-100 to-transparent"></View>

            {moments.map(group => (
                <View key={group.date} className="mb-10 relative">
                    {/* 日期分组标题 */}
                    <View className="flex items-center mb-6 relative z-10">
                        <View className="w-8 h-8 rounded-full bg-pink-100 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-pink-500 ml-6 mr-4">📅</View>
                        <Text className="text-sm font-bold text-gray-500 bg-white/60 px-3 py-1 rounded-full">{group.display}</Text>
                    </View>
                    
                    {/* 条目容器 - 增加左侧padding以对齐时间轴 */}
                    <View className="pl-14 pr-2">
                        {group.items.map(m => (
                            <View key={m.id} className="relative pb-8 pl-6">
                                {/* 时间轴小圆点 - 精准对齐气泡顶部 */}
                                <View className="absolute left-0 top-3 w-3 h-3 rounded-full bg-pink-300 border-2 border-white shadow-sm z-10"></View>
                                
                                {/* 气泡卡片 - 优化留白和圆角 */}
                                <View className="bg-white p-4 rounded-3xl shadow-sm border border-pink-50">
                                    {/* 内容区域 */}
                                    <Text className="text-gray-800 text-sm leading-relaxed font-medium block mb-3">
                                        {m.description.replace('磁贴时刻: ', '')}
                                    </Text>
                                    
                                    {/* 底部操作栏 */}
                                    <View className="flex items-center justify-between pt-3 border-t border-pink-50">
                                        {/* 左侧：时间 */}
                                        <Text className="text-xs text-gray-400">{dayjs(m.timestamp).format('HH:mm')}</Text>
                                        
                                        {/* 右侧：标签和按钮 */}
                                        <View className="flex items-center gap-2">
                                            {/* 磁贴数量标签 */}
                                            <View className="bg-yellow-50 text-yellow-600 font-bold text-xs px-2 py-1 rounded-lg border border-yellow-100">
                                                <Text>+{m.amount}</Text>
                                            </View>
                                            
                                            {/* 编辑按钮 */}
                                            <View 
                                                onClick={(e) => { e.stopPropagation(); openEditModal(m); }}
                                                className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center active:bg-blue-100 transition-all"
                                            >
                                                <Text className="text-xs text-blue-400">✎</Text>
                                            </View>
                                            
                                            {/* 删除按钮 */}
                                            <View 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteMoment(m.id); }}
                                                className="w-6 h-6 bg-red-50 rounded-full flex items-center justify-center active:bg-red-100 transition-all"
                                            >
                                                <Text className="text-xs text-red-400">✕</Text>
                                            </View>
                                        </View>
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
        
        {/* 编辑模态框 */}
        {showEditModal && editingLog && (
            <View className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => { setShowEditModal(false); setEditingLog(null); }}>
                <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <Text className="text-lg font-bold mb-4 block">编辑美好时光</Text>
                    
                    <View className="mb-4">
                        <Text className="text-xs font-bold text-slate-500 mb-2 block">美好内容</Text>
                        <Textarea 
                            className="w-full bg-slate-50 rounded-xl p-3 text-sm h-24"
                            value={editingLog.description?.replace('磁贴时刻: ', '')}
                            onInput={(e) => setEditingLog({ ...editingLog, description: `磁贴时刻: ${e.detail.value}` })}
                            placeholder="记录美好瞬间..."
                            maxlength={200}
                        />
                    </View>
                    
                    <View className="mb-6">
                        <Text className="text-xs font-bold text-slate-500 mb-2 block">磁贴数量</Text>
                        <Input 
                            type="number"
                            className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                            value={editingLog.amount !== undefined ? String(editingLog.amount) : ''}
                            onInput={(e) => {
                              const val = e.detail.value
                              setEditingLog({ ...editingLog, amount: val === '' ? undefined : Number(val) })
                            }}
                            placeholder="磁贴数量"
                        />
                    </View>
                    
                    <Button onClick={saveEdit} className="w-full bg-pink-500 text-white rounded-xl font-bold py-3">保存修改</Button>
                </View>
            </View>
        )}
    </View>
  )
}