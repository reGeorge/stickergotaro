import { Component, inject, signal } from '@angular/core';
import { StoreService } from '../../services/store.service';
import { CommonModule } from '@angular/common';
import { LottieAnimationComponent } from '../ui/lottie-animation.component';

@Component({
  selector: 'app-mood-converter',
  standalone: true,
  imports: [CommonModule, LottieAnimationComponent],
  template: `
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-6 transform transition-all hover:scale-[1.01]">
      <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span class="text-2xl mr-2">🌈</span> 心情转换器
      </h3>
      
      @if (!showSuccess()) {
        <p class="text-gray-600 text-xs mb-6">把坏心情变成好心情，还能赢磁贴！</p>
        
        <div class="grid grid-cols-3 gap-4">
          @for (mood of moods; track mood.label) {
            <button 
              (click)="convertMood(mood)"
              class="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-transparent hover:bg-gray-50 transition-colors active:scale-95"
              [class.bg-blue-50]="selectedMood() === mood.label"
            >
              <span class="text-4xl mb-2 filter drop-shadow-sm">{{ mood.icon }}</span>
              <span class="text-xs font-medium text-gray-500">{{ mood.label }}</span>
            </button>
          }
        </div>
      } @else {
        <div class="text-center py-4 animate-pop">
          <div class="w-32 h-32 mx-auto mb-2">
            <app-lottie 
              path="https://lottie.host/5ccfe317-5e60-4414-b49d-649033327663/zN1l2E4IqI.json"
              [loop]="false"
            />
          </div>
          <h4 class="text-xl font-bold text-purple-600 mb-1">太棒了！</h4>
          <p class="text-gray-600 text-sm">你成功控制了情绪！</p>
          <div class="mt-4 inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold shadow-sm">
            +2 磁贴 🌟
          </div>
          <div>
            <button (click)="reset()" class="mt-6 text-sm text-gray-400 underline">关闭</button>
          </div>
        </div>
      }
    </div>
  `
})
export class MoodConverterComponent {
  store = inject(StoreService);
  showSuccess = signal(false);
  selectedMood = signal<string | null>(null);

  moods = [
    { icon: '😤', label: '生气' },
    { icon: '😢', label: '难过' },
    { icon: '😫', label: '疲惫' },
  ];

  convertMood(mood: any) {
    if (this.showSuccess()) return;
    
    this.selectedMood.set(mood.label);
    
    // 模拟处理过程
    setTimeout(() => {
        this.store.addMagnets(2, `心情转换: 处理了 ${mood.label} 情绪`, 'mood');
        this.showSuccess.set(true);
    }, 500);
  }

  reset() {
    this.showSuccess.set(false);
    this.selectedMood.set(null);
  }
}