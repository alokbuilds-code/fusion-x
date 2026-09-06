<div align="center">

# FUSION-X
### Advanced Tokamak Nuclear Fusion & Plasma Engineering Platform

https://fusion-x-w42z.vercel.app/


[![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-00f0ff?style=for-the-badge)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-9d5cff?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20External%20Libs-00e676?style=for-the-badge)](https://github.com)
[![Status](https://img.shields.io/badge/Reactor%20Status-Online-00f0ff?style=for-the-badge)](https://github.com)

<p align="center">
  <em>“The future of energy is an engineering problem.”</em>
</p>

<p align="center">
  A high-fidelity, interactive tokamak fusion reactor engineering platform and physics simulation engine.<br>
  Built with <strong>100% pure HTML5, CSS3, and Vanilla JavaScript</strong> — zero external libraries, frameworks, or dependencies.
</p>

</div>

---

## 📌 Repository Overview

* **Primary Repository Name:** `fusion-x` (or `tokamak-fusion-engineering`)
* **Short Tagline / Description:**
  > An interactive nuclear fusion & tokamak engineering platform built in pure Vanilla JS. Features real-time 3D tokamak CAD inspection, particle kinetics with Larmor gyration, coupled Lawson criterion differential physics, multi-channel telemetry oscilloscope, and experimental flight scenarios.
* **Topics / Tags:**
  `nuclear-fusion`, `tokamak`, `plasma-physics`, `computational-physics`, `canvas-simulation`, `vanilla-javascript`, `web-audio-api`, `engineering-portfolio`, `iter`, `scientific-visualization`

---

## ⚡ Core Highlights & Capabilities

* **Full-Screen Cinematic Hero Gallery:** 6 photorealistic documentary-grade 16:9 images capturing the reactor core, magnetic flux helix, vacuum vessel, ion kinetics, cryogenics, and reactor facility hall with smooth timeline interpolation and procedural fallbacks.
* **Interactive 3D Tokamak Inspector (Canvas 2D Engine):**
  * Full 360° orbital drag & pitch rotation with mouse-wheel zoom.
  * Interactive **Exploded View** radial expansion slider.
  * Raycasting / 2D screen distance hit-testing for component selection (Toroidal Field Coils, Central Solenoid, Vacuum Vessel, Poloidal Coils, Divertor, and Plasma Torus).
  * Layer toggles to isolate internal sub-assemblies.
* **Plasma Kinetics Particle Simulation:**
  * 3,000+ charged particles (Deuterium, Tritium, Alpha ions) orbiting toroidal magnetic surfaces.
  * Real-time response to Temperature (10–200 MK), Density ($10^{20}\text{ m}^{-3}$), Confinement Time ($\tau_E$), and Neutral Beam Injection (NBI) heating power.
  * Live core-to-edge radial temperature profile monitor ($T(r)$).
* **Magnetic Confinement Topology & Particle Tracer:**
  * Helical flux lines dynamically modulated by the Safety Factor $q(r) = \frac{r B_\phi}{R B_\theta}$.
  * Guiding-center tracer simulating **Banana Orbits** (magnetic mirror trapping) and **Passing Orbits** (circulating ions).
* **Coupled Lawson Criterion Differential Physics Engine:**
  * Bosch-Hale parameterized D-T fusion reactivity $\langle \sigma v \rangle$.
  * Energy balance differential: $\frac{dW}{dt} = P_{aux} + P_\alpha - P_{loss} - P_{brems}$.
  * Troyon normalized beta limit ($\beta_N \le 3.5$) and Greenwald density limit ($n_G = \frac{I_p}{\pi a^2}$).
  * Real physical consequences: sudden **Thermal Disruptions** dump stored energy with klaxon alarms; achieving $Q \ge 10.0$ triggers **Thermonuclear Ignition**.
* **Industrial Control Room Telemetry:**
  * 60 FPS scrolling multi-channel oscilloscope tracking $T_i$, $P_{fus}$, Stability, and $Q$-factor.
  * Radial vector gauges for Divertor Heat Load ($\text{MW/m}^2$), Stored Thermal Energy ($\text{MJ}$), Cryostat Temperature ($4.22\text{ K}$), and Ultra-high vacuum ($10^{-9}\text{ mbar}$).
  * Poloidal equilibrium cross-section monitor displaying D-shape flux contours and X-point separatrix.
* **Experimental Mission Campaigns:**
  * 5 structured scenarios (Thermonuclear Ignition, High-Beta Stability, Greenwald Limit Flight, Advanced Confinement, Sustained Steady-State).
  * Real-time pass/fail evaluation, scoring engine (0–100%), and persistent `LocalStorage` run archive.
* **Web Audio API Procedural Acoustics:**
  * Synthesized 60Hz magnetic hum that shifts fundamental frequency with field ramp.
  * RF heating gyrotron whine, mechanical relay click chirps, and SCRAM klaxon siren.
* **Educational Research Hub:**
  * Interactive Lawson triple-product calculator ($n \cdot T \cdot \tau_E$).
  * Animated SVG diagrams explaining D-T mass defect energetics and the 6-stage tokamak pulse cycle.

---

## 🔬 Mathematical & Physics Formulation

### 1. Thermonuclear Power Generation
$$P_{fus} = \frac{1}{4} n^2 \langle \sigma v \rangle E_{fus} V$$

Where:
* $n$: Ion density ($n_D = n_T = \frac{1}{2} n_e$)
* $\langle \sigma v \rangle$: Bosch-Hale parameterized fusion cross-section
* $E_{fus} = 17.6 \text{ MeV} = 2.818 \times 10^{-12} \text{ Joules}$
* $V = 840 \text{ m}^3$: Plasma volume

### 2. Alpha Self-Heating & Net Power Differential
$$\frac{dW}{dt} = P_{aux} + P_\alpha - P_{loss} - P_{brems}$$

* Alpha power retained: $P_\alpha = 0.20 \cdot P_{fus}$
* Transport conduction loss: $P_{loss} = \frac{W}{\tau_E}$
* Bremsstrahlung radiation: $P_{brems} = 5.35 \times 10^{-37} Z_{eff} n_e^2 \sqrt{T_e} V$
* Energy gain factor: $Q = \frac{P_{fus}}{P_{aux}}$ (Ignition occurs when $Q \ge 10.0$ and $P_\alpha \ge P_{loss} + P_{brems}$)

### 3. Stability Boundaries
* **Troyon Beta Limit:** $\beta_N = \beta \frac{a B_0}{I_p} \le 3.50$ (Breaching triggers an MHD kink disruption)
* **Greenwald Density Limit:** $n_G = \frac{I_p}{\pi a^2}$ (Approaching $n/n_G > 1.15$ triggers radiative collapse)
* **Safety Factor:** $q(r) = \frac{r B_\phi}{R B_\theta}$ (Controls helical pitch and prevents tearing modes)

---

## 🗂️ Project Structure

```
fusion-x/
├── index.html                  # Semantic, accessible HTML5 platform layout
├── README.md                   # Project documentation & engineering specs
├── css/
│   ├── main.css                # Industrial tokens, metallic palette, typography
│   ├── hero.css                # 6-slide cinematic carousel & timeline
│   ├── reactor.css             # 3D tokamak inspector viewport & layer toggles
│   ├── plasma.css              # Particle simulation controls & HUD
│   ├── magnetic.css            # Field lines & particle tracing controls
│   ├── simulation.css          # Control desk console, gauges, SCRAM triggers
│   ├── telemetry.css           # 60fps oscilloscope & D-shape flux monitor
│   ├── experiments.css         # 5 mission cards & LocalStorage archive
│   └── research.css            # Interactive SVG diagrams & Lawson calculator
└── js/
    ├── core/
    │   ├── app.js              # Application lifecycle, scroll spies, shortcuts
    │   ├── audio.js            # Web Audio API procedural synthesizer
    │   └── carousel.js         # Hero carousel controller & procedural fallback
    ├── visuals/
    │   ├── tokamak-canvas.js   # Pure Canvas 2D isometric 3D CAD inspector
    │   ├── plasma-sim.js       # 3,000+ ion kinetic particle simulation
    │   └── magnetic-sim.js     # Helical flux line & banana orbit simulator
    ├── engine/
    │   ├── fusion-physics.js   # Coupled differential Lawson criterion solver
    │   └── telemetry-graphs.js # 60fps oscilloscope & cross-section renderer
    └── modules/
        ├── experiments.js      # Mission campaigns & LocalStorage persistence
        └── research.js         # Interactive physics explainers & calculators
```

---

## ⌨️ Operator Keyboard Shortcuts

| Shortcut | Action | Description |
| :---: | :--- | :--- |
| <kbd>SPACE</kbd> | **Start / Pause** | Toggle simulation differential integration loop |
| <kbd>R</kbd> | **Reset** | Reset reactor parameters to cold vacuum standby |
| <kbd>S</kbd> | **Emergency SCRAM** | Instant fast shutdown; activates safety killer pellets |
| <kbd>M</kbd> | **Audio Mute** | Toggle Web Audio procedural reactor acoustics |
| <kbd>1</kbd>–<kbd>6</kbd> | **Slide Jump** | Jump directly to any of the 6 hero carousel slides |



## 📋 Engineering Specifications (FUSION-X Tokamak)

| Parameter | Value | Engineering Significance |
| :--- | :--- | :--- |
| **Major Radius ($R_0$)** | 6.20 m | Central axis distance to plasma center |
| **Minor Radius ($a$)** | 2.00 m | Plasma cross-sectional horizontal radius |
| **Plasma Volume ($V$)** | 840 m³ | Total reacting volume within vacuum vessel |
| **On-Axis Field ($B_0$)** | 5.30 T | Azimuthal field from 18 superconducting TF coils |
| **Conductor Peak Field** | 11.80 T | Maximum magnetic field at coil surface |
| **Plasma Current ($I_p$)** | 15.0 MA | Inductively driven toroidal current |
| **Design Thermal Output** | 500 MW | Rated fusion thermal power generation |
| **Energy Confinement ($\tau_E$)** | 3.80 s | Energy retention time across transport barriers |
| **Divertor Peak Heat Flux** | 20 MW/m² | Handled via tungsten monoblock water cooling |

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, study, modify, and integrate it into your own research or portfolio projects.
