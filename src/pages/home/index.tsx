import { View as TaroView, Text as TaroText, Image as TaroImage, Textarea as TaroTextarea, Button as TaroButton } from '@tarojs/components'
import { useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import classNames from 'classnames'
import Taro from '@tarojs/taro'

const View = TaroView as any
const Text = TaroText as any
const Image = TaroImage as any
const Textarea = TaroTextarea as any
const Button = TaroButton as any

export default function Home() {
  const { user, tasks, toggleTask, addMagnets } = useStore()
  
  // Computed
  const todaysProgress = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length
    const total = tasks.length
    return { completed, total, percentage: total === 0 ? 0 : (completed / total) * 100 }
  }, [tasks])

  // Local State for Modals
  const [showMood, setShowMood] = useState(false)
  const [moodSuccess, setMoodSuccess] = useState(false)
  const [showMoment, setShowMoment] = useState(false)
  const [momentDesc, setMomentDesc] = useState('')
  const [momentAmount, setMomentAmount] = useState(1)

  // --- Handlers ---
  
  const handleMoodConvert = (moodLabel: string) => {
    // 模拟延迟
    Taro.showLoading({ title: '转换心情中...' })
    setTimeout(() => {
      Taro.hideLoading()
      addMagnets(2, `心情转换: 处理了 ${moodLabel}`, 'mood')
      setMoodSuccess(true)
    }, 500)
  }

  const submitMoment = () => {
    if (!momentDesc) return
    addMagnets(momentAmount, `磁贴时刻: ${momentDesc}`, 'magnet-moment')
    setShowMoment(false)
    setMomentDesc('')
    setMomentAmount(1)
    Taro.showToast({ title: '记录成功', icon: 'success' })
  }

  return (
    <View className="min-h-screen bg-bg-blue p-4 pb-24 font-sans">
      {/* Header */}
      <View className="flex items-center justify-between px-2 mb-6">
        <View>
          <Text className="text-xl font-bold text-slate-800 block">你好, {user.name}! 👋</Text>
          <Text className="text-slate-500 text-xs mt-1 block">今天也要加油收集磁贴哦！</Text>
        </View>
        <View className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
           <Text className="text-2xl">🐻</Text>
        </View>
      </View>

      {/* Stats Card */}
      <View className="bg-gradient-to-br from-pink-400 via-rose-400 to-purple-400 rounded-3xl p-6 text-white shadow-xl shadow-pink-200 relative overflow-hidden mb-6">
        <View className="flex justify-between items-start mb-6 relative z-10">
             <View>
                <Text className="text-pink-100 text-xs font-bold mb-1 uppercase tracking-wide block">我的磁贴总数</Text>
                <View className="flex items-center">
                   <Text className="text-6xl font-black">{user.magnets}</Text>
                   <Text className="text-3xl ml-2 opacity-80">🌟</Text>
                </View>
             </View>
             <View className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                <Text className="text-3xl">🏆</Text>
             </View>
        </View>

        <View className="bg-black/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 relative z-10">
             <View className="flex justify-between items-center mb-2">
                <Text className="text-xs font-bold text-white/90">每日约定场景</Text>
                <Text className="text-xs font-bold text-pink-100">{todaysProgress.completed} / {todaysProgress.total}</Text>
             </View>
             <View className="h-3 bg-black/20 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 shadow-glow transition-all duration-500 ease-out" 
                  style={{ width: `${todaysProgress.percentage}%` }}
                ></View>
             </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="grid grid-cols-2 gap-4 px-1 mb-6">
        <View onClick={() => setShowMoment(true)} className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col items-center justify-center active:scale-95 transition-all h-28">
           <View className="w-10 h-10 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center text-xl mb-2">
             <Text>📸</Text>
           </View>
           <Text className="text-xs font-bold text-slate-600">磁贴时刻</Text>
        </View>
        <View onClick={() => { setMoodSuccess(false); setShowMood(true); }} className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 flex flex-col items-center justify-center active:scale-95 transition-all h-28">
           <View className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl mb-2">
             <Text>🌈</Text>
           </View>
           <Text className="text-xs font-bold text-slate-600">心情转换</Text>
        </View>
      </View>

      {/* Tasks List */}
      <View className="px-1">
         <View className="grid grid-cols-1 gap-3">
            {tasks.map(task => (
                <View 
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={classNames(
                        "relative overflow-hidden bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 flex items-center transition-all active:scale-98",
                        { "opacity-80": task.completed }
                    )}
                >
                    {task.completed && (
                        <View className="absolute inset-0 bg-emerald-50/70 flex items-center justify-end pr-6 z-10 backdrop-blur-xs">
                            <View className="bg-white px-3 py-1 rounded-full shadow-sm border border-emerald-100 flex items-center">
                                <Text className="text-emerald-600 font-bold text-sm">✓ 完成</Text>
                            </View>
                        </View>
                    )}
                    <View className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-2xl mr-4 shrink-0">
                        <Text>{task.icon}</Text>
                    </View>
                    <View className="flex-1 min-w-0">
                        <Text className="font-bold text-slate-800 text-sm block truncate">{task.title}</Text>
                        <View className="mt-1 inline-block bg-indigo-50 px-2 py-0.5 rounded-lg">
                            <Text className="text-xs text-indigo-500 font-bold">+{task.magnetReward} 磁贴</Text>
                        </View>
                    </View>
                </View>
            ))}
         </View>
      </View>

      {/* Modals using root-portal or absolute positioning with high Z */}
      
      {/* Mood Modal */}
      {showMood && (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6">
            <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                {!moodSuccess ? (
                    <>
                        <Text className="text-lg font-bold text-center block mb-2">🌈 心情转换器</Text>
                        <Text className="text-center text-slate-400 text-xs block mb-6">把小情绪变成正能量！</Text>
                        <View className="grid grid-cols-3 gap-3 mb-6">
                            {[{icon:'😤',label:'生气'},{icon:'😢',label:'难过'},{icon:'😫',label:'疲惫'}].map(m => (
                                <View key={m.label} onClick={() => handleMoodConvert(m.label)} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 active:bg-purple-50">
                                    <Text className="text-4xl mb-2">{m.icon}</Text>
                                    <Text className="text-xs font-bold text-slate-600">{m.label}</Text>
                                </View>
                            ))}
                        </View>
                        <Button onClick={() => setShowMood(false)} className="bg-transparent text-slate-400 text-sm">取消</Button>
                    </>
                ) : (
                    <View className="flex flex-col items-center">
                        <Text className="text-4xl mb-4">🎉</Text>
                        <Text className="text-xl font-bold text-purple-600 mb-1">太棒了！</Text>
                        <Text className="text-slate-600 text-sm mb-4">你成功控制了情绪！</Text>
                        <View className="bg-yellow-100 px-4 py-2 rounded-full mb-6">
                            <Text className="text-yellow-800 font-bold text-sm">+2 磁贴 🌟</Text>
                        </View>
                        <Button onClick={() => setShowMood(false)} className="w-full bg-purple-600 text-white rounded-xl font-bold">收下奖励</Button>
                    </View>
                )}
            </View>
        </View>
      )}

      {/* Moment Modal */}
      {showMoment && (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6">
            <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <View className="flex justify-between items-center mb-4">
                    <Text className="text-lg font-bold">📸 磁贴时刻</Text>
                    <View onClick={() => setShowMoment(false)}><Text className="text-slate-400">✕</Text></View>
                </View>
                <Text className="text-xs font-bold text-slate-500 mb-2 block">发生了什么美好的事情？</Text>
                <Textarea 
                    value={momentDesc}
                    onInput={(e) => setMomentDesc(e.detail.value)}
                    className="w-full bg-slate-50 rounded-xl p-3 text-sm h-24 mb-4 border border-slate-100"
                    placeholder="例如：主动帮妈妈扫地..." 
                />
                <Text className="text-xs font-bold text-slate-500 mb-2 block">奖励磁贴数量</Text>
                <View className="flex justify-between gap-2 mb-6">
                    {[1,2,3,4,5].map(n => (
                        <View 
                            key={n} 
                            onClick={() => setMomentAmount(n)}
                            className={classNames(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-all",
                                momentAmount === n ? "bg-pink-500 border-pink-500 text-white scale-110" : "bg-white border-slate-100 text-slate-400"
                            )}
                        >
                            <Text>{n}</Text>
                        </View>
                    ))}
                </View>
                <Button onClick={submitMoment} className="bg-pink-500 text-white rounded-xl font-bold">记录并获得奖励</Button>
            </View>
        </View>
      )}
    </View>
  )
}