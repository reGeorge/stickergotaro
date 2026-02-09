
import { Component, inject, computed, signal } from '@angular/core';
import { StoreService, Log } from '../../services/store.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-moments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Full bleed container using negative margins to override app padding -->
    <div class="-m-4 md:-m-6 pb-24 min-h-screen bg-[#fff5f7]"> <!-- Very light pink background -->
      
      <!-- Header -->
      <div class="sticky top-0 z-20 bg-[#fff5f7]/95 backdrop-blur-sm px-6 py-4 shadow-sm border-b border-pink-100 flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-800 flex items-center">
          <span class="text-2xl mr-2">📸</span> 美好时光
        </h2>
        
        <div class="flex items-center gap-2">
            <!-- Export Button -->
            <button 
                (click)="exportToClipboard()" 
                class="text-xs bg-white text-pink-500 px-3 py-1.5 rounded-full font-bold shadow-sm border border-pink-100 flex items-center hover:bg-pink-50 active:scale-95 transition-all"
            >
                @if (copyStatus() === 'copied') {
                    <span class="mr-1">✅</span> 已复制
                } @else {
                    <span class="mr-1">📋</span> 导出
                }
            </button>
            
            <!-- Counter Pill -->
            <div class="hidden xs:block text-xs bg-pink-100 text-pink-600 px-3 py-1.5 rounded-full font-bold shadow-inner">
              {{ totalMoments() }}
            </div>
        </div>
      </div>

      <!-- Timeline Content -->
      <div class="p-6 relative">
        @if (groupedMoments().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div class="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center text-4xl mb-4 border-4 border-white shadow-sm">
              ✨
            </div>
            <h3 class="text-gray-500 font-bold text-lg mb-1">暂无美好记录</h3>
            <p class="text-gray-400 text-sm">点击首页的"磁贴时刻"<br>记录生活中的每一个闪光点吧！</p>
          </div>
        }

        <!-- Vertical Line -->
        <div class="absolute left-10 top-8 bottom-0 w-0.5 bg-gradient-to-b from-pink-200 to-transparent"></div>

        @for (group of groupedMoments(); track group.date) {
          <div class="mb-8 relative">
            <!-- Date Header -->
            <div class="flex items-center mb-4 relative z-10">
               <div class="w-8 h-8 rounded-full bg-pink-100 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-pink-500 ml-6 mr-4">
                 📅
               </div>
               <span class="text-sm font-bold text-gray-500 bg-white/60 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">{{ group.displayDate }}</span>
            </div>

            <!-- Items -->
            <div class="space-y-4 pl-14 pr-2">
              @for (moment of group.items; track moment.id) {
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 relative group active:scale-[0.99] transition-transform">
                   <!-- Icon Decoration -->
                   <div class="absolute -left-3 top-3 w-6 h-6 bg-yellow-100 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <span class="text-[10px]">⭐</span>
                   </div>

                   <div class="flex justify-between items-start">
                      <p class="text-gray-800 text-sm leading-relaxed font-medium">{{ getCleanDescription(moment.description) }}</p>
                      <div class="flex flex-col items-end ml-3 shrink-0">
                         <span class="bg-yellow-50 text-yellow-600 font-bold text-xs px-2 py-1 rounded-lg border border-yellow-100">
                            +{{ moment.amount }} 磁贴
                         </span>
                         <span class="text-[10px] text-gray-400 mt-1">{{ moment.timestamp | date:'HH:mm' }}</span>
                      </div>
                   </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class MomentsComponent {
  store = inject(StoreService);
  copyStatus = signal<'idle' | 'copied'>('idle');

  totalMoments = computed(() => {
    return this.store.logs().filter(l => l.type === 'magnet-moment').length;
  });

  groupedMoments = computed(() => {
    const logs = this.store.logs()
      .filter(l => l.type === 'magnet-moment')
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first

    const groups: { date: string, displayDate: string, items: Log[] }[] = [];

    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const dateKey = this.getDateKey(date);
      
      let group = groups.find(g => g.date === dateKey);
      if (!group) {
        group = { 
          date: dateKey, 
          displayDate: this.getDisplayDate(date),
          items: [] 
        };
        groups.push(group);
      }
      group.items.push(log);
    });

    return groups;
  });

  exportToClipboard() {
    if (this.groupedMoments().length === 0) return;

    // Build Markdown string
    // Format:
    // ## Date
    // - [HH:mm] Content (+N)
    const text = this.groupedMoments().map(group => {
        const header = `## ${group.displayDate}`;
        const items = group.items.map(item => {
            const date = new Date(item.timestamp);
            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            const desc = this.getCleanDescription(item.description);
            return `- [${timeStr}] ${desc} (+${item.amount} 🌟)`;
        }).join('\n');
        
        return `${header}\n${items}`;
    }).join('\n\n');

    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            this.copyStatus.set('copied');
            setTimeout(() => this.copyStatus.set('idle'), 2000);
        }).catch(err => {
            console.error('Failed to copy', err);
            alert('复制失败，请重试');
        });
    } else {
        alert('您的浏览器不支持自动复制，请截图保存。');
    }
  }

  getCleanDescription(desc: string): string {
    return desc.replace('磁贴时刻: ', '').trim();
  }

  private getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private getDisplayDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (this.isSameDay(date, today)) {
      return '今天';
    } else if (this.isSameDay(date, yesterday)) {
      return '昨天';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`; // Simple Chinese format
    }
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }
}
