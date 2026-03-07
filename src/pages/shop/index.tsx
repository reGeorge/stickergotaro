import { View as TaroView, Text as TaroText, Button as TaroButton } from '@tarojs/components'
import { useState } from 'react'
import { useStore, Reward } from '../../store/useStore'
import classNames from 'classnames'
import Taro from '@tarojs/taro'
import { soundService } from '../../utils/sound'
import { FeedbackService } from '../../store/feedback.service'
import RewardAnimation from '../../components/RewardAnimation'
import { MathGate } from '../../components/ui/math-gate.component'

const View = TaroView as any
const Text = TaroText as any
const Button = TaroButton as any

export default function Shop() {
  const { user, rewards, spendMagnets, spendStarTokens } = useStore()

  // Modal States
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [showMath, setShowMath] = useState(false)
  const [showMagnets, setShowMagnets] = useState(false)

  const initiateRedeem = (reward: Reward) => {
    setSelectedReward(reward)
    setShowMath(false)
  }

  const handleMathSuccess = () => {
    if (selectedReward) {
        const success = spendMagnets(selectedReward.cost, `兑换: ${selectedReward.title}`)

        if (success) {
            setSelectedReward(null)
            setShowMath(false)
            // 触发兑换成功动画
            FeedbackService.showRedeemSuccess()
        } else {
            Taro.showToast({ title: '磁贴不足', icon: 'error' })
        }
    }
  }

  return (
    <View className="min-h-screen bg-bg-blue p-4 pb-24 font-sans">
        {/* 全屏反馈动画层 */}
        <RewardAnimation />
        
        {/* Balance Sticky Header */}
        <View className="sticky top-0 z-20 py-2 -mx-2 mb-4 px-2 flex gap-2">
            <View
                className="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 rounded-full shadow-lg p-2 flex-1 flex items-center justify-between px-4 text-white active:scale-98 transition-all"
                onClick={() => setShowMagnets(true)}
            >
                <Text className="font-bold text-pink-50 text-xs">磁贴</Text>
                <View className="flex items-center">
                    <Text className="text-lg mr-1">🌟</Text>
                    <Text className="text-xl font-black">{user.magnets}</Text>
                </View>
            </View>
            <View
                onClick={() => {
                    Taro.setStorageSync('pendingProfileMode', 'stars')
                    Taro.switchTab({ url: '/pages/profile/index' })
                }}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg p-2 flex-1 flex items-center justify-between px-4 text-white active:scale-98 transition-all"
            >
                <Text className="font-bold text-yellow-50 text-xs">许愿星</Text>
                <View className="flex items-center">
                    <Text className="text-lg mr-1">⭐</Text>
                    <Text className="text-xl font-black">{user.starTokens || 0}</Text>
                </View>
            </View>
        </View>

        <Text className="text-lg font-bold text-slate-800 mb-4 block">🎁 梦想兑换中心</Text>

        {/* Grid */}
        <View className="grid grid-cols-2 gap-4">
            {rewards.map(reward => {
                const currentBalance = user.magnets;
                const canAfford = currentBalance >= reward.cost;
                const currencyUnit = '🌟';
                
                return (
                    <View key={reward.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                        <View className="absolute top-3 right-3 px-2 py-0.5 rounded-lg text-xs font-bold border bg-blue-50 text-blue-600 border-blue-100">
                            {reward.cost} {currencyUnit}
                        </View>

                        {/* Progress Bar */}
                        <View className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100">
                            <View className="h-full bg-gradient-to-r from-blue-400 to-indigo-500" style={{ width: `${Math.min(100, (currentBalance / reward.cost) * 100)}%` }}></View>
                        </View>

                        <View className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-3 mt-4 shadow-inner">
                            <Text>{reward.icon}</Text>
                        </View>
                        <Text className="font-bold text-slate-800 text-sm mb-1 block">{reward.title}</Text>
                        <Text className="text-xxs text-slate-400 mb-4 block h-4 overflow-hidden">{reward.description}</Text>

                        <Button 
                            onClick={() => initiateRedeem(reward)}
                            disabled={!canAfford}
                            className={classNames(
                                "w-full py-2 rounded-xl font-bold text-xs m-0 leading-normal",
                                canAfford ? "bg-indigo-500 text-white shadow-md shadow-indigo-200" : "bg-slate-100 text-slate-400"
                            )}
                        >
                            {canAfford ? '立即兑换' : `还差 ${reward.cost - currentBalance} 个`}
                        </Button>
                    </View>
                )
            })}
            
            {/* Quick Star Token Card */}
            <View className="bg-gradient-to-br from-yellow-300 to-orange-400 p-4 rounded-3xl shadow-sm border border-yellow-200 flex flex-col items-center text-center relative overflow-hidden">
                <View className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
                <View className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl mb-3 mt-2 shadow-inner animate-bounce">
                    <Text>⭐</Text>
                </View>
                <Text className="font-bold text-white text-sm mb-1 block">许愿星魔法</Text>
                <Text className="text-xxs text-yellow-50 mb-4 block h-4 overflow-hidden">立刻满足一个心愿！</Text>
                
                <Button 
                    onClick={() => {
                        Taro.setStorageSync('pendingProfileMode', 'stars')
                        Taro.switchTab({ url: '/pages/profile/index' })
                    }}
                    className="w-full bg-white text-orange-500 py-2 rounded-xl font-bold text-xs m-0 leading-normal shadow-sm active:scale-95 transition-all"
                >
                    使用 1 ⭐
                </Button>
            </View>
        </View>

        {/* Redemption Modal */}
        {selectedReward && !showMath && (
            <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" onClick={() => setSelectedReward(null)}>
                <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
                    <View className="text-6xl mb-6 bg-indigo-50 w-24 h-24 mx-auto rounded-full flex items-center justify-center">
                        <Text>{selectedReward.icon}</Text>
                    </View>
                    <Text className="text-lg font-bold text-slate-800 mb-2 block">确认兑换 {selectedReward.title}?</Text>
                    <Text className="text-slate-500 text-sm mb-6 block">需消耗 <Text className="font-bold text-blue-500">{selectedReward.cost} 个磁贴</Text></Text>
                    <View className="flex gap-3 mb-4">
                        <Button onClick={() => setSelectedReward(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold rounded-xl py-3 text-sm">再想想</Button>
                        <Button onClick={() => setShowMath(true)} className="flex-1 bg-indigo-500 text-white font-bold rounded-xl py-3 text-sm shadow-lg shadow-indigo-200">确认兑换</Button>
                    </View>
                    <Text className="text-xs text-orange-400 bg-orange-50 inline-block px-4 py-2 rounded-full border border-orange-100">🔒 需家长验证</Text>
                </View>
            </View>
        )}

        {/* Parent Math Gate */}
        <MathGate 
            isOpen={showMath} 
            onClose={() => {
                setShowMath(false);
                setSelectedReward(null);
            }} 
            onSuccess={handleMathSuccess} 
        />

        {/* Magnets Display Modal */}
        {showMagnets && (
            <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" onClick={() => setShowMagnets(false)}>
                <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl max-h-96 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <Text className="text-lg font-bold mb-4 block">🛒 我的磁贴</Text>
                    <Text className="text-xs text-slate-400 mb-4 block">点击磁贴可以看它们闪闪发光！</Text>
                    <View className="grid grid-cols-5 gap-y-5 gap-x-2 justify-items-center overflow-y-auto max-h-[60vh] py-4">
                        {Array.from({ length: Math.min(user.magnets, 50) }).map((_, i) => (
                            <View
                                key={i}
                                onClick={() => {
                                    Taro.vibrateShort({ type: 'light' });
                                    soundService.playEarn();
                                }}
                                className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-yellow-200/50 active:scale-110 animate-magnet-bounce"
                                style={{ 
                                    '--mdel': `${(i % 5) * 0.15 + (i % 3) * 0.1}s`, 
                                    '--mdur': `${1.2 + (i % 2) * 0.3}s` 
                                } as React.CSSProperties}
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