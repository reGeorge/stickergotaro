import { Component, inject, effect, signal } from '@angular/core';
import { StoreService, Task } from '../../services/store.service';
import { CommonModule } from '@angular/common';
import { LottieAnimationComponent } from '../ui/lottie-animation.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, LottieAnimationComponent],
  template: `
    <div class="space-y-4 pb-24 relative">
      <!-- Task Grid (Responsive: 1 col mobile, 2 col tablet, 3 col desktop) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        @for (task of store.tasks(); track task.id) {
          <button 
            (click)="onTaskClick(task)"
            [class.opacity-70]="task.completed"
            [disabled]="task.completed"
            class="relative overflow-hidden bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 transition-all text-left flex items-center group hover:shadow-md hover:border-indigo-100 active:scale-[0.98]"
          >
             <!-- Completed Overlay -->
             @if (task.completed) {
                <div class="absolute inset-0 bg-emerald-50/70 flex items-center justify-end pr-6 z-10 backdrop-blur-[1px]">
                    <span class="text-emerald-600 font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm border border-emerald-100 flex items-center">
                        <span class="mr-1">✓</span> 完成
                    </span>
                </div>
             }

            <div class="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-2xl mr-4 group-hover:bg-indigo-100 transition-colors shrink-0">
              {{ task.icon }}
            </div>
            
            <div class="flex-1 z-0 min-w-0">
              <h3 class="font-bold text-slate-800 text-sm truncate">{{ task.title }}</h3>
              <p class="text-xs text-indigo-500 font-bold mt-0.5 inline-block bg-indigo-50 px-2 py-0.5 rounded-lg">+{{ task.magnetReward }} 磁贴</p>
            </div>

            <div class="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center ml-2 z-0 shrink-0 bg-slate-50">
              @if (task.completed) {
                <div class="w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-sm"></div>
              }
            </div>
          </button>
        }
      </div>

      @if (store.todaysProgress().completed === store.todaysProgress().total && store.todaysProgress().total > 0) {
        <div class="bg-gradient-to-r from-yellow-100 to-amber-100 border border-amber-200 p-4 rounded-2xl text-center animate-bounce-small shadow-sm max-w-lg mx-auto">
            <span class="text-4xl block mb-2">🎉</span>
            <h3 class="font-bold text-amber-800 text-base">全垒打达成!</h3>
            <p class="text-amber-700 text-xs">太棒了！睡前额外奖励 +5 磁贴！</p>
        </div>
      }
      
      <!-- Home Run Celebration Overlay -->
      @if (showCelebration()) {
        <div class="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
           <app-lottie 
             path="https://lottie.host/4a6190be-d249-4113-a720-6395b4321703/D8X3M5F5tP.json" 
             width="100%" 
             height="100%" 
           />
        </div>
      }

      <!-- Task Confirmation Modal -->
      @if (taskToConfirm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="cancelConfirm()">
           <div class="bg-white rounded-3xl w-full max-w-xs p-6 text-center shadow-2xl animate-pop" (click)="$event.stopPropagation()">
              <div class="text-6xl mb-4 transform hover:scale-110 transition-transform bg-indigo-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center">{{ taskToConfirm()?.icon }}</div>
              <h3 class="text-lg font-bold text-slate-800 mb-2">确认完成 "{{ taskToConfirm()?.title }}"?</h3>
              <p class="text-slate-500 text-sm mb-6">完成后获得 <span class="font-bold text-indigo-500">{{ taskToConfirm()?.magnetReward }}</span> 个磁贴！</p>
              
              <div class="flex space-x-3">
                <button (click)="cancelConfirm()" class="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 text-sm active:bg-slate-200 hover:bg-slate-200 transition-colors">
                  取消
                </button>
                <button (click)="confirmTask()" class="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-200 active:scale-95 transition-transform hover:bg-indigo-600">
                  确认完成
                </button>
              </div>
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
export class TasksComponent {
  store = inject(StoreService);
  showCelebration = signal(false);
  taskToConfirm = signal<Task | null>(null);

  constructor() {
    effect(() => {
      // Trigger celebration when 100% complete
      const progress = this.store.todaysProgress();
      if (progress.total > 0 && progress.completed === progress.total) {
        this.showCelebration.set(true);
        setTimeout(() => this.showCelebration.set(false), 3000);
      }
    });
  }

  onTaskClick(task: Task) {
    this.taskToConfirm.set(task);
  }

  confirmTask() {
    const task = this.taskToConfirm();
    if (task) {
        this.store.toggleTask(task.id);
        this.taskToConfirm.set(null);
    }
  }

  cancelConfirm() {
    this.taskToConfirm.set(null);
  }
}