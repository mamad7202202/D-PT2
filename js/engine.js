/* =========================================================
   engine.js
   Weighted scoring engine + quiz state machine.
   Converts raw weighted deltas into normalized 0–100 trait
   scores using min/max theoretical bounds per trait.
   ========================================================= */

const Engine = (() => {
  const QUESTIONS = window.DPT_QUESTIONS;
  const TRAITS = window.DPT_TRAITS;
  const traitKeys = Object.keys(TRAITS);

  /* ---- Precompute theoretical min/max per trait ----
     For every question we look at the most positive and most
     negative achievable contribution to each trait, then sum.
     This lets us normalize any raw score to a fair 0–100. */
  function computeBounds() {
    const min = {}, max = {};
    traitKeys.forEach(k => { min[k] = 0; max[k] = 0; });

    QUESTIONS.forEach(q => {
      const perTrait = {};
      traitKeys.forEach(k => { perTrait[k] = []; });

      if (q.type === "likert") {
        // every intensity * weight is achievable
        q.options.forEach(opt => {
          for (const k in q.w) perTrait[k].push(q.w[k] * opt.intensity);
        });
      } else {
        // forced choice: only one option chosen
        q.options.forEach(opt => {
          for (const k in opt.w) perTrait[k].push(opt.w[k]);
        });
      }

      traitKeys.forEach(k => {
        const vals = perTrait[k];
        if (vals.length) {
          max[k] += Math.max(...vals, 0);
          min[k] += Math.min(...vals, 0);
        }
      });
    });
    return { min, max };
  }

  const BOUNDS = computeBounds();

  /* ---- State ---- */
  const state = {
    index: 0,
    answers: {},        // { qId: optionIndex }
    raw: null,          // last computed raw map
  };

  function reset() {
    state.index = 0;
    state.answers = {};
    state.raw = null;
  }

  function total() { return QUESTIONS.length; }
  function current() { return QUESTIONS[state.index]; }
  function answerOf(qId) { return state.answers[qId]; }

  function setAnswer(qId, optIndex) {
    state.answers[qId] = optIndex;
  }

  function answeredCount() { return Object.keys(state.answers).length; }
  function isComplete() { return answeredCount() >= total(); }

  function next() {
    if (state.index < total() - 1) { state.index++; return true; }
    return false;
  }
  function prev() {
    if (state.index > 0) { state.index--; return true; }
    return false;
  }

  /* ---- Aggregate raw weighted deltas ---- */
  function computeRaw() {
    const raw = {};
    traitKeys.forEach(k => { raw[k] = 0; });

    QUESTIONS.forEach(q => {
      const ans = state.answers[q.id];
      if (ans === undefined) return;
      const opt = q.options[ans];

      if (q.type === "likert") {
        for (const k in q.w) raw[k] += q.w[k] * opt.intensity;
      } else {
        for (const k in opt.w) raw[k] += opt.w[k];
      }
    });
    return raw;
  }

  /* ---- Normalize to 0–100 with a gentle curve ---- */
  function normalize(raw) {
    const out = {};
    traitKeys.forEach(k => {
      const lo = BOUNDS.min[k], hi = BOUNDS.max[k];
      const range = hi - lo || 1;
      let pct = ((raw[k] - lo) / range) * 100;
      // gentle S-curve to avoid clustering near 50
      pct = sCurve(pct);
      out[k] = Math.round(clamp(pct, 2, 98));
    });
    return out;
  }

  // pushes mid values slightly toward extremes for more "character"
  function sCurve(x) {
    const t = x / 100;
    const k = 0.15; // strength
    const shaped = t + k * Math.sin((t - 0.5) * Math.PI);
    return clamp(shaped * 100, 0, 100);
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---- Public: produce final scores ---- */
  function computeScores() {
    const raw = computeRaw();
    state.raw = raw;
    return normalize(raw);
  }

  return {
    reset, total, current, answerOf, setAnswer,
    answeredCount, isComplete, next, prev,
    computeScores,
    get index() { return state.index; },
    set index(v) { state.index = v; },
    traitKeys,
    TRAITS,
  };
})();

window.DPT_Engine = Engine;
