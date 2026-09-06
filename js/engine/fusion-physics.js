/**
 * FUSION-X PHYSICS ENGINE (Lawson Criterion & Differential Model)
 * Coupled non-linear differential equations:
 * - Bosch-Hale parameterized D-T fusion reactivity
 * - Power balance: dW/dt = P_aux + P_alpha - P_loss - P_brems
 * - Troyon normalized beta limit (beta_N <= 3.5)
 * - Greenwald density limit (n_G = Ip / pi*a^2)
 * - Energy gain factor Q = P_fus / P_aux
 * - Disruption dynamics (Thermal & Current Quench)
 */

class FusionPhysicsEngine {
  constructor() {
    // Machine Geometry Constants (ITER-scale Tokamak)
    this.R0 = 6.2;             // Major radius (meters)
    this.a = 2.0;              // Minor radius (meters)
    this.volume = 840;         // Plasma volume (m³)
    this.elongation = 1.85;    // Elongation kappa

    // Operator Input Parameters
    this.pAuxMW = 40.0;        // Auxiliary Heating Power (0 - 100 MW)
    this.densityE20 = 1.0;     // Electron/Ion density (0.1 - 3.0 × 10²⁰ m⁻³)
    this.bFieldTesla = 5.3;    // Toroidal field on axis (Tesla)
    this.plasmaCurrentMA = 15.0;// Plasma current (MA)

    // Dynamic Physics State Variables
    this.temperatureKeV = 1.2; // ~14 Million Kelvin initially
    this.storedEnergyMJ = 8.5; // Stored thermal energy W_th (MJ)
    this.tauE = 2.4;           // Energy confinement time (seconds)
    this.pFusMW = 0.0;         // Thermonuclear fusion power (MW)
    this.pAlphaMW = 0.0;       // Alpha particle self-heating (MW)
    this.pBremsMW = 0.0;       // Bremsstrahlung radiation loss (MW)
    this.pLossMW = 0.0;        // Transport conduction loss (MW)
    this.qFactor = 0.0;        // Energy amplification factor Q
    this.betaN = 0.8;          // Normalized plasma beta
    this.greenwaldFraction = 0.5; // n / n_G
    this.stabilityIndex = 95;  // 0% to 100%

    // Engine Run State
    this.state = 'OFFLINE';    // 'OFFLINE', 'HEATING', 'BURNING', 'IGNITION', 'DISRUPTION', 'SCRAM'
    this.isRunning = false;
    this.simTimeSec = 0.0;
    this.dt = 0.05;            // Simulation time step (50ms)

    // Event Listeners for Telemetry Dispatch
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notify(event) {
    for (const sub of this.subscribers) {
      sub(event);
    }
  }

  start() {
    if (this.state === 'DISRUPTION') return;
    this.isRunning = true;
    if (this.state === 'OFFLINE' || this.state === 'SCRAM') {
      this.state = 'HEATING';
      this.notify({ type: 'LOG', level: 'INFO', text: 'Auxiliary heating active. Plasma current ramp initiated.' });
    }
    if (window.FusionAudio) window.FusionAudio.playRelayClick();
  }

  pause() {
    this.isRunning = false;
    if (window.FusionAudio) window.FusionAudio.playRelayClick();
  }

  reset() {
    this.isRunning = false;
    this.state = 'OFFLINE';
    this.simTimeSec = 0.0;
    this.temperatureKeV = 1.2;
    this.storedEnergyMJ = 8.5;
    this.pFusMW = 0.0;
    this.pAlphaMW = 0.0;
    this.qFactor = 0.0;
    this.stabilityIndex = 95;

    // Reset Alert Banners
    this.notify({ type: 'RESET' });
    this.notify({ type: 'LOG', level: 'INFO', text: 'Reactor simulation reset to cold vacuum standby.' });
    if (window.FusionAudio) window.FusionAudio.playRelayClick();
  }

  scram(reason = 'MANUAL EMERGENCY TRIP') {
    this.state = 'SCRAM';
    this.isRunning = false;
    this.pAuxMW = 0.0;

    // Fast decay
    this.temperatureKeV *= 0.15;
    this.pFusMW = 0.0;
    this.pAlphaMW = 0.0;
    this.qFactor = 0.0;
    this.stabilityIndex = 10;

    if (window.FusionAudio) window.FusionAudio.playScramAlarm();
    this.notify({ type: 'SCRAM', reason: reason });
    this.notify({ type: 'LOG', level: 'CRIT', text: `EMERGENCY SCRAM ACTIVATED: ${reason}. Fast pellet killer engaged.` });
  }

  // D-T Thermonuclear Fusion Reactivity <sigma*v> (Bosch-Hale parametrization approximation)
  // T in keV, returns cross section reactivity in m³/s
  calcDTCrossSection(T_keV) {
    if (T_keV < 0.5) return 0;
    // Parameterized fit accurate for 1 - 100 keV
    const theta = T_keV / (1.0 - (T_keV * (0.01 + T_keV * (0.0005))));
    const xi = Math.pow(98.29 / theta, 1/3);
    const reactivity = 1.17e-15 * Math.pow(xi, 2) * Math.exp(-3 * xi) / (Math.pow(theta, 2/3) * Math.sqrt(1 + 0.14 * theta));
    return Math.max(0, reactivity);
  }

  step() {
    if (!this.isRunning) return;

    this.simTimeSec += this.dt;

    // 1. Confinement scaling (ITER IPB98(y,2) scaling approx)
    // tau_E ~ I_p^0.93 * B^0.15 * n^0.41 * P_tot^-0.69
    const pTotalNet = Math.max(this.pAuxMW + this.pAlphaMW, 5.0);
    this.tauE = 0.05 * Math.pow(this.plasmaCurrentMA, 0.93) *
                       Math.pow(this.bFieldTesla, 0.15) *
                       Math.pow(this.densityE20 * 10, 0.41) *
                       Math.pow(pTotalNet, -0.69) * 12.0;
    this.tauE = Math.max(0.4, Math.min(6.5, this.tauE));

    // 2. Fusion Reaction Rate & Alpha Heating
    // n_D = n_T = 0.5 * n_e
    const n_ions = this.densityE20 * 1e20;
    const sigmaV = this.calcDTCrossSection(this.temperatureKeV);

    // Fusion Power: P_fus = (1/4) * n^2 * <sigma v> * 17.6 MeV * Volume
    // 17.6 MeV = 2.818e-12 Joules
    const fusionsPerSec = 0.25 * Math.pow(n_ions, 2) * sigmaV * this.volume;
    this.pFusMW = (fusionsPerSec * 2.818e-12) / 1e6;

    // Alpha particles carry 20% of fusion energy (3.5 MeV)
    this.pAlphaMW = this.pFusMW * 0.20;

    // 3. Loss Channels:
    // Bremsstrahlung radiation: P_br ~ 5.35e-37 * Z_eff * n^2 * sqrt(T_keV) * Volume (Watts)
    this.pBremsMW = (5.35e-37 * 1.4 * Math.pow(n_ions, 2) * Math.sqrt(this.temperatureKeV * 1000) * this.volume) / 1e6;

    // Conduction/convection transport loss: P_loss = W / tau_E
    // Stored Energy W = 3 * n * k_B * T * Volume
    // 1 keV = 1.602e-16 Joules
    this.storedEnergyMJ = (3 * n_ions * (this.temperatureKeV * 1.602e-16) * this.volume) / 1e6;
    this.pLossMW = this.storedEnergyMJ / this.tauE;

    // 4. Net Power Balance & Temperature Differential (dW/dt)
    const netPowerMW = this.pAuxMW + this.pAlphaMW - this.pLossMW - this.pBremsMW;
    // dW = C * dT -> dT/dt = netPower / HeatCapacity
    const heatCapacity = (3 * n_ions * 1.602e-16 * this.volume) / 1e6; // MJ per keV
    const dTemp = (netPowerMW / Math.max(heatCapacity, 1.0)) * this.dt;

    this.temperatureKeV = Math.max(0.2, this.temperatureKeV + dTemp);

    // 5. Energy Amplification Factor Q
    this.qFactor = this.pAuxMW > 0.5 ? (this.pFusMW / this.pAuxMW) : (this.pFusMW > 10 ? 99.9 : 0.0);

    // 6. Stability Limits Evaluation:
    // Greenwald Density Limit: n_G = I_p / (pi * a^2) [10^20 m^-3]
    const nGreenwald = this.plasmaCurrentMA / (Math.PI * Math.pow(this.a, 2));
    this.greenwaldFraction = this.densityE20 / nGreenwald;

    // Troyon Beta Limit: beta_N = beta (%) * (a * B / I_p)
    // Stored kinetic pressure / magnetic pressure
    const bMagPress = Math.pow(this.bFieldTesla, 2) / (2 * 4 * Math.PI * 1e-7);
    const plasmaPress = 2 * n_ions * (this.temperatureKeV * 1.602e-16);
    const betaTotal = (plasmaPress / bMagPress) * 100;
    this.betaN = betaTotal * ((this.a * this.bFieldTesla) / this.plasmaCurrentMA);

    // Stability Index (0 - 100%)
    let stab = 100 - (Math.max(0, this.betaN - 2.5) * 45) - (Math.max(0, this.greenwaldFraction - 0.8) * 90);
    this.stabilityIndex = Math.max(5, Math.min(100, Math.round(stab)));

    // 7. Check State Transitions & Consequences
    this.evaluateStateTransitions();

    // Notify Telemetry
    this.notify({
      type: 'TELEMETRY',
      data: {
        time: this.simTimeSec,
        state: this.state,
        temperatureKeV: this.temperatureKeV,
        temperatureMK: this.temperatureKeV * 11.604, // 1 keV = 11.6 Million Kelvin
        densityE20: this.densityE20,
        tauE: this.tauE,
        pFusMW: this.pFusMW,
        pAlphaMW: this.pAlphaMW,
        pAuxMW: this.pAuxMW,
        qFactor: this.qFactor,
        stabilityIndex: this.stabilityIndex,
        betaN: this.betaN,
        greenwaldFraction: this.greenwaldFraction,
        storedEnergyMJ: this.storedEnergyMJ
      }
    });

    // Update Acoustics
    if (window.FusionAudio) {
      window.FusionAudio.updateReactorAcoustics(this.bFieldTesla, this.pFusMW);
    }
  }

  evaluateStateTransitions() {
    // DISRUPTION TRIGGER: Beta limit exceeded (MHD Kink/Tearing) OR Greenwald limit breached!
    if (this.betaN > 3.8 || this.greenwaldFraction > 1.18) {
      this.triggerDisruption(this.betaN > 3.8 ? 'TROYON BETA LIMIT COLLAPSE (MHD KINK)' : 'GREENWALD DENSITY LIMIT RADIATIVE QUENCH');
      return;
    }

    // IGNITION TRIGGER: Self-heating star condition (Q >= 10 and Alpha Heating exceeds losses)
    if (this.pAlphaMW >= (this.pLossMW + this.pBremsMW) && this.qFactor >= 10.0) {
      if (this.state !== 'IGNITION') {
        this.state = 'IGNITION';
        this.notify({ type: 'IGNITION' });
        this.notify({ type: 'LOG', level: 'INFO', text: 'THERMONUCLEAR IGNITION ACHIEVED: Alpha self-heating balances energy transport losses. Burning star condition confirmed.' });
        if (window.FusionAudio) window.FusionAudio.playIgnitionSurge();
      }
    } else if (this.pFusMW >= this.pAuxMW && this.pFusMW > 20) {
      if (this.state !== 'BURNING' && this.state !== 'IGNITION') {
        this.state = 'BURNING';
        this.notify({ type: 'LOG', level: 'INFO', text: 'SCIENTIFIC BREAKEVEN EXCEEDED: Q > 1.0. Entering burning plasma regime.' });
      }
    } else if (this.state !== 'HEATING' && this.isRunning) {
      this.state = 'HEATING';
    }
  }

  triggerDisruption(reason) {
    this.state = 'DISRUPTION';
    this.isRunning = false;

    // Thermal quench
    this.temperatureKeV = 0.15;
    this.pFusMW = 0.0;
    this.pAlphaMW = 0.0;
    this.qFactor = 0.0;
    this.stabilityIndex = 0;

    if (window.FusionAudio) window.FusionAudio.playScramAlarm();
    this.notify({ type: 'DISRUPTION', reason: reason });
    this.notify({ type: 'LOG', level: 'CRIT', text: `MAJOR THERMAL DISRUPTION: ${reason}. Rapid plasma quench to divertor.` });
  }
}

window.FusionEngine = new FusionPhysicsEngine();
