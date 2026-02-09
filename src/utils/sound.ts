
import Taro from '@tarojs/taro'

class SoundService {
  private ctx: any = null; // Use any to avoid strict type issues with Taro's WebAudio types which might be missing in some setups
  private volume = 0.3;

  constructor() {
    this.initAudio();
  }

  private initAudio() {
    if (!this.ctx) {
       try {
         // @ts-ignore
         if (Taro.createWebAudioContext) {
           // @ts-ignore
           this.ctx = Taro.createWebAudioContext();
         }
       } catch (e) {
         console.error('WebAudio not supported', e);
       }
    }
  }

  private ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.ctx) {
      this.initAudio();
    }
  }

  /**
   * 获得磁贴音效 (金币音)
   */
  playEarn() {
    this.ensureContext();
    if (!this.ctx) return;

    try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
        // Ignore audio errors
    }
  }

  /**
   * 消费磁贴音效
   */
  playSpend() {
    this.ensureContext();
    if (!this.ctx) return;

    try {
        const t = this.ctx.currentTime;
        
        // Tone 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(600, t);
        gain1.gain.setValueAtTime(this.volume, t);
        gain1.gain.linearRampToValueAtTime(0, t + 0.1);
        
        // Tone 2
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(800, t + 0.1);
        gain2.gain.setValueAtTime(this.volume, t + 0.1);
        gain2.gain.linearRampToValueAtTime(0, t + 0.4);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);

        osc1.connect(gain1).connect(this.ctx.destination);
        osc2.connect(gain2).connect(this.ctx.destination);

        osc1.start(t);
        osc1.stop(t + 0.1);
        osc2.start(t + 0.1);
        osc2.stop(t + 0.4);
    } catch (e) {}
  }

  /**
   * 全垒打音效
   */
  playFanfare() {
    this.ensureContext();
    if (!this.ctx) return;

    try {
        const t = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const duration = 0.15;

        notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'square';
          osc.frequency.value = freq;
          
          const startTime = t + i * duration;
          
          gain.gain.setValueAtTime(this.volume * 0.5, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 1.5);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration * 2);
        });
    } catch (e) {}
  }

  /**
   * 心情转换音效
   */
  playChime() {
    this.ensureContext();
    if (!this.ctx) return;
    
    try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 1); 
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.5);
    } catch (e) {}
  }
}

export const soundService = new SoundService();
