/**
 * FUSION-X MASTER APPLICATION COORDINATOR
 * - Component lifecycle init
 * - Viewport IntersectionObservers for performance (pauses off-screen canvases)
 * - Navigation scroll spies & mobile menu
 * - Audio controller toggle
 * - Global keyboard shortcuts
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Core Audio
  const audioBtn = document.getElementById('globalAudioToggle');
  if (audioBtn && window.FusionAudio) {
    if (!window.FusionAudio.isMuted) {
      audioBtn.classList.add('active');
    }
    audioBtn.addEventListener('click', () => {
      const muted = window.FusionAudio.toggleMute();
      audioBtn.classList.toggle('active', !muted);
    });
  }

  // 2. Initialize Hero Carousel
  if (window.HeroCarousel) {
    window.HeroCarousel.init();
  }

  // 3. Initialize Visualizations
  if (window.TokamakCanvas) window.TokamakCanvas.init();
  if (window.PlasmaSimulation) window.PlasmaSimulation.init();
  if (window.MagneticSimulation) window.MagneticSimulation.init();
  if (window.TelemetryVisualizer) window.TelemetryVisualizer.init();
  if (window.ExperimentManager) window.ExperimentManager.init();
  if (window.ResearchHub) window.ResearchHub.init();

  // 4. Setup Simulation Engine Step Timer
  setInterval(() => {
    if (window.FusionEngine) {
      window.FusionEngine.step();
    }
  }, 50); // 20 Hz physical differential integration

  // Wire Simulation Console Controls
  const btnStart = document.getElementById('simStartBtn');
  const btnPause = document.getElementById('simPauseBtn');
  const btnReset = document.getElementById('simResetBtn');
  const btnScram = document.getElementById('simScramBtn');

  if (btnStart) btnStart.addEventListener('click', () => window.FusionEngine?.start());
  if (btnPause) btnPause.addEventListener('click', () => window.FusionEngine?.pause());
  if (btnReset) btnReset.addEventListener('click', () => window.FusionEngine?.reset());
  if (btnScram) btnScram.addEventListener('click', () => window.FusionEngine?.scram());

  // Wire Simulation Input Sliders
  const auxSlider = document.getElementById('simAuxHeatSlider');
  const densSlider = document.getElementById('simDensitySlider');
  const bFieldSlider = document.getElementById('simBFieldSlider');
  const currentSlider = document.getElementById('simCurrentSlider');

  if (auxSlider) {
    auxSlider.addEventListener('input', (e) => {
      if (window.FusionEngine) {
        window.FusionEngine.pAuxMW = parseFloat(e.target.value);
        const valEl = document.getElementById('simAuxHeatVal');
        if (valEl) valEl.textContent = `${window.FusionEngine.pAuxMW} MW`;
      }
    });
  }

  if (densSlider) {
    densSlider.addEventListener('input', (e) => {
      if (window.FusionEngine) {
        window.FusionEngine.densityE20 = parseFloat(e.target.value);
        const valEl = document.getElementById('simDensityVal');
        if (valEl) valEl.textContent = `${window.FusionEngine.densityE20.toFixed(1)} × 10²⁰ m⁻³`;
      }
    });
  }

  if (bFieldSlider) {
    bFieldSlider.addEventListener('input', (e) => {
      if (window.FusionEngine) {
        window.FusionEngine.bFieldTesla = parseFloat(e.target.value);
        const valEl = document.getElementById('simBFieldVal');
        if (valEl) valEl.textContent = `${window.FusionEngine.bFieldTesla.toFixed(1)} T`;
      }
    });
  }

  if (currentSlider) {
    currentSlider.addEventListener('input', (e) => {
      if (window.FusionEngine) {
        window.FusionEngine.plasmaCurrentMA = parseFloat(e.target.value);
        const valEl = document.getElementById('simCurrentVal');
        if (valEl) valEl.textContent = `${window.FusionEngine.plasmaCurrentMA.toFixed(1)} MA`;
      }
    });
  }

  // 5. Sticky Navbar on Scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (navbar) {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > 40);
    }
    updateActiveNavSpy();
  }, { passive: true });

  // 6. Navigation Active Spy
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveNavSpy() {
    let currentId = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  // 7. Mobile Navigation Toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // 8. IntersectionObserver for Optimized Canvas Performance
  // Automatically pauses simulation draw loops when sections are not visible on screen!
  const canvasObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const visible = entry.isIntersecting;

      if (id === 'reactor' && window.TokamakCanvas) window.TokamakCanvas.isVisible = visible;
      if (id === 'plasma' && window.PlasmaSimulation) window.PlasmaSimulation.isVisible = visible;
      if (id === 'magnetic' && window.MagneticSimulation) window.MagneticSimulation.isVisible = visible;
      if (id === 'telemetry' && window.TelemetryVisualizer) window.TelemetryVisualizer.isVisible = visible;
    });
  }, { threshold: 0.1 });

  sections.forEach(sec => canvasObserver.observe(sec));

  // 9. Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (window.FusionEngine) {
        if (window.FusionEngine.isRunning) window.FusionEngine.pause();
        else window.FusionEngine.start();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      window.FusionEngine?.reset();
    } else if (e.key === 's' || e.key === 'S') {
      window.FusionEngine?.scram('OPERATOR KEYBOARD SCRAM [S]');
    } else if (e.key === 'm' || e.key === 'M') {
      if (audioBtn) audioBtn.click();
    }
  });
});
