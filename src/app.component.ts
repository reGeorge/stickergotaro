
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, Tab } from './services/store.service';
import { HomeComponent } from './components/home/home.component';
import { RewardsComponent } from './components/rewards/rewards.component';
import { ProfileComponent } from './components/profile/profile.component';
import { StatsComponent } from './components/stats/stats.component';
import { MomentsComponent } from './components/moments/moments.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HomeComponent, RewardsComponent, ProfileComponent, StatsComponent, MomentsComponent],
  template: `
    <div class="flex flex-col h-screen bg-[#eff6ff] font-sans">
      <div class="flex-1 overflow-y-auto no-scrollbar">
        @switch (store.activeTab()) {
          @case ('home') { <app-home /> }
          @case ('shop') { <app-rewards /> }
          @case ('stats') { <app-stats /> }
          @case ('moments') { <app-moments /> }
          @case ('profile') { <app-profile /> }
        }
      </div>

      <!-- Tab Bar -->
      <div class="bg-white border-t border-slate-200 pb-safe pt-2 px-6 flex justify-between items-center shrink-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <button (click)="setTab('home')" class="flex flex-col items-center space-y-1 w-12 py-2 transition-colors active:scale-95" [class.text-indigo-600]="store.activeTab() === 'home'" [class.text-slate-400]="store.activeTab() !== 'home'">
            <span class="text-2xl filter drop-shadow-sm">{{ store.activeTab() === 'home' ? '🏠' : '🏡' }}</span>
            <span class="text-[10px] font-bold">首页</span>
         </button>
         
         <button (click)="setTab('shop')" class="flex flex-col items-center space-y-1 w-12 py-2 transition-colors active:scale-95" [class.text-pink-600]="store.activeTab() === 'shop'" [class.text-slate-400]="store.activeTab() !== 'shop'">
            <span class="text-2xl filter drop-shadow-sm">{{ store.activeTab() === 'shop' ? '🎁' : '🛍️' }}</span>
            <span class="text-[10px] font-bold">梦想屋</span>
         </button>

         <button (click)="setTab('stats')" class="flex flex-col items-center space-y-1 w-12 py-2 transition-colors active:scale-95" [class.text-blue-600]="store.activeTab() === 'stats'" [class.text-slate-400]="store.activeTab() !== 'stats'">
            <span class="text-2xl filter drop-shadow-sm">{{ store.activeTab() === 'stats' ? '📊' : '📈' }}</span>
            <span class="text-[10px] font-bold">统计</span>
         </button>

         <button (click)="setTab('moments')" class="flex flex-col items-center space-y-1 w-12 py-2 transition-colors active:scale-95" [class.text-rose-600]="store.activeTab() === 'moments'" [class.text-slate-400]="store.activeTab() !== 'moments'">
            <span class="text-2xl filter drop-shadow-sm">{{ store.activeTab() === 'moments' ? '📸' : '📷' }}</span>
            <span class="text-[10px] font-bold">美好</span>
         </button>

         <button (click)="setTab('profile')" class="flex flex-col items-center space-y-1 w-12 py-2 transition-colors active:scale-95" [class.text-purple-600]="store.activeTab() === 'profile'" [class.text-slate-400]="store.activeTab() !== 'profile'">
            <span class="text-2xl filter drop-shadow-sm">{{ store.activeTab() === 'profile' ? '🐻' : '🐼' }}</span>
            <span class="text-[10px] font-bold">我的</span>
         </button>
      </div>
    </div>
  `,
  styles: [`
    .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class AppComponent {
  store = inject(StoreService);

  setTab(tab: Tab) {
    this.store.activeTab.set(tab);
  }
}
