
import { Component, inject, signal, computed } from '@angular/core';
import { StoreService, Reward } from '../../services/store.service';
import { CommonModule } from '@angular/common';
import { LottieAnimationComponent } from '../ui/lottie-animation.component';

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule, LottieAnimationComponent],
  template: `
    <div class="space-y-4 pb-24 relative">
      <!-- Balance Header -->
      <div class="sticky top-0 z-20 bg-[#eff6ff]/95 backdrop-blur-sm py-2 px-2 -mx-2 mb-2">
        <div class="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 rounded-full shadow-lg shadow-pink-100 p-2 flex items-center justify-between px-5 text-white">
          <span class="font-bold text-pink-50 text-sm">可用磁贴</span>
          <div class="flex items-center space-x-2">
            <span class="text-xl">🌟</span>
            <span class="text-2xl font-black text-white tracking-tight">{{ store.user().magnets }}</span>
          </div>
        </div>
      </div>

      <h2 class="text-lg font-bold text-slate-800 px-2 flex items-center">
        <span class="mr-2">🎁</span> 梦想兑换中心
      </h2>

      <!-- Reward Grid (Responsive) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-1">
        @for (reward of store.rewards(); track reward.id) {
          <div class="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-shadow">
            
            <!-- Category Badge -->
            @if (reward.category === 'dream') {
                <div class="absolute top-0 left-0 bg-gradient-to-br from-red-400 to-pink-500 text-white text-[10px] px-3 py-1 rounded-br-xl font-bold z-10 shadow-sm">大梦想</div>
            }

            <!-- Cost Tag -->
            <div class="absolute top-3 right-3 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center border border-yellow-100 shadow-sm">
              {{ reward.cost }} 🌟
            </div>

            <!-- Dream Progress Bar (Only for Big Dream) -->
            @if (reward.category === 'dream') {
                <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100">
                    <div class="h-full bg-gradient-to-r from-red-400 to-pink-500" [style.width.%]="Math.min(100, (store.user().magnets / reward.cost) * 100)"></div>
                </div>
            }

            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-3 mt-4 transform transition-transform group-hover:scale-110 duration-200">
              {{ reward.icon }}
            </div>
            
            <h3 class="font-bold text-slate-800 text-sm mb-1">{{ reward.title }}</h3>
            <p class="text-[10px] text-slate-400 mb-4 h-4 leading-tight overflow-hidden w-full px-1">{{ reward.description }}</p>

            <button 
              (click)="confirmExchange(reward)"
              [disabled]="store.user().magnets < reward.cost"
              class="w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              [class.bg-indigo-500]="store.user().magnets >= reward.cost"
              [class.text-white]="store.user().magnets >= reward.cost"
              [class.shadow-md]="store.user().magnets >= reward.cost"
              [class.shadow-indigo-200]="store.user().magnets >= reward.cost"
              [class.bg-slate-100]="store.user().magnets < reward.cost"
              [class.text-slate-400]="store.user().magnets < reward.cost"
            >
              @if (store.user().magnets >= reward.cost) {
                立即兑换
              } @else {
                还差 {{ reward.cost - store.user().magnets }} 个
              }
            </button>
          </div>
        }
      </div>

      <!-- Redeem History Preview -->
      <div class="mt-8 px-1">
        <h3 class="font-bold text-slate-600 text-sm mb-3 px-1 flex items-center">
            <span class="w-1 h-4 bg-indigo-500 rounded-full mr-2"></span>
            最近兑换
        </h3>
        <div class="bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-50">
           @if (recentRedemptions().length === 0) {
             <p class="text-center text-slate-400 text-xs py-4">还没有兑换过奖励，继续加油！</p>
           }
           @for (log of recentRedemptions(); track log.id) {
             <div class="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
               <span class="text-xs text-slate-600 truncate max-w-[70%] font-medium">{{ log.description }}</span>
               <span class="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-lg">{{ log.amount }}</span>
             </div>
           }
        </div>
      </div>
    
      <!-- Global Modal Overlay -->
      @if (selectedReward()) {
        <div class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" (click)="closeModal()">
          <div class="bg-white rounded-3xl w-full max-w-xs p-6 text-center shadow-2xl animate-pop" (click)="$event.stopPropagation()">
            
            @if (showSuccess()) {
                <!-- Success State -->
                <div class="flex flex-col items-center justify-center py-4">
                     <div class="w-32 h-32">
                        <app-lottie 
                            path="https://lottie.host/f7051410-d02f-4107-bd8b-87729938b82c/5P2M2I1I1I.json"
                            [loop]="false"
                        />
                     </div>
                     <h3 class="text-xl font-bold text-indigo-600 mt-2">兑换成功！</h3>
                     <p class="text-slate-500 text-sm mb-4">快去享受你的奖励吧！</p>
                     <button (click)="closeModal()" class="px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-bold w-full shadow-lg shadow-indigo-200 hover:bg-indigo-600">好的</button>
                </div>
            } 
            @else if (showMathGate()) {
                <!-- Math Verification State -->
                <h3 class="text-lg font-bold text-slate-800 mb-4">家长验证</h3>
                <p class="text-slate-400 text-xs mb-2">请家长帮忙计算，确认兑换</p>
                <div class="text-3xl font-mono font-bold mb-6 tracking-widest bg-slate-100 py-3 rounded-xl text-slate-700">
                    {{ mathProblem().q }} = ?
                </div>
                
                <div class="grid grid-cols-3 gap-3 mb-2">
                    @for (n of [1,2,3,4,5,6,7,8,9]; track n) {
                        <button (click)="checkAnswer(n)" class="bg-white p-3 rounded-xl font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-xl active:bg-indigo-100 shadow-sm border border-slate-200 transition-colors">{{n}}</button>
                    }
                    <div class="col-start-2">
                        <button (click)="checkAnswer(0)" class="w-full bg-white p-3 rounded-xl font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-xl active:bg-indigo-100 shadow-sm border border-slate-200 transition-colors">0</button>
                    </div>
                </div>
                <button (click)="showMathGate.set(false)" class="mt-4 text-sm text-slate-400 underline">返回</button>
            }
            @else {
                <!-- Confirmation State -->
                <div class="text-6xl mb-6 transform hover:scale-110 transition-transform duration-300 bg-indigo-50 w-24 h-24 mx-auto rounded-full flex items-center justify-center">{{ selectedReward()?.icon }}</div>
                <h3 class="text-lg font-bold text-slate-800 mb-2">确认兑换 {{ selectedReward()?.title }}?</h3>
                <p class="text-slate-500 text-sm mb-6">将消耗 <span class="text-yellow-500 font-bold text-lg mx-1">{{ selectedReward()?.cost }}</span> 个磁贴。</p>
                
                <div class="flex space-x-3">
                  <button (click)="selectedReward.set(null)" class="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 text-sm active:bg-slate-200 hover:bg-slate-200">再想想</button>
                  <button (click)="startVerification()" class="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-200 active:scale-95 transition-transform hover:bg-indigo-600">
                     确认兑换
                  </button>
                </div>
                
                <p class="text-[10px] text-orange-400 mt-4 bg-orange-50 inline-block px-3 py-1 rounded-full border border-orange-100">
                    🔒 需家长验证
                </p>
            }

          </div>
        </div>
      }
    </div>
  `
})
export class RewardsComponent {
  store = inject(StoreService);
  selectedReward = signal<Reward | null>(null);
  showSuccess = signal(false);
  showMathGate = signal(false);
  mathProblem = signal({ q: '', a: 0 });
  Math = Math;

  recentRedemptions = computed(() => {
    return this.store.logs().filter(l => l.type === 'spend').slice(0, 5);
  });

  confirmExchange(reward: Reward) {
    this.showSuccess.set(false);
    this.showMathGate.set(false);
    this.selectedReward.set(reward);
  }

  startVerification() {
    const a = Math.floor(Math.random() * 5); 
    const b = Math.floor(Math.random() * (10 - a)); 
    const safeA = a === 0 && b === 0 ? 1 : a;
    
    this.mathProblem.set({ q: `${safeA} + ${b}`, a: safeA + b });
    this.showMathGate.set(true);
  }

  checkAnswer(val: number) {
    if (val === this.mathProblem().a) {
        this.processRedemption();
    } else {
        const originalQ = this.mathProblem().q;
        this.mathProblem.set({ q: '❌', a: -1 });
        setTimeout(() => {
            const a = Math.floor(Math.random() * 5);
            const b = Math.floor(Math.random() * (10 - a));
            const safeA = a === 0 && b === 0 ? 1 : a;
            this.mathProblem.set({ q: `${safeA} + ${b}`, a: safeA + b });
        }, 500);
    }
  }

  processRedemption() {
    const reward = this.selectedReward();
    if (reward) {
        const success = this.store.spendMagnets(reward.cost, `兑换: ${reward.title}`);
        if (success) {
          this.showSuccess.set(true); 
        } else {
           this.selectedReward.set(null);
        }
    }
  }

  closeModal() {
    this.selectedReward.set(null);
    this.showSuccess.set(false);
    this.showMathGate.set(false);
  }
}
