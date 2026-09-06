/**
 * FUSION-X RESEARCH & PHYSICS VISUALIZATIONS
 * Interactive SVG technical diagrams, Lawson triple-product calculator,
 * and educational pulse sequence explorer.
 */

class ResearchHub {
  constructor() {
    this.activeTab = 'fusion';
  }

  init() {
    this.attachEvents();
    this.initTripleProductCalc();
  }

  attachEvents() {
    const tabButtons = document.querySelectorAll('.research-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const topic = btn.dataset.topic;
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const panes = document.querySelectorAll('.research-pane');
        panes.forEach(p => p.classList.toggle('active', p.dataset.pane === topic));

        this.activeTab = topic;
        if (window.FusionAudio) window.FusionAudio.playRelayClick();
      });
    });
  }

  initTripleProductCalc() {
    const nSlider = document.getElementById('calcDensitySlider');
    const tSlider = document.getElementById('calcTempSlider');
    const tauSlider = document.getElementById('calcTauSlider');

    const updateCalc = () => {
      const n = parseFloat(nSlider?.value || 1.0);     // 10^20 m^-3
      const t = parseFloat(tSlider?.value || 15);      // keV
      const tau = parseFloat(tauSlider?.value || 3.0);  // seconds

      // Triple Product n * T * tau_E (keV * s * 10^20 m^-3)
      const tripleProduct = (n * t * tau).toFixed(1);
      const lawsonTarget = 30.0; // 3.0 × 10²¹ keV·s·m⁻³ = 30 × 10²⁰
      const pctTarget = Math.round((tripleProduct / lawsonTarget) * 100);

      const nVal = document.getElementById('calcDensityVal');
      const tVal = document.getElementById('calcTempVal');
      const tauVal = document.getElementById('calcTauVal');
      const resVal = document.getElementById('calcResultVal');
      const resBar = document.getElementById('calcResultBar');
      const statusBadge = document.getElementById('calcStatusBadge');

      if (nVal) nVal.textContent = `${n.toFixed(1)} × 10²⁰ m⁻³`;
      if (tVal) tVal.textContent = `${t.toFixed(0)} keV (${Math.round(t * 11.6)} MK)`;
      if (tauVal) tauVal.textContent = `${tau.toFixed(1)} s`;

      if (resVal) resVal.textContent = `${tripleProduct} × 10²⁰ keV·s·m⁻³ (${pctTarget}% of Ignition Target)`;
      if (resBar) resBar.style.width = `${Math.min(pctTarget, 100)}%`;

      if (statusBadge) {
        if (pctTarget >= 100) {
          statusBadge.className = 'status-pill status-pill--green';
          statusBadge.textContent = 'IGNITION THRESHOLD SURPASSED';
        } else if (pctTarget >= 30) {
          statusBadge.className = 'status-pill status-pill--cyan';
          statusBadge.textContent = 'BREAKEVEN REGIME (Q ≥ 1.0)';
        } else {
          statusBadge.className = 'status-pill status-pill--amber';
          statusBadge.textContent = 'SUB-BREAKEVEN DRIVEN';
        }
      }
    };

    if (nSlider) nSlider.addEventListener('input', updateCalc);
    if (tSlider) tSlider.addEventListener('input', updateCalc);
    if (tauSlider) tauSlider.addEventListener('input', updateCalc);

    updateCalc();
  }
}

window.ResearchHub = new ResearchHub();
