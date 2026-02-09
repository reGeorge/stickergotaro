import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioCtx: AudioContext | null = null;
  private volume = 0.3; // Master volume

  constructor() {
    this.initAudio();
  }

  private initAudio() {
    if (typeof window !== 'undefined' && !this.audioCtx) {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  private ensureContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (!this.audioCtx) {
      this.initAudio();
    }
  }

  /**
   * Standard "Coin" sound for completing tasks
   * High pitch, quick decay sine wave
   */
  playEarn() {
    this.ensureContext();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    // Frequency sweep from 880Hz (A5) to 1760Hz (A6)
    osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  }

  /**
   * "Cha-ching" / Purchase sound for spending magnets
   * Two quick distinct tones
   */
  playSpend() {
    this.ensureContext();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    
    // Tone 1
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(600, t);
    gain1.gain.setValueAtTime(this.volume, t);
    gain1.gain.linearRampToValueAtTime(0, t + 0.1);
    
    // Tone 2
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(800, t + 0.1);
    gain2.gain.setValueAtTime(this.volume, t + 0.1);
    gain2.gain.linearRampToValueAtTime(0, t + 0.4);

    osc1.connect(gain1).connect(this.audioCtx.destination);
    osc2.connect(gain2).connect(this.audioCtx.destination);

    osc1.start(t);
    osc1.stop(t + 0.1);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.4);
  }

  /**
   * "Fanfare" for Home Runs
   * A major triad arpeggio (C - E - G - C)
   */
  playFanfare() {
    this.ensureContext();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const duration = 0.15;

    notes.forEach((freq, i) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      
      osc.type = 'square'; // 8-bit style
      osc.frequency.value = freq;
      
      const startTime = t + i * duration;
      
      gain.gain.setValueAtTime(this.volume * 0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 1.5);

      osc.connect(gain).connect(this.audioCtx!.destination);
      osc.start(startTime);
      osc.stop(startTime + duration * 2);
    });
  }

  /**
   * Gentle chime for mood conversion
   */
  playChime() {
    this.ensureContext();
    if (!this.audioCtx) return;
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.audioCtx.currentTime + 1); // Slow rise
    
    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(this.volume, this.audioCtx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.5);
    
    osc.connect(gain).connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 1.5);
  }
}
