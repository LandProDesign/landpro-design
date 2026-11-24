/* Land Pro Design — review mockup interactions */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.innerWidth <= 1100;

  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-menu]");

  // Nav background + mobile menu
  const onScrollNav = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
  };
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  const closeMenu = () => {
    nav?.classList.remove("is-open");
    document.body.classList.remove("is-nav-open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open menu");
  };

  toggle?.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  menu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (!isMobile()) closeMenu();
  });

  // Mock form (review only — nothing is sent)
  document.querySelectorAll("[data-mock-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = form.querySelector("[data-form-note]");
      if (note) {
        note.hidden = false;
        note.textContent = "This review mockup does not send messages. On the live site, this request would go to Land Pro Design.";
      }
    });
  });

  // Hero video: pause when off-screen
  const video = document.querySelector(".hero-video");
  if (video && "IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      });
    }, { threshold: 0.15 });
    io.observe(video);
  }

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    document.querySelectorAll(".reveal-line").forEach((el) => {
      el.style.transform = "none";
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Lenis
  let lenis;
  if (!reduced && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        closeMenu();
        lenis.scrollTo(target, { offset: 0 });
      });
    });
  }

  // Masked line reveals
  const reveal = (root, immediate) => {
    const lines = root.querySelectorAll(".reveal-line");
    if (!lines.length) return;
    if (reduced) {
      gsap.set(lines, { yPercent: 0 });
      return;
    }
    gsap.set(lines, { yPercent: 110 });
    const tw = gsap.to(lines, {
      yPercent: 0,
      duration: 1.15,
      ease: "power3.out",
      stagger: 0.1,
      paused: !immediate,
    });
    if (!immediate) {
      ScrollTrigger.create({
        trigger: root,
        start: "top 82%",
        onEnter: () => tw.play(),
        once: true,
      });
    } else {
      tw.delay(0.25).play();
    }
  };

  document.querySelectorAll(".hero-title").forEach((el) => reveal(el, true));
  document.querySelectorAll("h2").forEach((el) => reveal(el, false));

  // Subtle parallax on stills
  if (!reduced) {
    document.querySelectorAll("[data-parallax]").forEach((img) => {
      gsap.fromTo(
        img,
        { yPercent: -6, scale: 1.08 },
        {
          yPercent: 6,
          scale: 1.08,
          ease: "none",
          scrollTrigger: {
            trigger: img.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });

    document.querySelectorAll(".about-visual img, .work-media img, .apps-visual img").forEach((img) => {
      gsap.fromTo(
        img,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: img.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });
  }

  // Scroll-bound video (image sequence)
  const FRAME_COUNT = 150;
  let framesReady = Promise.resolve();
  const canvas = document.getElementById("scrub-canvas");
  const bar = document.querySelector("[data-scrub-bar]");
  const pctEl = document.querySelector("[data-scrub-pct]");
  const labels = Array.from(document.querySelectorAll("[data-scrub-labels] li"));

  if (canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    const poster = document.querySelector("[data-scrub-poster]");
    const images = new Array(FRAME_COUNT);
    let current = 0;
    let drawn = -1;

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawn = -1;
      draw(current);
    };

    const draw = (index) => {
      const img = images[index];
      if (!img || !img.complete || !img.naturalWidth) return;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw, dh, dx, dy;
      if (ir > cr) {
        dh = ch;
        dw = ch * ir;
        dx = (cw - dw) / 2;
        dy = 0;
      } else {
        dw = cw;
        dh = cw / ir;
        dx = 0;
        dy = (ch - dh) / 2;
      }
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = "#0c0c0b";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
      drawn = index;
      if (poster) poster.hidden = true;
    };

    const pad = (n) => String(n).padStart(3, "0");
    // Preload first frame immediately, then the rest
    const loadFrame = (i) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = `assets/scrub/frame-${pad(i + 1)}.webp`;
      });

    const loadAll = async () => {
      const first = await loadFrame(0);
      images[0] = first;
      sizeCanvas();
      const batch = 8;
      for (let i = 1; i < FRAME_COUNT; i += batch) {
        const slice = [];
        for (let j = i; j < Math.min(FRAME_COUNT, i + batch); j++) slice.push(j);
        const loaded = await Promise.all(slice.map(loadFrame));
        loaded.forEach((img, k) => {
          images[slice[k]] = img;
        });
      }
    };
    framesReady = loadAll();

    window.addEventListener("resize", sizeCanvas);

    const applyProgress = (progress) => {
      const i = Math.round(progress * (FRAME_COUNT - 1));
      current = i;
      if (i !== drawn) draw(i);
      if (bar) bar.style.width = `${(progress * 100).toFixed(2)}%`;
      if (pctEl) pctEl.textContent = String(Math.round(progress * 100)).padStart(2, "0");
      labels.forEach((li) => {
        const from = parseFloat(li.dataset.from);
        const to = parseFloat(li.dataset.to);
        li.classList.toggle("is-active", progress >= from && progress <= to + 0.0001);
      });
    };

    if (reduced) {
      applyProgress(0.5);
      sizeCanvas();
    } else {
      ScrollTrigger.create({
        trigger: ".scrub",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.35,
        onUpdate: (self) => applyProgress(self.progress),
        onRefresh: () => applyProgress(current / (FRAME_COUNT - 1) || 0),
      });
    }
  }

  // Horizontal scroll section (pinned, driven by vertical scroll)
  const setupHorizontal = () => {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars && st.vars.id === "services-horizontal") st.kill();
    });

    const section = document.querySelector(".horizontal");
    const pin = document.querySelector(".horizontal-pin");
    const track = document.querySelector("[data-htrack]");
    if (!section || !pin || !track) return;

    if (reduced || isMobile()) {
      section.style.height = "auto";
      pin.style.height = "auto";
      pin.style.overflow = "visible";
      track.style.transform = "none";
      track.style.display = isMobile() && !reduced ? "flex" : track.style.display;
      if (isMobile() && !reduced) {
        // Let the section be a vertical stack of full-width cards on small screens
        pin.style.height = "auto";
        track.style.flexDirection = "column";
        track.querySelectorAll(".h-card").forEach((card) => {
          card.style.flexBasis = "auto";
          card.style.height = "auto";
          card.style.minHeight = "100vh";
        });
      }
      return;
    }

    // Restore desktop layout if we resized up
    track.style.flexDirection = "row";
    track.querySelectorAll(".h-card").forEach((card) => {
      card.style.flexBasis = "";
      card.style.height = "";
      card.style.minHeight = "";
    });
    pin.style.height = "";
    pin.style.overflow = "";

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      id: "services-horizontal-tween",
      scrollTrigger: {
        id: "services-horizontal",
        trigger: section,
        start: "top top",
        end: () => "+=" + distance(),
        pin: pin,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  };

  setupHorizontal();
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setupHorizontal();
      ScrollTrigger.refresh();
    }, 200);
  });

  // Active nav link
  const sections = ["services", "apps", "shop", "about", "consult"].map((id) =>
    document.getElementById(id)
  );
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: () => {
      let current = null;
      sections.forEach((sec) => {
        if (!sec) return;
        const r = sec.getBoundingClientRect();
        if (r.top <= window.innerHeight * 0.45 && r.bottom > window.innerHeight * 0.3) {
          current = sec.id;
        }
      });
      navLinks.forEach((a) => {
        const href = a.getAttribute("href") || "";
        const id = href.replace("#", "");
        a.classList.toggle("is-active", id === current || (current === "consult" && id === "about"));
      });
    },
  });

  window.__LP = {
    scrollTo(y, immediate = true) {
      if (lenis) return lenis.scrollTo(y, { immediate, duration: immediate ? 0 : 1.1 });
      window.scrollTo(0, y);
    },
    refresh() {
      ScrollTrigger.refresh();
    },
    reduced,
    frameCount: FRAME_COUNT,
    framesReady,
  };
})();

