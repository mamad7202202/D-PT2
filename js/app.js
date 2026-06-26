/* =========================================================
   app.js
   UI controller: theme, navbar, landing content, quiz flow,
   results rendering (radar, bars, circles), share, keyboard.
   ========================================================= */

(() => {
  "use strict";

  const Engine = window.DPT_Engine;
  const Analysis = window.DPT_Analysis;
  const TRAITS = window.DPT_TRAITS;

  /* ---------- Persian digit helper ---------- */
  const FA_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
  const fa = (n) => String(n).replace(/\d/g, d => FA_DIGITS[+d]);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* =========================================================
     THEME
     ========================================================= */
  const ThemeCtrl = {
    key: "dpt-theme",
    init() {
      const saved = localStorage.getItem(this.key);
      const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = saved || (sysDark ? "dark" : "light");
      this.apply(theme);

      $("#themeToggle").addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        this.apply(next);
        localStorage.setItem(this.key, next);
      });

      // react to system changes only if user hasn't chosen
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
        if (!localStorage.getItem(this.key)) this.apply(e.matches ? "dark" : "light");
      });
    },
    apply(theme) {
      document.documentElement.dataset.theme = theme;
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.content = theme === "dark" ? "#0a0d1a" : "#f6f7fb";
    }
  };

  /* =========================================================
     NAVBAR scroll effect
     ========================================================= */
  function initNavbar() {
    const nav = $("#navbar");
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        nav.classList.toggle("scrolled", window.scrollY > 24);
        ticking = false;
      });
    });
  }

  /* =========================================================
     LANDING dynamic content (trait chips, FAQ, counts)
     ========================================================= */
  function initLanding() {
    const total = Engine.total();
    $("#qCountLabel").textContent = fa(total);

    const chips = $("#traitChips");
    Object.values(TRAITS).forEach(t => {
      const li = document.createElement("li");
      li.textContent = t.fa;
      chips.appendChild(li);
    });

    const faqs = [
      { q: "نتیجه چقدر دقیق است؟", a: "موتور امتیازدهی وزن‌دار است؛ هر پاسخ روی چند شاخص اثر می‌گذارد و نتیجه بر اساس الگوی کلی پاسخ‌هایت ساخته می‌شود. این یعنی تحلیل به رفتار واقعی‌ات نزدیک‌تر از تست‌های تک‌بُعدی است. با این حال جایگزین ارزیابی تخصصی نیست." },
      { q: "چقدر طول می‌کشد؟", a: "حدود پنج تا هفت دقیقه. می‌توانی با کلیدهای عددی هم سریع جواب بدهی." },
      { q: "اطلاعاتم ذخیره می‌شود؟", a: "خیر. همه‌چیز فقط در مرورگر خودت پردازش می‌شود؛ هیچ پاسخی به سروری ارسال نمی‌شود و نیازی به ثبت‌نام نیست." },
      { q: "آن بخش بامزه‌اش چیست؟", a: "یک بخش به‌اسم «تحلیل غیرضروری ولی کاملاً دقیق». جدی نیست، ولی دقیق است — و دقیقاً به‌خاطر همین خنده‌دار است." },
    ];
    const faqList = $("#faqList");
    faqs.forEach(f => {
      const d = document.createElement("details");
      d.className = "faq__item";
      d.innerHTML = `<summary class="faq__q">${f.q}</summary><div class="faq__a">${f.a}</div>`;
      faqList.appendChild(d);
    });


    $$("[data-start]").forEach(btn => btn.addEventListener("click", () => Quiz.open()));
  }

  /* =========================================================
     QUIZ CONTROLLER
     ========================================================= */
  const Quiz = {
    el: null, stage: null,
    init() {
      this.el = $("#quiz");
      this.stage = $("#quizStage");
      $("#quizClose").addEventListener("click", () => this.close());
      $("#btnNext").addEventListener("click", () => this.handleNext());
      $("#btnPrev").addEventListener("click", () => this.handlePrev());
      $("#progressTotal").textContent = fa(Engine.total());
      document.addEventListener("keydown", e => this.onKey(e));
    },

    open() {
      Engine.reset();
      this.el.classList.add("open");
      this.el.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      this.render("enter");
    },

    close() {
      this.el.classList.remove("open");
      this.el.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    },

    onKey(e) {
      if (!this.el.classList.contains("open")) return;
      const q = Engine.current();
      if (e.key === "Escape") return this.close();
      if (e.key === "ArrowLeft") return this.handleNext();   // RTL: left = forward
      if (e.key === "ArrowRight") return this.handlePrev();
      if (/^[1-9]$/.test(e.key)) {
        const idx = +e.key - 1;
        if (idx < q.options.length) {
          this.select(q.id, idx);
          // auto-advance shortly after choosing via keyboard
          setTimeout(() => this.handleNext(), 260);
        }
      }
    },

    render(anim = "enter") {
      const q = Engine.current();
      const i = Engine.index;
      const selected = Engine.answerOf(q.id);

      const optsHtml = q.options.map((opt, idx) => {
        const isSel = selected === idx;
        return `
          <button class="q-option ${isSel ? "selected" : ""}" data-opt="${idx}" type="button">
            <span class="q-option__key">${fa(idx + 1)}</span>
            <span class="q-option__label">${opt.label}</span>
          </button>`;
      }).join("");

      const card = document.createElement("div");
      card.className = `q-card ${anim}`;
      card.innerHTML = `
        <div class="q-card__index">سؤال ${fa(i + 1)}</div>
        <h2 class="q-card__text">${q.text}</h2>
        <div class="q-options">${optsHtml}</div>`;

      this.stage.innerHTML = "";
      this.stage.appendChild(card);


      $$(".q-option", card).forEach(btn => {
        btn.addEventListener("click", () => {
          this.select(q.id, +btn.dataset.opt);
        });
      });

      this.syncControls();
    },

    select(qId, idx) {
      Engine.setAnswer(qId, idx);

      $$(".q-option", this.stage).forEach((b, i) => b.classList.toggle("selected", i === idx));
      this.syncControls();
    },

    syncControls() {
      const i = Engine.index;
      const q = Engine.current();
      const answered = Engine.answerOf(q.id) !== undefined;
      const last = i === Engine.total() - 1;

      $("#btnPrev").disabled = i === 0;
      const next = $("#btnNext");
      next.disabled = !answered;
      next.firstChild.textContent = last ? "دیدن نتیجه " : "بعدی ";

      $("#progressNow").textContent = fa(i + 1);
      const pct = ((i + (answered ? 1 : 0)) / Engine.total()) * 100;
      $("#progressFill").style.width = pct + "%";
    },

    handleNext() {
      const q = Engine.current();
      if (Engine.answerOf(q.id) === undefined) return;
      if (Engine.index === Engine.total() - 1) {
        return this.finish();
      }
      const card = $(".q-card", this.stage);
      if (card) card.className = "q-card exit-left";
      setTimeout(() => { Engine.next(); this.render("enter"); }, 220);
    },

    handlePrev() {
      if (Engine.index === 0) return;
      const card = $(".q-card", this.stage);
      if (card) card.className = "q-card exit-right";
      setTimeout(() => { Engine.prev(); this.render("enter"); }, 220);
    },

    finish() {
      this.close();
      const scores = Engine.computeScores();
      Results.show(scores);
    },
  };

  /* =========================================================
     RESULTS CONTROLLER
     ========================================================= */
  const Results = {
    el: null, box: null,
    init() {
      this.el = $("#results");
      this.box = $("#resultsContainer");
    },

    show(scores) {
      this.el.classList.add("open");
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
      this.renderLoader();

      const steps = [
        "در حال خواندن الگوی پاسخ‌ها…",
        "وزن‌دهی به چهارده شاخص…",
        "ساخت پروفایل شخصیتی…",
        "نوشتن تحلیلِ نسبتاً ترسناک…",
      ];
      const stepEl = () => $("#loaderStep");
      let s = 0;
      const timer = setInterval(() => {
        s++;
        if (stepEl() && s < steps.length) stepEl().textContent = steps[s];
      }, 520);

      setTimeout(() => {
        clearInterval(timer);
        const data = Analysis.build(scores);
        this.render(data);
        this.animateMeters();
      }, 2100);
    },

    renderLoader() {
      this.box.innerHTML = `
        <div class="r-loader">
          <div class="r-loader__ring"></div>
          <p>در حال تحلیل شخصیت تو</p>
          <div class="r-loader__step" id="loaderStep">در حال خواندن الگوی پاسخ‌ها…</div>
        </div>`;
    },

    render(d) {
      const s = d.scores;

      const traitBars = Object.keys(TRAITS).map(k => `
        <div class="tbar" data-val="${s[k]}">
          <div class="tbar__head">
            <span class="tbar__name">${TRAITS[k].fa}</span>
            <span class="tbar__val">${fa(s[k])}</span>
          </div>
          <div class="tbar__track"><div class="tbar__fill"></div></div>
        </div>`).join("");

      const strengthsHtml = d.strengths.map(x => `
        <li><span class="bullet bullet--up">↑</span><span><strong>${x.t}</strong> — ${x.d}</span></li>`).join("");

      const growthHtml = d.growth.map(x => `
        <li><span class="bullet bullet--grow">→</span><span><strong>${x.t}</strong> — ${x.d}</span></li>`).join("");

      const roastHtml = d.roasts.map((r, i) => `
        <div class="r-roast"><span class="num">${fa(i + 1)}</span><span>${r}</span></div>`).join("");

      const overviewHtml = d.overview.map(p => `<p>${p}</p>`).join("");

      // pick 3 traits for circular indicators (signature trio)
      const trio = Object.keys(s).sort((a, b) => s[b] - s[a]).slice(0, 3);

      this.box.innerHTML = `
        <div class="r-hero">
          <span class="eyebrow">پروفایل شخصیتی تو</span>
          <h1 class="r-archetype">${d.archetype.title}</h1>
          <p class="r-tagline">${d.archetype.tagline}</p>
          <div class="r-actions">
            <button class="btn btn--primary" id="btnShare">کپی خلاصه برای اشتراک</button>
            <button class="btn btn--ghost" id="btnRetake">آزمون دوباره</button>
          </div>
        </div>

        <div class="r-grid">
          <div>
            <div class="r-block">
              <div class="r-block__title"><span class="ic">${icon("user")}</span> نمای کلی شخصیت</div>
              ${overviewHtml}
            </div>

            <div class="r-block">
              <div class="r-block__title"><span class="ic">${icon("up")}</span> نقاط قوت</div>
              <ul class="r-list">${strengthsHtml}</ul>
            </div>

            <div class="r-block">
              <div class="r-block__title"><span class="ic">${icon("grow")}</span> مسیرهای رشد</div>
              <ul class="r-list">${growthHtml}</ul>
            </div>
          </div>

          <div>
            <div class="r-block">
              <div class="r-block__title"><span class="ic">${icon("radar")}</span> نقشه‌ی شاخص‌ها</div>
              <div class="radar-wrap">${this.radarSVG(s)}</div>
            </div>

            <div class="r-block">
              <div class="r-block__title"><span class="ic">${icon("star")}</span> سه شاخص امضای تو</div>
              <div class="circles">${trio.map(k => this.circleCard(k, s[k])).join("")}</div>
            </div>
          </div>
        </div>

        <div class="r-block r-full">
          <div class="r-block__title"><span class="ic">${icon("bars")}</span> همه‌ی شاخص‌ها</div>
          ${traitBars}
        </div>

        <div class="r-grid">
          <div class="r-block">
            <div class="r-block__title"><span class="ic">${icon("work")}</span> سبک کاری</div>
            <p><strong>همکاری:</strong> ${d.work.collab}</p>
            <p><strong>بهره‌وری:</strong> ${d.work.prod}</p>
            <p><strong>رهبری:</strong> ${d.work.lead}</p>
          </div>
          <div class="r-block">
            <div class="r-block__title"><span class="ic">${icon("learn")}</span> سبک یادگیری</div>
            <p><strong>یادگیری:</strong> ${d.learning.learn}</p>
            <p><strong>پردازش اطلاعات:</strong> ${d.learning.process}</p>
            <p><strong>حل مسئله:</strong> ${d.learning.solve}</p>
          </div>
        </div>

        <div class="r-block r-full">
          <div class="r-block__title"><span class="ic">${icon("decide")}</span> پروفایل تصمیم‌گیری</div>
          <p><strong>منطق در برابر احساس:</strong> ${d.decision.logicEmotion}</p>
          <p><strong>سرعت در برابر احتیاط:</strong> ${d.decision.speedCaution}</p>
          <p><strong>رویکرد به ریسک:</strong> ${d.decision.risk}</p>
        </div>

        <div class="r-humor">
          <span class="r-humor__badge">${icon("spark")} کاملاً جدی نیست، کاملاً درست است</span>
          <div class="r-humor__title">تحلیل غیرضروری ولی کاملاً دقیق</div>
          <div class="r-humor__list">${roastHtml}</div>
        </div>

        <div class="r-hero" style="margin-top:50px;margin-bottom:0;">
          <button class="btn btn--ghost" id="btnRetake2">یک‌بار دیگر امتحان کن</button>
        </div>
      `;

      // bind actions
      const retake = () => { this.el.classList.remove("open"); document.body.style.overflow = ""; Quiz.open(); };
      $("#btnRetake").addEventListener("click", retake);
      $("#btnRetake2").addEventListener("click", retake);
      $("#btnShare").addEventListener("click", () => this.share(d));
    },

    /* radar chart for the 7 macro traits */
    radarSVG(s) {
      const keys = ["openness","conscientious","extraversion","agreeableness","stability","leadership","creativity"];
      const labels = keys.map(k => TRAITS[k].short);
      const N = keys.length;
      const cx = 160, cy = 150, R = 105;
      const angle = i => (-Math.PI / 2) + (i * 2 * Math.PI / N);
      const pt = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];

      // grid rings
      let rings = "";
      [0.25, 0.5, 0.75, 1].forEach(f => {
        const p = keys.map((_, i) => pt(i, R * f).join(",")).join(" ");
        rings += `<polygon class="radar-grid" points="${p}" />`;
      });
      // axes
      let axes = "";
      keys.forEach((_, i) => {
        const [x, y] = pt(i, R);
        axes += `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" />`;
      });
      // data shape
      const dataPts = keys.map((k, i) => pt(i, R * (s[k] / 100)));
      const shape = dataPts.map(p => p.join(",")).join(" ");
      const dots = dataPts.map(p => `<circle class="radar-dot" cx="${p[0]}" cy="${p[1]}" r="3.2" />`).join("");
      // labels
      let labelEls = "";
      keys.forEach((k, i) => {
        const [x, y] = pt(i, R + 20);
        labelEls += `<text class="radar-label" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${labels[i]}</text>`;
      });

      return `<svg class="radar-svg" viewBox="0 0 320 300" role="img" aria-label="نمودار راداری شاخص‌ها">
        ${rings}${axes}
        <polygon class="radar-shape" points="${shape}" />
        ${dots}${labelEls}
      </svg>`;
    },

    circleCard(key, val) {
      const r = 42, c = 2 * Math.PI * r;
      const offset = c * (1 - val / 100);
      return `
        <div class="circle-card">
          <svg viewBox="0 0 110 110" role="img" aria-label="${TRAITS[key].fa} ${val}">
            <defs>
              <linearGradient id="cgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#6d8bff"/><stop offset="1" stop-color="#41e0d0"/>
              </linearGradient>
            </defs>
            <circle class="circle-bg" cx="55" cy="55" r="${r}"/>
            <circle class="circle-fg" cx="55" cy="55" r="${r}"
              stroke-dasharray="${c}" stroke-dashoffset="${c}" data-offset="${offset}"/>
            <text class="circle-num" x="55" y="55" text-anchor="middle" dominant-baseline="central">${fa(val)}</text>
          </svg>
          <div class="circle-label">${TRAITS[key].short}</div>
        </div>`;
    },

    animateMeters() {
      // trait bars
      requestAnimationFrame(() => {

        $$(".tbar").forEach((bar, i) => {
          const val = +bar.dataset.val;
          setTimeout(() => { $(".tbar__fill", bar).style.width = val + "%"; }, 60 * i);
        });
        // circular indicators

        $$(".circle-fg").forEach(c => {
          setTimeout(() => { c.style.strokeDashoffset = c.dataset.offset; }, 200);
        });
      });
    },

    share(d) {
      const s = d.scores;
      const top = Object.keys(s).sort((a, b) => s[b] - s[a]).slice(0, 3)
        .map(k => `${TRAITS[k].fa} ${fa(s[k])}`).join(" · ");
      const text =
`نتیجه‌ی تست شخصیت من در D-PT:
🧭 ${d.archetype.title}
${d.archetype.tagline}

شاخص‌های امضا: ${top}

«${d.roasts[0]}»

تو هم امتحان کن.`;

      const done = () => Toast.show("خلاصه‌ی نتیجه کپی شد ✓");
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopy(text, done));
      } else {
        this.fallbackCopy(text, done);
      }
    },

    fallbackCopy(text, cb) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); cb(); } catch (e) {}
      document.body.removeChild(ta);
    },
  };

  /* =========================================================
     Toast
     ========================================================= */
  const Toast = {
    el: null,
    show(msg) {
      if (!this.el) {
        this.el = document.createElement("div");
        this.el.className = "toast";
        document.body.appendChild(this.el);
      }
      this.el.textContent = msg;
      this.el.classList.add("show");
      clearTimeout(this._t);
      this._t = setTimeout(() => this.el.classList.remove("show"), 2400);
    }
  };

  /* =========================================================
     Inline SVG icon set (line style, currentColor)
     ========================================================= */
  function icon(name) {
    const w = 'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    const map = {
      user: `<svg ${w}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
      up:   `<svg ${w}><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
      grow: `<svg ${w}><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v5h-5"/></svg>`,
      radar:`<svg ${w}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 3v9l6 4"/></svg>`,
      star: `<svg ${w}><path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.5l1.1-6L3.4 9.3l6-.8z"/></svg>`,
      bars: `<svg ${w}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`,
      work: `<svg ${w}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
      learn:`<svg ${w}><path d="M12 4 2 9l10 5 10-5-10-5z"/><path d="M6 11v5a6 3 0 0 0 12 0v-5"/></svg>`,
      decide:`<svg ${w}><path d="M12 3v18"/><path d="M5 7l7-4 7 4"/><circle cx="5" cy="13" r="3"/><circle cx="19" cy="13" r="3"/></svg>`,
      spark:`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>`,
    };
    return map[name] || "";
  }

  /* =========================================================
     BOOT
     ========================================================= */
  document.addEventListener("DOMContentLoaded", () => {
    ThemeCtrl.init();
    initNavbar();
    initLanding();
    Quiz.init();
    Results.init();
  });
})();
