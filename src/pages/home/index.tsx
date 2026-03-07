import { View as TaroView, Text as TaroText, Image as TaroImage, Textarea as TaroTextarea, Button as TaroButton } from '@tarojs/components'
import { useState, useMemo } from 'react'
import { useStore, Task, Log } from '../../store/useStore'
import classNames from 'classnames'
import Taro from '@tarojs/taro'
import { soundService } from '../../utils/sound'
import RewardAnimation from '../../components/RewardAnimation'
import { FeedbackService } from '../../store/feedback.service'

const View = TaroView as any
const Text = TaroText as any
const Image = TaroImage as any
const Textarea = TaroTextarea as any
const Button = TaroButton as any

export default function Home() {
  const { user, tasks, toggleTask, toggleTaskActive, toggleMonthlyTask, addMagnets } = useStore()
  
  // Tab 切换状态
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily')
  
  // Phase 2: Reflective Feedback & Draft State
  const [showTaskDraft, setShowTaskDraft] = useState(false)
  const [reflectionTask, setReflectionTask] = useState<{ id: string, title: string, isMonthly: boolean } | null>(null)
  const [reflectionEmotion, setReflectionEmotion] = useState<Log['emotion']>(undefined)
  
  // 按类型过滤任务
  const allDailyTasks = useMemo(() => tasks.filter(t => t.type === 'daily'), [tasks])
  const activeDailyTasks = useMemo(() => allDailyTasks.filter(t => t.isActive), [allDailyTasks])
  const dailyTasks = activeDailyTasks // Remap for UI
  
  const monthlyTasks = useMemo(() => tasks.filter(t => t.type === 'monthly'), [tasks])
  
  // Computed
  const todaysProgress = useMemo(() => {
    // 只计算活跃每日任务的进度
    const completed = activeDailyTasks.reduce((sum, t) => sum + (t.completedCount || 0), 0)
    const total = activeDailyTasks.reduce((sum, t) => sum + (t.dailyLimit || 1), 0)
    return { completed, total, percentage: total === 0 ? 0 : (completed / total) * 100 }
  }, [activeDailyTasks])

  // Local State for Modals
  const [showMood, setShowMood] = useState(false)
  const [moodSuccess, setMoodSuccess] = useState(false)
  const [showMoment, setShowMoment] = useState(false)
  const [momentDesc, setMomentDesc] = useState('')
  const [momentAmount, setMomentAmount] = useState(1)
  const [showMagnets, setShowMagnets] = useState(false)

  // --- Handlers ---
  
  const handleTaskClick = (taskId: string, taskTitle: string, isMonthly: boolean = false) => {
    setReflectionTask({ id: taskId, title: taskTitle, isMonthly })
    setReflectionEmotion(undefined)
  }

  const submitTaskReflection = () => {
    if (!reflectionTask) return
    
    if (reflectionTask.isMonthly) {
        toggleMonthlyTask(reflectionTask.id, reflectionEmotion)
    } else {
        toggleTask(reflectionTask.id, reflectionEmotion)
    }
    FeedbackService.showTaskComplete(reflectionTask.id)
    
    setReflectionTask(null)
    setReflectionEmotion(undefined)
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
      <View className="px-1 mb-6 sticky top-0 z-40 pt-4 bg-bg-blue">
        <View className="bg-white/30 backdrop-blur-md rounded-full p-1.5 flex border border-white/50 shadow-lg relative">
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
         <View className="grid grid-cols-2 gap-3">
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
                            "relative overflow-hidden bg-white p-5 rounded-3xl shadow-sm border border-indigo-50 transition-all active:scale-98 flex flex-col items-center justify-center text-center",
                            { "opacity-60": isFullyCompleted }
                        )}
                    >
                        {isFullyCompleted && (
                            <View className="absolute inset-0 bg-emerald-50/70 flex items-center justify-center z-10 backdrop-blur-xs">
                                <View className="bg-white px-3 py-1 rounded-full shadow-sm border border-emerald-100 flex items-center">
                                    <Text className="text-emerald-600 font-bold text-xs">✓ 已完成</Text>
                                </View>
                            </View>
                        )}
                        <View className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-sm shrink-0">
                            <Text>{task.icon}</Text>
                        </View>
                        <Text className="font-bold text-slate-800 text-sm mb-2 w-full truncate">{task.title}</Text>
                        <View className="flex flex-row flex-wrap gap-1 justify-center items-center w-full">
                            <View className="inline-block bg-gradient-to-r from-indigo-50 to-purple-50 px-2 py-1 rounded-lg border border-indigo-100/50">
                                <Text className="text-[10px] text-indigo-600 font-bold">+{task.magnetReward} 磁贴</Text>
                            </View>
                            {dailyLimit > 1 && (
                                <View className="inline-block bg-gradient-to-r from-orange-50 to-amber-50 px-2 py-1 rounded-lg border border-orange-100/50">
                                    <Text className="text-[10px] text-orange-600 font-bold">{completedCount}/{dailyLimit}</Text>
                                </View>
                            )}
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
                            handleTaskClick(task.id, task.title, true);
                          }
                        }}
                        className={classNames(
                          "relative overflow-hidden bg-white p-4 rounded-3xl shadow-sm transition-all flex flex-col items-center justify-between min-h-[220rpx]",
                          isAchieved ? "border-2 border-yellow-400" : "border border-indigo-50",
                          !isAchieved && !isTodayChecked && "active:scale-98",
                          isTodayChecked && !isAchieved && "opacity-80"
                        )}
                    >
                        {/* 流光效果 - 达成目标时 */}
                        {isAchieved && (
                          <View className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 via-orange-200/20 to-yellow-200/20 animate-pulse"></View>
                        )}
                        
                        <View className="relative z-10 w-full flex flex-col items-center">
                            <View className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-2 shrink-0">
                                <Text>{task.icon}</Text>
                            </View>
                            
                            <Text className="font-bold text-slate-800 text-sm block text-center truncate w-full mb-1">{task.title}</Text>
                            
                            {/* 进度 */}
                            <View className="w-full flex justify-between items-center px-1 mb-1">
                                <Text className="text-[10px] text-slate-500 font-medium">坚持 {progress}/{target} 天</Text>
                                <Text className="text-[10px] text-emerald-600 font-bold">{percentage.toFixed(0)}%</Text>
                            </View>
                            <View className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                                <View 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />
                            </View>
                        </View>
                        
                        <View className="relative z-10 w-full flex justify-center">
                            {/* 状态 / 奖励 */}
                            {isAchieved ? (
                                <View className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-full text-center">
                                    <Text className="text-slate-500 font-bold text-[10px]">已达成 🎁{bonus}</Text>
                                </View>
                            ) : isTodayChecked ? (
                                <View className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-full text-center">
                                    <Text className="text-slate-400 font-bold text-[10px]">✓ 今日已签</Text>
                                </View>
                            ) : (
                                <View className="flex gap-1 justify-center flex-wrap w-full">
                                    <View className="bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100/50">
                                        <Text className="text-[10px] text-emerald-600 font-bold">+{task.magnetReward}/天</Text>
                                    </View>
                                    <View className="bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100/50">
                                        <Text className="text-[10px] text-yellow-700 font-bold">🎁{bonus}</Text>
                                    </View>
                                </View>
                            )}
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
                            {[{icon:'🔴',label:'怒气怪兽'},{icon:'🔵',label:'忧郁怪兽'},{icon:'⚫',label:'害怕怪兽'}].map(m => (
                                <View key={m.label} onClick={() => handleMoodConvert(m.label)} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 active:bg-purple-50">
                                    <Text className="text-4xl mb-2">{m.icon}</Text>
                                    <Text className="text-xs font-bold text-slate-600">{m.label}</Text>
                                </View>
                            ))}
                        </View>
                        <Button onClick={() => setShowMood(false)} className="w-full bg-slate-100 text-slate-600 text-sm py-3 rounded-xl font-bold">取消</Button>
                    </>
                ) : (
                    <View className="flex flex-col items-center justify-center py-4">
                        <Text className="text-6xl mb-4 animate-bounce">🟢</Text>
                        <Text className="text-xl font-bold text-emerald-500 mb-2">平静怪兽</Text>
                        <Text className="text-slate-500 text-sm text-center mb-6">不好的情绪已经被处理掉啦！现在的你充满了平静与力量 ✨</Text>
                        <View className="bg-yellow-100 px-4 py-2 rounded-full mb-6">
                            <Text className="text-yellow-800 font-bold text-sm">+2 磁贴 🌟</Text>
                        </View>
                        <Button onClick={() => setShowMood(false)} className="w-full bg-emerald-500 text-white rounded-xl font-bold py-3 shadow-lg shadow-emerald-200">太棒了</Button>
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
                <View className="grid grid-cols-5 gap-y-5 gap-x-2 justify-items-center overflow-y-auto max-h-[60vh] py-4">
                    {Array.from({ length: Math.min(user.magnets, 50) }).map((_, i) => {
                        // 随机错落起跳与动画周期，呈现不规则蹦跳效果
                        const delay = (i % 5) * 0.15 + (i % 3) * 0.1;
                        const duration = 1.2 + (i % 2) * 0.3;
                        return (
                            <View 
                                key={i} 
                                onClick={() => {
                                    Taro.vibrateShort({ type: 'light' });
                                    soundService.playEarn();
                                }}
                                className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-yellow-200/50 active:scale-110 animate-magnet-bounce" 
                                style={{ 
                                    '--mdel': `${delay}s`,
                                    '--mdur': `${duration}s`
                                } as React.CSSProperties}
                            >
                                <Text>⭐</Text>
                            </View>
                        );
                    })}
                    {user.magnets > 50 && (
                        <View className="w-full text-center text-slate-400 text-xs mt-2">
                            <Text>还有 {user.magnets - 50} 个磁贴...</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
      )}

      {/* Phase 2: Daily Draft Modal */}
      {showTaskDraft && (
        <View className="fixed inset-0 z-[60] flex flex-col justify-end">
          <View className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowTaskDraft(false)} />
          <View className="bg-white w-full rounded-t-[40rpx] p-6 shadow-2xl relative animate-[pop-in_0.3s_ease-out] min-h-[60vh] max-h-[85vh] flex flex-col z-10 box-border">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
            
            <View className="flex flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-xl font-black text-slate-800 block mb-1">🎒 挑选今天的挑战</Text>
                    <Text className="text-xs font-bold text-slate-400">自己选的任务，一定要完成哦！</Text>
                </View>
                <View className="bg-indigo-50 px-3 py-1.5 rounded-full">
                    <Text className="text-xs font-bold text-indigo-500">已选 {activeDailyTasks.length} 个</Text>
                </View>
            </View>

            <View className="flex-1 overflow-y-auto mb-6">
                <View className="grid grid-cols-2 gap-3 pb-8">
                    {allDailyTasks.map(task => {
                        const isSelected = task.isActive;
                        return (
                            <View 
                                key={task.id}
                                onClick={() => toggleTaskActive(task.id)}
                                className={classNames(
                                    "flex flex-col items-center p-4 rounded-3xl border-2 transition-all duration-300",
                                    isSelected 
                                        ? "border-indigo-400 bg-indigo-50 scale-100 shadow-[0_4px_12px_rgba(99,102,241,0.15)]" 
                                        : "border-slate-100 bg-white scale-95 opacity-70"
                                )}
                            >
                                <View className={classNames("w-12 h-12 rounded-full flex items-center justify-center text-3xl mb-2", isSelected ? "bg-white shadow-sm" : "bg-slate-50")}>
                                    <Text>{task.icon}</Text>
                                </View>
                                <Text className={classNames("text-sm font-bold truncate w-full text-center", isSelected ? "text-indigo-700" : "text-slate-500")}>{task.title}</Text>
                                
                                {isSelected && (
                                    <View className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                                        <Text className="text-white text-xs font-bold">✓</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

            <View className="pt-2 pb-6">
                <Button 
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-3xl text-sm shadow-[0_8px_16px_rgba(15,23,42,0.2)] active:scale-95 transition-all"
                    onClick={() => setShowTaskDraft(false)}
                >
                    选好了，出发！🚀
                </Button>
            </View>
          </View>
        </View>
      )}

      {/* Phase 2: Reflective Feedback Modal */}
      {reflectionTask && (
        <View className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <View className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setReflectionTask(null)} />
          <View className="bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-[pop-in_0.3s_ease-out] border border-white">
            <View className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/50 rounded-full blur-2xl -z-10 pointer-events-none" />
            
            <Text className="text-xl font-black text-center text-slate-800 block mb-2">🎉 任务完成</Text>
            <Text className="text-center text-indigo-500 font-bold block mb-6">{reflectionTask.title}</Text>
            
            <View className="bg-white/60 rounded-2xl p-4 mb-6 shadow-sm border border-slate-100">
                <Text className="text-sm font-bold text-slate-700 block mb-4 text-center">做完这件事，你觉得怎么样？</Text>
                <View className="flex flex-row justify-around gap-2">
                    {[
                        { id: 'happy', icon: '🤩', label: '完成任务后很兴奋', color: 'text-yellow-500' },
                        { id: 'sad', icon: '😫', label: '这个任务很难', color: 'text-blue-500' }
                    ].map(mood => (
                        <View 
                            key={mood.id}
                            onClick={() => setReflectionEmotion(mood.id as any)}
                            className={classNames(
                                "flex flex-col items-center justify-center p-3 rounded-xl transition-all flex-1",
                                reflectionEmotion === mood.id 
                                    ? "bg-indigo-50 scale-105 shadow-sm border border-indigo-200" 
                                    : "bg-white opacity-80"
                            )}
                        >
                            <Text className="text-3xl mb-2">{mood.icon}</Text>
                            <Text className={classNames(
                                "text-xs font-bold text-center", 
                                mood.color
                            )}>{mood.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View className="flex flex-row gap-3">
                <Button 
                    className="flex-1 bg-slate-100 text-slate-500 text-sm py-3 rounded-2xl font-bold shadow-sm"
                    onClick={() => setReflectionTask(null)}
                >
                    稍后再说
                </Button>
                <Button 
                    className={classNames(
                        "flex-1 text-white text-sm py-3 rounded-2xl font-bold shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all",
                        reflectionEmotion ? "bg-gradient-to-r from-indigo-500 to-purple-500 active:scale-95" : "bg-slate-300 opacity-50"
                    )}
                    onClick={() => {
                        if(reflectionEmotion) {
                            submitTaskReflection();
                        } else {
                            Taro.showToast({ title: '要先选择一个心情哦', icon: 'none' });
                        }
                    }}
                >
                    领取奖励!
                </Button>
            </View>
          </View>
        </View>
      )}

      {/* Draft Trigger Button (Phase 2 Addon - Moved to bottom right) */}
      {activeTab === 'daily' && (
         <View 
             className="fixed bottom-24 right-6 z-50 bg-gradient-to-br from-yellow-300 to-orange-400 text-white w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-2xl transform active:scale-95 transition-all outline outline-4 outline-white/50"
             onClick={() => setShowTaskDraft(true)}
         >
             <Text className="text-2xl">🎒</Text>
         </View>
      )}
    </View>
  )
}