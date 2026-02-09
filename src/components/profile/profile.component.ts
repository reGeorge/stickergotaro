
import { Component, inject, signal } from '@angular/core';
import { StoreService, Reward, Task } from '../../services/store.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4 pb-24">
      <!-- Profile Header (Hidden when managing) -->
      <div [class.hidden]="activeView() !== 'main'">
        <div class="bg-white p-6 rounded-3xl shadow-sm text-center mb-4 border border-slate-50">
          <div class="w-24 h-24 bg-pink-50 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-inner text-5xl">
             🐻
          </div>
          <h2 class="text-xl font-bold text-slate-800">{{ store.user().name }}</h2>
          <p class="text-slate-400 text-xs mt-1">加入时间: {{ joinDate | date:'yyyy-MM-dd' }}</p>
        </div>

        <!-- Stats Grid (Responsive) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div class="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center hover:bg-orange-100 transition-colors">
            <div class="text-2xl mb-1">🔥</div>
            <div class="text-xl font-bold text-orange-600">{{ store.user().streak }}</div>
            <div class="text-[10px] text-orange-400 font-bold mt-1">连续打卡</div>
          </div>
          <div class="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-center hover:bg-purple-100 transition-colors">
            <div class="text-2xl mb-1">⚾</div>
            <div class="text-xl font-bold text-purple-600">{{ store.user().homeRuns }}</div>
            <div class="text-[10px] text-purple-400 font-bold mt-1">全垒打</div>
          </div>
        </div>

        <!-- Menu -->
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden mb-8 border border-slate-50">
          <button (click)="initiateManage('tasks')" class="w-full flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-50 active:bg-slate-100 transition-colors group">
            <div class="flex items-center space-x-3">
              <span class="bg-blue-50 w-10 h-10 flex items-center justify-center rounded-xl text-blue-600 text-lg group-hover:scale-110 transition-transform">📝</span>
              <span class="font-bold text-slate-700 text-sm">任务管理</span>
            </div>
            <div class="flex items-center">
              <span class="text-[10px] text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full mr-2 font-bold">家长</span>
              <span class="text-slate-300">›</span>
            </div>
          </button>
          
          <button (click)="initiateManage('rewards')" class="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group">
            <div class="flex items-center space-x-3">
              <span class="bg-pink-50 w-10 h-10 flex items-center justify-center rounded-xl text-pink-600 text-lg group-hover:scale-110 transition-transform">🎁</span>
              <span class="font-bold text-slate-700 text-sm">兑换管理</span>
            </div>
            <div class="flex items-center">
              <span class="text-[10px] text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full mr-2 font-bold">家长</span>
              <span class="text-slate-300">›</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Task Management Overlay -->
    @if (activeView() === 'manage-tasks') {
       <div class="fixed inset-0 z-40 bg-[#f7f8fa] flex flex-col animate-slide-up pb-safe">
          <!-- Header -->
          <div class="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
             <div class="flex items-center gap-1">
                <button (click)="closeManage()" class="bg-slate-100 text-slate-500 w-8 h-8 flex items-center justify-center rounded-full mr-1">✕</button>
                <span class="font-bold text-lg text-slate-800">任务管理</span>
             </div>
             <div class="flex gap-2">
                <button (click)="openImportModal('tasks')" class="text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs font-bold active:bg-slate-100">导入</button>
                <button (click)="exportConfig('tasks')" class="text-blue-500 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-bold active:bg-blue-100">导出配置</button>
             </div>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4 space-y-6 pb-20 max-w-2xl mx-auto w-full">
             <!-- Add/Edit Task -->
             <div class="bg-white p-5 rounded-3xl shadow-sm border border-blue-50">
                <h3 class="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex justify-between">
                   {{ editingTaskId ? '编辑任务' : '添加新任务' }}
                   @if (editingTaskId) {
                      <button (click)="cancelEditTask()" class="text-blue-500 font-normal normal-case">取消编辑</button>
                   }
                </h3>
                
                <div class="flex gap-3 mb-4">
                   <div class="w-14 h-14 flex items-center justify-center bg-slate-50 rounded-2xl text-3xl relative border border-slate-100 overflow-hidden">
                      {{ newTask.icon }}
                      <input type="text" [(ngModel)]="newTask.icon" class="absolute inset-0 opacity-0 text-center w-full h-full cursor-pointer">
                      <div class="absolute bottom-0 left-0 right-0 bg-black/5 text-[8px] text-center text-slate-500">点我换图</div>
                   </div>
                   <div class="flex-1">
                       <input type="text" [(ngModel)]="newTask.title" placeholder="输入任务名称 (如: 练钢琴)" class="w-full bg-slate-50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-blue-100 h-full border border-slate-100 transition-all placeholder-slate-400 text-slate-900 font-medium">
                   </div>
                </div>

                <div class="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                   <span class="text-xs font-bold text-slate-500 ml-1">奖励磁贴:</span>
                   <div class="flex gap-1.5">
                      @for(n of [1,2,3,4,5]; track n) {
                         <button (click)="newTask.reward = n" 
                            [class]="newTask.reward === n ? 'bg-blue-500 text-white shadow-md shadow-blue-200 scale-110' : 'bg-white text-slate-400 border border-slate-100'"
                            class="w-8 h-8 rounded-full text-xs font-bold transition-all">
                            {{n}}
                         </button>
                      }
                   </div>
                </div>
                
                <button (click)="submitTask()" [disabled]="!newTask.title" class="w-full mt-4 bg-blue-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none">
                    {{ editingTaskId ? '保存修改' : '确认添加' }}
                </button>
             </div>
             
             <!-- Existing Tasks List -->
             <div>
                <h3 class="text-xs font-bold text-slate-400 mb-3 px-2 uppercase tracking-wider">现有任务 ({{ store.tasks().length }})</h3>
                <p class="text-[10px] text-slate-400 px-2 mb-2">点击任务进行编辑</p>
                <div class="space-y-3">
                    @for (task of store.tasks(); track task.id) {
                    <div 
                        (click)="editTask(task)"
                        [class.ring-2]="editingTaskId === task.id"
                        [class.ring-blue-200]="editingTaskId === task.id"
                        class="bg-white p-3 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-xl">
                                {{task.icon}}
                            </div>
                            <div>
                                <div class="font-bold text-slate-800 text-sm">{{task.title}}</div>
                                <div class="text-[10px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">+{{task.magnetReward}} 磁贴</div>
                            </div>
                        </div>
                        <button (click)="deleteTask($event, task.id)" class="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-full transition-colors active:bg-red-100 z-10">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                    }
                </div>
             </div>
          </div>
       </div>
    }

    <!-- Reward Management Overlay -->
    @if (activeView() === 'manage-rewards') {
       <div class="fixed inset-0 z-40 bg-[#f7f8fa] flex flex-col animate-slide-up pb-safe">
          <!-- Header -->
          <div class="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
             <div class="flex items-center gap-1">
                <button (click)="closeManage()" class="bg-slate-100 text-slate-500 w-8 h-8 flex items-center justify-center rounded-full mr-1">✕</button>
                <span class="font-bold text-lg text-slate-800">兑换管理</span>
             </div>
             <div class="flex gap-2">
                <button (click)="openImportModal('rewards')" class="text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs font-bold active:bg-slate-100">导入</button>
                <button (click)="exportConfig('rewards')" class="text-pink-500 bg-pink-50 border border-pink-100 px-3 py-1.5 rounded-full text-xs font-bold active:bg-pink-100">导出配置</button>
             </div>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4 space-y-6 pb-20 max-w-2xl mx-auto w-full">
             <!-- Add/Edit Reward -->
             <div class="bg-white p-5 rounded-3xl shadow-sm border border-pink-50">
                <h3 class="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex justify-between">
                    {{ editingRewardId ? '编辑奖励' : '添加新奖励' }}
                    @if (editingRewardId) {
                        <button (click)="cancelEditReward()" class="text-pink-500 font-normal normal-case">取消编辑</button>
                    }
                </h3>
                
                <div class="flex gap-3 mb-4">
                   <div class="w-14 h-14 flex items-center justify-center bg-slate-50 rounded-2xl text-3xl relative border border-slate-100 overflow-hidden">
                      {{ newReward.icon }}
                      <input type="text" [(ngModel)]="newReward.icon" class="absolute inset-0 opacity-0 text-center w-full h-full cursor-pointer">
                      <div class="absolute bottom-0 left-0 right-0 bg-black/5 text-[8px] text-center text-slate-500">点我换图</div>
                   </div>
                   <div class="flex-1 space-y-2">
                       <input type="text" [(ngModel)]="newReward.title" placeholder="奖品名称 (如: 看电视)" class="w-full bg-slate-50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-pink-100 border border-slate-100 text-slate-900 font-medium">
                   </div>
                </div>

                <div class="flex items-center gap-2 mb-4">
                    <span class="text-xs font-bold text-slate-500 whitespace-nowrap">消耗磁贴:</span>
                    <input type="number" [(ngModel)]="newReward.cost" class="w-20 bg-slate-50 rounded-xl px-3 py-2 text-sm text-center font-bold text-slate-800 outline-none focus:ring-2 ring-pink-100 border border-slate-100 text-slate-900">
                    <span class="text-xs text-slate-400">个</span>
                </div>
                
                <button (click)="submitReward()" [disabled]="!newReward.title" class="w-full bg-pink-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-pink-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none">
                    {{ editingRewardId ? '保存修改' : '确认添加' }}
                </button>
             </div>
             
             <!-- Existing Rewards List -->
             <div>
                <h3 class="text-xs font-bold text-slate-400 mb-3 px-2 uppercase tracking-wider">现有奖励 ({{ store.rewards().length }})</h3>
                <p class="text-[10px] text-slate-400 px-2 mb-2">点击奖励进行编辑</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @for (reward of store.rewards(); track reward.id) {
                    <div 
                        (click)="editReward(reward)"
                        [class.ring-2]="editingRewardId === reward.id"
                        [class.ring-pink-200]="editingRewardId === reward.id"
                        class="bg-white p-3 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <div class="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-xl shrink-0">
                                {{reward.icon}}
                            </div>
                            <div class="min-w-0">
                                <div class="font-bold text-slate-800 text-sm truncate">{{reward.title}}</div>
                                <div class="text-[10px] text-pink-500 font-bold bg-pink-50 px-1.5 py-0.5 rounded mt-0.5 inline-block border border-pink-100">{{reward.cost}} 磁贴</div>
                            </div>
                        </div>
                        <button (click)="deleteReward($event, reward.id)" class="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-full transition-colors active:bg-red-100 shrink-0 z-10">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                    }
                </div>
             </div>
          </div>
       </div>
    }

    <!-- Math Gate Modal -->
    @if (showGate) {
      <div class="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-3xl w-full max-w-xs p-6 text-center shadow-2xl animate-pop">
          <h3 class="text-lg font-bold text-slate-800 mb-4">家长验证</h3>
          <p class="text-slate-400 text-xs mb-2">管理功能需家长解锁</p>
          <p class="text-3xl font-mono font-bold mb-6 tracking-widest bg-slate-50 py-3 rounded-xl text-slate-700 border border-slate-100">{{ mathProblem.q }} = ?</p>
          
          <div class="grid grid-cols-3 gap-2 mb-4">
             @for (n of [1,2,3,4,5,6,7,8,9]; track n) {
                <button (click)="checkAnswer(n)" class="bg-white border-b-4 border-slate-100 active:border-b-0 active:translate-y-[4px] p-3 rounded-xl font-bold text-slate-700 text-xl transition-all shadow-sm">{{n}}</button>
             }
             <div class="col-start-2">
                <button (click)="checkAnswer(0)" class="w-full bg-white border-b-4 border-slate-100 active:border-b-0 active:translate-y-[4px] p-3 rounded-xl font-bold text-slate-700 text-xl transition-all shadow-sm">0</button>
             </div>
          </div>
          <button (click)="closeManage()" class="mt-4 text-slate-400 text-sm underline">取消</button>
        </div>
      </div>
    }

    <!-- NEW: Import Modal (Replaces standard prompt) -->
    @if (showImportModalState()) {
       <div class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
         <div class="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-pop">
           <h3 class="text-lg font-bold text-slate-800 mb-2">
             导入{{ importTarget() === 'tasks' ? '任务' : '奖励' }}配置
           </h3>
           <p class="text-slate-400 text-xs mb-4">请将之前导出的配置文本粘贴到下方：</p>
           
           <textarea 
             [(ngModel)]="importContent"
             class="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none mb-4"
             placeholder='[{"id":"...", "title":"..."}]'
           ></textarea>

           <div class="flex gap-3">
             <button (click)="closeImportModal()" class="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600 text-sm hover:bg-slate-200">取消</button>
             <button (click)="confirmImport()" [disabled]="!importContent()" class="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 hover:bg-indigo-600">确认导入</button>
           </div>
         </div>
       </div>
    }

    <!-- NEW: Toast Notification -->
    @if (notification()) {
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-bounce-small">
            <span>{{ notification() }}</span>
        </div>
    }
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-bounce-small { animation: bounce 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes bounce { 0% { transform: translate(-50%, -20px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
    .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
  `]
})
export class ProfileComponent {
  store = inject(StoreService);
  
  // Views
  activeView = signal<'main' | 'manage-tasks' | 'manage-rewards'>('main');
  targetView: 'manage-tasks' | 'manage-rewards' | null = null;
  
  // Gate
  showGate = false;
  mathProblem = { q: '', a: 0 };
  
  // Data
  joinDate = Date.now();
  
  // Editing State
  editingTaskId: string | null = null;
  editingRewardId: string | null = null;

  // New Item Forms
  newTask = { title: '', icon: '✨', reward: 1 };
  newReward = { title: '', icon: '🎁', cost: 2 }; // Default cost changed to 2

  // NEW: UI States for Import/Export
  showImportModalState = signal(false);
  importTarget = signal<'tasks' | 'rewards' | null>(null);
  importContent = signal('');
  notification = signal<string | null>(null);

  initiateManage(view: 'tasks' | 'rewards') {
    this.targetView = `manage-${view}`;
    // Ensure sum <= 9
    const a = Math.floor(Math.random() * 5); // 0-4
    const b = Math.floor(Math.random() * (10 - a)); // Ensures a+b <= 9
    const safeA = (a === 0 && b === 0) ? 1 : a; // Avoid 0+0
    
    this.mathProblem = { q: `${safeA} + ${b}`, a: safeA + b };
    this.showGate = true;
  }

  checkAnswer(val: number) {
    if (val === this.mathProblem.a && this.targetView) {
      this.activeView.set(this.targetView);
      this.showGate = false;
      this.targetView = null;
    } else {
      // Wrong answer visual feedback could go here
      this.closeManage(); // Or just close
    }
  }

  closeManage() {
    this.showGate = false;
    this.activeView.set('main');
    this.targetView = null;
    this.cancelEditTask();
    this.cancelEditReward();
  }

  // --- Utility: Show Toast ---
  showToast(message: string) {
      this.notification.set(message);
      setTimeout(() => {
          this.notification.set(null);
      }, 3000);
  }

  // --- Import / Export Logic (Upgraded) ---

  async exportConfig(type: 'tasks' | 'rewards') {
    const data = type === 'tasks' ? this.store.tasks() : this.store.rewards();
    try {
        await navigator.clipboard.writeText(JSON.stringify(data));
        this.showToast(type === 'tasks' ? '任务配置已复制 ✅' : '奖励配置已复制 ✅');
    } catch (err) {
        this.showToast('复制失败，请重试 ❌');
    }
  }

  // Open the custom modal
  openImportModal(type: 'tasks' | 'rewards') {
      this.importTarget.set(type);
      this.importContent.set('');
      this.showImportModalState.set(true);
  }

  closeImportModal() {
      this.showImportModalState.set(false);
      this.importTarget.set(null);
  }

  confirmImport() {
    const text = this.importContent();
    const type = this.importTarget();

    if (!text || !type) return;

    try {
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
             // Basic validation: check if first item has required fields
             if (type === 'tasks' && data[0].title && data[0].icon) {
                 this.store.tasks.set(data);
                 this.showToast('任务配置导入成功！✅');
                 this.closeImportModal();
             } else if (type === 'rewards' && data[0].title && data[0].cost) {
                 this.store.rewards.set(data);
                 this.showToast('奖励配置导入成功！✅');
                 this.closeImportModal();
             } else {
                 this.showToast('配置格式不正确 ❌');
             }
        } else {
             this.showToast('无效的配置数据 ❌');
        }
    } catch (err) {
        this.showToast('JSON 解析失败 ❌');
    }
  }

  // --- Task Logic ---

  editTask(task: Task) {
    this.editingTaskId = task.id;
    this.newTask = {
        title: task.title,
        icon: task.icon,
        reward: task.magnetReward
    };
  }

  cancelEditTask() {
    this.editingTaskId = null;
    this.newTask = { title: '', icon: '✨', reward: 1 };
  }

  submitTask() {
    if (!this.newTask.title) return;
    
    if (this.editingTaskId) {
        this.store.updateTask(this.editingTaskId, {
            title: this.newTask.title,
            icon: this.newTask.icon,
            magnetReward: this.newTask.reward
        });
        this.cancelEditTask();
    } else {
        this.store.addTask(this.newTask.title, this.newTask.icon, this.newTask.reward);
        this.newTask = { title: '', icon: '✨', reward: 1 }; // Reset
    }
  }

  deleteTask(e: Event, id: string) {
    e.stopPropagation();
    if (this.editingTaskId === id) this.cancelEditTask();
    this.store.deleteTask(id);
  }

  // --- Reward Logic ---

  editReward(reward: Reward) {
    this.editingRewardId = reward.id;
    this.newReward = {
        title: reward.title,
        icon: reward.icon,
        cost: reward.cost
    };
  }

  cancelEditReward() {
    this.editingRewardId = null;
    this.newReward = { title: '', icon: '🎁', cost: 2 }; // Reset default cost to 2
  }

  submitReward() {
     if (!this.newReward.title) return;
     
     if (this.editingRewardId) {
         this.store.updateReward(this.editingRewardId, {
             title: this.newReward.title,
             icon: this.newReward.icon,
             cost: this.newReward.cost
         });
         this.cancelEditReward();
     } else {
         this.store.addReward(
             this.newReward.title, 
             this.newReward.icon, 
             this.newReward.cost, 
             '自定义奖励', 
             'small'
         );
         this.newReward = { title: '', icon: '🎁', cost: 2 }; // Reset
     }
  }

  deleteReward(e: Event, id: string) {
    e.stopPropagation();
    if (this.editingRewardId === id) this.cancelEditReward();
    this.store.deleteReward(id);
  }
}
