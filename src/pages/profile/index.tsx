import { View as TaroView, Text as TaroText, Button as TaroButton, Textarea as TaroTextarea } from '@tarojs/components'
import { useState } from 'react'
import { useStore } from '../../store/useStore'
import Taro from '@tarojs/taro'

const View = TaroView as any
const Text = TaroText as any
const Button = TaroButton as any
const Textarea = TaroTextarea as any

export default function Profile() {
  const { user, tasks, rewards, addTask, deleteTask, addReward, deleteReward, importConfig } = useStore()
  
  const [mode, setMode] = useState<'view' | 'tasks' | 'rewards'>('view')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')

  // Gate Logic (Simulated)
  const checkGate = (target: 'tasks' | 'rewards') => {
    // 简化：在小程序里直接进入，或者可以用 Modal 实现算术题
    setMode(target)
  }

  const handleExport = (type: 'tasks' | 'rewards') => {
    const data = type === 'tasks' ? tasks : rewards
    Taro.setClipboardData({ data: JSON.stringify(data) })
  }

  const handleImport = () => {
    try {
        const data = JSON.parse(importText)
        if (Array.isArray(data)) {
            importConfig(mode === 'tasks' ? 'tasks' : 'rewards', data)
            Taro.showToast({title: '导入成功', icon:'success'})
            setShowImport(false)
        }
    } catch (e) {
        Taro.showToast({title: '格式错误', icon:'none'})
    }
  }

  if (mode !== 'view') {
    return (
        <View className="min-h-screen bg-bg-gray p-4 font-sans pb-24">
            <View className="flex justify-between items-center mb-6">
                <Text className="font-bold text-lg" onClick={() => setMode('view')}>&lt; 返回</Text>
                <View className="flex gap-2">
                    <Button size="mini" onClick={() => setShowImport(true)} className="text-xs bg-white">导入</Button>
                    <Button size="mini" onClick={() => handleExport(mode as any)} className="text-xs bg-blue-50 text-blue-500">导出</Button>
                </View>
            </View>

            {mode === 'tasks' ? (
                tasks.map(t => (
                    <View key={t.id} className="bg-white p-4 rounded-xl mb-3 flex justify-between items-center">
                        <View className="flex items-center">
                            <Text className="text-2xl mr-3">{t.icon}</Text>
                            <Text className="font-bold text-gray-800">{t.title}</Text>
                        </View>
                        <Button size="mini" onClick={() => deleteTask(t.id)} className="bg-red-50 text-red-500 m-0">删除</Button>
                    </View>
                ))
            ) : (
                rewards.map(r => (
                    <View key={r.id} className="bg-white p-4 rounded-xl mb-3 flex justify-between items-center">
                        <View className="flex items-center">
                             <Text className="text-2xl mr-3">{r.icon}</Text>
                             <View>
                                <Text className="font-bold text-gray-800 block">{r.title}</Text>
                                <Text className="text-xs text-pink-500">{r.cost} 🌟</Text>
                             </View>
                        </View>
                        <Button size="mini" onClick={() => deleteReward(r.id)} className="bg-red-50 text-red-500 m-0">删除</Button>
                    </View>
                ))
            )}
            
            <View className="mt-8 text-center text-gray-400 text-xs">此处仅展示列表，完整编辑功能请在代码中扩展</View>

            {showImport && (
                <View className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                    <View className="bg-white w-full rounded-2xl p-4">
                        <Text className="mb-2 block font-bold">粘贴配置JSON</Text>
                        <Textarea 
                            className="w-full h-32 bg-gray-50 p-2 text-xs mb-4" 
                            value={importText}
                            onInput={e => setImportText(e.detail.value)} 
                            maxlength={-1}
                        />
                        <View className="flex gap-2">
                            <Button onClick={() => setShowImport(false)} className="flex-1">取消</Button>
                            <Button onClick={handleImport} className="flex-1 bg-blue-500 text-white">确认</Button>
                        </View>
                    </View>
                </View>
            )}
        </View>
    )
  }

  return (
    <View className="min-h-screen bg-bg-blue p-4 font-sans">
      <View className="bg-white p-6 rounded-3xl shadow-sm text-center mb-6 mt-4">
          <View className="w-24 h-24 bg-pink-50 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl border-4 border-white shadow-inner">🐻</View>
          <Text className="text-xl font-bold text-slate-800 block">{user.name}</Text>
      </View>

      <View className="grid grid-cols-2 gap-3 mb-6">
          <View className="bg-orange-50 p-4 rounded-2xl text-center">
            <Text className="text-2xl block mb-1">🔥</Text>
            <Text className="text-xl font-bold text-orange-600 block">{user.streak}</Text>
            <Text className="text-xxs text-orange-400">连续打卡</Text>
          </View>
          <View className="bg-purple-50 p-4 rounded-2xl text-center">
            <Text className="text-2xl block mb-1">⚾</Text>
            <Text className="text-xl font-bold text-purple-600 block">{user.homeRuns}</Text>
            <Text className="text-xxs text-purple-400">全垒打</Text>
          </View>
      </View>

      <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <View onClick={() => checkGate('tasks')} className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50">
             <View className="flex items-center gap-3">
                 <View className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">📝</View>
                 <Text className="font-bold text-slate-700 text-sm">任务管理</Text>
             </View>
             <Text className="text-xs text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">家长</Text>
          </View>
          <View onClick={() => checkGate('rewards')} className="flex items-center justify-between p-4 active:bg-slate-50">
             <View className="flex items-center gap-3">
                 <View className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500">🎁</View>
                 <Text className="font-bold text-slate-700 text-sm">兑换管理</Text>
             </View>
             <Text className="text-xs text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">家长</Text>
          </View>
      </View>
    </View>
  )
}