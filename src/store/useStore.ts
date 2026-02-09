
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import dayjs from 'dayjs'
import { soundService } from '../utils/sound'

// --- Interfaces (复用原项目) ---
export interface Task {
  id: string;
  title: string;
  icon: string;
  magnetReward: number;
  completed: boolean;
  lastCompletedDate: string;
}

export interface Reward {
  id: string;
  title: string;
  icon: string;
  cost: number;
  description: string;
  category: 'mini' | 'small' | 'bonus' | 'dream';
}

export interface Log {
  id: string;
  type: 'earn' | 'spend' | 'bonus' | 'mood' | 'penalty' | 'magnet-moment';
  amount: number;
  description: string;
  timestamp: number;
}

export interface User {
  name: string;
  magnets: number;
  streak: number;
  lastCheckInDate: string;
  totalTasksCompleted: number;
  homeRuns: number;
}

interface StoreState {
  user: User;
  tasks: Task[];
  rewards: Reward[];
  logs: Log[];
  
  // Actions
  addMagnets: (amount: number, description: string, type: Log['type']) => void;
  spendMagnets: (amount: number, description: string) => boolean;
  toggleTask: (taskId: string) => void;
  checkDailyReset: () => void;
  
  // Admin Actions
  addTask: (title: string, icon: string, reward: number) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addReward: (title: string, icon: string, cost: number, desc: string) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  
  // Import
  importConfig: (type: 'tasks' | 'rewards', data: any[]) => void;
}

// --- Initial Data ---
const initialUser: User = {
  name: '宝贝',
  magnets: 0,
  streak: 0,
  lastCheckInDate: '',
  totalTasksCompleted: 0,
  homeRuns: 0
};

const initialTasks: Task[] = [
  { id: '1', title: '吃饭香香', icon: '🍚', magnetReward: 1, completed: false, lastCompletedDate: '' },
  { id: '2', title: '洗刷刷达人', icon: '🛁', magnetReward: 1, completed: false, lastCompletedDate: '' },
  { id: '3', title: '玩具回新家', icon: '🧸', magnetReward: 1, completed: false, lastCompletedDate: '' },
  { id: '4', title: '上学不迟到', icon: '🎒', magnetReward: 1, completed: false, lastCompletedDate: '' },
  { id: '5', title: '准时梦游记', icon: '🌙', magnetReward: 1, completed: false, lastCompletedDate: '' },
];

const initialRewards: Reward[] = [
  { id: 'r1', title: '玩一会手机', icon: '📱', cost: 2, description: 'mini奖励 (15分钟)', category: 'mini' },
  { id: 'r2', title: '玩一会游戏', icon: '🎮', cost: 3, description: '小奖励 (30分钟)', category: 'small' },
  { id: 'r3', title: '美味零食', icon: '🍫', cost: 5, description: '小奖赏 (10元以内)', category: 'bonus' },
  { id: 'r4', title: '心仪玩具', icon: '🎁', cost: 10, description: '大梦想 (50元以内)', category: 'dream' },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: initialUser,
      tasks: initialTasks,
      rewards: initialRewards,
      logs: [],

      addMagnets: (amount, description, type) => {
        set(state => ({
          user: { ...state.user, magnets: state.user.magnets + amount },
          logs: [{
            id: Date.now().toString(),
            type,
            amount,
            description,
            timestamp: Date.now()
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
        soundService.playSpend();
        return true;
      },

      toggleTask: (taskId) => {
        const today = dayjs().format('YYYY-MM-DD');
        const state = get();
        const task = state.tasks.find(t => t.id === taskId);

        if (task && !task.completed) {
          // 1. Mark as complete
          set(s => ({
            tasks: s.tasks.map(t => t.id === taskId ? { ...t, completed: true, lastCompletedDate: today } : t)
          }));
          
          // 2. Add Reward
          get().addMagnets(task.magnetReward, `完成约定: ${task.title}`, 'earn');
          Taro.vibrateShort({ type: 'light' });

          // 3. Update Streak Logic
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

          // 4. Check Home Run
          const currentTasks = get().tasks;
          const allCompleted = currentTasks.every(t => t.completed);
          // Check if bonus already given today
          const alreadyBonus = get().logs.some(l => 
             l.type === 'bonus' && dayjs(l.timestamp).format('YYYY-MM-DD') === today
          );

          if (allCompleted && !alreadyBonus) {
             get().addMagnets(5, '全垒打！今日五项全能达成！', 'bonus');
             set(s => ({ user: { ...s.user, homeRuns: s.user.homeRuns + 1 } }));
          }
        }
      },

      checkDailyReset: () => {
        const today = dayjs().format('YYYY-MM-DD');
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.lastCompletedDate !== today) {
              return { ...t, completed: false };
            }
            return t;
          })
        }));
      },

      // Admin
      addTask: (title, icon, reward) => set(s => ({
        tasks: [...s.tasks, { id: Date.now().toString(), title, icon, magnetReward: reward, completed: false, lastCompletedDate: '' }]
      })),
      updateTask: (id, updates) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      deleteTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
      
      addReward: (title, icon, cost, description) => set(s => ({
        rewards: [...s.rewards, { id: Date.now().toString(), title, icon, cost, description, category: 'small' }]
      })),
      updateReward: (id, updates) => set(s => ({
        rewards: s.rewards.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      deleteReward: (id) => set(s => ({ rewards: s.rewards.filter(r => r.id !== id) })),

      importConfig: (type, data) => {
        if (type === 'tasks') set({ tasks: data });
        if (type === 'rewards') set({ rewards: data });
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
