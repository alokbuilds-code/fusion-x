/**
 * FUSION-X TELEMETRY & CONTROL ROOM VISUALIZATIONS (Pure Canvas 2D)
 * - 60fps Multi-channel scrolling oscilloscope
 * - Dynamic D-shaped plasma equilibrium cross-section monitor
 * - Circular vector gauges
 * - Diagnostic event stream logger
 */

class TelemetryVisualizer {
  constructor() {
    this.oscCanvas = null;
    this.oscCtx = null;
    this.csCanvas = null;
    this.csCtx = null;

    this.pixelRatio = window.devicePixelRatio || 1;
    this.oscWidth = 0;
    this.oscHeight = 0;
    this.csWidth = 0;
    this.csHeight = 0;

    // Oscilloscope History Buffers (200 data points)
    this.maxPoints = 200;
    this.history = {
      temp: new Array(this.maxPoints).fill(15),
      power: new Array(this.maxPoints).fill(0),
      stability: new Array(this.maxPoints).fill(95),
      qFactor: new Array(this.maxPoints).fill(0)
    };

    // Active Channels
    this.channels = {
      ch1: true, // Temp (Cyan)
      ch2: true, // Power (Violet)
      ch3: true, // Stability (Amber)
      ch4: true  // Q (Green)
    };

    this.animId = null;
    this.isVisible = true;

    // Latest Telemetry Cache
    this.latestData = {
      temperatureMK: 15,
      temperatureKeV: 1.2,
      pFusMW: 0,
      stabilityIndex: 95,
      qFactor: 0,
      storedEnergyMJ: 8.5,
      tauE: 2.4,
      densityE20: 1.0
    };
  }

  init() {
    this.oscCanvas = document.getElementById('oscilloscopeCanvas');
    this.csCanvas = document.getElementById('crossSectionCanvas');

    if (this.oscCanvas) {
      this.oscCtx = this.oscCanvas.getContext('2d');
    }
    if (this.csCanvas) {
      this.csCtx = this.csCanvas.getContext('2d');
    }

    this.handleResize();
    this.attachEvents();

    // Subscribe to physics engine
    if (window.FusionEngine) {
      window.FusionEngine.subscribe((event) => this.handleEngineEvent(event));
    }

    window.addEventListener('resize', () => this.handleResize());
    this.loop();
  }

  handleResize() {
    if (this.oscCanvas) {
      const rect = this.oscCanvas.parentElement.getBoundingClientRect();
      this.oscWidth = rect.width;
      this.oscHeight = rect.height;
      this.oscCanvas.width = this.oscWidth * this.pixelRatio;
      this.oscCanvas.height = this.oscHeight * this.pixelRatio;
    }

    if (this.csCanvas) {
      const rect = this.csCanvas.parentElement.getBoundingClientRect();
      this.csWidth = rect.width;
      this.csHeight = rect.height;
      this.csCanvas.width = this.csWidth * this.pixelRatio;
      this.csCanvas.height = this.csHeight * this.pixelRatio;
    }
  }

  attachEvents() {
    // Oscilloscope Channel Toggles
    const channelTags = document.querySelectorAll('.channel-tag');
    channelTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const ch = tag.dataset.channel;
        if (ch && this.channels.hasOwnProperty(ch)) {
          this.channels[ch] = !this.channels[ch];
          tag.classList.toggle('active', this.channels[ch]);
          if (window.FusionAudio) window.FusionAudio.playRelayClick();
        }
      });
    });
  }

  handleEngineEvent(event) {
    if (event.type === 'TELEMETRY') {
      this.latestData = event.data;

      // Append to oscilloscope history
      this.history.temp.push(event.data.temperatureMK);
      this.history.power.push(event.data.pFusMW);
      this.history.stability.push(event.data.stabilityIndex);
      this.history.qFactor.push(Math.min(event.data.qFactor * 10, 200)); // Scale for graph

      if (this.history.temp.length > this.maxPoints) {
        this.history.temp.shift();
        this.history.power.shift();
        this.history.stability.shift();
        this.history.qFactor.shift();
      }

      this.updateReadoutGauges(event.data);
    } else if (event.type === 'LOG') {
      this.appendLogEntry(event.level, event.text);
    } else if (event.type === 'SCRAM' || event.type === 'DISRUPTION') {
      this.showConsequenceAlert(event.type, event.reason);
    } else if (event.type === 'IGNITION') {
      this.showConsequenceAlert('IGNITION', 'Thermonuclear burn self-sustained (Q ≥ 10.0)');
    } else if (event.type === 'RESET') {
      this.hideConsequenceAlert();
    }
  }

  updateReadoutGauges(data) {
    // 1. Simulation Section Telemetry Readouts
    const telTemp = document.getElementById('telPlasmaTemp');
    const telDens = document.getElementById('telDensity');
    const telConf = document.getElementById('telConfinement');
    const telStab = document.getElementById('telStability');
    const telRate = document.getElementById('telFusionRate');
    const telPowr = document.getElementById('telEnergyOutput');

    if (telTemp) telTemp.textContent = data.temperatureMK.toFixed(1);
    if (telDens) telDens.textContent = data.densityE20.toFixed(2);
    if (telConf) telConf.textContent = data.tauE.toFixed(2);
    if (telStab) telStab.textContent = `${data.stabilityIndex}%`;
    if (telRate) telRate.textContent = (data.pFusMW * 0.355).toFixed(1);
    if (telPowr) telPowr.textContent = data.pFusMW.toFixed(0);

    // Progress Bars in Telemetry Boxes
    const barTemp = document.getElementById('barPlasmaTemp');
    const barDens = document.getElementById('barDensity');
    const barConf = document.getElementById('barConfinement');
    const barStab = document.getElementById('barStability');
    const barRate = document.getElementById('barFusionRate');
    const barPowr = document.getElementById('barEnergyOutput');

    if (barTemp) barTemp.style.width = `${Math.min((data.temperatureMK / 200) * 100, 100)}%`;
    if (barDens) barDens.style.width = `${Math.min((data.densityE20 / 3.0) * 100, 100)}%`;
    if (barConf) barConf.style.width = `${Math.min((data.tauE / 6.0) * 100, 100)}%`;
    if (barStab) barStab.style.width = `${data.stabilityIndex}%`;
    if (barRate) barRate.style.width = `${Math.min((data.pFusMW / 600) * 100, 100)}%`;
    if (barPowr) barPowr.style.width = `${Math.min((data.pFusMW / 600) * 100, 100)}%`;

    // 2. Control Desk State Badge & Pulse Timer
    const stateBadge = document.getElementById('simStateBadge');
    if (stateBadge) {
      stateBadge.className = `sim-state-badge sim-state-badge--${data.state.toLowerCase()}`;
      stateBadge.textContent = data.state;
    }

    const pulseTimer = document.getElementById('simPulseTimer');
    if (pulseTimer) {
      const totalSec = Math.floor(data.time || 0);
      const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      const cs = String(Math.floor(((data.time || 0) % 1) * 100)).padStart(2, '0');
      pulseTimer.textContent = `${mins}:${secs}.${cs}`;
    }

    // 3. Navigation Bar Quick Status
    const navBField = document.getElementById('navBField');
    const navQ = document.getElementById('navQFactor');
    const navState = document.getElementById('navReactorState');

    if (navBField) navBField.textContent = `${(window.FusionEngine?.bFieldTesla || 5.3).toFixed(1)}T`;
    if (navQ) navQ.textContent = data.qFactor.toFixed(2);
    if (navState) navState.textContent = data.state;

    // 4. Section 05 Radial Vector Gauges
    // Divertor Heat load MW/m² scales with (P_loss + P_brems)
    const divertorLoad = (data.pFusMW * 0.035 + (data.temperatureKeV * 0.5)).toFixed(1);
    const gaugeDiv = document.getElementById('gaugeDivertorVal');
    const circleDiv = document.getElementById('gaugeDivertorCircle');
    if (gaugeDiv) gaugeDiv.textContent = `${divertorLoad}`;
    if (circleDiv) {
      // 226 circumference: offset from 226 (0%) to 0 (100%)
      const frac = Math.min(divertorLoad / 20, 1.0);
      circleDiv.style.strokeDashoffset = 226 - (frac * 226);
    }

    // Stored Thermal Energy MJ
    const gaugeEnergy = document.getElementById('gaugeEnergyVal');
    const circleEnergy = document.getElementById('gaugeEnergyCircle');
    if (gaugeEnergy) gaugeEnergy.textContent = `${data.storedEnergyMJ.toFixed(1)}`;
    if (circleEnergy) {
      const frac = Math.min(data.storedEnergyMJ / 400, 1.0);
      circleEnergy.style.strokeDashoffset = 226 - (frac * 226);
    }

    // Cryo TF Temp (4.22 K to 4.45 K under neutron load)
    const cryoTemp = (4.22 + (data.pFusMW * 0.0003)).toFixed(2);
    const gaugeCryo = document.getElementById('gaugeCryoVal');
    if (gaugeCryo) gaugeCryo.textContent = `${cryoTemp} K`;
  }

  appendLogEntry(level, text) {
    const logStream = document.getElementById('telemetryLogStream');
    if (!logStream) return;

    const item = document.createElement('div');
    item.className = `event-log-item event-log-item--${level.toLowerCase()}`;

    const now = new Date();
    const timeStr = now.toISOString().substring(11, 23);

    item.innerHTML = `
      <span class="event-time">[${timeStr}]</span>
      <span class="event-text">${text}</span>
    `;

    logStream.insertBefore(item, logStream.firstChild);

    // Trim older entries
    while (logStream.children.length > 25) {
      logStream.removeChild(logStream.lastChild);
    }
  }

  showConsequenceAlert(type, message) {
    const banner = document.getElementById('simAlertBanner');
    if (!banner) return;

    banner.className = `sim-alert-banner active sim-alert-banner--${type.toLowerCase()}`;
    banner.innerHTML = `
      <span><strong>[${type}]</strong> ${message}</span>
      <button class="btn btn--secondary btn--icon" onclick="window.FusionEngine.reset()">DISMISS</button>
    `;
  }

  hideConsequenceAlert() {
    const banner = document.getElementById('simAlertBanner');
    if (banner) {
      banner.className = 'sim-alert-banner';
    }
  }

  loop() {
    this.animId = requestAnimationFrame(() => this.loop());
    if (!this.isVisible) return;

    this.renderOscilloscope();
    this.renderCrossSection();
  }

  renderOscilloscope() {
    if (!this.oscCtx) return;
    const ctx = this.oscCtx;
    const w = this.oscWidth;
    const h = this.oscHeight;

    ctx.save();
    ctx.scale(this.pixelRatio, this.pixelRatio);
    ctx.clearRect(0, 0, w, h);

    // Industrial Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Render Active Channels
    const dx = w / (this.maxPoints - 1);

    // Channel 1: Plasma Core Temp (0 - 200 MK) -> Cyan
    if (this.channels.ch1) {
      this.drawOscChannel(ctx, this.history.temp, 200, '#00f0ff', dx, h);
    }

    // Channel 2: Fusion Power Output (0 - 600 MW) -> Violet
    if (this.channels.ch2) {
      this.drawOscChannel(ctx, this.history.power, 600, '#9d5cff', dx, h);
    }

    // Channel 3: Plasma Stability Margin (0 - 100%) -> Amber
    if (this.channels.ch3) {
      this.drawOscChannel(ctx, this.history.stability, 100, '#ffaa00', dx, h);
    }

    // Channel 4: Q Amplification (0 - 20) -> Green
    if (this.channels.ch4) {
      this.drawOscChannel(ctx, this.history.qFactor, 150, '#00e676', dx, h);
    }

    ctx.restore();
  }

  drawOscChannel(ctx, dataArr, maxVal, color, dx, h) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    for (let i = 0; i < dataArr.length; i++) {
      const val = dataArr[i];
      const norm = Math.max(0, Math.min(val / maxVal, 1.0));
      const x = i * dx;
      const y = h - (norm * (h - 20)) - 10;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  // Render Poloidal Equilibrium Cross-Section (D-Shape Flux Surfaces)
  renderCrossSection() {
    if (!this.csCtx) return;
    const ctx = this.csCtx;
    const w = this.csWidth;
    const h = this.csHeight;

    ctx.save();
    ctx.scale(this.pixelRatio, this.pixelRatio);
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.48;
    const a = Math.min(w, h) * 0.32;   // Minor radius scale
    const kappa = 1.85;                // Elongation
    const delta = 0.45;                // Triangularity

    // Draw Nested Poloidal Flux Surfaces (psi = 0.2, 0.4, 0.6, 0.8, 1.0)
    for (let psi = 0.2; psi <= 1.0; psi += 0.2) {
      const curA = a * psi;
      ctx.beginPath();

      for (let th = 0; th <= Math.PI * 2; th += 0.08) {
        // Tokamak D-shape parameterization:
        // R(theta) = R0 + a * cos(theta + delta * sin(theta))
        // Z(theta) = kappa * a * sin(theta)
        const rx = curA * Math.cos(th + delta * Math.sin(th));
        const ry = kappa * curA * Math.sin(th);

        const x = cx + rx;
        const y = cy - ry;

        if (th === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();

      if (psi === 1.0) {
        // Separatrix (Last Closed Flux Surface)
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Divertor X-point strike legs at bottom
        const xPtY = cy + (kappa * curA * 0.98);
        ctx.beginPath();
        ctx.moveTo(cx, xPtY);
        ctx.lineTo(cx - 28, h - 8);
        ctx.moveTo(cx, xPtY);
        ctx.lineTo(cx + 28, h - 8);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = `rgba(157, 92, 255, ${psi * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Magnetic Axis dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + 12, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.TelemetryVisualizer = new TelemetryVisualizer();
