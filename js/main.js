document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  const bar = document.querySelector(".progress");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (bar) bar.style.width = p + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  window.addEventListener(
    "pointermove",
    (e) => {
      document.body.style.setProperty("--mx", (e.clientX / window.innerWidth) * 100 + "%");
      document.body.style.setProperty("--my", (e.clientY / window.innerHeight) * 100 + "%");
    },
    { passive: true }
  );

  document.querySelectorAll(".card, .pricing-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--cx", e.clientX - r.left + "px");
      card.style.setProperty("--cy", e.clientY - r.top + "px");
    });
  });

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
    });
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            e.target.style.transitionDelay = Math.min(i * 0.05, 0.25) + "s";
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
    setTimeout(() => reveals.forEach((el) => el.classList.add("visible")), 1400);
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  initHeroStage();
  initContactForm();
});

function initHeroStage() {
  const stage = document.querySelector(".hero-stage");
  const canvas = document.querySelector(".hero-canvas");
  if (!stage || !canvas) return;

  const cards = [...stage.querySelectorAll(".stage-card")];
  const rails = [...stage.querySelectorAll(".stage-rail-btn")];
  let idx = 0;
  let timer;
  let stepProgress = 0;

  const show = (n) => {
    idx = (n + cards.length) % cards.length;
    stepProgress = 0;
    stage.dataset.step = String(idx);
    cards.forEach((c, i) => c.classList.toggle("active", i === idx));
    rails.forEach((d, i) => {
      const on = i === idx;
      d.classList.toggle("is-active", on);
      d.setAttribute("aria-current", on ? "true" : "false");
    });
  };

  const next = () => show(idx + 1);
  const restart = () => {
    clearInterval(timer);
    timer = setInterval(next, 3600);
  };

  rails.forEach((d, i) => {
    d.addEventListener("click", () => {
      show(i);
      restart();
    });
  });

  show(0);
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) restart();

  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let mx = 0.5;
  let my = 0.5;
  let t = 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const resize = () => {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  stage.addEventListener(
    "pointermove",
    (e) => {
      const r = stage.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width;
      my = (e.clientY - r.top) / r.height;
    },
    { passive: true }
  );

  const palettes = [
    { a: "61,255,168", b: "122,162,255" },
    { a: "122,162,255", b: "200,170,255" },
    { a: "61,255,168", b: "255,210,120" },
  ];

  const draw = () => {
    t += 0.01;
    stepProgress = Math.min(1, stepProgress + 0.012);
    ctx.clearRect(0, 0, w, h);
    const pal = palettes[idx] || palettes[0];

    const g = ctx.createRadialGradient(
      w * (0.28 + mx * 0.35 + idx * 0.08),
      h * (0.42 + my * 0.2),
      10,
      w * 0.5,
      h * 0.55,
      w * 0.75
    );
    g.addColorStop(0, `rgba(${pal.a},${0.18 + stepProgress * 0.1})`);
    g.addColorStop(0.5, `rgba(${pal.b},0.1)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // orbiting nodes — denser / different path per step
    const count = 10 + idx * 4;
    for (let i = 0; i < count; i++) {
      const ang = t * (0.55 + idx * 0.15) + (i / count) * Math.PI * 2;
      const rad = (0.18 + (i % 4) * 0.07) * Math.min(w, h);
      const cx = w * (0.5 + (mx - 0.5) * 0.12);
      const cy = h * (0.52 + (my - 0.5) * 0.1);
      const px = cx + Math.cos(ang) * rad;
      const py = cy + Math.sin(ang * (1 + idx * 0.2)) * rad * 0.72;
      ctx.beginPath();
      ctx.arc(px, py, 1.6 + (i % 3), 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? `rgba(${pal.a},0.7)` : `rgba(${pal.b},0.55)`;
      ctx.fill();
      if (i % 3 === 0) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = `rgba(${pal.a},0.12)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // step-specific motif
    ctx.save();
    ctx.translate(w * 0.5, h * 0.55);
    ctx.strokeStyle = `rgba(${pal.a},${0.35 + stepProgress * 0.25})`;
    ctx.lineWidth = 1.6;
    if (idx === 0) {
      // expanding search rings
      for (let r = 0; r < 3; r++) {
        const rr = 28 + r * 22 + Math.sin(t * 2 + r) * 4;
        ctx.beginPath();
        ctx.arc(0, 0, rr * stepProgress, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(18, 18);
      ctx.lineTo(42, 42);
      ctx.stroke();
    } else if (idx === 1) {
      // blueprint grid
      const s = 22;
      for (let x = -66; x <= 66; x += s) {
        ctx.globalAlpha = 0.25 + stepProgress * 0.35;
        ctx.beginPath();
        ctx.moveTo(x, -55);
        ctx.lineTo(x, 55);
        ctx.stroke();
      }
      for (let y = -55; y <= 55; y += s) {
        ctx.beginPath();
        ctx.moveTo(-66, y);
        ctx.lineTo(66, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.strokeRect(-40 * stepProgress, -28 * stepProgress, 80 * stepProgress, 56 * stepProgress);
    } else {
      // launch burst
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t;
        const len = (30 + (i % 3) * 12) * stepProgress;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 10 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pal.a},0.35)`;
      ctx.fill();
    }
    ctx.restore();

    if (!reduce) requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  draw();
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const note = form.querySelector(".form-note");
  const btn = form.querySelector('button[type="submit"]');
  // behind-the-scenes inbox (not shown in the UI)
  const inbox = atob("d2FsbnV0c2VydkBnbWFpbC5jb20=");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending…";
    }
    if (note) note.textContent = "";

    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      role: String(data.get("role") || ""),
      message: String(data.get("message") || ""),
      _subject: "Walnut Rock Technologies — new enquiry",
      _template: "table",
    };

    try {
      const res = await fetch("https://formsubmit.co/ajax/" + inbox, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("send failed");
      form.reset();
      if (note) note.textContent = "Sent — we’ll get back to you soon.";
    } catch {
      if (note) note.textContent = "Couldn’t send just now. Try again in a moment.";
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Send message";
      }
    }
  });
}
