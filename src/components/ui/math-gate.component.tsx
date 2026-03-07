import { View as TaroView, Text as TaroText } from '@tarojs/components';
import { useState, useEffect } from 'react';
import classNames from 'classnames';
import Taro from '@tarojs/taro';

const View = TaroView as any;
const Text = TaroText as any;

// 预设的家长肯定/同理心短句
const PARENT_TIPS = [
    "比起夸奖结果，不如称赞孩子刚才的专注！",
    "“我看到你刚才很努力，你一定觉得自己很棒吧！”",
    "不要把奖励当成交易，这是对孩子成长的见证。",
    "今天抱抱孩子了吗？",
    "关注孩子的情绪，比完成任务本身更重要哦。",
    "给孩子选择的权利，培养自主感。",
];

interface MathGateProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function MathGate({ isOpen, onClose, onSuccess }: MathGateProps) {
    const [mathProblem, setMathProblem] = useState({ q: '', a: 0 });
    const [showTip, setShowTip] = useState(false);
    const [currentTip, setCurrentTip] = useState('');

    useEffect(() => {
        if (isOpen) {
            startVerification();
            setShowTip(false);
        }
    }, [isOpen]);

    const startVerification = () => {
        const a = Math.floor(Math.random() * 5); 
        const b = Math.floor(Math.random() * (10 - a));
        const safeA = a === 0 && b === 0 ? 1 : a;
        setMathProblem({ q: `${safeA} + ${b}`, a: safeA + b });
    }

    const checkAnswer = (val: number) => {
        if (val === mathProblem.a) {
            // 答对了，展示随机提示
            const randomTip = PARENT_TIPS[Math.floor(Math.random() * PARENT_TIPS.length)];
            setCurrentTip(randomTip);
            setShowTip(true);
            
            // 展示提示的时间调短一半
            setTimeout(() => {
                setShowTip(false);
                onSuccess();
            }, 1250);
        } else {
            Taro.showToast({ title: '算错了哦', icon: 'error' });
            Taro.vibrateLong();
            setTimeout(() => startVerification(), 500);
        }
    }

    if (!isOpen) return null;

    return (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" onClick={onClose}>
            <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                
                {showTip ? (
                    <View className="animate-fade-in flex flex-col items-center justify-center py-6">
                        <Text className="text-4xl mb-4">💡</Text>
                        <Text className="text-lg font-bold text-indigo-500 mb-2 block">家长小贴士</Text>
                        <Text className="text-slate-600 text-sm leading-relaxed px-4">{currentTip}</Text>
                        <View className="mt-6 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <View className="bg-indigo-400 h-full animate-progress"></View>
                        </View>
                    </View>
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
                        <Text onClick={onClose} className="text-sm text-slate-400 underline py-2 block">取消操作</Text>
                    </>
                )}
            </View>
        </View>
    );
}
