
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import dayjs from 'dayjs'
import { soundService } from '../utils/sound'
import { FeedbackService } from './feedback.service'

// --- Interfaces (复用原项目) ---
export interface Task {
  id: string;
  type: 'daily' | 'monthly'; // 任务类型：每日任务或月度打卡
  title: string;
  icon: string;
  magnetReward: number; // 基础奖励磁贴数
  completed: boolean;
  lastCompletedDate: string;
  dailyLimit?: number; // 每日最多完成次数，默认为1
  completedCount?: number; // 当天已完成的次数
  isActive?: boolean; // Phase 2: In current daily draft pool
  
  // 月度任务特有字段
  monthlyProgress?: number; // 本月已打卡天数
  targetDays?: number; // 目标天数（如一个月打卡满 20 天）
  bonusReward?: number; // 达成目标后的额外磁贴大奖
  history?: string[]; // 记录打卡的日期数组 ['2026-02-01', '2026-02-03']
}

export interface Reward {
  id: string;
  title: string;
  icon: string;
  cost: number;
  description: string;
  category: 'mini' | 'small' | 'bonus' | 'dream' | 'experience';
  type?: 'goods' | 'experience'; // 体验类 / 物品类
  currencyType?: 'magnet' | 'starToken'; // 新增货币类型：普通磁贴 / 许愿星
  dailyLimit?: number; // 每日最多兑换次数，默认为1
  redeemedCount?: number; // 当天已兑换的次数
}

export interface Log {
  id: string;
  type: 'earn' | 'spend' | 'bonus' | 'mood' | 'penalty' | 'magnet-moment';
  amount: number;
  description: string;
  timestamp: number;
  emotion?: 'happy' | 'normal' | 'sad'; // 记录当时的情绪反思
}

export interface User {
  name: string;
  avatar?: string;
  magnets: number;
  starTokens: number; // 高阶奖励碎片
  streak: number;
  lastCheckInDate: string;
  totalTasksCompleted: number;
  homeRuns: number;
  unlockedBadges: string[]; // Store unlocked badge IDs
  claimedMilestones: string[]; // 记录已领取的里程碑，避免重复领取 (如 "2026-w10")
}

interface StoreState {
  user: User;
  tasks: Task[];
  rewards: Reward[];
  logs: Log[];
  
  // Actions
  updateProfile: (name: string, avatar: string) => void;
  addMagnets: (amount: number, description: string, type: Log['type'], emotion?: Log['emotion']) => void;
  spendMagnets: (amount: number, description: string) => boolean;
  spendStarTokens: (amount: number, description: string) => boolean; // 花费许愿星
  addStarTokens: (amount: number, description: string) => void; // 增加许愿星
  claimMilestone: (milestoneId: string, tokenReward: number) => void; // 领取里程碑奖励
  toggleTask: (taskId: string, emotion?: Log['emotion']) => void;
  toggleTaskActive: (taskId: string) => void;
  checkDailyReset: () => void;
  deleteLog: (logId: string) => void;
  updateLog: (logId: string, updates: Partial<Log>) => void;
  
  // 月度任务 Actions
  toggleMonthlyTask: (taskId: string, emotion?: Log['emotion']) => void;
  checkMonthlyReset: () => void;
  
  // Admin Actions
  addTask: (task: Partial<Task>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  addReward: (title: string, icon: string, cost: number, desc: string, type?: 'goods' | 'experience') => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  reorderRewards: (rewardIds: string[]) => void;
  
  // Import
  importConfig: (type: 'tasks' | 'rewards' | 'logs', data: any[]) => void;
}

// --- Initial Data ---
const initialUser: User = {
  name: '宝贝',
  avatar: '�',
  magnets: 0,
  starTokens: 0,
  streak: 0,
  lastCheckInDate: '',
  totalTasksCompleted: 0,
  homeRuns: 0,
  unlockedBadges: ['badge-courage'], // TODO: Just giving one by default so we can see the unlocked styling
  claimedMilestones: []
};

const initialTasks: Task[] = [
  // 每日任务
  { id: '1', type: 'daily', title: '吃饭香香', icon: '🍚', magnetReward: 1, completed: false, lastCompletedDate: '', dailyLimit: 1, completedCount: 0, isActive: true },
  { id: '2', type: 'daily', title: '洗刷刷达人', icon: '🛁', magnetReward: 1, completed: false, lastCompletedDate: '', dailyLimit: 1, completedCount: 0, isActive: true },
  { id: '3', type: 'daily', title: '玩具回新家', icon: '🧸', magnetReward: 1, completed: false, lastCompletedDate: '', dailyLimit: 1, completedCount: 0, isActive: true },
  { id: '4', type: 'daily', title: '上学不迟到', icon: '🎒', magnetReward: 1, completed: false, lastCompletedDate: '', dailyLimit: 1, completedCount: 0, isActive: false }, // Let's make some false by default so the user can choose them
  { id: '5', type: 'daily', title: '准时梦游记', icon: '🌙', magnetReward: 1, completed: false, lastCompletedDate: '', dailyLimit: 1, completedCount: 0, isActive: false },
  { id: '6', type: 'daily', title: '每日阅读', icon: '📚', magnetReward: 2, completed: false, lastCompletedDate: '', dailyLimit: 1, completedCount: 0, isActive: false },
  { id: '7', type: 'daily', title: '运动小健将', icon: '🏃', magnetReward: 2, completed: false, lastCompletedDate: '', dailyLimit: 1, completedCount: 0, isActive: false },
  
  // 月度任务示例
  { 
    id: 'm1', 
    type: 'monthly', 
    title: '阅读小达人', 
    icon: '📖', 
    magnetReward: 1, 
    completed: false, 
    lastCompletedDate: '', 
    monthlyProgress: 0, 
    targetDays: 20, 
    bonusReward: 10, 
    history: [] 
  },
  { 
    id: 'm2', 
    type: 'monthly', 
    title: '运动小健将', 
    icon: '🏀', 
    magnetReward: 1, 
    completed: false, 
    lastCompletedDate: '', 
    monthlyProgress: 0, 
    targetDays: 15, 
    bonusReward: 8, 
    history: [] 
  },
];

const initialRewards: Reward[] = [
  { id: 'r1', title: '玩一会手机', icon: '📱', cost: 2, description: 'mini奖励 (15分钟)', category: 'mini', type: 'goods', currencyType: 'magnet', dailyLimit: 1, redeemedCount: 0 },
  { id: 'r2', title: '美味零食', icon: '🍫', cost: 5, description: '小奖赏 (10元以内)', category: 'bonus', type: 'goods', currencyType: 'magnet', dailyLimit: 1, redeemedCount: 0 },
  { id: 'r3', title: '睡前多讲一个故事', icon: '📖', cost: 3, description: '亲子体验', category: 'experience', type: 'experience', currencyType: 'magnet', dailyLimit: 1, redeemedCount: 0 },
  { id: 'r4', title: '选周末大餐', icon: '🍽️', cost: 8, description: '家庭决定权', category: 'small', type: 'experience', currencyType: 'magnet', dailyLimit: 1, redeemedCount: 0 },
  { id: 'r5', title: '心仪大玩具', icon: '🎁', cost: 80, description: '积攒磁贴换大奖', category: 'dream', type: 'goods', currencyType: 'magnet', dailyLimit: 1, redeemedCount: 0 },
  { id: 'r6', title: '游乐园一日游', icon: '🎢', cost: 100, description: '积攒磁贴换大奖', category: 'dream', type: 'experience', currencyType: 'magnet', dailyLimit: 1, redeemedCount: 0 },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: initialUser,
      tasks: initialTasks,
      rewards: initialRewards,
      logs: [],

      updateProfile: (name, avatar) => {
        set(state => ({
          user: { ...state.user, name, avatar }
        }));
      },

      addMagnets: (amount, description, type, emotion) => {
        set(state => ({
          user: { ...state.user, magnets: state.user.magnets + amount },
          logs: [{
            id: Date.now().toString(),
            type,
            amount,
            description,
            timestamp: Date.now(),
            emotion
          }, ...state.logs]
        }));
        
        // Sound Effects
        if (type === 'bonus') {
            soundService.playFanfare();
        } else if (type === 'mood') {
            soundService.playChime();
        } else if (type === 'earn' || type === 'magnet-moment') {
            soundService.playEarn();
        }
      },

      spendMagnets: (amount, description) => {
        const { user } = get();
        if (user.magnets < amount) return false;

        set(state => ({
          user: { ...state.user, magnets: state.user.magnets - amount },
          logs: [{
            id: Date.now().toString(),
            type: 'spend',
            amount: -amount,
            description,
            timestamp: Date.now()
          }, ...state.logs]
        }));
        
        Taro.vibrateShort({ type: 'light' });
        // Sound is now handled by FeedbackService.showRedeemSuccess()
        return true;
      },

      spendStarTokens: (amount, description) => {
        const state = get();
        if ((state.user.starTokens || 0) < amount) return false;
        
        set(state => ({
          user: { ...state.user, starTokens: (state.user.starTokens || 0) - amount },
          logs: [{
            id: Date.now().toString(),
            type: 'spend',
            amount: -amount,
            description,
            timestamp: Date.now()
          }, ...state.logs]
        }));
        return true;
      },

      addStarTokens: (amount, description) => {
        set(state => ({
          user: { ...state.user, starTokens: (state.user.starTokens || 0) + amount },
          logs: [{
            id: Date.now().toString(),
            type: 'bonus',
            amount: 0, // This is basically a non-magnet log, but you can track it via text.
            description,
            timestamp: Date.now()
          }, ...state.logs]
        }));
      },

      claimMilestone: (milestoneId, tokenReward) => {
        const state = get();
        // Prevent duplicate claims
        if (state.user.claimedMilestones?.includes(milestoneId)) return;

        set(state => ({
          user: { 
            ...state.user, 
            starTokens: (state.user.starTokens || 0) + tokenReward,
            claimedMilestones: [...(state.user.claimedMilestones || []), milestoneId]
          },
          logs: [{
            id: Date.now().toString(),
            type: 'bonus',
            amount: tokenReward,
            description: `达到里程碑 ${milestoneId}，获得许愿星！`,
            timestamp: Date.now()
          }, ...state.logs]
        }));
        Taro.vibrateLong();
        soundService.playFanfare();
      },

      toggleTask: (taskId, emotion) => {
        const today = dayjs().format('YYYY-MM-DD');
        const state = get();
        const task = state.tasks.find(t => t.id === taskId);

        if (!task) return;

        const dailyLimit = task.dailyLimit || 1;
        const completedCount = task.completedCount || 0;

        // 检查是否还可以完成
        if (completedCount >= dailyLimit) {
          Taro.showToast({ title: '今日已达上限', icon: 'none' });
          return;
        }

        // 增加完成次数
        const newCompletedCount = completedCount + 1;
        const isFullyCompleted = newCompletedCount >= dailyLimit;

        // 1. 更新任务状态
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { 
            ...t, 
            completed: isFullyCompleted,
            completedCount: newCompletedCount,
            lastCompletedDate: today 
          } : t)
        }));
        
        // 2. 添加奖励 (15%几率触发暴击)
        const isCrit = Math.random() < 0.15;
        const rewardAmount = isCrit ? task.magnetReward * 2 : task.magnetReward;
        const rewardDesc = isCrit ? `🎉 暴击双倍！完成约定: ${task.title}` : `完成约定: ${task.title}`;
        get().addMagnets(rewardAmount, rewardDesc, 'earn', emotion);
        Taro.vibrateShort({ type: 'light' });

        // 3. 更新连续打卡逻辑
        const { user } = get();
        let newStreak = user.streak;
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        
        if (user.lastCheckInDate !== today) {
           if (user.lastCheckInDate === yesterday) {
              newStreak++;
           } else {
              newStreak = 1;
           }
        }

        set(s => ({
          user: {
             ...s.user,
             lastCheckInDate: today,
             streak: newStreak,
             totalTasksCompleted: s.user.totalTasksCompleted + 1
          }
        }));

        // 4. 检查全垒打（所有任务都达到每日上限）
        const currentTasks = get().tasks;
        const allCompleted = currentTasks.every(t => (t.completedCount || 0) >= (t.dailyLimit || 1));
        // 检查今天是否已经奖励过全垒打
        const alreadyBonus = get().logs.some(l => 
           l.type === 'bonus' && dayjs(l.timestamp).format('YYYY-MM-DD') === today
        );

        if (allCompleted && !alreadyBonus) {
           get().addMagnets(5, '全垒打！今日五项全能达成！', 'bonus');
           set(s => ({ user: { ...s.user, homeRuns: s.user.homeRuns + 1 } }));
           
           // 触发全垒打动画
           FeedbackService.showTaskComplete(taskId, true);
        } else {
           // 触发普通任务完成动画
           FeedbackService.showTaskComplete(taskId, false);
        }
      },

      toggleTaskActive: (taskId: string) => {
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId ? { ...t, isActive: !t.isActive } : t
          )
        }));
      },

      checkDailyReset: () => {
        const today = dayjs().format('YYYY-MM-DD');
        
        // 检查月度重置
        get().checkMonthlyReset();
        
        set(state => ({
          tasks: state.tasks.map(t => {
            // 数据迁移：为旧任务添加 type 字段
            if (!t.type) {
              t.type = 'daily';
            }
            
            // 每日任务重置
            if (t.type === 'daily' && t.lastCompletedDate !== today) {
              return { ...t, completed: false, completedCount: 0 };
            }
            
            // 月度任务初始化
            if (t.type === 'monthly') {
              return {
                ...t,
                monthlyProgress: t.monthlyProgress || 0,
                targetDays: t.targetDays || 20,
                bonusReward: t.bonusReward || 10,
                history: t.history || []
              };
            }
            
            return t;
          })
        }));
      },

      // 月度任务打卡
      toggleMonthlyTask: (taskId, emotion) => {
        const today = dayjs().format('YYYY-MM-DD');
        const state = get();
        const task = state.tasks.find(t => t.id === taskId);

        if (!task || task.type !== 'monthly') return;

        // 检查今日是否已打卡
        const history = task.history || [];
        if (history.includes(today)) {
          Taro.showToast({ title: '今日已打卡', icon: 'none' });
          return;
        }

        // 更新打卡数据
        const newHistory = [...history, today];
        const newProgress = newHistory.length;
        const targetDays = task.targetDays || 20;
        const bonusReward = task.bonusReward || 10;

        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? {
            ...t,
            history: newHistory,
            monthlyProgress: newProgress,
            lastCompletedDate: today
          } : t)
        }));

        // 发放基础奖励 (15%几率暴击)
        const isCrit = Math.random() < 0.15;
        const rewardAmount = isCrit ? task.magnetReward * 2 : task.magnetReward;
        const rewardDesc = isCrit ? `🎉 暴击双倍！月度打卡: ${task.title}` : `月度打卡: ${task.title}`;
        get().addMagnets(rewardAmount, rewardDesc, 'earn', emotion);
        Taro.vibrateShort({ type: 'light' });

        // 检查是否达成目标
        if (newProgress >= targetDays) {
          setTimeout(() => {
            get().addMagnets(bonusReward, `达成月度目标: ${task.title}`, 'bonus');
            Taro.showModal({
              title: '🎉 太棒了！',
              content: `你坚持完成了 ${task.title} ${targetDays} 天！获得额外 ${bonusReward} 磁贴大奖！`,
              showCancel: false,
              confirmText: '继续加油'
            });
          }, 500);
        }

        // 触发打卡动画
        FeedbackService.showTaskComplete(taskId, false);
      },

      // 月度任务重置
      checkMonthlyReset: () => {
        const currentMonth = dayjs().format('YYYY-MM');
        const lastCheckInDate = get().user.lastCheckInDate;
        const lastMonth = lastCheckInDate ? dayjs(lastCheckInDate).format('YYYY-MM') : null;

        // 如果跨月了，重置月度任务进度
        if (lastMonth && lastMonth !== currentMonth) {
          set(state => ({
            tasks: state.tasks.map(t => {
              if (t.type === 'monthly') {
                return {
                  ...t,
                  monthlyProgress: 0,
                  history: [],
                  completed: false
                };
              }
              return t;
            })
          }));
        }
      },

      // Admin
      addTask: (task) => set(s => ({
        tasks: [...s.tasks, {
          id: Date.now().toString(),
          title: task.title || '新任务',
          icon: task.icon || '⭐',
          type: task.type || 'daily',
          magnetReward: task.magnetReward || 1,
          completed: false,
          lastCompletedDate: '',
          completedCount: 0,
          dailyLimit: task.dailyLimit || 1,
          // 月度任务特有字段
          ...(task.type === 'monthly' ? {
            monthlyProgress: 0,
            targetDays: task.targetDays || 20,
            bonusReward: task.bonusReward || 10,
            history: []
          } : {}),
          ...task
        }]
      })),
      updateTask: (id, updates) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      
      deleteTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
      
      reorderTasks: (taskIds) => {
        const state = get();
        const taskMap = new Map(state.tasks.map(t => [t.id, t]));
        const reorderedTasks = taskIds
          .map(id => taskMap.get(id))
          .filter((t): t is Task => t !== undefined);
        set({ tasks: reorderedTasks });
      },
      
      addReward: (title, icon, cost, description, type = 'goods') => set(s => ({
        rewards: [...s.rewards, { id: Date.now().toString(), title, icon, cost, description, category: 'small', type, currencyType: 'magnet' }]
      })),
      updateReward: (id, updates) => set(s => ({
        rewards: s.rewards.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      deleteReward: (id) => set(s => ({ rewards: s.rewards.filter(r => r.id !== id) })),
      
      reorderRewards: (rewardIds) => {
        const state = get();
        const rewardMap = new Map(state.rewards.map(r => [r.id, r]));
        const reorderedRewards = rewardIds
          .map(id => rewardMap.get(id))
          .filter((r): r is Reward => r !== undefined);
        set({ rewards: reorderedRewards });
      },
      
      deleteLog: (logId) => {
        const state = get();
        const log = state.logs.find(l => l.id === logId);
        
        if (!log) return;
        
        // 如果是获得磁贴的记录，需要扣除相应数量
        if (log.amount > 0 && ['earn', 'bonus', 'mood', 'magnet-moment'].includes(log.type)) {
          set(s => ({
            user: { ...s.user, magnets: Math.max(0, s.user.magnets - log.amount) },
            logs: s.logs.filter(l => l.id !== logId)
          }));
        } else if (log.amount < 0 && log.type === 'spend') {
          // 如果是消费记录，需要返还磁贴
          set(s => ({
            user: { ...s.user, magnets: s.user.magnets + Math.abs(log.amount) },
            logs: s.logs.filter(l => l.id !== logId)
          }));
        } else {
          // 其他情况只删除记录
          set(s => ({ logs: s.logs.filter(l => l.id !== logId) }));
        }
      },

      updateLog: (logId, updates) => {
        set(s => ({
          logs: s.logs.map(l => l.id === logId ? { ...l, ...updates } : l)
        }));
      },

      importConfig: (type, data) => {
        if (type === 'tasks') set({ tasks: data });
        if (type === 'rewards') set({ rewards: data });
        if (type === 'logs') set({ logs: data });
      }
    }),
    {
      name: 'magnet-storage',
      storage: createJSONStorage(() => ({
        getItem: (key) => Taro.getStorageSync(key),
        setItem: (key, value) => Taro.setStorageSync(key, value),
        removeItem: (key) => Taro.removeStorageSync(key),
      }))
    }
  )
)
