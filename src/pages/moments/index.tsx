import { View as TaroView, Text as TaroText, Button as TaroButton, Input as TaroInput, Textarea as TaroTextarea } from '@tarojs/components'
import { useMemo, useState } from 'react'
import { useStore, Log } from '../../store/useStore'
import dayjs from 'dayjs'
import Taro from '@tarojs/taro'
import { getMatchingBadge } from '../../config/badges.config'

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

  const normalizeImportedLogs = (items: any[]): Log[] => {
    return items
      .filter(item => item && typeof item === 'object')
      .map((item, index) => ({
        id: String(item.id || `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`),
        type: item.type === 'earn' ? 'earn' : 'magnet-moment',
        amount: Math.max(1, Number(item.amount || 1)),
        description:
          item.type === 'earn'
            ? String(item.description || '完成约定: 未命名任务')
            : String(item.description || '磁贴时刻: 未命名记录'),
        timestamp: Number(item.timestamp || Date.now())
      }))
  }

  const parseMarkdownMoments = (text: string): Log[] => {
    const lines = text.split('\n')
    const newLogs: Log[] = []
    let currentDate = dayjs()

    const parseDateHeader = (header: string): dayjs.Dayjs | null => {
      const today = dayjs()
      if (header.includes('今天')) return today
      if (header.includes('昨天')) return today.subtract(1, 'day')
      if (header.includes('前天')) return today.subtract(2, 'day')
      const match = header.match(/(\d{1,2})月(\d{1,2})日/)
      if (match) {
        return dayjs().month(parseInt(match[1]) - 1).date(parseInt(match[2]))
      }
      return null
    }

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('## ')) {
        const date = parseDateHeader(trimmed.replace('## ', ''))
        if (date) currentDate = date
        continue
      }
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
    return newLogs
  }

  const importFromClipboard = (mode: 'markdown' | 'json') => {
    Taro.getClipboardData({
      success: (res) => {
        const text = (res.data || '').trim()
        if (!text) {
          Taro.showToast({ title: '剪贴板为空', icon: 'none' })
          return
        }

        try {
          let newLogs: Log[] = []
          if (mode === 'json') {
            const parsed = JSON.parse(text)
            if (!Array.isArray(parsed)) {
              throw new Error('JSON_NOT_ARRAY')
            }
            newLogs = normalizeImportedLogs(parsed)
          } else {
            if (!text.includes('##')) {
              Taro.showToast({ title: 'Markdown 格式错误', icon: 'none' })
              return
            }
            newLogs = parseMarkdownMoments(text)
          }

          if (newLogs.length > 0) {
            importConfig('logs', newLogs)
            Taro.showToast({ title: `导入 ${newLogs.length} 条记录！`, icon: 'success' })
          } else {
            Taro.showToast({ title: '未解析到记录', icon: 'none' })
          }
        } catch (e) {
          Taro.showToast({ title: mode === 'json' ? 'JSON 解析失败' : '解析失败', icon: 'none' })
        }
      }
    })
  }

  const handleImport = () => {
    Taro.showActionSheet({
      itemList: ['导入 Markdown 剪贴板', '导入 logs.json 剪贴板'],
      success: (res) => {
        if (res.tapIndex === 1) {
          importFromClipboard('json')
          return
        }
        importFromClipboard('markdown')
      }
    })
  }

  return (
    <View className="min-h-screen bg-bg-pink font-sans pb-24">
        {/* Header */}
        <View className="sticky top-0 z-20 bg-bg-pink/95 backdrop-blur-sm px-6 py-4 shadow-sm border-b border-pink-100 flex items-center justify-between">
            <Text className="text-xl font-bold text-gray-800">📸 美好时光</Text>
            <View className="flex items-center gap-2">
                <View className="bg-white text-slate-600 px-4 py-1.5 rounded-full text-xs font-medium active:scale-95 shadow-sm border border-slate-100 transition-all flex items-center justify-center" onClick={handleImport}>
                    <Text>导入</Text>
                </View>
                <View className="bg-indigo-50 text-indigo-500 px-4 py-1.5 rounded-full text-xs font-medium active:scale-95 shadow-sm border border-indigo-100 transition-all flex items-center justify-center" onClick={copyMoments}>
                    <Text>导出</Text>
                </View>
            </View>
        </View>

        <View className="p-6 relative">
            {/* 时间轴垂直线条 - 自适应高度 (立体化阴影) */}
            <View className="absolute left-10 top-8 bottom-0 w-1 bg-gradient-to-b from-pink-300 via-pink-200 to-transparent rounded-full shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)]"></View>

            {moments.map(group => (
                <View key={group.date} className="mb-10 relative">
                    {/* 日期分组标题 */}
                    <View className="flex items-center mb-6 relative z-10">
                        <View className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 border-2 border-white shadow-[0_4px_8px_rgba(244,114,182,0.3)] flex items-center justify-center text-sm font-bold text-pink-500 ml-5 mr-4 transform -translate-x-[2px]">📅</View>
                        <Text className="text-sm font-bold text-slate-600 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-50">{group.display}</Text>
                    </View>
                    
                    {/* 条目容器 - 增加左侧padding以对齐时间轴 */}
                    <View className="pl-14 pr-2">
                        {group.items.map(m => (
                            <View key={m.id} className="relative pb-8 pl-6">
                                {/* 时间轴小圆点 - 精准对齐气泡顶部 */}
                                <View className="absolute left-[-2px] top-4 w-3.5 h-3.5 rounded-full bg-pink-400 border-2 border-white shadow-[0_2px_4px_rgba(244,114,182,0.4)] z-10"></View>
                                
                                {/* 左侧三角小箭头指示 */}
                                <View className="absolute left-4 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-r-white border-b-[8px] border-b-transparent z-10 drop-shadow-sm"></View>

                                {/* 气泡卡片 - 立体感阴影 3D */}
                                <View className="bg-gradient-to-br from-white to-pink-50/30 p-5 rounded-3xl shadow-[0_8px_20px_-4px_rgba(244,114,182,0.15),inset_0__2px_4px_rgba(255,255,255,1)] border border-white relative z-0">
                                    {/* 内容区域 */}
                                    <View className="flex justify-between items-start mb-3">
                                        <Text className="text-slate-800 text-sm leading-relaxed font-bold block drop-shadow-sm flex-1">
                                            {m.description.replace('磁贴时刻: ', '')}
                                        </Text>
                                        {/* 勋章微标 */}
                                        {getMatchingBadge(m.description) && (
                                            <View className={`ml-2 px-2 py-0.5 rounded-full bg-gradient-to-r ${getMatchingBadge(m.description)!.bgGradient} border border-white/50 shadow-sm flex items-center justify-center shrink-0`}>
                                                <Text className="text-sm">{getMatchingBadge(m.description)!.icon}</Text>
                                            </View>
                                        )}
                                    </View>
                                    
                                    {/* 底部操作栏 */}
                                    <View className="flex items-center justify-between pt-3 border-t border-pink-100/50">
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
