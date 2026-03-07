import { View, Text, Button } from '@tarojs/components'
import React from 'react'
import classNames from 'classnames'
import Taro from '@tarojs/taro'
import { useWeeklyMilestone, MILESTONES } from '../../hooks/useWeeklyMilestone'

export interface WeeklyMilestoneCardProps {
    onOpenStars?: () => void;
}

export const WeeklyMilestoneCard: React.FC<WeeklyMilestoneCardProps> = ({ onOpenStars }) => {
    const { weeklyEarned, maxTarget, milestones, handleClaim } = useWeeklyMilestone();
    
    // Clamp percentage
    const percentage = Math.min(100, Math.max(0, (weeklyEarned / maxTarget) * 100));

    return (
        <View className="bg-white rounded-3xl p-5 mb-6 shadow-[0_8px_20px_-4px_rgba(244,114,182,0.15)] border border-pink-50 relative overflow-hidden">
            <View className="absolute -top-10 -right-10 w-32 h-32 bg-pink-100/50 rounded-full blur-2xl pointer-events-none" />
            
            <View className="flex flex-row justify-between items-center mb-6 relative z-10">
                <View>
                    <Text className="text-gray-800 font-bold text-lg block mb-1">📅 本周成长里程碑</Text>
                    <Text className="text-gray-500 text-xs">每积攒20个磁贴，即可召唤许愿星！</Text>
                </View>
                <View 
                    onClick={() => {
                        if (onOpenStars) {
                            onOpenStars();
                        } else {
                            Taro.setStorageSync('pendingProfileMode', 'stars');
                            Taro.switchTab({ url: '/pages/profile/index' });
                        }
                    }}
                    className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex flex-col items-center justify-center shadow-lg transform active:scale-95 transition-all relative overflow-hidden"
                >
                    <View className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
                    <Text className="text-xl">⭐</Text>
                </View>
            </View>

            {/* Target nodes and Progress bar */}
            <View className="relative z-10 mb-8 mt-2 px-2">
                <View className="flex flex-row justify-between mb-4">
                    <Text className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">本周累计: {weeklyEarned}</Text>
                    <Text className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">目标: {maxTarget}</Text>
                </View>
                
                {/* The Bar Wrapper - slightly narrower to prevent 100% and 0% nodes from overflowing visually */}
                <View className="relative w-auto mx-2 h-3 bg-gray-100 rounded-full shadow-inner mb-6">
                    <View 
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500"
                        style={{ width: `${percentage}%` }}
                    />

                    {/* Nodes spread across the bar */}
                    {milestones.map((m) => {
                        const nodeLeft = `${(m.target / maxTarget) * 100}%`;
                        const isReached = m.isReached;
                        const isClaimed = m.isClaimed;

                        return (
                            <View 
                                key={m.id} 
                                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
                                style={{ left: nodeLeft }}
                            >
                                {/* Dot on the bar */}
                                <View className={classNames(
                                    "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                                    isReached ? "bg-white border-purple-500 z-10" : "bg-gray-200 border-white z-10"
                                )}>
                                    {isReached && isClaimed && <Text className="text-[8px]">✓</Text>}
                                    {isReached && !isClaimed && <View className="w-2 h-2 bg-purple-500 rounded-full" />}
                                </View>

                                {/* Badge Status positioned above/below */}
                                <View className="absolute top-5 flex flex-col items-center min-w-[40px] whitespace-nowrap">
                                    <Text className="text-[10px] text-gray-400 font-bold mb-1">{m.target}🌟</Text>
                                    
                                    {!isReached && (
                                        <View className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 opacity-50 grayscale">
                                            <Text className="text-sm">⭐</Text>
                                        </View>
                                    )}
                                    {isReached && !isClaimed && (
                                        <View onClick={() => handleClaim(m.uniqueId, m.rewardTokens)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-300 to-yellow-400 shadow-md animate-bounce transform active:scale-95 cursor-pointer z-20">
                                            <Text className="text-lg">⭐</Text>
                                        </View>
                                    )}
                                    {isReached && isClaimed && (
                                        <View className="px-2 py-1 flex items-center justify-center rounded-full whitespace-nowrap" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                                            <Text className="text-xs font-bold text-slate-400 whitespace-nowrap" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>已完成</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};
