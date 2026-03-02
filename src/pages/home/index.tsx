import { View as TaroView, Text as TaroText, Image as TaroImage, Textarea as TaroTextarea, Button as TaroButton } from '@tarojs/components'
import { useState, useMemo } from 'react'
import { useStore, Task } from '../../store/useStore'
import classNames from 'classnames'
import Taro from '@tarojs/taro'
import { soundService } from '../../utils/sound'
import RewardAnimation from '../../components/RewardAnimation'

const View = TaroView as any
const Text = TaroText as any
const Image = TaroImage as any
const Textarea = TaroTextarea as any
const Button = TaroButton as any

export default function Home() {
  const { user, tasks, toggleTask, toggleMonthlyTask, addMagnets } = useStore()
  
  // Tab 切换状态
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily')
  
  // 按类型过滤任务
  const dailyTasks = useMemo(() => tasks.filter(t => t.type === 'daily'), [tasks])
  const monthlyTasks = useMemo(() => tasks.filter(t => t.type === 'monthly'), [tasks])
  
  // Computed
  const todaysProgress = useMemo(() => {
    // 只计算每日任务的进度
    const completed = dailyTasks.reduce((sum, t) => sum + (t.completedCount || 0), 0)
    const total = dailyTasks.reduce((sum, t) => sum + (t.dailyLimit || 1), 0)
    return { completed, total, percentage: total === 0 ? 0 : (completed / total) * 100 }
  }, [dailyTasks])

  // Local State for Modals
  const [showMood, setShowMood] = useState(false)
  const [moodSuccess, setMoodSuccess] = useState(false)
  const [showMoment, setShowMoment] = useState(false)
  const [momentDesc, setMomentDesc] = useState('')
  const [momentAmount, setMomentAmount] = useState(1)
  const [showMagnets, setShowMagnets] = useState(false)

  // --- Handlers ---
  
  const handleTaskClick = (taskId: string, taskTitle: string) => {
    Taro.showModal({
      title: '确认完成约定',
      content: `确定要完成"${taskTitle}"吗？`,
      confirmText: '完成了',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          toggleTask(taskId)
        }
      }
    })
  }
  
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
      {/* 全屏反馈动画层 */}
      <RewardAnimation />
      
      {/* Tab Switcher - 滑动胶囊设计 */}
      <View className="px-1 mb-6">
        <View className="bg-white/30 backdrop-blur-md rounded-full p-1.5 flex border border-white/50 shadow-lg">
          <View 
            onClick={() => setActiveTab('daily')}
            className={classNames(
              "flex-1 py-3 rounded-full text-center font-bold text-sm transition-all duration-300",
              activeTab === 'daily' 
                ? "bg-white shadow-md text-indigo-600" 
                : "text-slate-500"
            )}
          >
            <Text>⚡ 今日挑战</Text>
          </View>
          <View 
            onClick={() => setActiveTab('monthly')}
            className={classNames(
              "flex-1 py-3 rounded-full text-center font-bold text-sm transition-all duration-300",
              activeTab === 'monthly' 
                ? "bg-white shadow-md text-indigo-600" 
                : "text-slate-500"
            )}
          >
            <Text>🏆 恒心榜单</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="grid grid-cols-2 gap-4 px-1 mb-6">
        <View onClick={() => setShowMoment(true)} className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100 flex flex-col items-center justify-center active:scale-95 transition-all min-h-[120rpx]">
           <View className="w-10 h-10 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center text-xl mb-3">
             <Text>📸</Text>
           </View>
           <Text className="text-sm font-bold text-slate-600">磁贴时刻</Text>
        </View>
        <View onClick={() => { setMoodSuccess(false); setShowMood(true); }} className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 flex flex-col items-center justify-center active:scale-95 transition-all min-h-[120rpx]">
           <View className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl mb-3">
             <Text>🌈</Text>
           </View>
           <Text className="text-sm font-bold text-slate-600">心情转换</Text>
        </View>
      </View>

      {/* Tasks List */}
      <View className="px-1">
         <View className="grid grid-cols-1 gap-3">
            {/* 根据当前 Tab 显示不同类型的任务 */}
            {(activeTab === 'daily' ? dailyTasks : monthlyTasks).map(task => {
              if (task.type === 'daily') {
                // 每日任务卡片
                const dailyLimit = task.dailyLimit || 1;
                const completedCount = task.completedCount || 0;
                const isFullyCompleted = completedCount >= dailyLimit;

                return (
                    <View 
                        key={task.id}
                        onClick={() => handleTaskClick(task.id, task.title)}
                        className={classNames(
                            "relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-indigo-50 transition-all active:scale-98 min-h-[160rpx]",
                            { "opacity-60": isFullyCompleted }
                        )}
                    >
                        {isFullyCompleted && (
                            <View className="absolute inset-0 bg-emerald-50/70 flex items-center justify-end pr-6 z-10 backdrop-blur-xs">
                                <View className="bg-white px-4 py-2 rounded-full shadow-sm border border-emerald-100 flex items-center">
                                    <Text className="text-emerald-600 font-bold text-sm">✓ 已达上限</Text>
                                </View>
                            </View>
                        )}
                        <View className="flex justify-between items-center gap-4">
                            <View className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm">
                                <Text>{task.icon}</Text>
                            </View>
                            <View className="flex-1 min-w-0 flex flex-col space-y-2">
                                <Text className="font-bold text-slate-800 text-base block truncate tracking-wide">{task.title}</Text>
                                <View className="flex items-center gap-2 flex-wrap">
                                    <View className="inline-block bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1 rounded-xl border border-indigo-100/50">
                                        <Text className="text-xs text-indigo-600 font-bold">+{task.magnetReward} 磁贴</Text>
                                    </View>
                                    {dailyLimit > 1 && (
                                        <View className="inline-block bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-1 rounded-xl border border-orange-100/50">
                                            <Text className="text-xs text-orange-600 font-bold">{completedCount}/{dailyLimit}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                );
              } else {
                // 月度任务卡片
                const progress = task.monthlyProgress || 0;
                const target = task.targetDays || 20;
                const bonus = task.bonusReward || 10;
                const percentage = Math.min(100, (progress / target) * 100);
                const isAchieved = progress >= target;
                
                // 检查今日是否已打卡
                const today = new Date().toISOString().split('T')[0];
                const history = task.history || [];
                const isTodayChecked = history.includes(today);

                return (
                    <View 
                        key={task.id}
                        onClick={() => {
                          if (isAchieved) {
                            // TODO: 领取奖励逻辑
                          } else if (!isTodayChecked) {
                            toggleMonthlyTask(task.id);
                          }
                        }}
                        className={classNames(
                          "relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm transition-all",
                          isAchieved ? "border-2 border-yellow-400" : "border border-indigo-50",
                          !isAchieved && !isTodayChecked && "active:scale-98"
                        )}
                    >
                        {/* 流光效果 - 达成目标时 */}
                        {isAchieved && (
                          <View className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 via-orange-200/20 to-yellow-200/20 animate-pulse"></View>
                        )}
                        
                        <View className="relative z-10">
                            {/* 标题和图标 */}
                            <View className="flex justify-between items-start mb-4">
                                <View className="flex items-center gap-3">
                                    <View className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                        <Text>{task.icon}</Text>
                                    </View>
                                    <View>
                                        <Text className="font-bold text-slate-800 text-base block">{task.title}</Text>
                                        <Text className="text-xs text-slate-500">坚持 {progress}/{target} 天</Text>
                                    </View>
                                </View>
                                
                                {/* 圆形进度条 */}
                                <View className="relative w-14 h-14">
                                    {/* 背景圆环 */}
                                    <View className="absolute inset-0 rounded-full border-4 border-slate-200"></View>
                                    
                                    {/* 进度圆环 - 使用多个 div 模拟圆环进度 */}
                                    {percentage > 0 && (
                                      <View 
                                        className="absolute inset-0 rounded-full border-4 border-emerald-500 transition-all duration-500"
                                        style={{
                                          clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(percentage * 2 * Math.PI / 100)}% ${50 - 50 * Math.cos(percentage * 2 * Math.PI / 100)}%, 50% 50%)`
                                        }}
                                      ></View>
                                    )}
                                    
                                    {/* 进度文字 */}
                                    <View className="absolute inset-0 flex items-center justify-center">
                                        <View className="flex flex-col items-center">
                                            <Text className="text-sm font-bold text-emerald-600">{progress}</Text>
                                            <Text className="text-xs text-slate-400">/{target}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            
                            {/* 分段进度条 */}
                            <View className="mb-4">
                                <View className="flex gap-1 justify-center">
                                    {Array.from({ length: Math.min(20, target) }).map((_, i) => (
                                        <View 
                                            key={i}
                                            className={classNames(
                                                "w-2 h-2 rounded-full transition-all",
                                                i < progress ? "bg-emerald-500" : "bg-slate-200"
                                            )}
                                        />
                                    ))}
                                </View>
                            </View>
                            
                            {/* 奖励信息 */}
                            <View className="flex justify-between items-center">
                                <View className="flex gap-2">
                                    <View className="bg-gradient-to-r from-emerald-50 to-cyan-50 px-3 py-1 rounded-xl border border-emerald-100/50">
                                        <Text className="text-xs text-emerald-600 font-bold">+{task.magnetReward} 磁贴/天</Text>
                                    </View>
                                    <View className="bg-gradient-to-r from-yellow-50 to-orange-50 px-3 py-1 rounded-xl border border-yellow-100/50">
                                        <Text className="text-xs text-yellow-700 font-bold">🎁 {bonus} 大奖</Text>
                                    </View>
                                </View>
                                
                                {/* 按钮状态 */}
                                {isAchieved ? (
                                    <View className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 rounded-full shadow-md">
                                        <Text className="text-white font-bold text-sm">领取大奖 🎁</Text>
                                    </View>
                                ) : isTodayChecked ? (
                                    <View className="bg-slate-100 px-4 py-2 rounded-full">
                                        <Text className="text-slate-400 font-bold text-sm">今日已打卡 ✓</Text>
                                    </View>
                                ) : (
                                    <View className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 rounded-full shadow-md">
                                        <Text className="text-white font-bold text-sm">今日打卡</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                );
              }
            })}
            
            {/* 空状态 */}
            {((activeTab === 'daily' && dailyTasks.length === 0) || 
              (activeTab === 'monthly' && monthlyTasks.length === 0)) && (
              <View className="flex flex-col items-center justify-center py-12">
                <Text className="text-6xl mb-4">🥳</Text>
                <Text className="text-slate-800 font-bold text-lg mb-2">
                  {activeTab === 'daily' ? '今日任务已清空' : '暂无月度任务'}
                </Text>
                <Text className="text-slate-500 text-sm">
                  {activeTab === 'daily' ? '你是最棒的！' : '敬请期待更多挑战'}
                </Text>
              </View>
            )}
         </View>
      </View>

      {/* Modals using root-portal or absolute positioning with high Z */}
      
      {/* Mood Modal */}
      {showMood && (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" onClick={() => setShowMood(false)}>
            <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
                        <Button onClick={() => setShowMood(false)} className="w-full bg-slate-100 text-slate-600 text-sm py-3 rounded-xl font-bold">取消</Button>
                    </>
                ) : (
                    <View className="flex flex-col items-center">
                        <Text className="text-4xl mb-4">🎉</Text>
                        <Text className="text-xl font-bold text-purple-600 mb-1">太棒了！</Text>
                        <Text className="text-slate-600 text-sm mb-4">你成功控制了情绪！</Text>
                        <View className="bg-yellow-100 px-4 py-2 rounded-full mb-6">
                            <Text className="text-yellow-800 font-bold text-sm">+2 磁贴 🌟</Text>
                        </View>
                        <Button onClick={() => setShowMood(false)} className="w-full bg-purple-600 text-white rounded-xl font-bold py-3">收下奖励</Button>
                    </View>
                )}
            </View>
        </View>
      )}

      {/* Moment Modal */}
      {showMoment && (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" onClick={() => setShowMoment(false)}>
            <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <Text className="text-lg font-bold mb-4 block">📸 磁贴时刻</Text>
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
                <Button onClick={submitMoment} className="bg-pink-500 text-white rounded-xl font-bold py-3">记录并获得奖励</Button>
            </View>
        </View>
      )}

      {/* Magnets Display Modal */}
      {showMagnets && (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" onClick={() => setShowMagnets(false)}>
            <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl max-h-96 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <Text className="text-lg font-bold mb-4 block">🛒 我的磁贴</Text>
                <Text className="text-xs text-slate-400 mb-4 block">点击磁贴可以看它们闪闪发光！</Text>
                <View className="flex flex-wrap gap-2 overflow-y-auto max-h-64">
                    {Array.from({ length: Math.min(user.magnets, 50) }).map((_, i) => (
                        <View 
                            key={i} 
                            onClick={() => {
                                Taro.vibrateShort({ type: 'light' });
                                soundService.playEarn();
                            }}
                            className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-yellow-200/50 active:scale-110 transition-all animate-pulse"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            <Text>⭐</Text>
                        </View>
                    ))}
                    {user.magnets > 50 && (
                        <View className="w-full text-center text-slate-400 text-xs mt-2">
                            <Text>还有 {user.magnets - 50} 个磁贴...</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
      )}
    </View>
  )
}