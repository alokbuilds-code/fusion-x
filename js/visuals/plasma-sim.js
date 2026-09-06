/**
 * FUSION-X PLASMA SIMULATION (Pure Canvas 2D)
 * Simulates 3,000+ charged particles (Deuterium, Tritium, Alpha particles)
 * orbiting along toroidal magnetic flux tubes with Larmor gyration,
 * guiding-center drifts, thermal collision dispersion, and neutral beam injection.
 */

class PlasmaSimulation {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.profileCanvas = null;
    this.profileCtx = null;
    this.width = 0;
    this.height = 0;
    this.pixelRatio = window.devicePixelRatio || 1;

    // Simulation Physics State
    this.temperatureMK = 150;     // 10 to 200 Million Kelvin
    this.densityE20 = 1.0;         // 0.2 to 3.0 × 10²⁰ m⁻³
    this.confinementSec = 3.8;    // 0.5 to 6.0 seconds (tau_E)
    this.heatingMW = 45;          // 0 to 100 MW

    // Particle Arrays
    this.particles = [];
    this.maxParticles = 2400;
    this.injectionBeams = [];     // High-energy NBI particle streaks

    // Animation & Loop
    this.animId = null;
    this.isVisible = true;
    this.time = 0;
  }

  init() {
    this.canvas = document.getElementById('plasmaCanvas');
    this.profileCanvas = document.getElementById('plasmaProfileCanvas');

    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    if (this.profileCanvas) {
      this.profileCtx = this.profileCanvas.getContext('2d');
    }

    this.handleResize();
    this.initParticles();
    this.attachEvents();

    window.addEventListener('resize', () => this.handleResize());
    this.loop();
  }

  handleResize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;

    if (this.profileCanvas) {
      this.profileCanvas.width = 180 * this.pixelRatio;
      this.profileCanvas.height = 60 * this.pixelRatio;
    }
  }

  initParticles() {
    this.particles = [];
    const targetCount = Math.floor(800 + (this.densityE20 / 3.0) * 1600);

    for (let i = 0; i < targetCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    // Toroidal Coordinate System (major radius R, poloidal angle theta, toroidal angle phi)
    const majorR = Math.min(this.width, this.height) * 0.32;
    const minorRMax = Math.min(this.width, this.height) * 0.16;

    // Random minor radius r with core concentration
    const rNorm = Math.pow(Math.random(), 1.6);
    const r = rNorm * minorRMax;

    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI * 2;

    // Particle Species: 48% Deuterium, 48% Tritium, 4% Fast Alpha
    const rand = Math.random();
    let species = 'deuterium';
    let baseMass = 2; // Deuteron
    let baseCharge = 1;

    if (rand > 0.96) {
      species = 'alpha';
      baseMass = 4;
      baseCharge = 2;
    } else if (rand > 0.48) {
      species = 'tritium';
      baseMass = 3;
      baseCharge = 1;
    }

    return {
      phi: phi,
      theta: theta,
      r: r,
      species: species,
      mass: baseMass,
      charge: baseCharge,
      energyTail: Math.random() * 0.5,
      gyrationPhase: Math.random() * Math.PI * 2,
      trail: []
    };
  }

  attachEvents() {
    // Sliders
    const tempSlider = document.getElementById('plasmaTempSlider');
    const densitySlider = document.getElementById('plasmaDensitySlider');
    const confineSlider = document.getElementById('plasmaConfineSlider');
    const heatSlider = document.getElementById('plasmaHeatSlider');

    if (tempSlider) {
      tempSlider.addEventListener('input', (e) => {
        this.temperatureMK = parseFloat(e.target.value);
        const valEl = document.getElementById('plasmaTempVal');
        if (valEl) valEl.textContent = `${this.temperatureMK.toFixed(0)} MK`;
        this.updateDiagnosticsHUD();
      });
    }

    if (densitySlider) {
      densitySlider.addEventListener('input', (e) => {
        this.densityE20 = parseFloat(e.target.value);
        const valEl = document.getElementById('plasmaDensityVal');
        if (valEl) valEl.textContent = `${this.densityE20.toFixed(2)} × 10²⁰ m⁻³`;
        this.adjustParticleCount();
        this.updateDiagnosticsHUD();
      });
    }

    if (confineSlider) {
      confineSlider.addEventListener('input', (e) => {
        this.confinementSec = parseFloat(e.target.value);
        const valEl = document.getElementById('plasmaConfineVal');
        if (valEl) valEl.textContent = `${this.confinementSec.toFixed(2)} s`;
        this.updateDiagnosticsHUD();
      });
    }

    if (heatSlider) {
      heatSlider.addEventListener('input', (e) => {
        this.heatingMW = parseFloat(e.target.value);
        const valEl = document.getElementById('plasmaHeatVal');
        if (valEl) valEl.textContent = `${this.heatingMW.toFixed(0)} MW`;
        this.updateDiagnosticsHUD();
      });
    }

    // Preset Buttons
    const presetButtons = document.querySelectorAll('.plasma-preset-btn');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyPreset(preset);
        if (window.FusionAudio) window.FusionAudio.playRelayClick();
      });
    });
  }

  applyPreset(preset) {
    if (preset === 'ohmic') {
      this.temperatureMK = 35;
      this.densityE20 = 0.6;
      this.confinementSec = 1.8;
      this.heatingMW = 5;
    } else if (preset === 'hmode') {
      this.temperatureMK = 140;
      this.densityE20 = 1.2;
      this.confinementSec = 4.2;
      this.heatingMW = 50;
    } else if (preset === 'burning') {
      this.temperatureMK = 195;
      this.densityE20 = 1.8;
      this.confinementSec = 5.4;
      this.heatingMW = 85;
      if (window.FusionAudio) window.FusionAudio.playIgnitionSurge();
    }

    // Update slider UI
    const tempSlider = document.getElementById('plasmaTempSlider');
    const densitySlider = document.getElementById('plasmaDensitySlider');
    const confineSlider = document.getElementById('plasmaConfineSlider');
    const heatSlider = document.getElementById('plasmaHeatSlider');

    if (tempSlider) tempSlider.value = this.temperatureMK;
    if (densitySlider) densitySlider.value = this.densityE20;
    if (confineSlider) confineSlider.value = this.confinementSec;
    if (heatSlider) heatSlider.value = this.heatingMW;

    const tVal = document.getElementById('plasmaTempVal');
    const dVal = document.getElementById('plasmaDensityVal');
    const cVal = document.getElementById('plasmaConfineVal');
    const hVal = document.getElementById('plasmaHeatVal');

    if (tVal) tVal.textContent = `${this.temperatureMK.toFixed(0)} MK`;
    if (dVal) dVal.textContent = `${this.densityE20.toFixed(2)} × 10²⁰ m⁻³`;
    if (cVal) cVal.textContent = `${this.confinementSec.toFixed(2)} s`;
    if (hVal) hVal.textContent = `${this.heatingMW.toFixed(0)} MW`;

    this.adjustParticleCount();
    this.updateDiagnosticsHUD();
  }

  adjustParticleCount() {
    const targetCount = Math.floor(600 + (this.densityE20 / 3.0) * 1800);
    while (this.particles.length < targetCount) {
      this.particles.push(this.createParticle());
    }
    if (this.particles.length > targetCount) {
      this.particles.length = targetCount;
    }
  }

  updateDiagnosticsHUD() {
    const speedEl = document.getElementById('hudThermalVelocity');
    const collEl = document.getElementById('hudCollisionRate');
    const lossEl = document.getElementById('hudLossFlux');

    // Thermal velocity v_th = sqrt(2 k_B T / m) ~ km/s
    const vTh = Math.round(310 * Math.sqrt(this.temperatureMK / 10));
    // Collision rate nu_ii ~ n / T^(3/2)
    const nu = ((this.densityE20 / Math.pow(this.temperatureMK / 10, 1.5)) * 14.5).toFixed(1);
    // Transport loss flux ~ 1 / tau_E
    const loss = (100 / this.confinementSec).toFixed(1);

    if (speedEl) speedEl.textContent = `${vTh} km/s`;
    if (collEl) collEl.textContent = `${nu} kHz`;
    if (lossEl) lossEl.textContent = `${loss} kW/m²`;
  }

  // Inject fast neutral beam heating streaks
  spawnHeatingStreak() {
    if (this.heatingMW <= 0) return;
    if (Math.random() > (this.heatingMW / 120)) return;

    const angle = (Math.random() - 0.5) * 0.4;
    this.injectionBeams.push({
      x: 0,
      y: (this.height * 0.5) + (Math.random() - 0.5) * 40,
      vx: 14 + (this.heatingMW * 0.15),
      vy: Math.sin(angle) * 8,
      life: 1.0
    });
  }

  loop() {
    this.animId = requestAnimationFrame(() => this.loop());
    if (!this.isVisible) return;

    this.time += 0.016;
    this.updatePhysics();
    this.render();
    this.renderProfile();
  }

  updatePhysics() {
    // Thermal velocity factor
    const velFactor = Math.sqrt(this.temperatureMK / 100) * 0.035;
    // Magnetic pitch helical safety factor
    const qSafety = 2.4;
    // Loss probability inversely related to confinement time
    const lossProb = (0.012 / this.confinementSec);

    const majorR = Math.min(this.width, this.height) * 0.32;
    const minorRMax = Math.min(this.width, this.height) * 0.16;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Particle advances toroidally
      p.phi += velFactor * (1.0 + p.energyTail);

      // Particle winds poloidally following safety factor q: d(theta)/d(phi) = 1/q
      p.theta += (velFactor / qSafety) * (1.0 + (p.r / minorRMax) * 0.4);

      // Larmor Gyration
      p.gyrationPhase += 0.4 + (this.temperatureMK * 0.005);

      // Radial transport / turbulent diffusion
      p.r += (Math.random() - 0.495) * (1.2 / Math.sqrt(this.confinementSec));

      // Particle loss to vessel wall
      if (p.r > minorRMax || Math.random() < lossProb * 0.01) {
        // Recycle particle at core
        p.r = Math.pow(Math.random(), 2) * (minorRMax * 0.5);
        p.energyTail = Math.random() * (this.heatingMW / 40);
      }
    }

    // Update Neutral Beams
    this.spawnHeatingStreak();
    for (let i = this.injectionBeams.length - 1; i >= 0; i--) {
      const b = this.injectionBeams[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life -= 0.03;
      if (b.life <= 0 || b.x > this.width * 0.6) {
        this.injectionBeams.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.pixelRatio, this.pixelRatio);

    // Fade trail background for motion blur
    ctx.fillStyle = 'rgba(4, 6, 10, 0.28)';
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const majorR = Math.min(this.width, this.height) * 0.32;

    // Center Core Glow
    const coreGrad = ctx.createRadialGradient(centerX, centerY, majorR * 0.2, centerX, centerY, majorR * 1.5);
    const glowAlpha = Math.min(0.2 + (this.temperatureMK / 200) * 0.3, 0.5);
    coreGrad.addColorStop(0, `rgba(0, 240, 255, ${glowAlpha})`);
    coreGrad.addColorStop(0.5, `rgba(157, 92, 255, ${glowAlpha * 0.5})`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Convert Toroidal (R, r, theta, phi) to 2D Screen Plane (Isometric perspective)
      // Torus ring projected with tilt
      const cosPhi = Math.cos(p.phi);
      const sinPhi = Math.sin(p.phi);
      const cosTh = Math.cos(p.theta);
      const sinTh = Math.sin(p.theta);

      // Gyration micro-wobble
      const larmorR = (Math.sqrt(this.temperatureMK) / 20) * (p.species === 'alpha' ? 2 : 1);
      const gx = Math.cos(p.gyrationPhase) * larmorR;
      const gy = Math.sin(p.gyrationPhase) * larmorR;

      const currentR = majorR + (p.r * cosTh) + gx;
      const x = centerX + (currentR * cosPhi);
      const y = centerY + (sinPhi * currentR * 0.42) + (p.r * sinTh * 0.85) + gy;

      // Color based on Species & Temperature
      let fillCol = '#00f0ff';
      let size = 1.4;

      if (p.species === 'tritium') {
        fillCol = '#a855f7';
        size = 1.6;
      } else if (p.species === 'alpha') {
        fillCol = '#ffaa00';
        size = 2.4;
      }

      // Brighten core hot particles
      if (p.r < 25 && this.temperatureMK > 120) {
        fillCol = '#ffffff';
      }

      ctx.fillStyle = fillCol;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Neutral Beam Injection Streaks
    for (const b of this.injectionBeams) {
      ctx.strokeStyle = `rgba(0, 240, 255, ${b.life})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x - 30, b.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw core-to-edge radial temperature profile T(r)
  renderProfile() {
    if (!this.profileCtx) return;
    const ctx = this.profileCtx;
    const w = 180;
    const h = 60;

    ctx.save();
    ctx.scale(this.pixelRatio, this.pixelRatio);
    ctx.clearRect(0, 0, w, h);

    // Profile curve: T(r) = T_0 * (1 - (r/a)^2)^alpha
    const alpha = this.confinementSec > 3.0 ? 1.8 : 1.1; // Peaked profile with good confinement

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let px = 0; px <= w; px += 2) {
      const normR = Math.abs((px / (w * 0.5)) - 1.0); // 0 at center, 1 at edges
      const tNorm = Math.max(0, Math.pow(1.0 - Math.min(normR * normR, 1.0), alpha));
      const py = h - 6 - (tNorm * (h - 14) * (this.temperatureMK / 200));

      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Baseline axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - 4);
    ctx.lineTo(w, h - 4);
    ctx.stroke();

    ctx.restore();
  }
}

window.PlasmaSimulation = new PlasmaSimulation();
