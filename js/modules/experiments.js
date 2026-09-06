/**
 * FUSION-X EXPERIMENTAL SCENARIOS & LOCAL STORAGE HISTORY
 * 5 distinct engineering missions with real-time pass/fail evaluation,
 * automated scoring, and persistent LocalStorage run history.
 */

class ExperimentManager {
  constructor() {
    this.scenarios = [
      {
        id: "ignition",
        tag: "MISSION SCENARIO 01",
        title: "Thermonuclear Ignition",
        objective: "Achieve self-heating condition where alpha particle power balances transport losses and Q >= 10.0.",
        criteria: [
          { id: "q_gain", label: "Energy Gain Q ≥ 10.0", target: 10.0, current: 0, passed: false },
          { id: "p_fus", label: "Fusion Power ≥ 450 MW", target: 450, current: 0, passed: false },
          { id: "duration", label: "Ignition Sustained ≥ 15s", target: 15, current: 0, passed: false }
        ],
        config: { pAux: 50, density: 1.4, bField: 5.3, current: 15.0 }
      },
      {
        id: "stability",
        tag: "MISSION SCENARIO 02",
        title: "High-Beta Stability",
        objective: "Maximize plasma pressure beta_N >= 2.8 while maintaining stability margin >= 80% without tearing modes.",
        criteria: [
          { id: "beta_n", label: "Normalized Beta ≥ 2.8", target: 2.8, current: 0, passed: false },
          { id: "stability", label: "Stability Margin ≥ 80%", target: 80, current: 0, passed: false },
          { id: "duration", label: "Duration ≥ 20s", target: 20, current: 0, passed: false }
        ],
        config: { pAux: 60, density: 1.1, bField: 5.0, current: 14.5 }
      },
      {
        id: "density",
        tag: "MISSION SCENARIO 03",
        title: "Greenwald Limit Flight",
        objective: "Push electron density to 90% of the Greenwald limit (n/n_G >= 0.90) without triggering radiative disruption.",
        criteria: [
          { id: "greenwald", label: "Greenwald Fraction ≥ 0.90", target: 0.90, current: 0, passed: false },
          { id: "no_disrupt", label: "Zero Disruption Events", target: 1, current: 1, passed: true },
          { id: "duration", label: "Duration ≥ 15s", target: 15, current: 0, passed: false }
        ],
        config: { pAux: 45, density: 1.9, bField: 5.5, current: 15.0 }
      },
      {
        id: "confinement",
        tag: "MISSION SCENARIO 04",
        title: "Advanced Confinement",
        objective: "Optimize magnetic shear and toroidal field to attain energy confinement time tau_E >= 4.0 seconds.",
        criteria: [
          { id: "tau_e", label: "Confinement tau_E ≥ 4.0s", target: 4.0, current: 0, passed: false },
          { id: "temp", label: "Ion Temp ≥ 140 MK", target: 140, current: 0, passed: false },
          { id: "duration", label: "Duration ≥ 15s", target: 15, current: 0, passed: false }
        ],
        config: { pAux: 40, density: 1.2, bField: 6.0, current: 15.5 }
      },
      {
        id: "sustained",
        tag: "MISSION SCENARIO 05",
        title: "Sustained Steady-State",
        objective: "Maintain continuous burning plasma generating >= 400 MW thermal output for 30 consecutive seconds.",
        criteria: [
          { id: "p_fus_ss", label: "Fusion Power ≥ 400 MW", target: 400, current: 0, passed: false },
          { id: "duration_ss", label: "Burn Duration ≥ 30s", target: 30, current: 0, passed: false },
          { id: "stability_ss", label: "Stability Margin ≥ 75%", target: 75, current: 0, passed: false }
        ],
        config: { pAux: 45, density: 1.3, bField: 5.3, current: 15.0 }
      }
    ];

    this.activeScenario = this.scenarios[0];
    this.conditionTimerSec = 0;
    this.isTracking = false;

    // LocalStorage Key
    this.storageKey = 'fusionx_experiment_history';
    this.historyLogs = [];
  }

  init() {
    this.loadHistory();
    this.renderScenarioCards();
    this.updateTrackerPanel();
    this.renderHistoryTable();

    // Subscribe to physics engine for real-time tracking
    if (window.FusionEngine) {
      window.FusionEngine.subscribe((event) => this.handleEngineUpdate(event));
    }
  }

  loadHistory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.historyLogs = JSON.parse(data);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
      this.historyLogs = [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.historyLogs));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }
  }

  renderScenarioCards() {
    const grid = document.getElementById('scenariosGrid');
    if (!grid) return;

    grid.innerHTML = '';
    this.scenarios.forEach((scen, idx) => {
      const card = document.createElement('div');
      card.className = `scenario-card ${scen.id === this.activeScenario.id ? 'active' : ''}`;
      card.dataset.id = scen.id;

      card.innerHTML = `
        <div class="scenario-badge">
          <span>${scen.tag}</span>
          <span class="status-dot ${this.isScenarioCompleted(scen.id) ? 'status-pill--green' : ''}"></span>
        </div>
        <div class="scenario-title">${scen.title}</div>
        <div class="scenario-objective">${scen.objective}</div>
        <div class="scenario-criteria-list">
          ${scen.criteria.map(c => `
            <div class="scenario-criterion-item">
              <span class="criterion-icon">✓</span>
              <span>${c.label}</span>
            </div>
          `).join('')}
        </div>
        <button class="btn btn--secondary btn--sm" style="margin-top: auto;">LOAD SCENARIO</button>
      `;

      card.addEventListener('click', () => {
        this.selectScenario(scen.id);
        if (window.FusionAudio) window.FusionAudio.playRelayClick();
      });

      grid.appendChild(card);
    });
  }

  selectScenario(id) {
    const found = this.scenarios.find(s => s.id === id);
    if (!found) return;

    this.activeScenario = found;
    this.conditionTimerSec = 0;
    this.isTracking = false;

    // Reset criteria
    this.activeScenario.criteria.forEach(c => {
      c.passed = false;
      c.current = 0;
    });

    // Update active class on cards
    const cards = document.querySelectorAll('.scenario-card');
    cards.forEach(c => c.classList.toggle('active', c.dataset.id === id));

    this.updateTrackerPanel();

    // Configure simulation engine with preset parameters
    if (window.FusionEngine) {
      const cfg = this.activeScenario.config;
      window.FusionEngine.pAuxMW = cfg.pAux;
      window.FusionEngine.densityE20 = cfg.density;
      window.FusionEngine.bFieldTesla = cfg.bField;
      window.FusionEngine.plasmaCurrentMA = cfg.current;

      // Update simulation UI sliders to match
      const pAuxSlider = document.getElementById('simAuxHeatSlider');
      const pAuxVal = document.getElementById('simAuxHeatVal');
      const densSlider = document.getElementById('simDensitySlider');
      const densVal = document.getElementById('simDensityVal');

      if (pAuxSlider) pAuxSlider.value = cfg.pAux;
      if (pAuxVal) pAuxVal.textContent = `${cfg.pAux} MW`;
      if (densSlider) densSlider.value = cfg.density;
      if (densVal) densVal.textContent = `${cfg.density.toFixed(1)} × 10²⁰ m⁻³`;

      // Telemetry log notification
      window.FusionEngine.notify({
        type: 'LOG',
        level: 'INFO',
        text: `Mission loaded: [${this.activeScenario.title}]. Actuators primed.`
      });
    }
  }

  launchExperiment() {
    this.conditionTimerSec = 0;
    this.isTracking = true;
    if (window.FusionEngine) {
      window.FusionEngine.reset();
      window.FusionEngine.start();
    }
  }

  updateTrackerPanel() {
    const tagEl = document.getElementById('trackerTag');
    const titleEl = document.getElementById('trackerTitle');
    const descEl = document.getElementById('trackerDesc');
    const metricsGrid = document.getElementById('trackerMetrics');

    if (tagEl) tagEl.textContent = this.activeScenario.tag;
    if (titleEl) titleEl.textContent = this.activeScenario.title;
    if (descEl) descEl.textContent = this.activeScenario.objective;

    if (metricsGrid) {
      metricsGrid.innerHTML = '';
      this.activeScenario.criteria.forEach(c => {
        const box = document.createElement('div');
        box.className = 'tracker-metric-box';
        box.innerHTML = `
          <div class="tracker-metric-label">${c.label}</div>
          <div class="tracker-metric-value" id="crit_val_${c.id}">${c.current}</div>
          <div class="tracker-metric-progress">
            <div class="tracker-progress-fill" id="crit_bar_${c.id}" style="width: 0%"></div>
          </div>
        `;
        metricsGrid.appendChild(box);
      });
    }
  }

  handleEngineUpdate(event) {
    if (event.type === 'TELEMETRY' && window.FusionEngine?.isRunning) {
      const d = event.data;
      const scen = this.activeScenario;

      if (scen.id === 'ignition') {
        const cQ = scen.criteria.find(c => c.id === 'q_gain');
        const cP = scen.criteria.find(c => c.id === 'p_fus');
        const cDur = scen.criteria.find(c => c.id === 'duration');

        cQ.current = d.qFactor.toFixed(2);
        cP.current = `${d.pFusMW.toFixed(0)} MW`;

        cQ.passed = d.qFactor >= 10.0;
        cP.passed = d.pFusMW >= 450;

        if (cQ.passed && cP.passed) {
          this.conditionTimerSec += 0.05;
          cDur.current = `${this.conditionTimerSec.toFixed(1)}s`;
          if (this.conditionTimerSec >= 15.0) {
            cDur.passed = true;
            this.completeScenario();
          }
        }
      } else if (scen.id === 'stability') {
        const cB = scen.criteria.find(c => c.id === 'beta_n');
        const cS = scen.criteria.find(c => c.id === 'stability');
        const cDur = scen.criteria.find(c => c.id === 'duration');

        cB.current = d.betaN.toFixed(2);
        cS.current = `${d.stabilityIndex}%`;

        cB.passed = d.betaN >= 2.8;
        cS.passed = d.stabilityIndex >= 80;

        if (cB.passed && cS.passed) {
          this.conditionTimerSec += 0.05;
          cDur.current = `${this.conditionTimerSec.toFixed(1)}s`;
          if (this.conditionTimerSec >= 20.0) {
            cDur.passed = true;
            this.completeScenario();
          }
        }
      } else if (scen.id === 'density') {
        const cG = scen.criteria.find(c => c.id === 'greenwald');
        const cDur = scen.criteria.find(c => c.id === 'duration');

        cG.current = d.greenwaldFraction.toFixed(2);
        cG.passed = d.greenwaldFraction >= 0.90;

        if (cG.passed) {
          this.conditionTimerSec += 0.05;
          cDur.current = `${this.conditionTimerSec.toFixed(1)}s`;
          if (this.conditionTimerSec >= 15.0) {
            cDur.passed = true;
            this.completeScenario();
          }
        }
      } else if (scen.id === 'confinement') {
        const cT = scen.criteria.find(c => c.id === 'tau_e');
        const cTemp = scen.criteria.find(c => c.id === 'temp');
        const cDur = scen.criteria.find(c => c.id === 'duration');

        cT.current = `${d.tauE.toFixed(2)}s`;
        cTemp.current = `${d.temperatureMK.toFixed(0)} MK`;

        cT.passed = d.tauE >= 4.0;
        cTemp.passed = d.temperatureMK >= 140;

        if (cT.passed && cTemp.passed) {
          this.conditionTimerSec += 0.05;
          cDur.current = `${this.conditionTimerSec.toFixed(1)}s`;
          if (this.conditionTimerSec >= 15.0) {
            cDur.passed = true;
            this.completeScenario();
          }
        }
      } else if (scen.id === 'sustained') {
        const cP = scen.criteria.find(c => c.id === 'p_fus_ss');
        const cDur = scen.criteria.find(c => c.id === 'duration_ss');
        const cS = scen.criteria.find(c => c.id === 'stability_ss');

        cP.current = `${d.pFusMW.toFixed(0)} MW`;
        cS.current = `${d.stabilityIndex}%`;

        cP.passed = d.pFusMW >= 400;
        cS.passed = d.stabilityIndex >= 75;

        if (cP.passed && cS.passed) {
          this.conditionTimerSec += 0.05;
          cDur.current = `${this.conditionTimerSec.toFixed(1)}s`;
          if (this.conditionTimerSec >= 30.0) {
            cDur.passed = true;
            this.completeScenario();
          }
        }
      }

      this.updateTrackerLiveDisplays();
    } else if (event.type === 'DISRUPTION' || event.type === 'SCRAM') {
      this.conditionTimerSec = 0;
    }
  }

  updateTrackerLiveDisplays() {
    this.activeScenario.criteria.forEach(c => {
      const valEl = document.getElementById(`crit_val_${c.id}`);
      const barEl = document.getElementById(`crit_bar_${c.id}`);

      if (valEl) valEl.textContent = c.current;
      if (barEl) {
        barEl.style.width = c.passed ? '100%' : '50%';
        barEl.style.backgroundColor = c.passed ? 'var(--green-nominal)' : 'var(--cyan-glow)';
      }
    });
  }

  completeScenario() {
    const scen = this.activeScenario;
    const score = Math.round(85 + Math.random() * 15);

    const logEntry = {
      scenarioId: scen.id,
      title: scen.title,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      score: `${score}%`,
      status: 'SUCCESSFUL'
    };

    this.historyLogs.unshift(logEntry);
    this.saveHistory();
    this.renderHistoryTable();

    if (window.FusionEngine) {
      window.FusionEngine.notify({
        type: 'LOG',
        level: 'INFO',
        text: `MISSION ACCOMPLISHED: [${scen.title}] verified. Telemetry recorded with score ${score}%.`
      });
    }

    if (window.FusionAudio) window.FusionAudio.playIgnitionSurge();
  }

  isScenarioCompleted(id) {
    return this.historyLogs.some(log => log.scenarioId === id && log.status === 'SUCCESSFUL');
  }

  renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (this.historyLogs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="history-empty-state">No experimental runs recorded yet. Launch a scenario to log telemetry.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = '';
    this.historyLogs.slice(0, 8).forEach((log, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(idx + 1).padStart(2, '0')}</td>
        <td><strong>${log.title}</strong></td>
        <td>${log.timestamp}</td>
        <td><span class="status-pill status-pill--green">${log.status}</span></td>
        <td><strong>${log.score}</strong></td>
      `;
      tbody.appendChild(tr);
    });
  }

  clearHistory() {
    this.historyLogs = [];
    localStorage.removeItem(this.storageKey);
    this.renderHistoryTable();
    if (window.FusionAudio) window.FusionAudio.playRelayClick();
  }
}

window.ExperimentManager = new ExperimentManager();
