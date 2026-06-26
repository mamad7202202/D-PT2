/* =========================================================
   analysis.js
   Turns normalized trait scores into rich, believable,
   human-sounding analysis — including the humor section.
   No randomness in the *logic*: humor is triggered by real
   score patterns so it always feels earned and accurate.
   ========================================================= */

const Analysis = (() => {
  const TRAITS = window.DPT_TRAITS;

  const HI = 66, LO = 38; // thresholds for "high" / "low"

  const isHi = (s, k) => s[k] >= HI;
  const isLo = (s, k) => s[k] <= LO;
  const lvl  = (s, k) => s[k] >= HI ? "high" : s[k] <= LO ? "low" : "mid";

  /* ---------- Archetype naming ----------
     Built from the two strongest signature traits. */
  function archetype(s) {
    const ranked = Object.keys(s).sort((a, b) => s[b] - s[a]);
    const top = ranked[0], second = ranked[1];

    const names = {
      curiosity:     "کاشف",
      openness:      "آزاداندیش",
      creativity:    "خالق",
      conscientious: "معمار",
      discipline:    "استوار",
      planning:      "راهبر نقشه",
      extraversion:  "جرقه",
      socialEnergy:  "محور جمع",
      agreeableness: "پل ارتباط",
      stability:     "ناخدای آرام",
      adaptability:  "آب روان",
      leadership:    "هدایتگر",
      decisiveness:  "قاطع",
      riskTolerance:"شکارچی فرصت",
    };

    const main = names[top] || "تحلیل‌گر";
    const sub  = names[second] || "";
    const title = sub && sub !== main ? `${main}ِ ${sub}` : main;

    const taglines = {
      curiosity: "ذهنی که هیچ‌وقت در حالت آماده‌باش نیست؛ همیشه دنبال در بعدی.",
      openness: "برایت دنیا یک کتابِ باز است که هنوز فصل‌های زیادی نخوانده‌اش داری.",
      creativity: "چیزهایی را به هم وصل می‌کنی که بقیه حتی کنار هم نمی‌بینند.",
      conscientious: "نظم برایت ابزار نیست، یک‌جور آرامش است.",
      discipline: "وقتی تصمیم می‌گیری، اراده‌ات از انگیزه‌ات قوی‌تر است.",
      planning: "قبل از اینکه قدم اول را برداری، نقشه‌ی کل مسیر را دیده‌ای.",
      extraversion: "انرژی‌ات وقتی بیشتر می‌شود که بین آدم‌ها باشی.",
      socialEnergy: "اتاق با آمدنت کمی روشن‌تر می‌شود؛ خودت معمولاً نمی‌فهمی.",
      agreeableness: "حال آدم‌ها را زودتر از خودشان می‌فهمی.",
      stability: "در طوفان، تو همان نقطه‌ای هستی که بقیه نگاهش می‌کنند.",
      adaptability: "هرجا بگذارندت، ریشه می‌دوانی.",
      leadership: "حتی وقتی نمی‌خواهی، مسئولیت سمتت می‌آید.",
      decisiveness: "تصمیم می‌گیری و پشت سرت را نگاه نمی‌کنی.",
      riskTolerance: "جایی که بقیه خطر می‌بینند، تو فرصت می‌بینی.",
    };

    return { title, tagline: taglines[top] || "ترکیبی نادر که در یک برچسب جا نمی‌شود." };
  }

  /* ---------- Personality overview (2–3 paragraphs) ---------- */
  function overview(s) {
    const parts = [];

    // paragraph 1 — dominant texture
    const social = s.extraversion >= 50
      ? "تو انرژی‌ات را بیشتر از تعامل با آدم‌ها می‌گیری و در جمع شکوفا می‌شوی"
      : "تو دنیای درونی پرمشغله‌ای داری و آرامش واقعی را در تنهاییِ باکیفیت پیدا می‌کنی";
    const mind = s.openness >= 50 || s.curiosity >= 50
      ? "ذهنت به‌سمت تازگی و ایده‌های نو کشیده می‌شود"
      : "به چیزهای آشنا، عملی و امتحان‌پس‌داده اعتماد بیشتری داری";
    parts.push(`${social}. در عین حال ${mind}. این دو ویژگی با هم، چارچوب اصلی شخصیت تو را می‌سازند.`);

    // paragraph 2 — how you operate
    const work = s.conscientious >= 50
      ? "وقتی کاری را به‌عهده می‌گیری، دیگران می‌توانند روی تمام‌شدنش حساب کنند"
      : "تو با انگیزه و الهام بهتر کار می‌کنی تا با ساختار خشک و روتین ثابت";
    const emo = s.stability >= 50
      ? "زیر فشار، خونسردی‌ات را بهتر از اغلب آدم‌ها حفظ می‌کنی"
      : "حساسیت هیجانی‌ات بالاست؛ این هم می‌تواند منبع رنج باشد، هم منبع همدلی و عمق";
    parts.push(`${work}. ${emo}.`);

    // paragraph 3 — decision signature
    const dec = s.decisiveness >= 55
      ? "در تصمیم‌گیری قاطعی و معمولاً سریع به نتیجه می‌رسی"
      : s.decisiveness <= 40
        ? "در تصمیم‌گیری محتاطی و دوست داری همه‌ی زوایا را ببینی، حتی به قیمت کمی کندی"
        : "در تصمیم‌گیری تعادلی بین سرعت و احتیاط داری";
    const risk = s.riskTolerance >= 55
      ? "و از ریسک حساب‌شده نمی‌ترسی"
      : "و امنیت برایت وزن مهمی دارد";
    parts.push(`${dec} ${risk}.`);

    return parts;
  }

  /* ---------- Strengths ---------- */
  function strengths(s) {
    const pool = [
      { k: "curiosity", hi: true, t: "کنجکاوی پایان‌ناپذیر", d: "همیشه چیزی برای یاد گرفتن پیدا می‌کنی و این باعث می‌شود هیچ‌وقت واقعاً راکد نشوی." },
      { k: "creativity", hi: true, t: "ذهن خلاق و ترکیب‌گر", d: "ایده‌هایی می‌سازی که از زاویه‌ی متفاوت به مسائل نگاه می‌کنند." },
      { k: "conscientious", hi: true, t: "قابل‌اتکا بودن", d: "وقتی قول می‌دهی، انجامش می‌دهی؛ این کمیاب‌تر از چیزی است که فکر می‌کنی." },
      { k: "discipline", hi: true, t: "اراده‌ی عملی", d: "می‌توانی کاری را که حسش را نداری هم انجام بدهی، و این یعنی واقعاً به نتیجه می‌رسی." },
      { k: "planning", hi: true, t: "دوراندیشی", d: "قبل از اینکه مشکل پیش بیاید، معمولاً برایش نقشه داری." },
      { k: "stability", hi: true, t: "ثبات هیجانی", d: "در بحران، تکیه‌گاه دیگرانی؛ آرامشت مسری است." },
      { k: "agreeableness", hi: true, t: "همدلی واقعی", d: "آدم‌ها کنارت احساس امنیت و دیده‌شدن می‌کنند." },
      { k: "leadership", hi: true, t: "رهبری طبیعی", d: "در خلأ مسئولیت، بقیه ناخودآگاه سمت تو می‌چرخند." },
      { k: "adaptability", hi: true, t: "انعطاف بالا", d: "تغییر تو را فلج نمی‌کند؛ سریع خودت را با شرایط نو هماهنگ می‌کنی." },
      { k: "decisiveness", hi: true, t: "قاطعیت", d: "بین چند گزینه گیر نمی‌کنی؛ انتخاب می‌کنی و جلو می‌روی." },
      { k: "extraversion", hi: true, t: "انرژی اجتماعی", d: "می‌توانی جمع را گرم کنی و ارتباط‌های تازه بسازی." },
      { k: "openness", hi: true, t: "گشودگی فکری", d: "حاضری باورهایت را به چالش بکشی، که نشانه‌ی بلوغ ذهنی است." },
      { k: "riskTolerance", hi: true, t: "شجاعت در ریسک", d: "فرصت‌هایی را می‌گیری که آدم‌های محتاط از کنارشان رد می‌شوند." },
    ];
    const out = pool.filter(p => isHi(s, p.k)).sort((a, b) => s[b.k] - s[a.k]).slice(0, 5);
    if (out.length < 3) {
      // fall back to relative top traits
      const ranked = Object.keys(s).sort((a, b) => s[b] - s[a]);
      ranked.forEach(k => {
        if (out.length >= 4) return;
        const found = pool.find(p => p.k === k);
        if (found && !out.includes(found)) out.push(found);
      });
    }
    return out.map(p => ({ t: p.t, d: p.d }));
  }

  /* ---------- Growth areas ---------- */
  function growth(s) {
    const items = [];
    if (isLo(s, "discipline")) items.push({ t: "تبدیل انگیزه به عادت", d: "انرژی شروعت عالی است ولی پایداری نیاز به ساختار دارد. سیستم‌های کوچک و تکرارشونده بسازی، نه روزهای پر‌انرژیِ پراکنده." });
    if (isLo(s, "conscientious")) items.push({ t: "بستن حلقه‌ها", d: "کارهای نیمه‌تمام انرژی ذهنی می‌خورند. تمام کردن، حتی ناقص، بهتر از رها کردن است." });
    if (isLo(s, "stability")) items.push({ t: "مدیریت گفت‌وگوی درونی", d: "ذهنت اتفاق‌ها را زیاد مرور می‌کند. فاصله گرفتن از افکار به‌جای جنگیدن با آن‌ها می‌تواند کمک کند." });
    if (isHi(s, "stability") && isLo(s, "agreeableness")) items.push({ t: "نشان دادن آسیب‌پذیری", d: "آرامشت گاهی شبیه فاصله دیده می‌شود. کمی بیشتر سهیم‌شدن، رابطه‌ها را عمیق‌تر می‌کند." });
    if (isLo(s, "decisiveness")) items.push({ t: "پذیرفتن تصمیم «به‌اندازه‌ی کافی خوب»", d: "همه‌ی اطلاعات هیچ‌وقت کامل نمی‌شوند. گاهی سرعت ارزشمندتر از قطعیت است." });
    if (isLo(s, "adaptability")) items.push({ t: "رفاقت با تغییر", d: "روتین به تو امنیت می‌دهد، ولی گاهی همان روتین درِ فرصت‌ها را می‌بندد. تمرین تغییرهای کوچکِ عمدی کمک می‌کند." });
    if (isHi(s, "agreeableness") && isLo(s, "decisiveness")) items.push({ t: "مرزگذاری", d: "تمایل به راضی نگه‌داشتن همه، گاهی به‌قیمت نیازهای خودت تمام می‌شود. «نه» گفتن هم یک مهارت است." });
    if (isLo(s, "extraversion") && s.socialEnergy <= LO) items.push({ t: "مراقبت از شبکه‌ی روابط", d: "تنهایی شارژت می‌کند، ولی روابط هم مثل گیاه به آب‌دادن منظم نیاز دارند." });
    if (isHi(s, "riskTolerance") && isLo(s, "planning")) items.push({ t: "ریسکِ هوشمندتر", d: "جسارت داری؛ کاف
