/**
 * FUSION-X HERO CINEMATIC CAROUSEL
 * 6-Slide cinematic documentary presentation with smooth crossfades,
 * interactive timeline, keyboard controls, and robust image fallback.
 */

class HeroCarousel {
  constructor() {
    this.slides = [
      {
        id: "01",
        title: "REACTOR CORE",
        tag: "TOROIDAL VACUUM VESSEL / SECTOR 04",
        desc: "Interior view of the D-shaped vacuum chamber armored with tungsten armor tiles, containing the 150-million-degree deuterium-tritium plasma ring.",
        primarySrc: "../../.gemini/antigravity/brain/d380f82b-20ce-4bb2-8ded-caf12a08ff6d/fusion_reactor_core_1788678257011.jpg",
        altSrc: "assets/images/01_reactor_core.jpg",
        themeColor: "#00f0ff"
      },
      {
        id: "02",
        title: "MAGNETIC CONFINEMENT",
        tag: "HELICAL FLUX TOPOLOGY / 5.3 TESLA",
        desc: "Macro view of high-energy plasma filaments guided along helical magnetic flux surfaces created by the superposition of toroidal and poloidal fields.",
        primarySrc: "../../.gemini/antigravity/brain/d380f82b-20ce-4bb2-8ded-caf12a08ff6d/magnetic_confinement_1788678270976.jpg",
        altSrc: "assets/images/02_magnetic_confinement.jpg",
        themeColor: "#9d5cff"
      },
      {
        id: "03",
        title: "TOKAMAK CHAMBER",
        tag: "PRIMARY CRYOGENIC ENVELOPE / 840 M³",
        desc: "The massive stainless-steel cryostat enclosing 18 D-shaped superconducting toroidal field coils, port plugs, and structural support gravity columns.",
        primarySrc: "../../.gemini/antigravity/brain/d380f82b-20ce-4bb2-8ded-caf12a08ff6d/tokamak_chamber_1788678286999.jpg",
        altSrc: "assets/images/03_tokamak_chamber.jpg",
        themeColor: "#00e676"
      },
      {
        id: "04",
        title: "PLASMA KINETICS",
        tag: "DEUTERIUM-TRITIUM ION DYNAMICS",
        desc: "Microscopic visualization of thermalized ions and electrons undergoing Coulomb collisions and overcoming electrostatic repulsion to fuse.",
        primarySrc: "../../.gemini/antigravity/brain/d380f82b-20ce-4bb2-8ded-caf12a08ff6d/plasma_particles_1788678307231.jpg",
        altSrc: "assets/images/04_plasma_particles.jpg",
        themeColor: "#00f0ff"
      },
      {
        id: "05",
        title: "ENGINEERING SYSTEMS",
        tag: "SUPERCONDUCTING MAGNETS & CRYO-DISTRIBUTION",
        desc: "Sub-4-Kelvin liquid helium distribution manifolds, high-current copper busbars, and multi-channel fiber-optic magnetic diagnostic probes.",
        primarySrc: "../../.gemini/antigravity/brain/d380f82b-20ce-4bb2-8ded-caf12a08ff6d/engineering_systems_1788678345960.jpg",
        altSrc: "assets/images/05_engineering_systems.jpg",
        themeColor: "#ffaa00"
      },
      {
        id: "06",
        title: "FUSION FACILITY",
        tag: "EXPERIMENTAL TOKAMAK HALL & BIOSHIELD",
        desc: "Cavernous reactor complex featuring 3.5-meter concrete biological shielding, 750-ton gantry cranes, and high-voltage power conversion bays.",
        primarySrc: "../../.gemini/antigravity/brain/d380f82b-20ce-4bb2-8ded-caf12a08ff6d/fusion_facility_1788678361127.jpg",
        altSrc: "assets/images/06_fusion_facility.jpg",
        themeColor: "#38bdf8"
      }
    ];

    this.currentIndex = 0;
    this.intervalDuration = 7000;
    this.startTime = Date.now();
    this.timerId = null;
    this.animFrameId = null;
    this.isPaused = false;

    // DOM Elements
    this.slidesContainer = null;
    this.progressFill = null;
    this.counterCurrent = null;
    this.counterTotal = null;
    this.slideTag = null;
    this.slideTitle = null;
    this.slideDesc = null;
    this.dotsContainer = null;
  }

  init() {
    this.slidesContainer = document.getElementById('heroCarouselSlides');
    this.progressFill = document.getElementById('carouselProgressFill');
    this.counterCurrent = document.getElementById('carouselCurrentIndex');
    this.counterTotal = document.getElementById('carouselTotalIndex');
    this.slideTag = document.getElementById('heroSlideTag');
    this.slideTitle = document.getElementById('heroSlideTitle');
    this.slideDesc = document.getElementById('heroSlideDesc');
    this.dotsContainer = document.getElementById('carouselDots');

    if (!this.slidesContainer) return;

    this.buildSlides();
    this.buildDots();
    this.attachEvents();
    this.goToSlide(0);
    this.startTimer();
    this.updateClockTicker();
  }

  buildSlides() {
    this.slidesContainer.innerHTML = '';
    this.slides.forEach((slide, idx) => {
      const slideEl = document.createElement('div');
      slideEl.className = `carousel-slide ${idx === 0 ? 'active' : ''}`;
      slideEl.dataset.index = idx;

      const img = document.createElement('img');
      img.className = 'carousel-image';
      img.alt = slide.title;
      img.src = slide.primarySrc;

      // Graceful fallback to altSrc or procedural canvas if local path needs fallback
      img.onerror = () => {
        if (img.src.indexOf(slide.altSrc) === -1) {
          img.src = slide.altSrc;
        } else {
          // Render procedural canvas backdrop if file isn't available
          img.style.display = 'none';
          this.renderProceduralCanvas(slideEl, slide);
        }
      };

      slideEl.appendChild(img);
      this.slidesContainer.appendChild(slideEl);
    });

    if (this.counterTotal) {
      this.counterTotal.textContent = String(this.slides.length).padStart(2, '0');
    }
  }

  // Procedural canvas fallback rendering high-tech tokamak visualization
  renderProceduralCanvas(parent, slide) {
    let canvas = parent.querySelector('.carousel-fallback-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'carousel-fallback-canvas';
      canvas.style.display = 'block';
      parent.appendChild(canvas);
    }

    const rect = parent.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#05080f';
    ctx.fillRect(0, 0, w, h);

    // Toroidal ring gradient
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.1, w * 0.5, h * 0.5, h * 0.45);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
    grad.addColorStop(0.3, 'rgba(157, 92, 255, 0.25)');
    grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.8)');
    grad.addColorStop(1, 'rgba(3, 5, 8, 1)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.5, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Field grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  buildDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    this.slides.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
      dot.addEventListener('click', () => {
        if (window.FusionAudio) window.FusionAudio.playRelayClick();
        this.goToSlide(idx);
        this.resetTimer();
      });
      this.dotsContainer.appendChild(dot);
    });
  }

  attachEvents() {
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (window.FusionAudio) window.FusionAudio.playRelayClick();
        this.prevSlide();
        this.resetTimer();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (window.FusionAudio) window.FusionAudio.playRelayClick();
        this.nextSlide();
        this.resetTimer();
      });
    }

    // Pause on hover
    const heroSection = document.getElementById('hero');
    if (heroSection) {
      heroSection.addEventListener('mouseenter', () => { this.isPaused = true; });
      heroSection.addEventListener('mouseleave', () => { this.isPaused = false; });
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key >= '1' && e.key <= '6') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < this.slides.length) {
          this.goToSlide(idx);
          this.resetTimer();
        }
      }
    });
  }

  goToSlide(index) {
    this.currentIndex = (index + this.slides.length) % this.slides.length;
    const currentSlide = this.slides[this.currentIndex];

    // Update DOM active slides
    const slideEls = this.slidesContainer.querySelectorAll('.carousel-slide');
    slideEls.forEach((el, idx) => {
      el.classList.toggle('active', idx === this.currentIndex);
    });

    // Update Dots
    if (this.dotsContainer) {
      const dots = this.dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === this.currentIndex);
      });
    }

    // Update Index Text
    if (this.counterCurrent) {
      this.counterCurrent.textContent = String(this.currentIndex + 1).padStart(2, '0');
    }

    // Update Slide Info Panel
    if (this.slideTag) this.slideTag.textContent = currentSlide.tag;
    if (this.slideTitle) this.slideTitle.textContent = currentSlide.title;
    if (this.slideDesc) this.slideDesc.textContent = currentSlide.desc;
  }

  nextSlide() {
    this.goToSlide(this.currentIndex + 1);
  }

  prevSlide() {
    this.goToSlide(this.currentIndex - 1);
  }

  startTimer() {
    this.startTime = Date.now();
    const tick = () => {
      if (!this.isPaused) {
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min((elapsed / this.intervalDuration) * 100, 100);

        if (this.progressFill) {
          this.progressFill.style.width = `${progress}%`;
        }

        if (elapsed >= this.intervalDuration) {
          this.nextSlide();
          this.startTime = Date.now();
        }
      } else {
        // Shift start time when paused so progress stays frozen
        this.startTime = Date.now() - ((parseFloat(this.progressFill.style.width) || 0) / 100 * this.intervalDuration);
      }
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  resetTimer() {
    this.startTime = Date.now();
    if (this.progressFill) {
      this.progressFill.style.width = '0%';
    }
  }

  // Live timestamp on the hero diagnostic badge
  updateClockTicker() {
    const clockEl = document.getElementById('heroLiveClock');
    if (!clockEl) return;

    setInterval(() => {
      const now = new Date();
      clockEl.textContent = now.toISOString().substring(11, 19) + ' UTC';
    }, 1000);
  }
}

window.HeroCarousel = new HeroCarousel();
