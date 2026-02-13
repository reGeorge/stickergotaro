import { View as TaroView, Text as TaroText, Button as TaroButton } from '@tarojs/components'
import { useState } from 'react'
import { useStore, Reward } from '../../store/useStore'
import classNames from 'classnames'
import Taro from '@tarojs/taro'
import { soundService } from '../../utils/sound'

const View = TaroView as any
const Text = TaroText as any
const Button = TaroButton as any

export default function Shop() {
  const { user, rewards, spendMagnets } = useStore()

  // Modal States
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [showMath, setShowMath] = useState(false)
  const [mathProblem, setMathProblem] = useState({ q: '', a: 0 })
  const [showMagnets, setShowMagnets] = useState(false)

  const initiateRedeem = (reward: Reward) => {
    setSelectedReward(reward)
    setShowMath(false)
  }

  const startVerification = () => {
    const a = Math.floor(Math.random() * 5); 
    const b = Math.floor(Math.random() * (10 - a));
    const safeA = a === 0 && b === 0 ? 1 : a;
    setMathProblem({ q: `${safeA} + ${b}`, a: safeA + b });
    setShowMath(true);
  }

  const checkAnswer = (val: number) => {
    if (val === mathProblem.a && selectedReward) {
        const success = spendMagnets(selectedReward.cost, `兑换: ${selectedReward.title}`)
        if (success) {
            Taro.showToast({ title: '兑换成功！', icon: 'success' })
            setSelectedReward(null)
            setShowMath(false)
        }
    } else {
        Taro.showToast({ title: '算错了哦', icon: 'error' })
        // Regenerate
        setTimeout(() => startVerification(), 500)
    }
  }

  return (
    <View className="min-h-screen bg-bg-blue p-4 pb-24 font-sans">
        {/* Balance Sticky Header */}
        <View className="sticky top-0 z-20 py-2 -mx-2 mb-4 px-2">
            <View
                className="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 rounded-full shadow-lg p-2 flex items-center justify-between px-5 text-white active:scale-98 transition-all"
                onClick={() => setShowMagnets(true)}
            >
                <Text className="font-bold text-pink-50 text-sm">可用磁贴</Text>
                <View className="flex items-center">
                    <Text className="text-xl mr-2">🛒</Text>
                    <Text className="text-2xl font-black">{user.magnets}</Text>
                </View>
            </View>
        </View>

        <Text className="text-lg font-bold text-slate-800 mb-4 block">🎁 梦想兑换中心</Text>

        {/* Grid */}
        <View className="grid grid-cols-2 gap-4">
            {rewards.map(reward => {
                const canAfford = user.magnets >= reward.cost
                return (
                    <View key={reward.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                        {reward.category === 'dream' && (
                            <View className="absolute top-0 left-0 bg-gradient-to-br from-red-400 to-pink-500 text-white text-xxs px-3 py-1 rounded-br-xl font-bold z-10">大梦想</View>
                        )}
                        <View className="absolute top-3 right-3 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-lg text-xs font-bold border border-yellow-100">
                            {reward.cost} 🌟
                        </View>

                        {/* Dream Progress Bar */}
                        {reward.category === 'dream' && (
                            <View className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100">
                                <View className="h-full bg-gradient-to-r from-red-400 to-pink-500" style={{ width: `${Math.min(100, (user.magnets / reward.cost) * 100)}%` }}></View>
                            </View>
                        )}

                        <View className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-3 mt-4">
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
                            {canAfford ? '立即兑换' : `还差 ${reward.cost - user.magnets} 个`}
                        </Button>
                    </View>
                )
            })}
        </View>

        {/* Redemption Modal */}
        {selectedReward && (
            <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" onClick={() => setSelectedReward(null)}>
                <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
                    {!showMath ? (
                        <>
                            <View className="text-6xl mb-6 bg-indigo-50 w-24 h-24 mx-auto rounded-full flex items-center justify-center">
                                <Text>{selectedReward.icon}</Text>
                            </View>
                            <Text className="text-lg font-bold text-slate-800 mb-2 block">确认兑换 {selectedReward.title}?</Text>
                            <Text className="text-slate-500 text-sm mb-6 block">需消耗 <Text className="text-yellow-500 font-bold">{selectedReward.cost}</Text> 磁贴</Text>
                            <View className="flex gap-3 mb-4">
                                <Button onClick={() => setSelectedReward(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold rounded-xl py-3 text-sm">再想想</Button>
                                <Button onClick={startVerification} className="flex-1 bg-indigo-500 text-white font-bold rounded-xl py-3 text-sm shadow-lg shadow-indigo-200">确认兑换</Button>
                            </View>
                            <Text className="text-xs text-orange-400 bg-orange-50 inline-block px-4 py-2 rounded-full border border-orange-100">🔒 需家长验证</Text>
                        </>
                    ) : (
                        <>
                            <Text className="text-lg font-bold text-slate-800 mb-4 block">家长验证</Text>
                            <Text className="text-3xl font-mono font-bold mb-6 block bg-slate-100 py-3 rounded-xl text-slate-700">{mathProblem.q} = ?</Text>
                            <View className="grid grid-cols-3 gap-3 mb-4">
                                {[1,2,3,4,5,6,7,8,9,0].map(n => (
                                    <View key={n} onClick={() => checkAnswer(n)} className={classNames(
                                        "bg-white p-3 rounded-xl font-bold text-slate-700 border border-slate-200 text-xl active:bg-indigo-50 text-center shadow-sm",
                                        { "col-start-2": n === 0 }
                                    )}>
                                        <Text>{n}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text onClick={() => setShowMath(false)} className="text-sm text-slate-400 underline">返回</Text>
                        </>
                    )}
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