/**
 * FUSION-X MAGNETIC FIELD TOPOLOGY SIMULATOR (Pure Canvas 2D)
 * Visualizes nested magnetic flux surfaces, helical twisting dependent on safety factor q(r),
 * and dynamic test particle guiding-center tracing (Passing vs Trapped Banana Orbits).
 */

class MagneticSimulation {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.pixelRatio = window.devicePixelRatio || 1;

    // Magnetic Topology Parameters
    this.bFieldTesla = 5.3;       // 1.0 to 13.0 T
    this.safetyFactorQ = 2.0;      // 1.0 to 4.0
    this.lineDensity = 36;         // 12 to 72 field lines
    this.animSpeed = 1.0;          // 0.2 to 2.5
    this.traceMode = 'banana';     // 'banana' or 'passing'

    // Particle Tracer State
    this.tracer = {
      phi: 0,
      theta: 0,
      r: 65,
      history: [],
      maxHistory: 220,
      pitchAngle: 0.85 // Trapped vs Passing condition
    };

    // Canvas State
    this.time = 0;
    this.animId = null;
    this.isVisible = true;
  }

  init() {
    this.canvas = document.getElementById('magneticCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.handleResize();
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
  }

  attachEvents() {
    const bSlider = document.getElementById('magFieldSlider');
    const qSlider = document.getElementById('magSafetySlider');
    const densitySlider = document.getElementById('magDensitySlider');
    const speedSlider = document.getElementById('magSpeedSlider');

    if (bSlider) {
      bSlider.addEventListener('input', (e) => {
        this.bFieldTesla = parseFloat(e.target.value);
        const valEl = document.getElementById('magFieldVal');
        if (valEl) valEl.textContent = `${this.bFieldTesla.toFixed(1)} T`;
        this.updateHUD();
      });
    }

    if (qSlider) {
      qSlider.addEventListener('input', (e) => {
        this.safetyFactorQ = parseFloat(e.target.value);
        const valEl = document.getElementById('magSafetyVal');
        if (valEl) valEl.textContent = `q = ${this.safetyFactorQ.toFixed(1)}`;
      });
    }

    if (densitySlider) {
      densitySlider.addEventListener('input', (e) => {
        this.lineDensity = parseInt(e.target.value, 10);
        const valEl = document.getElementById('magDensityVal');
        if (valEl) valEl.textContent = `${this.lineDensity} lines`;
      });
    }

    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.animSpeed = parseFloat(e.target.value);
        const valEl = document.getElementById('magSpeedVal');
        if (valEl) valEl.textContent = `${this.animSpeed.toFixed(1)}×`;
      });
    }

    // Tracer Mode Selectors (Banana Orbit vs Passing Orbit)
    const traceBtns = document.querySelectorAll('.trace-mode-btn');
    traceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        traceBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setTraceMode(mode);
        if (window.FusionAudio) window.FusionAudio.playRelayClick();
      });
    });
  }

  setTraceMode(mode) {
    this.traceMode = mode;
    this.tracer.history = [];
    this.tracer.phi = 0;
    this.tracer.theta = 0;
    this.tracer.pitchAngle = mode === 'banana' ? 0.72 : 0.25;

    const modeTitle = document.getElementById('tracerModeLabel');
    if (modeTitle) {
      modeTitle.textContent = mode === 'banana' ? 'TRAPPED (BANANA ORBIT)' : 'PASSING (CIRCULATING)';
    }
  }

  updateHUD() {
    // Gyrofrequency omega_c = q B / m (MHz)
    const gyroFreq = (this.bFieldTesla * 7.6).toFixed(1);
    const hudFreq = document.getElementById('hudGyroFrequency');
    if (hudFreq) hudFreq.textContent = `${gyroFreq} MHz`;
  }

  loop() {
    this.animId = requestAnimationFrame(() => this.loop());
    if (!this.isVisible) return;

    this.time += 0.018 * this.animSpeed;
    this.updateTracer();
    this.render();
  }

  updateTracer() {
    const t = this.tracer;

    if (this.traceMode === 'banana') {
      // Trapped particle bounces between magnetic mirror points (high-field side at inner radius)
      // theta oscillates between -theta_mirror and +theta_mirror
      const thetaMirror = 1.1; // Radians
      t.theta = Math.sin(this.time * 2.2) * thetaMirror;

      // Banana width radial shift: Delta r ~ (q rho / epsilon) * cos(theta)
      const bananaWidth = 14 * (5.3 / this.bFieldTesla);
      t.r = 65 + Math.cos(this.time * 2.2) * bananaWidth;

      // Net toroidal precession drift (slow advance in phi)
      t.phi += 0.008;
    } else {
      // Passing particle continuously circulates around torus
      t.phi += 0.035;
      t.theta += 0.035 / this.safetyFactorQ;
      t.r = 65;
    }

    // Screen projection calculation
    const majorR = Math.min(this.width, this.height) * 0.32;
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;

    const currentR = majorR + (t.r * Math.cos(t.theta));
    const sx = centerX + (currentR * Math.cos(t.phi));
    const sy = centerY + (Math.sin(t.phi) * currentR * 0.42) + (t.r * Math.sin(t.theta) * 0.85);

    t.history.push({ x: sx, y: sy });
    if (t.history.length > t.maxHistory) {
      t.history.shift();
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.pixelRatio, this.pixelRatio);

    ctx.clearRect(0, 0, this.width, this.height);

    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const majorR = Math.min(this.width, this.height) * 0.32;
    const minorR = 65;

    // Draw Magnetic Field Lines (Helical streamlines around torus)
    const numLines = this.lineDensity;
    const numPts = 100;

    for (let l = 0; l < numLines; l++) {
      const basePhi = (l / numLines) * Math.PI * 2 + (this.time * 0.4);

      ctx.beginPath();
      for (let p = 0; p <= numPts; p++) {
        const phi = basePhi + (p / numPts) * Math.PI * 2;
        const theta = (p / numPts) * Math.PI * 2 / this.safetyFactorQ;

        const r = majorR + (minorR * Math.cos(theta));
        const x = centerX + (r * Math.cos(phi));
        const y = centerY + (Math.sin(phi) * r * 0.42) + (minorR * Math.sin(theta) * 0.85);

        if (p === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Magnetic field color scales with Field Strength (Tesla)
      const alpha = Math.min(0.25 + (this.bFieldTesla / 13) * 0.4, 0.7);
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.4})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Draw Magnetic Core Axis
    ctx.beginPath();
    for (let a = 0; a <= 60; a++) {
      const phi = (a / 60) * Math.PI * 2;
      const x = centerX + (majorR * Math.cos(phi));
      const y = centerY + (Math.sin(phi) * majorR * 0.42);
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Particle Tracer Path (Banana orbit / Passing orbit)
    if (this.tracer.history.length > 2) {
      ctx.beginPath();
      ctx.moveTo(this.tracer.history[0].x, this.tracer.history[0].y);
      for (let h = 1; h < this.tracer.history.length; h++) {
        ctx.lineTo(this.tracer.history[h].x, this.tracer.history[h].y);
      }
      ctx.strokeStyle = this.traceMode === 'banana' ? '#ffaa00' : '#00e676';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Active Tracer Ion Head
      const lastPt = this.tracer.history[this.tracer.history.length - 1];
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

window.MagneticSimulation = new MagneticSimulation();
