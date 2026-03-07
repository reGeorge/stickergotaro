import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { BADGE_DEFINITIONS, BadgeDef } from '../../config/badges.config';
import { useStore } from '../../store/useStore';
import dayjs from 'dayjs';

interface BadgeGridProps {}

export const BadgeGrid: React.FC<BadgeGridProps> = () => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);
  const { logs } = useStore();

  const getBadgeStats = (badge: BadgeDef) => {
    const matchingLogs = logs.filter(l => l.type === 'magnet-moment' && badge.keywords?.some(kw => l.description.includes(kw))).sort((a, b) => b.timestamp - a.timestamp);
    const count = matchingLogs.length;
    let level = 0;
    if (count >= 20) level = 3;
    else if (count >= 10) level = 2;
    else if (count >= 5) level = 1;
    return { count, level, matchingLogs };
  };

  const unlockedCount = BADGE_DEFINITIONS.filter(b => getBadgeStats(b).level > 0).length;

  const handleBadgeClick = (badge: BadgeDef) => {
    // Only show modal if badge is clicked (we can show it even if locked, to motivate)
    setSelectedBadge(badge);
  };

  const closeModal = () => {
    setSelectedBadge(null);
  };

  return (
    <>
      {/* Badge Grid Component */}
      <View className="bg-white/40 backdrop-blur-3xl rounded-3xl p-5 mb-6 shadow-sm border border-white/60 relative overflow-hidden">
        {/* Decorative background glow */}
        <View className="absolute top-0 right-0 w-32 h-32 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />

        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-gray-800 font-bold text-lg">核心精神荣誉</Text>
          <Text className="text-gray-500 font-medium text-xs bg-white/50 px-3 py-1 rounded-full">
            {unlockedCount} / {BADGE_DEFINITIONS.length} 已点亮
          </Text>
        </View>

        <View className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-2 pb-2">
          {BADGE_DEFINITIONS.map((badge, index) => {
            const { level, count } = getBadgeStats(badge);
            const isUnlocked = level > 0;
            return (
              <View key={badge.id} className="flex flex-col items-center">
                <View 
                  className={`relative flex flex-col items-center justify-center w-[84px] h-[84px] rounded-full transition-all duration-300 ${
                    isUnlocked 
                      ? `bg-gradient-to-br ${badge.bgGradient} shadow-[0_10px_20px_rgba(0,0,0,0.12),inset_0_-4px_8px_rgba(0,0,0,0.05),inset_0_4px_8px_rgba(255,255,255,0.8)] border border-white/60 transform hover:scale-105 active:scale-95` 
                      : 'bg-gray-100/50 border border-white/40 grayscale opacity-60 shadow-[0_6px_12px_rgba(0,0,0,0.05),inset_0_-2px_4px_rgba(0,0,0,0.02)]'
                  }`}
                  onClick={() => handleBadgeClick(badge)}
                >
                  {/* Animating glow pulse for unlocked */}
                  {isUnlocked && (
                    <View className="absolute inset-0 bg-white/20 rounded-full animate-pulse pointer-events-none" />
                  )}
                  
                  <Text className="text-4xl filter drop-shadow-sm">{badge.icon}</Text>
                  {isUnlocked && (
                    <View className={`absolute -bottom-2 bg-gradient-to-r ${badge.bgGradient} text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white shadow-sm`}>
                       Lv.{level}
                    </View>
                  )}
                </View>
                <Text className={`text-xs font-bold mt-3 text-center w-full truncate px-1 ${isUnlocked ? badge.color : 'text-gray-400'}`}>
                  {badge.title}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <View className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <View 
            className="absolute inset-0 bg-black/40 backdrop-blur-md animate-[pop-in_0.2s_ease-out]" 
            onClick={closeModal} 
          />
          <View className="w-[85%] bg-white rounded-3xl overflow-hidden relative shadow-2xl animate-[suck-in_0.3s_ease-out] border border-white/50 flex flex-col max-h-[85vh]">
            {/* Modal Header/Icon Area */}
            <View className={`h-48 shrink-0 bg-gradient-to-br ${selectedBadge.bgGradient} relative flex flex-col items-center justify-center pt-8`}>
              <View className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
              <View className="w-24 h-24 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_12px_24px_rgba(0,0,0,0.1),inset_0_-4px_8px_rgba(0,0,0,0.05),inset_0_4px_10px_rgba(255,255,255,0.8)] border border-white/50 mb-2 animate-bounce">
                <Text className="text-6xl">{selectedBadge.icon}</Text>
              </View>
              <Text className={`text-xl font-black ${selectedBadge.color}`}>{selectedBadge.title}</Text>
              
              <View 
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/10 rounded-full active:bg-black/20"
                onClick={closeModal}
              >
                <Text className="text-gray-700 font-bold">✕</Text>
              </View>
            </View>

            {/* Content Area */}
            <ScrollView scrollY className="flex-1 w-full" style={{ maxHeight: 'calc(85vh - 192px)' }}>
              <View className="p-6">
                {/* Philosophy Root section */}
              <View className="mb-5 bg-gray-50 rounded-2xl p-4 border border-gray-100 relative overflow-hidden">
                <View className="absolute top-0 left-0 w-2 h-full bg-indigo-400" />
                <View className="flex flex-row items-center mb-2">
                  <Text className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md mr-2">渊源</Text>
                  <Text className="text-sm font-bold text-gray-800">{selectedBadge.philosophy}</Text>
                </View>
                <Text className="text-xs text-gray-500 leading-relaxed italic block mt-1">
                  "{selectedBadge.philosophyDesc}"
                </Text>
              </View>

              {/* Unlock Condition section */}
              <View className="mb-2">
                <Text className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">家长授予语</Text>
                <View className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100">
                  <Text className="text-sm text-gray-700 leading-relaxed font-medium block">
                    {selectedBadge.condition}
                  </Text>
                </View>
              </View>

              {/* Status Message */}
              {(() => {
                 const { level, count, matchingLogs } = getBadgeStats(selectedBadge);
                 return (
                   <View className="mt-4 pt-4 border-t border-dashed border-gray-200">
                     <View className="flex justify-between items-center mb-3">
                       <Text className="text-xs font-bold text-gray-500">当前收集: {count} 次</Text>
                       {level > 0 ? (
                         <Text className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded">Lv.{level} 达成</Text>
                       ) : (
                         <Text className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">未解锁 (需5次)</Text>
                       )}
                     </View>

                     {/* Progress Bar */}
                     <View className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                       <View 
                         className={`h-full bg-gradient-to-r ${selectedBadge.bgGradient}`} 
                         style={{ width: `${Math.min(100, (count / 20) * 100)}%` }} 
                       />
                     </View>
                     
                     <Text className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">收集到的美好时刻</Text>
                     <View className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                        {matchingLogs.length > 0 ? matchingLogs.map(log => (
                          <View key={log.id} className="text-xs text-gray-600 mb-2 pb-2 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
                            <Text className="font-bold text-indigo-400 mr-2">{dayjs(log.timestamp).format('MM-DD')}</Text>
                            <Text>{log.description.replace('磁贴时刻: ', '')}</Text>
                          </View>
                        )) : (
                          <Text className="text-xs text-gray-400 text-center block py-2">还没有收集到相关的时刻哦~ 含有关键字：{selectedBadge.keywords?.join('、')}</Text>
                        )}
                     </View>
                   </View>
                 )
              })()}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </>
  );
};