import { Component, ElementRef, Input, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import lottie from 'lottie-web';

@Component({
  selector: 'app-lottie',
  standalone: true,
  template: `
    <div #container [style.width]="width" [style.height]="height" class="flex items-center justify-center"></div>
  `
})
export class LottieAnimationComponent implements AfterViewInit, OnDestroy {
  @Input() path: string = '';
  @Input() loop: boolean = false;
  @Input() autoplay: boolean = true;
  @Input() width: string = '100%';
  @Input() height: string = '100%';

  @ViewChild('container') container!: ElementRef;
  private animation: any;

  ngAfterViewInit() {
    if (this.path) {
      try {
        this.animation = lottie.loadAnimation({
          container: this.container.nativeElement,
          renderer: 'svg',
          loop: this.loop,
          autoplay: this.autoplay,
          path: this.path
        });
      } catch (e) {
        console.error('Lottie load failed', e);
      }
    }
  }

  ngOnDestroy() {
    this.animation?.destroy();
  }
}