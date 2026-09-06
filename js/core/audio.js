/**
 * FUSION-X AUDIO ENGINE (Web Audio API)
 * Procedural synthesis of industrial tokamak acoustics:
 * - 60Hz magnetic field mains hum & coil resonance
 * - Auxiliary RF heating surge whine
 * - Relay switch / diagnostic click chirps
 * - SCRAM emergency klaxon alarm
 */

class FusionAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.masterGain = null;
    this.humOsc = null;
    this.humSubOsc = null;
    this.humGain = null;
    this.whineOsc = null;
    this.whineGain = null;
    this.alarmInterval = null;

    // Check localStorage
    const savedMute = localStorage.getItem('fusionx_audio_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Continuous 60Hz Magnetic Hum + 120Hz Sub-harmonic
    this.humOsc = this.ctx.createOscillator();
    this.humOsc.type = 'sawtooth';
    this.humOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

    this.humSubOsc = this.ctx.createOscillator();
    this.humSubOsc.type = 'sine';
    this.humSubOsc.frequency.setValueAtTime(120, this.ctx.currentTime);

    // Lowpass filter for hum to make it deep and industrial
    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

    this.humGain = this.ctx.createGain();
    this.humGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.humOsc.connect(humFilter);
    this.humSubOsc.connect(humFilter);
    humFilter.connect(this.humGain);
    this.humGain.connect(this.masterGain);

    this.humOsc.start();
    this.humSubOsc.start();

    // Auxiliary RF Whine Generator
    this.whineOsc = this.ctx.createOscillator();
    this.whineOsc.type = 'triangle';
    this.whineOsc.frequency.setValueAtTime(840, this.ctx.currentTime);

    this.whineGain = this.ctx.createGain();
    this.whineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.whineOsc.connect(this.whineGain);
    this.whineGain.connect(this.masterGain);
    this.whineOsc.start();
  }

  toggleMute() {
    if (!this.ctx) {
      this.init();
      this.isMuted = false;
    } else {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isMuted = !this.isMuted;
    }

    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.25;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }

    localStorage.setItem('fusionx_audio_muted', this.isMuted.toString());
    return this.isMuted;
  }

  // Update hum frequency and intensity based on magnetic field & plasma power
  updateReactorAcoustics(bFieldTesla, fusionPowerMW) {
    if (!this.ctx || this.isMuted) return;

    // Shift hum fundamental slightly with B-field strength
    const freq = 55 + (bFieldTesla * 1.5);
    this.humOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);

    // Gain scales with power
    const humVol = 0.03 + Math.min(fusionPowerMW / 1500, 0.08);
    this.humGain.gain.setTargetAtTime(humVol, this.ctx.currentTime, 0.1);

    // High-pitched gyrotron / RF whine scales with aux power
    const whineVol = Math.min(fusionPowerMW / 3000, 0.03);
    this.whineGain.gain.setTargetAtTime(whineVol, this.ctx.currentTime, 0.1);
  }

  // Short tactile mechanical relay click
  playRelayClick() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  // Plasma ignition energetic surge sound
  playIgnitionSurge() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  // Emergency SCRAM Klaxon Alarm
  playScramAlarm() {
    if (!this.ctx || this.isMuted) return;

    // Two-tone warning siren
    let count = 0;
    const triggerTone = () => {
      if (count >= 6 || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = count % 2 === 0 ? 880 : 580;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.19);
      count++;
      setTimeout(triggerTone, 220);
    };

    triggerTone();
  }
}

window.FusionAudio = new FusionAudioEngine();
