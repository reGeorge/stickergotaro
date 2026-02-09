
import { Component, inject, signal } from '@angular/core';
import { StoreService } from '../../services/store.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksComponent } from '../tasks/tasks.component';
import { LottieAnimationComponent } from '../ui/lottie-animation.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TasksComponent, FormsModule, LottieAnimationComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome Banner -->
      <div class="flex items-center justify-between px-2">
        <div>
          <h1 class="text-xl font-bold text-slate-800">你好, {{ store.user().name }}! 👋</h1>
          <p class="text-slate-500 text-xs mt-1">今天也要加油收集磁贴哦！</p>
        </div>
        <!-- Avatar -->
        <div class="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-2xl">
           🐻
        </div>
      </div>

      <!-- Merged Card: Total Magnets & Daily Progress (Updated Colors) -->
      <div class="bg-gradient-to-br from-pink-400 via-rose-400 to-purple-400 rounded-3xl p-6 text-white shadow-xl shadow-pink-200 relative overflow-hidden transform transition-all active:scale-[0.99]">
        <!-- Top Section: Magnets -->
        <div class="flex justify-between items-start mb-6 relative z-10">
             <div>
                <p class="text-pink-100 text-xs font-bold mb-1 uppercase tracking-wide">我的磁贴总数</p>
                <div class="text-6xl font-black flex items-center drop-shadow-sm tracking-tighter">
                   {{ store.user().magnets }} <span class="text-3xl ml-2 opacity-80">🌟</span>
                </div>
             </div>
             <!-- Trophy Icon -->
             <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-md shadow-inner border border-white/20">
                🏆
             </div>
        </div>

        <!-- Bottom Section: Daily Progress -->
        <div class="bg-black/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 relative z-10">
             <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-white/90">每日约定场景</span>
                <span class="text-xs font-bold text-pink-100">{{ store.todaysProgress().completed }} / {{ store.todaysProgress().total }}</span>
             </div>
             <!-- Custom Progress Bar -->
             <div class="h-3 bg-black/20 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-yellow-300 to-amber-400 shadow-[0_0_15px_rgba(253,224,71,0.5)] transition-all duration-500 ease-out" 
                     [style.width.%]="store.todaysProgress().percentage"></div>
             </div>
        </div>

        <!-- Decorative bg circles -->
        <div class="absolute -right-8 -top-8 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none mix-blend-overlay"></div>
        <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      <!-- Quick Actions Grid (Responsive) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 px-1">
        
        <!-- 1. Magnet Moment -->
        <button (click)="openMagnetMoment()" class="bg-white hover:bg-pink-50/50 p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col items-center justify-center space-y-2 active:scale-95 transition-all group h-28 sm:col-span-1">
           <div class="w-10 h-10 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
             📸
           </div>
           <span class="text-xs font-bold text-slate-600">磁贴时刻</span>
        </button>

        <!-- 2. Mood Converter -->
        <button (click)="openMoodModal()" class="bg-white hover:bg-purple-50/50 p-4 rounded-2xl shadow-sm border border-purple-100 flex flex-col items-center justify-center space-y-2 active:scale-95 transition-all group h-28 sm:col-span-1">
           <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
             🌈
           </div>
           <span class="text-xs font-bold text-slate-600">心情转换</span>
        </button>

      </div>

      <!-- Integrated Tasks Section -->
      <div class="px-1">
        <app-tasks />
      </div>

      <!-- ============ MODALS ============ -->

      <!-- 1. Magnet Moment Modal -->
      @if (showMagnetMomentModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="closeMagnetMoment()">
           <div class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-pop" (click)="$event.stopPropagation()">
              <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-bold text-slate-800 flex items-center">
                    <span class="mr-2">📸</span> 磁贴时刻
                  </h3>
                  <button (click)="closeMagnetMoment()" class="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div class="mb-4">
                <label class="block text-xs font-bold text-slate-500 mb-2">发生了什么美好的事情？</label>
                <textarea 
                  [ngModel]="magnetMomentDescription()"
                  (ngModelChange)="magnetMomentDescription.set($event)"
                  class="w-full bg-slate-50 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none h-24 placeholder-slate-400 border border-slate-100"
                  placeholder="例如：主动帮妈妈扫地..."
                ></textarea>
              </div>

              <div class="mb-6">
                <label class="block text-xs font-bold text-slate-500 mb-2">奖励磁贴数量</label>
                <div class="flex justify-between gap-2">
                  @for (num of [1,2,3,4,5]; track num) {
                    <button 
                      (click)="setMomentAmount(num)"
                      class="w-10 h-10 rounded-full font-bold transition-all text-sm flex items-center justify-center border-2"
                      [class.bg-pink-500]="magnetMomentAmount() === num"
                      [class.border-pink-500]="magnetMomentAmount() === num"
                      [class.text-white]="magnetMomentAmount() === num"
                      [class.bg-white]="magnetMomentAmount() !== num"
                      [class.border-slate-100]="magnetMomentAmount() !== num"
                      [class.text-slate-400]="magnetMomentAmount() !== num"
                      [class.scale-110]="magnetMomentAmount() === num"
                    >
                      {{ num }}
                    </button>
                  }
                </div>
              </div>
              
              <button 
                (click)="submitMagnetMoment()" 
                [disabled]="!magnetMomentDescription()"
                class="w-full py-3 rounded-xl bg-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-200 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                记录并获得奖励
              </button>
           </div>
        </div>
      }

      <!-- 2. Mood Converter Modal -->
      @if (showMoodModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="closeMoodModal()">
           <div class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-pop text-center" (click)="$event.stopPropagation()">
              
              @if (!moodSuccess()) {
                <h3 class="text-lg font-bold text-slate-800 mb-2 flex items-center justify-center">
                  <span class="mr-2">🌈</span> 心情转换器
                </h3>
                <p class="text-slate-400 text-xs mb-6">选择当前的小情绪，把它变成正能量！</p>

                <div class="grid grid-cols-3 gap-3 mb-6">
                  @for (mood of moods; track mood.label) {
                    <button 
                      (click)="convertMood(mood)"
                      class="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-purple-200 hover:bg-purple-50 transition-all active:scale-95"
                    >
                      <span class="text-4xl mb-2 filter drop-shadow-sm">{{ mood.icon }}</span>
                      <span class="text-xs font-bold text-slate-600">{{ mood.label }}</span>
                    </button>
                  }
                </div>
                
                <button (click)="closeMoodModal()" class="text-slate-400 text-sm underline">取消</button>
              } @else {
                <!-- Success State -->
                <div class="flex flex-col items-center py-2">
                  <div class="w-32 h-32 mb-2">
                    <app-lottie 
                      path="https://lottie.host/5ccfe317-5e60-4414-b49d-649033327663/zN1l2E4IqI.json"
                      [loop]="false"
                    />
                  </div>
                  <h4 class="text-xl font-bold text-purple-600 mb-1">太棒了！</h4>
                  <p class="text-slate-600 text-sm mb-4">你成功控制了情绪！</p>
                  <div class="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold shadow-sm mb-6">
                    +2 磁贴 🌟
                  </div>
                  <button (click)="closeMoodModal()" class="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-colors">
                    收下奖励
                  </button>
                </div>
              }
           </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class HomeComponent {
  store = inject(StoreService);
  
  // Magnet Moment State
  showMagnetMomentModal = signal(false);
  magnetMomentDescription = signal('');
  magnetMomentAmount = signal(1);

  // Mood Converter State
  showMoodModal = signal(false);
  moodSuccess = signal(false);
  moods = [
    { icon: '😤', label: '生气' },
    { icon: '😢', label: '难过' },
    { icon: '😫', label: '疲惫' },
  ];

  // --- Actions ---

  // Navigation
  goToMoments() {
    this.store.activeTab.set('moments');
  }

  // Magnet Moment Logic
  openMagnetMoment() {
    this.magnetMomentDescription.set('');
    this.magnetMomentAmount.set(1);
    this.showMagnetMomentModal.set(true);
  }

  closeMagnetMoment() {
    this.showMagnetMomentModal.set(false);
  }

  setMomentAmount(amount: number) {
    this.magnetMomentAmount.set(amount);
  }

  submitMagnetMoment() {
    if (!this.magnetMomentDescription()) return;

    this.store.addMagnets(
      this.magnetMomentAmount(), 
      `磁贴时刻: ${this.magnetMomentDescription()}`, 
      'magnet-moment'
    );
    this.closeMagnetMoment();
  }

  // Mood Logic
  openMoodModal() {
    this.moodSuccess.set(false);
    this.showMoodModal.set(true);
  }

  closeMoodModal() {
    this.showMoodModal.set(false);
  }

  convertMood(mood: any) {
    // Simulate processing delay for effect
    setTimeout(() => {
        this.store.addMagnets(2, `心情转换: 处理了 ${mood.label} 情绪`, 'mood');
        this.moodSuccess.set(true);
    }, 300);
  }
}
