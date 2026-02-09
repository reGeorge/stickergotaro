
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { SoundService } from './sound.service';

export interface Task {
  id: string;
  title: string;
  icon: string;
  magnetReward: number;
  completed: boolean; // Reset daily
  lastCompletedDate: string; // YYYY-MM-DD
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

export type Tab = 'home' | 'shop' | 'profile' | 'stats' | 'moments';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private soundService = inject(SoundService);
  
  // State
  private readonly STORAGE_KEY = 'magnet_challenge_v2_1';
  
  activeTab = signal<Tab>('home');

  user = signal<User>({
    name: '宝贝',
    magnets: 0,
    streak: 0,
    lastCheckInDate: '',
    totalTasksCompleted: 0,
    homeRuns: 0
  });

  // 五大约定场景
  tasks = signal<Task[]>([
    { id: '1', title: '吃饭香香', icon: '🍚', magnetReward: 1, completed: false, lastCompletedDate: '' },
    { id: '2', title: '洗刷刷达人', icon: '🛁', magnetReward: 1, completed: false, lastCompletedDate: '' },
    { id: '3', title: '玩具回新家', icon: '🧸', magnetReward: 1, completed: false, lastCompletedDate: '' },
    { id: '4', title: '上学不迟到', icon: '🎒', magnetReward: 1, completed: false, lastCompletedDate: '' },
    { id: '5', title: '准时梦游记', icon: '🌙', magnetReward: 1, completed: false, lastCompletedDate: '' },
  ]);

  rewards = signal<Reward[]>([
    { id: 'r1', title: '玩一会手机', icon: '📱', cost: 2, description: 'mini奖励 (15分钟)', category: 'mini' },
    { id: 'r2', title: '玩一会游戏', icon: '🎮', cost: 3, description: '小奖励 (30分钟)', category: 'small' },
    { id: 'r3', title: '美味零食', icon: '🍫', cost: 5, description: '小奖赏 (10元以内)', category: 'bonus' },
    { id: 'r4', title: '心仪玩具', icon: '🎁', cost: 10, description: '大梦想 (50元以内)', category: 'dream' },
  ]);

  logs = signal<Log[]>([]);

  // Computed
  todaysProgress = computed(() => {
    const tasks = this.tasks();
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    return { completed, total, percentage: total === 0 ? 0 : (completed / total) * 100 };
  });

  constructor() {
    this.loadData();
    this.checkDailyReset();

    // Auto-save effect
    effect(() => {
      const data = {
        user: this.user(),
        tasks: this.tasks(),
        rewards: this.rewards(),
        logs: this.logs()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    });
  }

  private loadData() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.user) this.user.set(parsed.user);
        if (parsed.tasks) this.tasks.set(parsed.tasks);
        if (parsed.rewards) this.rewards.set(parsed.rewards);
        if (parsed.logs) this.logs.set(parsed.logs);
      } catch (e) {
        console.error('Failed to load data', e);
      }
    }
  }

  private checkDailyReset() {
    const today = new Date().toISOString().split('T')[0];
    
    this.tasks.update(tasks => tasks.map(t => {
      if (t.lastCompletedDate !== today) {
        return { ...t, completed: false };
      }
      return t;
    }));
  }

  // Actions
  toggleTask(taskId: string) {
    const today = new Date().toISOString().split('T')[0];
    let justCompleted = false;
    let taskReward = 0;
    let taskTitle = '';

    this.tasks.update(tasks => tasks.map(t => {
      if (t.id === taskId) {
        if (!t.completed) {
          justCompleted = true;
          taskReward = t.magnetReward;
          taskTitle = t.title;
          return { ...t, completed: true, lastCompletedDate: today };
        }
      }
      return t;
    }));

    if (justCompleted) {
      this.addMagnets(taskReward, `完成约定: ${taskTitle}`, 'earn');
      this.updateStreak(today);
      this.checkHomeRun(today);
      this.triggerVibration();
    }
  }

  private checkHomeRun(today: string) {
    const allCompleted = this.tasks().every(t => t.completed);
    // Use a flag in logs to check if bonus already given today to avoid double bonus if logic changes
    const alreadyBonus = this.logs().some(l => l.type === 'bonus' && new Date(l.timestamp).toISOString().split('T')[0] === today);

    if (allCompleted && !alreadyBonus) {
      this.addMagnets(5, '全垒打！今日五项全能达成！', 'bonus');
      this.user.update(u => ({ ...u, homeRuns: u.homeRuns + 1 }));
    }
  }

  private updateStreak(today: string) {
    this.user.update(u => {
      if (u.lastCheckInDate === today) return u;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = u.streak;
      if (u.lastCheckInDate === yesterdayStr) {
        newStreak++;
      } else {
        newStreak = 1; // Reset or Start new
      }

      return {
        ...u,
        lastCheckInDate: today,
        streak: newStreak,
        totalTasksCompleted: u.totalTasksCompleted + 1
      };
    });
  }

  addMagnets(amount: number, description: string, type: Log['type']) {
    this.user.update(u => ({ ...u, magnets: u.magnets + amount }));
    this.logs.update(logs => [{
      id: Date.now().toString(),
      type,
      amount,
      description,
      timestamp: Date.now()
    }, ...logs]);

    // Play sound based on type
    if (type === 'bonus') {
      this.soundService.playFanfare();
    } else if (type === 'mood') {
      this.soundService.playChime();
    } else if (type === 'earn' || type === 'magnet-moment') {
      this.soundService.playEarn();
    }
  }

  spendMagnets(amount: number, description: string): boolean {
    if (this.user().magnets < amount) return false;

    this.user.update(u => ({ ...u, magnets: u.magnets - amount }));
    this.logs.update(logs => [{
      id: Date.now().toString(),
      type: 'spend',
      amount: -amount,
      description,
      timestamp: Date.now()
    }, ...logs]);
    
    this.triggerVibration();
    this.soundService.playSpend();
    
    return true;
  }

  private triggerVibration() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  // Admin Actions
  addTask(title: string, icon: string, reward: number) {
    this.tasks.update(prev => [...prev, {
      id: Date.now().toString(),
      title,
      icon,
      magnetReward: reward,
      completed: false,
      lastCompletedDate: ''
    }]);
  }

  updateTask(id: string, updates: Partial<Task>) {
    this.tasks.update(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }

  deleteTask(id: string) {
    this.tasks.update(prev => prev.filter(t => t.id !== id));
  }

  addReward(title: string, icon: string, cost: number, description: string, category: Reward['category'] = 'small') {
    this.rewards.update(prev => [...prev, {
      id: Date.now().toString(),
      title,
      icon,
      cost,
      description,
      category
    }]);
  }

  updateReward(id: string, updates: Partial<Reward>) {
    this.rewards.update(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }

  deleteReward(id: string) {
    this.rewards.update(prev => prev.filter(r => r.id !== id));
  }
}
