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
        <View className="sticky top-0 z-20 py-2 -mx-2 mb-4 px-2 flex gap-2 md:gap-4 md:px-0">
            <View
                className="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 rounded-full shadow-lg p-2 md:p-4 flex-1 flex items-center justify-between px-4 md:px-8 text-white active:scale-98 transition-all"
                onClick={() => setShowMagnets(true)}
            >
                <Text className="font-bold text-pink-50 text-xs md:text-base">磁贴</Text>
                <View className="flex items-center">
                    <Text className="text-lg md:text-2xl mr-1">🌟</Text>
                    <Text className="text-xl md:text-3xl font-black">{user.magnets}</Text>
                </View>
            </View>
            <View
                onClick={() => {
                    Taro.setStorageSync('pendingProfileMode', 'stars')
                    Taro.switchTab({ url: '/pages/profile/index' })
                }}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg p-2 md:p-4 flex-1 flex items-center justify-between px-4 md:px-8 text-white active:scale-98 transition-all"
            >
                <Text className="font-bold text-yellow-50 text-xs md:text-base">许愿星</Text>
                <View className="flex items-center">
                    <Text className="text-lg md:text-2xl mr-1">⭐</Text>
                    <Text className="text-xl md:text-3xl font-black">{user.starTokens || 0}</Text>
                </View>
            </View>
        </View>

        <Text className="text-lg md:text-2xl font-bold text-slate-800 mb-4 block">🎁 梦想兑换中心</Text>

        {/* Grid */}
        <View className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {rewards.map(reward => {
                const currentBalance = user.magnets;
                const canAfford = currentBalance >= reward.cost;
                const currencyUnit = '🌟';
                
                return (
                    <View key={reward.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                        <View className="absolute top-3 right-3 px-2 py-0.5 rounded-lg text-xs md:text-sm font-bold border bg-blue-50 text-blue-600 border-blue-100">
                            {reward.cost} {currencyUnit}
                        </View>

                        {/* Progress Bar */}
                        <View className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100">
                            <View className="h-full bg-gradient-to-r from-blue-400 to-indigo-500" style={{ width: `${Math.min(100, (currentBalance / reward.cost) * 100)}%` }}></View>
                        </View>

                        <View className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl md:text-6xl mb-3 mt-4 shadow-inner">
                            <Text>{reward.icon}</Text>
                        </View>
                        <Text className="font-bold text-slate-800 text-sm md:text-lg mb-1 block leading-normal">{reward.title}</Text>
                        <Text className="text-[10px] md:text-sm text-slate-400 mb-4 block min-h-[1.2rem] md:min-h-[1.5rem] leading-normal">{reward.description}</Text>

                        <Button 
                            onClick={() => initiateRedeem(reward)}
                            disabled={!canAfford}
                            className={classNames(
                                "w-full py-2 md:py-3 rounded-xl font-bold text-xs md:text-base m-0 leading-normal flex items-center justify-center",
                                canAfford ? "bg-indigo-500 text-white shadow-md shadow-indigo-200" : "bg-slate-100 text-slate-400"
                            )}
                        >
                            <Text>{canAfford ? '立即兑换' : `还差 ${reward.cost - currentBalance} 个`}</Text>
                        </Button>
                    </View>
                )
            })}
            
            <View className="bg-gradient-to-br from-yellow-300 to-orange-400 p-4 rounded-3xl shadow-sm border border-yellow-200 flex flex-col items-center text-center relative overflow-hidden">
                <View className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
                <View className="w-16 h-16 md:w-24 md:h-24 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl md:text-6xl mb-3 mt-2 shadow-inner animate-bounce">
                    <Text>⭐</Text>
                </View>
                <Text className="font-bold text-white text-sm md:text-lg mb-1 block leading-normal">许愿星魔法</Text>
                <Text className="text-[10px] md:text-sm text-yellow-50 mb-4 block min-h-[1.2rem] md:min-h-[1.5rem] leading-normal">立刻满足一个心愿！</Text>
                
                <Button 
                    onClick={() => {
                        Taro.setStorageSync('pendingProfileMode', 'stars')
                        Taro.switchTab({ url: '/pages/profile/index' })
                    }}
                    className="w-full bg-white text-orange-500 py-2 md:py-3 rounded-xl font-bold text-xs md:text-base m-0 leading-normal shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                    <Text>使用 1 ⭐</Text>
                </Button>
            </View>
        </View>

        {/* Redemption Modal */}
        {selectedReward && !showMath && (
            <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6 md:p-12" onClick={() => setSelectedReward(null)}>
                <View className="bg-white w-full max-w-sm md:max-w-md rounded-3xl p-6 md:p-10 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
                    <View className="text-6xl md:text-8xl mb-6 bg-indigo-50 w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full flex items-center justify-center">
                        <Text>{selectedReward.icon}</Text>
                    </View>
                    <Text className="text-lg md:text-2xl font-bold text-slate-800 mb-2 block">确认兑换 {selectedReward.title}?</Text>
                    <Text className="text-slate-500 text-sm md:text-lg mb-6 block">需消耗 <Text className="font-bold text-blue-500">{selectedReward.cost} 个磁贴</Text></Text>
                    <View className="flex gap-3 mb-4">
                        <Button onClick={() => setSelectedReward(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold rounded-xl py-3 md:py-4 text-sm md:text-lg">再想想</Button>
                        <Button onClick={() => setShowMath(true)} className="flex-1 bg-indigo-500 text-white font-bold rounded-xl py-3 md:py-4 text-sm md:text-lg shadow-lg shadow-indigo-200">确认兑换</Button>
                    </View>
                    <Text className="text-xs md:text-base text-orange-400 bg-orange-50 inline-block px-4 py-2 rounded-full border border-orange-100">🔒 需家长验证</Text>
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
            <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6 md:p-12" onClick={() => setShowMagnets(false)}>
                <View className="bg-white w-full max-w-sm md:max-w-2xl rounded-3xl p-6 md:p-10 shadow-2xl max-h-96 md:max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <Text className="text-lg md:text-2xl font-bold mb-4 block">🛒 我的磁贴</Text>
                    <Text className="text-xs md:text-lg text-slate-400 mb-4 block">点击磁贴可以看它们闪闪发光！</Text>
                    <View className="grid grid-cols-5 md:grid-cols-8 gap-y-5 gap-x-2 md:gap-x-4 justify-items-center overflow-y-auto max-h-[60vh] md:max-h-[65vh] py-4">
                        {Array.from({ length: Math.min(user.magnets, 50) }).map((_, i) => (
                            <View
                                key={i}
                                onClick={() => {
                                    Taro.vibrateShort({ type: 'light' });
                                    soundService.playEarn();
                                }}
                                className="w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center text-xl sm:text-2xl md:text-4xl shadow-lg shadow-yellow-200/50 active:scale-110 animate-magnet-bounce"
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