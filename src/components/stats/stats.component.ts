
import { Component, ElementRef, inject, viewChild, effect, signal } from '@angular/core';
import { StoreService } from '../../services/store.service';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 pb-24">
      <!-- Header -->
      <div class="bg-white p-4 sticky top-0 z-20 shadow-sm flex items-center">
        <h2 class="text-lg font-bold text-gray-800 ml-2">数据统计</h2>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-3 gap-3 px-2">
        <div class="bg-blue-50 p-3 rounded-2xl text-center border border-blue-100">
          <div class="text-[10px] text-blue-400 font-bold mb-1">近7天收入</div>
          <div class="text-lg font-bold text-blue-600">+{{ weekStats().income }}</div>
        </div>
        <div class="bg-red-50 p-3 rounded-2xl text-center border border-red-100">
          <div class="text-[10px] text-red-400 font-bold mb-1">近7天支出</div>
          <div class="text-lg font-bold text-red-600">{{ weekStats().expense }}</div>
        </div>
        <div class="bg-green-50 p-3 rounded-2xl text-center border border-green-100">
          <div class="text-[10px] text-green-400 font-bold mb-1">净增长</div>
          <div class="text-lg font-bold text-green-600">{{ weekStats().net }}</div>
        </div>
      </div>

      <!-- Trend Chart -->
      <div class="bg-white m-2 p-4 rounded-3xl shadow-sm border border-gray-100">
        <h3 class="font-bold text-gray-800 text-sm mb-4 flex items-center">
          <span class="mr-2 text-lg">📈</span> 磁贴收支趋势 (近7天)
        </h3>
        <div #trendChartContainer class="w-full h-48"></div>
      </div>

      <!-- Task Distribution -->
      <div class="bg-white m-2 p-4 rounded-3xl shadow-sm border border-gray-100">
         <h3 class="font-bold text-gray-800 text-sm mb-4 flex items-center">
            <span class="mr-2 text-lg">📊</span> 收入来源分析
         </h3>
         
         <div class="flex flex-col sm:flex-row items-center justify-center sm:justify-start">
            <!-- Chart centered on mobile, left on desktop -->
            <div #pieChartContainer class="w-48 h-48 flex-shrink-0 relative"></div>
            
            <!-- Legend -->
            <div class="mt-6 sm:mt-0 sm:ml-8 flex-1 w-full max-w-sm">
                @if (pieData().length === 0) {
                    <p class="text-center text-gray-400 text-xs">暂无数据</p>
                } @else {
                    <div class="grid grid-cols-2 gap-x-4 gap-y-3">
                        @for (item of pieData(); track item.name) {
                            <div class="flex items-center text-xs">
                                <span class="w-3 h-3 rounded-full mr-2 shrink-0 shadow-sm" [style.backgroundColor]="item.color"></span>
                                <span class="text-gray-500 truncate mr-auto">{{ item.name }}</span>
                                <span class="font-bold text-gray-700 ml-1">+{{ item.value }}</span>
                            </div>
                        }
                    </div>
                }
            </div>
         </div>
      </div>
    </div>
  `
})
export class StatsComponent {
  store = inject(StoreService);
  trendContainer = viewChild<ElementRef>('trendChartContainer');
  pieContainer = viewChild<ElementRef>('pieChartContainer');

  weekStats = signal({ income: 0, expense: 0, net: 0 });
  pieData = signal<{name: string, value: number, color: string}[]>([]);

  private colors = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#818cf8', '#f87171'];

  constructor() {
    effect(() => {
      // 1. Generate last 7 days keys (YYYY-MM-DD)
      const days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return this.getLocalDay(d);
      });

      const logs = this.store.logs();
      const dailyData = days.map(day => {
        const dayLogs = logs.filter(l => 
            this.getLocalDay(new Date(l.timestamp)) === day
        );
        const income = dayLogs.reduce((sum, l) => l.amount > 0 ? sum + l.amount : sum, 0);
        const expense = Math.abs(dayLogs.reduce((sum, l) => l.amount < 0 ? sum + l.amount : sum, 0));
        return { day, income, expense };
      });

      // Compute Summary
      const totalIncome = dailyData.reduce((acc, d) => acc + d.income, 0);
      const totalExpense = dailyData.reduce((acc, d) => acc + d.expense, 0);

      this.weekStats.set({ 
        income: totalIncome, 
        expense: -totalExpense, 
        net: totalIncome - totalExpense 
      });

      // Prepare Pie Data (Based on logs from last 7 days)
      const recentLogs = logs.filter(l => 
         l.amount > 0 && days.includes(this.getLocalDay(new Date(l.timestamp)))
      );
      
      const groups: {[key: string]: number} = {};
      recentLogs.forEach(l => {
          let key = '其他';
          if (l.type === 'bonus') key = '全垒打';
          else if (l.type === 'mood') key = '心情转换';
          else if (l.type === 'magnet-moment') key = '磁贴时刻';
          else if (l.description.includes('完成约定')) {
              key = l.description.replace('完成约定: ', '').trim();
          } else if (l.description.includes('任务:')) {
             key = l.description.replace('任务: ', '').trim();
          }
          groups[key] = (groups[key] || 0) + l.amount;
      });

      const processedPieData = Object.entries(groups)
        .map(([name, value], index) => ({
            name, 
            value,
            color: this.colors[index % this.colors.length]
        }))
        .sort((a, b) => b.value - a.value);

      this.pieData.set(processedPieData);

      // Redraw charts
      setTimeout(() => {
        this.renderTrendChart(days, dailyData);
        this.renderPieChart();
      }, 0);
    });
  }

  // Helper to get local date string YYYY-MM-DD
  private getLocalDay(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private renderTrendChart(days: string[], data: any[]) {
    const container = this.trendContainer()?.nativeElement;
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const x = d3.scalePoint()
      .domain(days.map(d => d.slice(5))) // MM-DD
      .range([margin.left, width - margin.right]);

    const yMax = d3.max(data, d => Math.max(d.income, d.expense)) || 10;
    const y = d3.scaleLinear()
      .domain([0, yMax])
      .range([height - margin.bottom, margin.top]);

    // Draw Income Line
    const lineIncome = d3.line<any>()
      .x((d, i) => x(days[i].slice(5))!)
      .y(d => y(d.income))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6') // Blue
      .attr('stroke-width', 3)
      .attr('d', lineIncome);

     // Draw Expense Line
    const lineExpense = d3.line<any>()
      .x((d, i) => x(days[i].slice(5))!)
      .y(d => y(d.expense))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444') // Red
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '4')
      .attr('d', lineExpense);

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
      .select('.domain').remove();
    
    // Y Axis (Grid)
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-width))
      .select('.domain').remove();
    
    svg.selectAll('.tick line').attr('stroke', '#f3f4f6');
    svg.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '10px');
  }

  private renderPieChart() {
    const container = this.pieContainer()?.nativeElement;
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const data = this.pieData();
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    if (data.length === 0) {
        svg.append('text').text('暂无数据').attr('text-anchor', 'middle').attr('fill', '#ccc').attr('font-size', '12px');
        return;
    }

    const pie = d3.pie<any>().value(d => d.value).sort(null); // Data is already sorted
    const arc = d3.arc<any>().innerRadius(radius * 0.55).outerRadius(radius * 0.9);

    svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d: any) => d.data.color)
      .attr('stroke', 'white')
      .style('stroke-width', '2px');
    
    const total = data.reduce((sum, d) => sum + d.value, 0);
    svg.append('text')
       .text(total)
       .attr('text-anchor', 'middle')
       .attr('dy', '-0.1em')
       .attr('font-weight', 'bold')
       .attr('font-size', '24px')
       .attr('fill', '#374151');
    
    svg.append('text')
       .text('总收入')
       .attr('text-anchor', 'middle')
       .attr('dy', '1.4em')
       .attr('font-size', '10px')
       .attr('fill', '#9ca3af');
  }
}
