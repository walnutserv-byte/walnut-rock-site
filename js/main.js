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
  const dots = [...stage.querySelectorAll(".stage-dots button")];
  let idx = 0;
  let timer;

  const show = (n) => {
    idx = (n + cards.length) % cards.length;
    cards.forEach((c, i) => c.classList.toggle("active", i === idx));
    dots.forEach((d, i) => d.setAttribute("aria-current", i === idx ? "true" : "false"));
  };

  const next = () => show(idx + 1);
  const restart = () => {
    clearInterval(timer);
    timer = setInterval(next, 3200);
  };

  dots.forEach((d, i) => {
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

  const ribbons = [
    { amp: 42, speed: 0.7, hue: "61,255,168", thick: 1.4 },
    { amp: 28, speed: 1.1, hue: "122,162,255", thick: 1.1 },
    { amp: 36, speed: 0.85, hue: "255,255,255", thick: 0.8 },
  ];

  const draw = () => {
    t += 0.008;
    ctx.clearRect(0, 0, w, h);

    const g = ctx.createRadialGradient(
      w * (0.35 + mx * 0.3),
      h * (0.3 + my * 0.25),
      20,
      w * 0.5,
      h * 0.5,
      w * 0.7
    );
    g.addColorStop(0, "rgba(61,255,168,0.14)");
    g.addColorStop(0.45, "rgba(122,162,255,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ribbons.forEach((rib, ri) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const n =
          Math.sin(x * 0.012 + t * rib.speed + ri) * rib.amp +
          Math.sin(x * 0.004 + t * 0.6 + ri * 2) * (rib.amp * 0.35) +
          (my - 0.5) * 40;
        const y = h * (0.38 + ri * 0.12) + n + (mx - 0.5) * 18;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${rib.hue},${ri === 2 ? 0.18 : 0.45})`;
      ctx.lineWidth = rib.thick;
      ctx.stroke();
    });

    for (let i = 0; i < 18; i++) {
      const px = ((Math.sin(t * 0.4 + i * 1.7) + 1) / 2) * w;
      const py = ((Math.cos(t * 0.55 + i * 1.1) + 1) / 2) * h;
      const r = 1.2 + (i % 3);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? "rgba(61,255,168,0.55)" : "rgba(122,162,255,0.45)";
      ctx.fill();
    }

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
