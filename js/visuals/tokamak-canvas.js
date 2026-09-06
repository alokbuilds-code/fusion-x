/**
 * FUSION-X TOKAMAK 3D INSPECTOR (Pure Canvas 2D)
 * Zero external 3D libraries. Custom 3D perspective projection engine,
 * interactive orbit controls, exploded view animation, layer filtering,
 * and component click raycasting/hit-testing.
 */

class TokamakCanvas {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.pixelRatio = window.devicePixelRatio || 1;

    // Camera & Orbit State
    this.yaw = 0.65;      // Rotation around Y axis
    this.pitch = 0.38;    // Rotation around X axis
    this.targetYaw = 0.65;
    this.targetPitch = 0.38;
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.panX = 0;
    this.panY = 0;

    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.autoRotate = true;
    this.explodedFactor = 0; // 0 = assembled, 1 = fully expanded
    this.targetExplodedFactor = 0;

    // Active Highlighted Component
    this.selectedComponent = "toroidal_coils";
    this.hoveredComponent = null;

    // Component Layer Visibilities
    this.layers = {
      tf_coils: true,
      pf_coils: true,
      solenoid: true,
      vacuum_vessel: true,
      plasma: true,
      divertor: true,
      cryostat: false
    };

    // Component Database & Engineering Dossiers
    this.componentsData = {
      vacuum_vessel: {
        id: "vacuum_vessel",
        tag: "PRIMARY CONFINEMENT ENVELOPE",
        name: "Double-Walled Vacuum Vessel",
        desc: "D-shaped toroidal stainless steel (316L(N)-IG) vessel maintained at ultra-high vacuum (< 10⁻⁹ mbar). Shields the superconducting magnets from 14.1 MeV fusion neutrons using borated steel water-cooled shielding blocks.",
        specs: {
          "Material": "SS 316L(N)-IG Titanium Stabilized",
          "Base Vacuum": "1.2 × 10⁻⁹ mbar",
          "Cooling Medium": "Pressurized Water (150°C, 3 MPa)",
          "Inner Major Radius": "6.20 m",
          "Minor Radius (a)": "2.00 m",
          "Neutron Shielding": "Borated Demineralized Water"
        }
      },
      toroidal_coils: {
        id: "toroidal_coils",
        tag: "AZIMUTHAL MAGNETIC CAGE",
        name: "Toroidal Field (TF) Coils",
        desc: "Set of 18 giant D-shaped superconducting coils wound with Niobium-Tin (Nb₃Sn) cables. Generates the primary azimuthal magnetic field (5.3 Tesla on axis, 11.8 Tesla peak at coil conductor) to confine charged plasma particles.",
        specs: {
          "Conductor Type": "Nb₃Sn Cable-in-Conduit",
          "Coil Count": "18 D-shaped segments",
          "Operating Temp": "4.5 K (-268.65°C, Liquid Helium)",
          "On-Axis Field": "5.3 Tesla",
          "Peak Field at Wire": "11.8 Tesla",
          "Operating Current": "68,000 Amperes"
        }
      },
      central_solenoid: {
        id: "central_solenoid",
        tag: "INDUCTIVE TRANSFORMER CORE",
        name: "Central Solenoid",
        desc: "The heartbeat of the tokamak. Acts as the primary transformer winding, pulsing a massive magnetic flux swing (up to 130 Volt-seconds) to induce and sustain up to 15 Mega-Amperes of toroidal plasma current.",
        specs: {
          "Module Count": "6 Independent Vertical Stacks",
          "Magnetic Energy": "6.4 Giga-Joules",
          "Conductor Material": "Nb₃Sn High-Field Superconductor",
          "Flux Swing Capability": "130 Volt-seconds",
          "Max Electromagnetic Force": "460 MN (Pull-apart force)",
          "Peak Operating Field": "13.0 Tesla"
        }
      },
      poloidal_coils: {
        id: "poloidal_coils",
        tag: "EQUILIBRIUM & SHAPING SYSTEM",
        name: "Poloidal Field (PF) Coils",
        desc: "Six horizontal superconducting ring coils positioned outside the TF coils. Controls plasma vertical stability, elongation (κ ≈ 1.85), triangularity (δ ≈ 0.45), and positions the magnetic X-point for divertor detachment.",
        specs: {
          "Conductor Material": "NbTi Superconducting Cable",
          "Diameter Range": "8.0 m to 24.0 m",
          "Total PF Current": "Up to 45 Mega-Ampere-turns",
          "Operating Temp": "4.5 K (Supercritical Helium)",
          "Positioning Precision": "± 5 mm active feedback",
          "Response Time": "15 milliseconds"
        }
      },
      plasma_ring: {
        id: "plasma_ring",
        tag: "FUSING STAR CORE",
        name: "Deuterium-Tritium Burning Plasma",
        desc: "Fully ionized D-T fuel heated to 150 Million °C (10× hotter than the Sun's core). Trapped on helical magnetic flux surfaces where deuterium and tritium nuclei undergo thermonuclear fusion to yield helium-4 ash and 14.1 MeV neutrons.",
        specs: {
          "Core Ion Temperature": "150–200 Million K (~15 keV)",
          "Core Electron Density": "1.0 × 10²⁰ m⁻³",
          "Energy Confinement (τ_E)": "3.80 seconds",
          "Fusion Power Output": "500 MW thermal",
          "Amplification (Q)": "≥ 10 (Target)",
          "Plasma Volume": "840 m³"
        }
      },
      divertor: {
        id: "divertor",
        tag: "EXHAUST & IMPURITY ASH REMOVAL",
        name: "Tungsten Divertor Cassettes",
        desc: "Located at the bottom of the vacuum chamber, handling the most extreme continuous thermal load in human engineering (up to 20 MW/m²). Extracts helium fusion ash, neutral impurities, and unburned fuel through cryogenic vacuum pumps.",
        specs: {
          "Armour Material": "Tungsten (W) Monoblocks",
          "Heat Flux Capacity": "20 MW/m² (Exceeds rocket nozzle)",
          "Cassette Count": "54 Replaceable Modules",
          "Exhaust Medium": "Liquid Helium Cryopump Array",
          "Strike Point Temp": "Up to 1,400°C steady-state",
          "Maintenance": "100% Robotic Remote Handling"
        }
      }
    };

    this.projectedPoints = [];
    this.animId = null;
    this.isVisible = true;
  }

  init() {
    this.canvas = document.getElementById('tokamakCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.handleResize();
    this.attachEvents();
    this.updateDossier(this.selectedComponent);

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
    const container = this.canvas.parentElement;

    // Mouse Controls
    container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) {
        this.handleHover(e);
        return;
      }

      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;

      this.targetYaw += dx * 0.007;
      this.targetPitch += dy * 0.007;

      // Restrict pitch angle to avoid flip
      this.targetPitch = Math.max(-1.1, Math.min(1.1, this.targetPitch));

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch Controls
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;

      this.targetYaw += dx * 0.009;
      this.targetPitch += dy * 0.009;
      this.targetPitch = Math.max(-1.1, Math.min(1.1, this.targetPitch));

      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
    }, { passive: true });

    container.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Mouse Wheel Zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.0015;
      this.targetZoom = Math.max(0.6, Math.min(1.8, this.targetZoom + delta));
    }, { passive: false });

    // Click Detection for Component Raycasting
    container.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      this.handleClick(mouseX, mouseY);
    });

    // Exploded View Slider
    const explodeSlider = document.getElementById('tokamakExplodeSlider');
    if (explodeSlider) {
      explodeSlider.addEventListener('input', (e) => {
        this.targetExplodedFactor = parseFloat(e.target.value);
        if (window.FusionAudio) window.FusionAudio.playRelayClick();
      });
    }

    // Auto-Rotate Button
    const autoRotateBtn = document.getElementById('tokamakAutoRotateBtn');
    if (autoRotateBtn) {
      autoRotateBtn.addEventListener('click', () => {
        this.autoRotate = !this.autoRotate;
        autoRotateBtn.classList.toggle('active', this.autoRotate);
        if (window.FusionAudio) window.FusionAudio.playRelayClick();
      });
    }

    // Reset View Button
    const resetViewBtn = document.getElementById('tokamakResetViewBtn');
    if (resetViewBtn) {
      resetViewBtn.addEventListener('click', () => {
        this.targetYaw = 0.65;
        this.targetPitch = 0.38;
        this.targetZoom = 1.0;
        this.targetExplodedFactor = 0;
        if (explodeSlider) explodeSlider.value = 0;
        if (window.FusionAudio) window.FusionAudio.playRelayClick();
      });
    }

    // Layer Toggle Buttons
    const layerButtons = document.querySelectorAll('.layer-toggle-btn');
    layerButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const layerKey = btn.dataset.layer;
        if (layerKey && this.layers.hasOwnProperty(layerKey)) {
          this.layers[layerKey] = !this.layers[layerKey];
          btn.classList.toggle('active', this.layers[layerKey]);
          if (window.FusionAudio) window.FusionAudio.playRelayClick();
        }
      });
    });

    // Component Selector Nav Items
    const compNavItems = document.querySelectorAll('.component-nav-item');
    compNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const compId = item.dataset.component;
        if (compId) {
          this.selectComponent(compId);
          if (window.FusionAudio) window.FusionAudio.playRelayClick();
        }
      });
    });
  }

  handleHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closest = null;
    let minDist = 35; // Pixel threshold

    for (const pt of this.projectedPoints) {
      const dist = Math.hypot(pt.screenX - mouseX, pt.screenY - mouseY);
      if (dist < minDist) {
        minDist = dist;
        closest = pt.componentId;
      }
    }

    this.hoveredComponent = closest;
    this.canvas.style.cursor = closest ? 'pointer' : (this.isDragging ? 'grabbing' : 'grab');
  }

  handleClick(mouseX, mouseY) {
    let closest = null;
    let minDist = 40;

    for (const pt of this.projectedPoints) {
      const dist = Math.hypot(pt.screenX - mouseX, pt.screenY - mouseY);
      if (dist < minDist) {
        minDist = dist;
        closest = pt.componentId;
      }
    }

    if (closest) {
      this.selectComponent(closest);
      if (window.FusionAudio) window.FusionAudio.playRelayClick();
    }
  }

  selectComponent(componentId) {
    this.selectedComponent = componentId;
    this.updateDossier(componentId);

    // Update nav list highlighting
    const compNavItems = document.querySelectorAll('.component-nav-item');
    compNavItems.forEach(item => {
      item.classList.toggle('active', item.dataset.component === componentId);
    });
  }

  updateDossier(componentId) {
    const comp = this.componentsData[componentId];
    if (!comp) return;

    const tagEl = document.getElementById('compInspectTag');
    const titleEl = document.getElementById('compInspectTitle');
    const descEl = document.getElementById('compInspectDesc');
    const metricsGrid = document.getElementById('compInspectMetrics');

    if (tagEl) tagEl.textContent = comp.tag;
    if (titleEl) titleEl.textContent = comp.name;
    if (descEl) descEl.textContent = comp.desc;

    if (metricsGrid) {
      metricsGrid.innerHTML = '';
      for (const [label, val] of Object.entries(comp.specs)) {
        const item = document.createElement('div');
        item.className = 'component-metric-item';
        item.innerHTML = `
          <div class="component-metric-label">${label}</div>
          <div class="component-metric-value">${val}</div>
        `;
        metricsGrid.appendChild(item);
      }
    }
  }

  // 3D Perspective Projection Function
  project(x, y, z) {
    // 1. Yaw Rotation around Y axis
    const cosY = Math.cos(this.yaw);
    const sinY = Math.sin(this.yaw);
    const x1 = x * cosY + z * sinY;
    const y1 = y;
    const z1 = -x * sinY + z * cosY;

    // 2. Pitch Rotation around X axis
    const cosP = Math.cos(this.pitch);
    const sinP = Math.sin(this.pitch);
    const x2 = x1;
    const y2 = y1 * cosP - z1 * sinP;
    const z2 = y1 * sinP + z1 * cosP;

    // 3. Perspective Projection
    const fov = 750 * this.zoom;
    const cameraDistance = 900;
    const zDist = z2 + cameraDistance;

    const scale = fov / Math.max(zDist, 100);
    const screenX = (x2 * scale) + (this.width / 2) + this.panX;
    const screenY = (y2 * scale) + (this.height / 2) + this.panY;

    return {
      x: screenX,
      y: screenY,
      z: z2,
      scale: scale
    };
  }

  loop() {
    this.animId = requestAnimationFrame(() => this.loop());
    if (!this.isVisible) return;

    // Smooth Interpolation of Orbit and Exploded slider
    this.yaw += (this.targetYaw - this.yaw) * 0.1;
    this.pitch += (this.targetPitch - this.pitch) * 0.1;
    this.zoom += (this.targetZoom - this.zoom) * 0.1;
    this.explodedFactor += (this.targetExplodedFactor - this.explodedFactor) * 0.08;

    if (this.autoRotate && !this.isDragging) {
      this.targetYaw += 0.003;
    }

    this.render();
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.pixelRatio, this.pixelRatio);
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw Subtle Coordinate Grid Floor
    this.drawFloorGrid();

    // Reset projected click test points
    this.projectedPoints = [];

    // Collect all renderable elements with depth Z for sorting
    const renderQueue = [];

    // 1. Central Solenoid
    if (this.layers.solenoid) {
      this.buildSolenoidGeometry(renderQueue);
    }

    // 2. Divertor Cassettes
    if (this.layers.divertor) {
      this.buildDivertorGeometry(renderQueue);
    }

    // 3. Toroidal Field Coils (18 Segments)
    if (this.layers.tf_coils) {
      this.buildTFCoilsGeometry(renderQueue);
    }

    // 4. Poloidal Field Coils (6 Rings)
    if (this.layers.pf_coils) {
      this.buildPFCoilsGeometry(renderQueue);
    }

    // 5. Vacuum Vessel Shell
    if (this.layers.vacuum_vessel) {
      this.buildVacuumVesselGeometry(renderQueue);
    }

    // 6. Plasma Torus
    if (this.layers.plasma) {
      this.buildPlasmaRingGeometry(renderQueue);
    }

    // Depth Sort: Painter's Algorithm (farthest Z first)
    renderQueue.sort((a, b) => a.z - b.z);

    // Execute render commands in sorted order
    for (const item of renderQueue) {
      item.draw(ctx);
    }

    ctx.restore();
  }

  drawFloorGrid() {
    const ctx = this.ctx;
    const gridSize = 700;
    const step = 70;
    const floorY = 240;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    for (let x = -gridSize; x <= gridSize; x += step) {
      const p1 = this.project(x, floorY, -gridSize);
      const p2 = this.project(x, floorY, gridSize);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (let z = -gridSize; z <= gridSize; z += step) {
      const p1 = this.project(-gridSize, floorY, z);
      const p2 = this.project(gridSize, floorY, z);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // --- GEOMETRY BUILDERS ---

  buildSolenoidGeometry(queue) {
    const radius = 60;
    const height = 300;
    const slices = 24;
    const isSelected = this.selectedComponent === 'central_solenoid';
    const isHovered = this.hoveredComponent === 'central_solenoid';

    const pCenter = this.project(0, 0, 0);
    this.projectedPoints.push({ screenX: pCenter.x, screenY: pCenter.y, componentId: 'central_solenoid' });

    queue.push({
      z: pCenter.z,
      draw: (ctx) => {
        // Draw Stacked Stack of 6 Solenoid Pancakes
        for (let s = -2.5; s <= 2.5; s += 1.0) {
          const yPos = s * (height / 6);
          const topPts = [];
          const btmPts = [];

          for (let i = 0; i < slices; i++) {
            const th = (i / slices) * Math.PI * 2;
            const x = Math.cos(th) * radius;
            const z = Math.sin(th) * radius;
            topPts.push(this.project(x, yPos - 20, z));
            btmPts.push(this.project(x, yPos + 20, z));
          }

          // Cylinder body
          ctx.fillStyle = isSelected ? 'rgba(0, 240, 255, 0.5)' : (isHovered ? 'rgba(100, 200, 255, 0.35)' : '#1a2436');
          ctx.strokeStyle = isSelected ? '#00f0ff' : '#334866';
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          for (let i = 0; i < slices; i++) {
            const next = (i + 1) % slices;
            ctx.moveTo(topPts[i].x, topPts[i].y);
            ctx.lineTo(topPts[next].x, topPts[next].y);
            ctx.lineTo(btmPts[next].x, btmPts[next].y);
            ctx.lineTo(btmPts[i].x, btmPts[i].y);
          }
          ctx.fill();
          ctx.stroke();
        }
      }
    });
  }

  buildTFCoilsGeometry(queue) {
    const numCoils = 18;
    const isSelected = this.selectedComponent === 'toroidal_coils';
    const isHovered = this.hoveredComponent === 'toroidal_coils';
    const explode = this.explodedFactor * 140;

    for (let i = 0; i < numCoils; i++) {
      const angle = (i / numCoils) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Radially shifted position in exploded view
      const exX = cosA * explode;
      const exZ = sinA * explode;

      // Generate D-shaped coil points in local 2D plane (r, y)
      // D-shape: straight inner leg at r1, outer elliptical arc to r2
      const coilPoints3D = [];
      const rInner = 80;
      const rOuter = 260;
      const halfHeight = 180;

      // Inner vertical leg
      for (let y = -halfHeight; y <= halfHeight; y += 40) {
        coilPoints3D.push({ x: cosA * rInner + exX, y: y, z: sinA * rInner + exZ });
      }

      // Outer D-shaped arc
      for (let a = -Math.PI / 2; a <= Math.PI / 2; a += Math.PI / 10) {
        const r = rInner + (rOuter - rInner) * Math.cos(a);
        const y = Math.sin(a) * halfHeight;
        coilPoints3D.push({ x: cosA * r + exX, y: y, z: sinA * r + exZ });
      }

      const projected = coilPoints3D.map(pt => this.project(pt.x, pt.y, pt.z));
      const avgZ = projected.reduce((acc, p) => acc + p.z, 0) / projected.length;

      // Store representative click-test centroid
      if (i % 3 === 0) {
        const mid = projected[Math.floor(projected.length / 2)];
        this.projectedPoints.push({ screenX: mid.x, screenY: mid.y, componentId: 'toroidal_coils' });
      }

      queue.push({
        z: avgZ,
        draw: (ctx) => {
          ctx.beginPath();
          ctx.moveTo(projected[0].x, projected[0].y);
          for (let p = 1; p < projected.length; p++) {
            ctx.lineTo(projected[p].x, projected[p].y);
          }
          ctx.closePath();

          ctx.strokeStyle = isSelected ? '#00f0ff' : (isHovered ? '#38bdf8' : 'rgba(74, 100, 138, 0.7)');
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.fillStyle = isSelected ? 'rgba(0, 240, 255, 0.08)' : 'rgba(15, 23, 42, 0.3)';
          ctx.fill();
          ctx.stroke();
        }
      });
    }
  }

  buildPFCoilsGeometry(queue) {
    const isSelected = this.selectedComponent === 'poloidal_coils';
    const isHovered = this.hoveredComponent === 'poloidal_coils';
    const explode = this.explodedFactor * 100;

    // 6 Poloidal ring coils [radius, y]
    const rings = [
      { r: 275 + explode, y: -190 },
      { r: 295 + explode, y: -90 },
      { r: 295 + explode, y: 90 },
      { r: 275 + explode, y: 190 },
      { r: 120, y: -205 },
      { r: 120, y: 205 }
    ];

    rings.forEach((ring, idx) => {
      const pts = [];
      const steps = 32;
      for (let i = 0; i <= steps; i++) {
        const th = (i / steps) * Math.PI * 2;
        pts.push(this.project(Math.cos(th) * ring.r, ring.y, Math.sin(th) * ring.r));
      }

      const avgZ = pts.reduce((acc, p) => acc + p.z, 0) / pts.length;

      if (idx === 1) {
        this.projectedPoints.push({ screenX: pts[0].x, screenY: pts[0].y, componentId: 'poloidal_coils' });
      }

      queue.push({
        z: avgZ,
        draw: (ctx) => {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let p = 1; p < pts.length; p++) {
            ctx.lineTo(pts[p].x, pts[p].y);
          }
          ctx.strokeStyle = isSelected ? '#ffaa00' : (isHovered ? '#ffd166' : '#2dd4bf');
          ctx.lineWidth = isSelected ? 4 : 2.5;
          ctx.stroke();
        }
      });
    });
  }

  buildVacuumVesselGeometry(queue) {
    const isSelected = this.selectedComponent === 'vacuum_vessel';
    const isHovered = this.hoveredComponent === 'vacuum_vessel';
    const explode = this.explodedFactor * 60;

    // D-shaped Toroidal Shell (Render half-shell cutaway to show inside)
    const torR = 175; // Major radius of torus
    const minR = 65;  // Minor radius of torus
    const numPhi = 16;
    const numTheta = 12;

    // Render partial cutaway (leave 120 degree sector open so plasma is visible!)
    for (let i = 0; i < numPhi - 4; i++) {
      const phi1 = (i / numPhi) * Math.PI * 2;
      const phi2 = ((i + 1) / numPhi) * Math.PI * 2;

      for (let j = 0; j < numTheta; j++) {
        const th1 = (j / numTheta) * Math.PI * 2;
        const th2 = ((j + 1) / numTheta) * Math.PI * 2;

        const getPt = (phi, th) => {
          const r = torR + (minR * Math.cos(th)) + (explode * 0.4);
          const y = (minR * 1.5 * Math.sin(th));
          return this.project(Math.cos(phi) * r, y, Math.sin(phi) * r);
        };

        const p1 = getPt(phi1, th1);
        const p2 = getPt(phi2, th1);
        const p3 = getPt(phi2, th2);
        const p4 = getPt(phi1, th2);

        const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;

        if (i === 3 && j === 3) {
          this.projectedPoints.push({ screenX: p1.x, screenY: p1.y, componentId: 'vacuum_vessel' });
        }

        queue.push({
          z: avgZ,
          draw: (ctx) => {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();

            ctx.fillStyle = isSelected ? 'rgba(0, 240, 255, 0.25)' : (isHovered ? 'rgba(71, 85, 105, 0.35)' : 'rgba(20, 28, 42, 0.4)');
            ctx.strokeStyle = isSelected ? '#00f0ff' : 'rgba(90, 115, 148, 0.3)';
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();
          }
        });
      }
    }
  }

  buildDivertorGeometry(queue) {
    const isSelected = this.selectedComponent === 'divertor';
    const isHovered = this.hoveredComponent === 'divertor';
    const yBottom = 95;
    const rDivInner = 130;
    const rDivOuter = 195;
    const sectors = 24;

    const pMid = this.project((rDivInner + rDivOuter) / 2, yBottom, 0);
    this.projectedPoints.push({ screenX: pMid.x, screenY: pMid.y, componentId: 'divertor' });

    queue.push({
      z: pMid.z,
      draw: (ctx) => {
        for (let s = 0; s < sectors; s++) {
          const th1 = (s / sectors) * Math.PI * 2;
          const th2 = ((s + 0.85) / sectors) * Math.PI * 2;

          const p1 = this.project(Math.cos(th1) * rDivInner, yBottom, Math.sin(th1) * rDivInner);
          const p2 = this.project(Math.cos(th1) * rDivOuter, yBottom + 12, Math.sin(th1) * rDivOuter);
          const p3 = this.project(Math.cos(th2) * rDivOuter, yBottom + 12, Math.sin(th2) * rDivOuter);
          const p4 = this.project(Math.cos(th2) * rDivInner, yBottom, Math.sin(th2) * rDivInner);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();

          ctx.fillStyle = isSelected ? 'rgba(255, 170, 0, 0.5)' : (isHovered ? 'rgba(255, 200, 100, 0.35)' : '#334155');
          ctx.strokeStyle = isSelected ? '#ffaa00' : '#475569';
          ctx.lineWidth = 1.2;
          ctx.fill();
          ctx.stroke();
        }
      }
    });
  }

  buildPlasmaRingGeometry(queue) {
    const isSelected = this.selectedComponent === 'plasma_ring';
    const isHovered = this.hoveredComponent === 'plasma_ring';
    const majorR = 175;
    const minorR = 45;
    const steps = 36;

    // Centroid for click testing
    const pCenter = this.project(majorR, 0, 0);
    this.projectedPoints.push({ screenX: pCenter.x, screenY: pCenter.y, componentId: 'plasma_ring' });

    // Multi-pass glowing torus
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const phi = (i / steps) * Math.PI * 2;
      pts.push(this.project(Math.cos(phi) * majorR, 0, Math.sin(phi) * majorR));
    }

    const avgZ = pts.reduce((acc, p) => acc + p.z, 0) / pts.length;

    queue.push({
      z: avgZ,
      draw: (ctx) => {
        // Outer volumetric glow
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();

        ctx.strokeStyle = 'rgba(157, 92, 255, 0.35)';
        ctx.lineWidth = minorR * 1.5 * this.zoom;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Inner hot core
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();

        ctx.strokeStyle = isSelected ? '#ffffff' : (isHovered ? '#e0f2fe' : 'rgba(0, 240, 255, 0.85)');
        ctx.lineWidth = (minorR * 0.75) * this.zoom;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });
  }
}

window.TokamakCanvas = new TokamakCanvas();
