import { View as TaroView, Text as TaroText, Button as TaroButton, Textarea as TaroTextarea, Input as TaroInput } from '@tarojs/components'
import { useState } from 'react'
import { useStore, Task, Reward } from '../../store/useStore'
import { FeedbackService } from '../../store/feedback.service'
import classNames from 'classnames'
import Taro, { useDidShow } from '@tarojs/taro'
import { MathGate } from '../../components/ui/math-gate.component'
import RewardAnimation from '../../components/RewardAnimation'
import { BadgeGrid } from '../../components/profile/badge-grid.component'
import { WeeklyMilestoneCard } from '../../components/profile/weekly-milestone.component'

const View = TaroView as any
const Text = TaroText as any
const Button = TaroButton as any
const Textarea = TaroTextarea as any
const Input = TaroInput as any

export default function Profile() {
  const { user, tasks, rewards, addTask, updateTask, deleteTask, reorderTasks, addReward, updateReward, deleteReward, reorderRewards, importConfig, updateProfile, spendStarTokens, addStarTokens } = useStore()
  
  const [mode, setMode] = useState<'view' | 'tasks' | 'rewards' | 'stars'>('view')
  
  useDidShow(() => {
    const pendingMode = Taro.getStorageSync('pendingProfileMode')
    if (pendingMode) {
      setMode(pendingMode)
      Taro.removeStorageSync('pendingProfileMode')
    }
  })

  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null)
  const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null)
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [tempName, setTempName] = useState(user.name)
    const [tempAvatar, setTempAvatar] = useState(user.avatar || '👦')
    const avatars = ['👦', '👧', '👶', '🦸‍♂️', '🦸‍♀️', '🥷', '🐻', '🐰', '🐶', '🐱', '🦁', '🦖']
    
    // Math Gate State
    const [showMathGate, setShowMathGate] = useState(false)
    const [pendingTarget, setPendingTarget] = useState<'tasks' | 'rewards' | 'stars' | null>(null)
    
    // 排序模式
    const [isReorderMode, setIsReorderMode] = useState(false)

    // Manual Stars Adjust state
    const [starAdjustAmount, setStarAdjustAmount] = useState<string>('')
    const [starAdjustReason, setStarAdjustReason] = useState<string>('')

    // Gate Logic (Simulated)
    const checkGate = (target: 'tasks' | 'rewards' | 'stars') => {
    setPendingTarget(target)
    setShowMathGate(true)
  }

  const handleGateSuccess = () => {
    if (pendingTarget) {
      setMode(pendingTarget)
      setPendingTarget(null)
    }
  }

  // Task handlers
  const openAddTask = () => {
    setEditingTask({ 
      title: '', 
      icon: '⭐', 
      type: 'daily',
      magnetReward: undefined, 
      dailyLimit: undefined,
      targetDays: undefined,
      bonusReward: undefined
    })
    setShowEditModal(true)
  }

  const openEditTask = (task: Task) => {
    setEditingTask({ 
      ...task,
      type: task.type || 'daily',
      targetDays: task.targetDays || 20,
      bonusReward: task.bonusReward || 10
    })
    setShowEditModal(true)
  }

  const saveTask = () => {
    if (!editingTask || !editingTask.title) {
      Taro.showToast({ title: '请填写任务名称', icon: 'none' })
      return
    }
    // 校验磁贴奖励
    if (!editingTask.magnetReward || editingTask.magnetReward < 1) {
      Taro.showToast({ title: '磁贴奖励至少为1', icon: 'none' })
      return
    }
    
    // 根据任务类型校验不同字段
    if (editingTask.type === 'daily') {
      if (!editingTask.dailyLimit || editingTask.dailyLimit < 1) {
        Taro.showToast({ title: '每日次数至少为1', icon: 'none' })
        return
      }
    } else {
      if (!editingTask.targetDays || editingTask.targetDays < 1) {
        Taro.showToast({ title: '目标天数至少为1', icon: 'none' })
        return
      }
      if (!editingTask.bonusReward || editingTask.bonusReward < 1) {
        Taro.showToast({ title: '达成奖励至少为1', icon: 'none' })
        return
      }
    }
    
    if (editingTask.id) {
      // 更新已有任务
      updateTask(editingTask.id, editingTask)
      Taro.showToast({ title: '约定已生效！', icon: 'success' })
    } else {
      // 添加新任务
      addTask(editingTask)
      Taro.showToast({ title: '约定已生效！', icon: 'success' })
    }
    setShowEditModal(false)
    setEditingTask(null)
  }

  // 删除任务确认
  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除「${taskTitle}」吗？删除后无法恢复。`,
      confirmText: '确定删除',
      confirmColor: '#ef4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          deleteTask(taskId)
          Taro.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  }

  // 删除奖励确认
  const handleDeleteReward = (rewardId: string, rewardTitle: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除「${rewardTitle}」吗？删除后无法恢复。`,
      confirmText: '确定删除',
      confirmColor: '#ef4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          deleteReward(rewardId)
          Taro.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  }

  // Reward handlers
  const openAddReward = () => {
    setEditingReward({ title: '', icon: '🎁', cost: undefined, description: '', category: 'small', dailyLimit: undefined, type: 'goods' })
    setShowEditModal(true)
  }

  const openEditReward = (reward: Reward) => {
    setEditingReward({ ...reward })
    setShowEditModal(true)
  }

  const saveReward = () => {
    if (!editingReward || !editingReward.title) {
      Taro.showToast({ title: '请填写奖励名称', icon: 'none' })
      return
    }
    // 校验磁贴花费
    if (!editingReward.cost || editingReward.cost < 1) {
      Taro.showToast({ title: '磁贴花费至少为1', icon: 'none' })
      return
    }
    // 校验每日次数
    if (!editingReward.dailyLimit || editingReward.dailyLimit < 1) {
      Taro.showToast({ title: '每日次数至少为1', icon: 'none' })
      return
    }
    if (editingReward.id) {
      updateReward(editingReward.id, editingReward)
      Taro.showToast({ title: '更新成功', icon: 'success' })
    } else {
      addReward(editingReward.title!, editingReward.icon || '🎁', editingReward.cost!, editingReward.description || '', editingReward.type)
      Taro.showToast({ title: '添加成功', icon: 'success' })
    }
    setShowEditModal(false)
    setEditingReward(null)
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
  
  // 排序功能
  const moveTaskUp = (index: number) => {
    if (index === 0) return;
    const newTaskIds = [...tasks.map(t => t.id)];
    [newTaskIds[index - 1], newTaskIds[index]] = [newTaskIds[index], newTaskIds[index - 1]];
    reorderTasks(newTaskIds);
  }
  
  const moveTaskDown = (index: number) => {
    if (index === tasks.length - 1) return;
    const newTaskIds = [...tasks.map(t => t.id)];
    [newTaskIds[index], newTaskIds[index + 1]] = [newTaskIds[index + 1], newTaskIds[index]];
    reorderTasks(newTaskIds);
  }
  
  const moveRewardUp = (index: number) => {
    if (index === 0) return;
    const newRewardIds = [...rewards.map(r => r.id)];
    [newRewardIds[index - 1], newRewardIds[index]] = [newRewardIds[index], newRewardIds[index - 1]];
    reorderRewards(newRewardIds);
  }
  
  const moveRewardDown = (index: number) => {
    if (index === rewards.length - 1) return;
    const newRewardIds = [...rewards.map(r => r.id)];
    [newRewardIds[index], newRewardIds[index + 1]] = [newRewardIds[index + 1], newRewardIds[index]];
    reorderRewards(newRewardIds);
  }

  if (mode === 'tasks' || mode === 'rewards') {
    return (
        <View className="min-h-screen bg-slate-50 font-sans pb-24 relative">
            <View className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-slate-50/90 backdrop-blur-md flex justify-between items-center mb-4 border-b border-slate-200/50">
                <View className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm active:scale-95 transition-all text-slate-700" onClick={() => { setMode('view'); setIsReorderMode(false); }}>
                    <Text className="text-sm font-bold">← 返回</Text>
                </View>
                <View className="flex gap-2">
                    <View onClick={mode === 'tasks' ? openAddTask : openAddReward} className="text-xs bg-pink-500 text-white rounded-full shadow-sm shadow-pink-200 py-1.5 px-3 font-bold active:scale-95 flex items-center justify-center">+ 添加</View>
                    <View 
                        onClick={() => setIsReorderMode(!isReorderMode)} 
                        className={classNames("text-xs py-1.5 px-3 rounded-full shadow-sm font-medium active:scale-95 flex items-center justify-center transition-all border", isReorderMode ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-slate-600 border-slate-100")}
                    >
                        {isReorderMode ? "完成排序" : "排序"}
                    </View>
                    <View onClick={() => setShowImport(true)} className="text-xs bg-white text-slate-600 rounded-full shadow-sm py-1.5 px-3 font-medium active:scale-95 transition-all border border-slate-100 flex items-center justify-center">导入</View>
                    <View onClick={() => handleExport(mode as any)} className="text-xs bg-indigo-50 text-indigo-500 rounded-full shadow-sm py-1.5 px-3 font-medium active:scale-95 transition-all border border-indigo-100 flex items-center justify-center">导出</View>
                </View>
            </View>

            <View className="px-4">
            {mode === 'tasks' ? (
                tasks.map((t, index) => (
                    <View key={t.id} className="bg-white p-4 rounded-xl mb-3">
                        <View className="flex justify-between items-center">
                            <View className="flex items-center flex-1">
                                {isReorderMode && (
                                    <View className="mr-3 flex flex-col gap-1">
                                        <View 
                                            onClick={() => moveTaskUp(index)}
                                            className={classNames(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                                index === 0 ? "bg-gray-100 text-gray-300" : "bg-indigo-50 text-indigo-500"
                                            )}
                                        >
                                            <Text>↑</Text>
                                        </View>
                                        <View 
                                            onClick={() => moveTaskDown(index)}
                                            className={classNames(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                                index === tasks.length - 1 ? "bg-gray-100 text-gray-300" : "bg-indigo-50 text-indigo-500"
                                            )}
                                        >
                                            <Text>↓</Text>
                                        </View>
                                    </View>
                                )}
                                <Text className="text-2xl mr-3">{t.icon}</Text>
                                <View className="flex-1">
                                    <View className="flex items-center gap-2 mb-1">
                                      <Text className="font-bold text-gray-800">{t.title}</Text>
                                      <View className={classNames(
                                        "px-2 py-0.5 rounded-full text-xs",
                                        t.type === 'daily' ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-600"
                                      )}>
                                        <Text>{t.type === 'daily' ? '每日' : '月度'}</Text>
                                      </View>
                                    </View>
                                    <View className="flex items-center gap-2 mt-1">
                                        <Text className="text-xs text-indigo-500">+{t.magnetReward} 磁贴</Text>
                                        {t.type === 'daily' && t.dailyLimit && t.dailyLimit > 1 && (
                                            <Text className="text-xs text-orange-500">每日{t.dailyLimit}次</Text>
                                        )}
                                        {t.type === 'monthly' && t.targetDays && (
                                            <Text className="text-xs text-emerald-500">目标{t.targetDays}天</Text>
                                        )}
                                        {t.type === 'monthly' && t.bonusReward && (
                                            <Text className="text-xs text-yellow-600">🎁{t.bonusReward}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                            {!isReorderMode && (
                                <View className="flex gap-2">
                                    <Button size="mini" onClick={() => openEditTask(t)} className="bg-blue-50 text-blue-500 m-0">编辑</Button>
                                    <Button size="mini" onClick={() => handleDeleteTask(t.id, t.title)} className="bg-red-50 text-red-500 m-0">删除</Button>
                                </View>
                            )}
                        </View>
                    </View>
                ))
            ) : (
                rewards.map((r, index) => (
                    <View key={r.id} className="bg-white p-4 rounded-xl mb-3">
                        <View className="flex justify-between items-center">
                            <View className="flex items-center flex-1">
                                {isReorderMode && (
                                    <View className="mr-3 flex flex-col gap-1">
                                        <View 
                                            onClick={() => moveRewardUp(index)}
                                            className={classNames(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                                index === 0 ? "bg-gray-100 text-gray-300" : "bg-pink-50 text-pink-500"
                                            )}
                                        >
                                            <Text>↑</Text>
                                        </View>
                                        <View 
                                            onClick={() => moveRewardDown(index)}
                                            className={classNames(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                                index === rewards.length - 1 ? "bg-gray-100 text-gray-300" : "bg-pink-50 text-pink-500"
                                            )}
                                        >
                                            <Text>↓</Text>
                                        </View>
                                    </View>
                                )}
                                <Text className="text-2xl mr-3">{r.icon}</Text>
                                <View className="flex-1">
                                    <Text className="font-bold text-gray-800 block">{r.title}</Text>
                                    <View className="flex items-center gap-2 mt-1">
                                        <Text className="text-xs text-pink-500">{r.cost} 🌟</Text>
                                        {r.dailyLimit && r.dailyLimit > 1 && (
                                            <Text className="text-xs text-orange-500">每日{r.dailyLimit}次</Text>
                                        )}
                                        <Text className="text-xs text-slate-400">· {r.description}</Text>
                                    </View>
                                </View>
                            </View>
                            {!isReorderMode && (
                                <View className="flex gap-2">
                                    <Button size="mini" onClick={() => openEditReward(r)} className="bg-blue-50 text-blue-500 m-0">编辑</Button>
                                    <Button size="mini" onClick={() => handleDeleteReward(r.id, r.title)} className="bg-red-50 text-red-500 m-0">删除</Button>
                                </View>
                            )}
                        </View>
                    </View>
                ))
            )}
            </View>

            {/* Import Modal */}
            {showImport && (
                <View className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowImport(false)}>
                    <View className="bg-white w-full rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
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

            {/* Edit Task Modal */}
            {showEditModal && editingTask && (
                <View className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => { setShowEditModal(false); setEditingTask(null); }}>
                    <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-scroll" onClick={(e) => e.stopPropagation()}>
                        <Text className="text-lg font-bold mb-4 block">{editingTask.id ? '编辑约定' : '添加约定'}</Text>

                        {/* 任务类型选择 */}
                        <View className="mb-4">
                            <Text className="text-xs font-bold text-slate-500 mb-2 block">约定类型</Text>
                            <View className="flex gap-2">
                                <View 
                                    onClick={() => setEditingTask({ ...editingTask, type: 'daily', dailyLimit: 1 })}
                                    className={classNames(
                                        "flex-1 py-3 rounded-xl text-center border-2 transition-all",
                                        editingTask.type === 'daily' 
                                            ? "bg-blue-50 border-blue-500" 
                                            : "bg-slate-50 border-slate-200"
                                    )}
                                >
                                    <Text className={editingTask.type === 'daily' ? "text-blue-600 font-bold" : "text-slate-400"}>
                                        ⚡ 每日任务
                                    </Text>
                                </View>
                                <View 
                                    onClick={() => setEditingTask({ ...editingTask, type: 'monthly', targetDays: 20, bonusReward: 10 })}
                                    className={classNames(
                                        "flex-1 py-3 rounded-xl text-center border-2 transition-all",
                                        editingTask.type === 'monthly' 
                                            ? "bg-emerald-50 border-emerald-500" 
                                            : "bg-slate-50 border-slate-200"
                                    )}
                                >
                                    <Text className={editingTask.type === 'monthly' ? "text-emerald-600 font-bold" : "text-slate-400"}>
                                        🏆 月度打卡
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-xs font-bold text-slate-500 mb-2 block">任务图标</Text>
                            <Input 
                                className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                value={editingTask.icon}
                                onInput={(e) => setEditingTask({ ...editingTask, icon: e.detail.value })}
                                placeholder="输入emoji图标"
                            />
                        </View>
                        
                        <View className="mb-4">
                            <Text className="text-xs font-bold text-slate-500 mb-2 block">任务名称</Text>
                            <Input 
                                className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                value={editingTask.title}
                                onInput={(e) => setEditingTask({ ...editingTask, title: e.detail.value })}
                                placeholder="例如：吃饭香香"
                            />
                        </View>
                        
                        <View className="mb-4">
                            <Text className="text-xs font-bold text-slate-500 mb-2 block">
                                {editingTask.type === 'daily' ? '磁贴奖励（每次）' : '磁贴奖励（每天）'}
                            </Text>
                            <Input 
                                type="number"
                                className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                value={editingTask.magnetReward !== undefined ? String(editingTask.magnetReward) : ''}
                                onInput={(e) => {
                                  const val = e.detail.value
                                  setEditingTask({ ...editingTask, magnetReward: val === '' ? undefined : Number(val) })
                                }}
                                placeholder="请输入磁贴奖励数量"
                            />
                        </View>
                        
                        {/* 每日任务特有字段 */}
                        {editingTask.type === 'daily' && (
                            <View className="mb-6">
                                <Text className="text-xs font-bold text-slate-500 mb-2 block">每日最多完成次数</Text>
                                <Input 
                                    type="number"
                                    className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                    value={editingTask.dailyLimit !== undefined ? String(editingTask.dailyLimit) : ''}
                                    onInput={(e) => {
                                      const val = e.detail.value
                                      setEditingTask({ ...editingTask, dailyLimit: val === '' ? undefined : Number(val) })
                                    }}
                                    placeholder="请输入每日最多完成次数"
                                />
                            </View>
                        )}
                        
                        {/* 月度任务特有字段 */}
                        {editingTask.type === 'monthly' && (
                            <>
                                <View className="mb-4">
                                    <Text className="text-xs font-bold text-slate-500 mb-2 block">目标天数</Text>
                                    <Input 
                                        type="number"
                                        className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                        value={editingTask.targetDays !== undefined ? String(editingTask.targetDays) : ''}
                                        onInput={(e) => {
                                          const val = e.detail.value
                                          setEditingTask({ ...editingTask, targetDays: val === '' ? undefined : Number(val) })
                                        }}
                                        placeholder="例如：20天"
                                    />
                                </View>
                                
                                <View className="mb-6">
                                    <Text className="text-xs font-bold text-slate-500 mb-2 block">达成奖励（额外磁贴）</Text>
                                    <Input 
                                        type="number"
                                        className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                        value={editingTask.bonusReward !== undefined ? String(editingTask.bonusReward) : ''}
                                        onInput={(e) => {
                                          const val = e.detail.value
                                          setEditingTask({ ...editingTask, bonusReward: val === '' ? undefined : Number(val) })
                                        }}
                                        placeholder="达成目标后的额外奖励"
                                    />
                                </View>
                            </>
                        )}
                        
                        <Button onClick={saveTask} className="w-full bg-pink-500 text-white rounded-xl font-bold py-3">保存约定</Button>
                    </View>
                </View>
            )}

            {/* Edit Reward Modal */}
            {showEditModal && editingReward && (
                <View className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => { setShowEditModal(false); setEditingReward(null); }}>
                    <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <Text className="text-lg font-bold mb-4 block">{editingReward.id ? '编辑奖励' : '添加奖励'}</Text>

                        <View className="mb-4">
                            <Text className="text-xs font-bold text-slate-500 mb-2 block">奖励图标</Text>
                            <Input 
                                className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                value={editingReward.icon}
                                onInput={(e) => setEditingReward({ ...editingReward, icon: e.detail.value })}
                                placeholder="输入emoji图标"
                            />
                        </View>
                        
                        <View className="mb-4">
                            <Text className="text-xs font-bold text-slate-500 mb-2 block">奖励名称</Text>
                            <Input 
                                className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                value={editingReward.title}
                                onInput={(e) => setEditingReward({ ...editingReward, title: e.detail.value })}
                                placeholder="例如：玩一会手机"
                            />
                        </View>
                        
                        <View className="mb-4">
                            <Text className="text-xs font-bold text-slate-500 mb-2 block">磁贴花费</Text>
                            <Input 
                                type="number"
                                className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                value={editingReward.cost !== undefined ? String(editingReward.cost) : ''}
                                onInput={(e) => {
                                  const val = e.detail.value
                                  setEditingReward({ ...editingReward, cost: val === '' ? undefined : Number(val) })
                                }}
                                placeholder="请输入磁贴花费数量"
                            />
                        </View>
                        
                        <View className="mb-6">
                            <Text className="text-xs font-bold text-slate-500 mb-2 block">奖励描述</Text>
                            <Input
                                className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                value={editingReward.description}
                                onInput={(e) => setEditingReward({ ...editingReward, description: e.detail.value })}
                                placeholder="例如：15分钟"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-xs font-bold text-slate-500 mb-2 block">每日最多兑换次数</Text>
                            <Input
                                type="number"
                                className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                                value={editingReward.dailyLimit !== undefined ? String(editingReward.dailyLimit) : ''}
                                onInput={(e) => {
                                  const val = e.detail.value
                                  setEditingReward({ ...editingReward, dailyLimit: val === '' ? undefined : Number(val) })
                                }}
                                placeholder="请输入每日最多兑换次数"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-xs font-bold text-slate-500 mb-2 block">奖励类型</Text>
                            <View className="flex gap-2">
                                <View 
                                    onClick={() => setEditingReward({ ...editingReward, type: 'goods' })}
                                    className={classNames("flex-1 py-2 px-3 rounded-xl border text-center text-sm font-bold transition-all", 
                                        editingReward.type !== 'experience' ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-400")}
                                >
                                    🎁 物品类
                                </View>
                                <View 
                                    onClick={() => setEditingReward({ ...editingReward, type: 'experience' })}
                                    className={classNames("flex-1 py-2 px-3 rounded-xl border text-center text-sm font-bold transition-all", 
                                        editingReward.type === 'experience' ? "bg-pink-50 border-pink-200 text-pink-600" : "bg-white border-slate-200 text-slate-400")}
                                >
                                    🎈 体验类
                                </View>
                            </View>
                        </View>

                        <Button onClick={saveReward} className="w-full bg-pink-500 text-white rounded-xl font-bold py-3">保存</Button>
                    </View>
                </View>
            )}
        </View>
    )
  }

  if (mode === 'stars') {
      return (
          <View className="min-h-screen bg-bg-blue p-4 pb-24 flex items-center justify-center">
              <View className="bg-white w-full rounded-3xl p-8 shadow-xl text-center relative overflow-hidden text-center flex flex-col items-center">
                   <View className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-3xl pointer-events-none" />
                   
                   <View className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex flex-col items-center justify-center shadow-lg mb-6 border-4 border-white animate-bounce-slow">
                       <Text className="text-4xl">⭐</Text>
                   </View>
                   
                   <Text className="text-2xl font-black text-slate-800 mb-2">我的许愿星</Text>
                   <Text className="text-slate-500 text-sm mb-6 max-w-[200px]">你拥有特殊的魔法！使用1颗许愿星可以立刻让你立刻实现一个小愿望！</Text>
                   
                   <View className="bg-slate-50 rounded-2xl p-6 w-full mb-8">
                       <Text className="text-sm font-bold text-slate-500 mb-2 block">当前拥有</Text>
                       <View className="flex justify-center items-end">
                           <Text className="text-5xl font-black text-orange-500">{user.starTokens || 0}</Text>
                           <Text className="text-xl font-bold text-orange-400 ml-1 mb-1">颗</Text>
                       </View>
                   </View>
                   
                   <View className="flex w-full gap-3">
                       <Button 
                           onClick={() => setMode('view')}
                           className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl"
                       >
                           返回
                       </Button>
                       <Button 
                           onClick={() => {
                               const success = spendStarTokens(1, '使用了一颗许愿星！');
                               if(success) {
                                   FeedbackService.showRedeemSuccess();
                                   Taro.showToast({ title: '魔法生效了！', icon: 'success' });
                                   setTimeout(() => {
                                       setMode('view');
                                   }, 1500); // 稍微延迟一下退出，让动画展示一会儿
                               } else {
                                   Taro.showToast({ title: '许愿星不够哦', icon: 'none' });
                               }
                           }}
                           className="flex-[2] bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                       >
                           使用1颗许愿星
                       </Button>
                   </View>
              </View>
          </View>
      );
  }

  return (
    <View className="min-h-screen bg-bg-blue p-4 font-sans pb-24">
      <View className="flex items-center gap-4 mb-6 relative mt-4">
          <View 
             className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm border-4 border-white relative"
             onClick={() => setIsEditingProfile(true)}
          >
             <Text>{user.avatar || '�'}</Text>
             <View className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                  <Text className="text-[12px]">✏️</Text>
             </View>
          </View>
          <View className="flex-1" onClick={() => setIsEditingProfile(true)}>
             <Text className="text-2xl font-black text-slate-800 block">{user.name}</Text>
             <Text className="text-xs text-slate-600 font-bold bg-white/80 px-3 py-1 rounded-full inline-block mt-2 shadow-sm">磁贴累计: {user.magnets} 🌟 | 许愿星: {user.starTokens || 0} ⭐</Text>
          </View>
      </View>

      <WeeklyMilestoneCard onOpenStars={() => setMode('stars')} />

        <BadgeGrid />

        <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <View className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <Text className="text-xs font-bold text-slate-500">🔒 家长管理中心</Text>
            </View>
            <View onClick={() => checkGate('tasks')} className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50">
               <View className="flex items-center gap-3">
                   <View className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">📝</View>
                   <Text className="font-bold text-slate-700 text-sm">日常任务编辑</Text>
               </View>
               <Text className="text-xs text-slate-400">去调整 &gt;</Text>
            </View>
            <View onClick={() => checkGate('rewards')} className="flex items-center justify-between p-4 active:bg-slate-50">
               <View className="flex items-center gap-3">
                   <View className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500">🎁</View>
                   <Text className="font-bold text-slate-700 text-sm">商店奖励上新</Text>
               </View>
               <Text className="text-xs text-slate-400">去调整 &gt;</Text>
            </View>
        </View>
      <MathGate 
        isOpen={showMathGate} 
        onClose={() => {
            setShowMathGate(false);
            setPendingTarget(null);
        }} 
        onSuccess={() => {
            setShowMathGate(false);
            handleGateSuccess();
        }} 
      />

      {isEditingProfile && (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" onClick={() => setIsEditingProfile(false)}>
            <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto box-border" onClick={e => e.stopPropagation()}>
                <Text className="text-lg font-bold mb-4 block text-center">编辑主角档案</Text>
                
                <Text className="text-xs font-bold text-slate-500 mb-2 block">选择头像</Text>
                <View className="flex flex-wrap gap-3 mb-6 justify-center bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    {avatars.map(a => (
                        <View key={a} onClick={() => setTempAvatar(a)} className={classNames("w-12 h-12 flex items-center justify-center text-2xl rounded-full transition-all border-2", tempAvatar === a ? "bg-white border-indigo-400 shadow-sm scale-110" : "bg-transparent border-transparent select-none")}>
                            <Text>{a}</Text>
                        </View>
                    ))}
                </View>
                
                <Text className="text-xs font-bold text-slate-500 mb-2 block">宝贝名字</Text>
                <Input 
                     value={tempName} 
                     onInput={e => setTempName(e.detail.value)} 
                     className="bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl mb-6 w-full box-border font-bold text-center"
                     placeholder="请输入宝贝的名字"
                />
                <Button onClick={() => { updateProfile(tempName, tempAvatar); setIsEditingProfile(false); }} className="w-full box-border bg-slate-900 text-white font-bold rounded-xl py-4 shadow-lg active:scale-95 transition-all">
                    保存档案
                </Button>
            </View>
        </View>
      )}

      <RewardAnimation />
    </View>
  )
}