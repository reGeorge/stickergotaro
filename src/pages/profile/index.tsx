import { View as TaroView, Text as TaroText, Button as TaroButton, Textarea as TaroTextarea, Input as TaroInput } from '@tarojs/components'
import { useState } from 'react'
import { useStore, Task, Reward } from '../../store/useStore'
import classNames from 'classnames'
import Taro from '@tarojs/taro'

const View = TaroView as any
const Text = TaroText as any
const Button = TaroButton as any
const Textarea = TaroTextarea as any
const Input = TaroInput as any

export default function Profile() {
  const { user, tasks, rewards, addTask, updateTask, deleteTask, addReward, updateReward, deleteReward, importConfig } = useStore()
  
  const [mode, setMode] = useState<'view' | 'tasks' | 'rewards'>('view')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null)
  const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null)

  // Gate Logic (Simulated)
  const checkGate = (target: 'tasks' | 'rewards') => {
    // 简化：在小程序里直接进入，或者可以用 Modal 实现算术题
    setMode(target)
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
      updateTask(editingTask.id, editingTask)
      Taro.showToast({ title: '约定已生效！', icon: 'success' })
    } else {
      // 添加新任务时，补充必要字段
      const newTask = {
        ...editingTask,
        id: Date.now().toString(),
        completed: false,
        lastCompletedDate: '',
        completedCount: 0,
        ...(editingTask.type === 'monthly' ? {
          monthlyProgress: 0,
          history: []
        } : {})
      }
      updateTask(newTask.id, newTask)
      Taro.showToast({ title: '约定已生效！', icon: 'success' })
    }
    setShowEditModal(false)
    setEditingTask(null)
  }

  // Reward handlers
  const openAddReward = () => {
    setEditingReward({ title: '', icon: '🎁', cost: undefined, description: '', category: 'small', dailyLimit: undefined })
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
      addReward(editingReward.title!, editingReward.icon || '🎁', editingReward.cost!, editingReward.description || '')
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

  if (mode !== 'view') {
    return (
        <View className="min-h-screen bg-bg-gray p-4 font-sans pb-24">
            <View className="flex justify-between items-center mb-6">
                <View className="flex items-center gap-2" onClick={() => setMode('view')}>
                    <Text className="text-xl">←</Text>
                    <Text className="font-bold text-lg">返回</Text>
                </View>
                <View className="flex gap-2">
                    <Button size="mini" onClick={mode === 'tasks' ? openAddTask : openAddReward} className="text-xs bg-pink-500 text-white py-2">+ 添加</Button>
                    <Button size="mini" onClick={() => setShowImport(true)} className="text-xs bg-white py-2">导入</Button>
                    <Button size="mini" onClick={() => handleExport(mode as any)} className="text-xs bg-blue-50 text-blue-500 py-2">导出</Button>
                </View>
            </View>

            {mode === 'tasks' ? (
                tasks.map(t => (
                    <View key={t.id} className="bg-white p-4 rounded-xl mb-3">
                        <View className="flex justify-between items-center">
                            <View className="flex items-center flex-1">
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
                            <View className="flex gap-2">
                                <Button size="mini" onClick={() => openEditTask(t)} className="bg-blue-50 text-blue-500 m-0">编辑</Button>
                                <Button size="mini" onClick={() => deleteTask(t.id)} className="bg-red-50 text-red-500 m-0">删除</Button>
                            </View>
                        </View>
                    </View>
                ))
            ) : (
                rewards.map(r => (
                    <View key={r.id} className="bg-white p-4 rounded-xl mb-3">
                        <View className="flex justify-between items-center">
                            <View className="flex items-center flex-1">
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
                            <View className="flex gap-2">
                                <Button size="mini" onClick={() => openEditReward(r)} className="bg-blue-50 text-blue-500 m-0">编辑</Button>
                                <Button size="mini" onClick={() => deleteReward(r.id)} className="bg-red-50 text-red-500 m-0">删除</Button>
                            </View>
                        </View>
                    </View>
                ))
            )}

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

                        <Button onClick={saveReward} className="w-full bg-pink-500 text-white rounded-xl font-bold py-3">保存</Button>
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