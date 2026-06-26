/* =========================================================
   questions.js
   Question bank + trait taxonomy.
   Each question maps options to weighted trait deltas.
   Score scale per trait is normalized later (0–100).
   Likert options carry a base intensity; the `w` map decides
   which traits each option pushes and by how much.
   ========================================================= */

/* Trait keys (14 dimensions). `dir` is only used for display. */
const TRAITS = {
  openness:        { fa: "گشودگی به تجربه",  short: "گشودگی" },
  conscientious:   { fa: "وظیفه‌شناسی",       short: "وظیفه‌شناسی" },
  extraversion:    { fa: "برون‌گرایی",        short: "برون‌گرایی" },
  agreeableness:   { fa: "همدلی و توافق",      short: "همدلی" },
  stability:       { fa: "ثبات هیجانی",       short: "ثبات" },
  curiosity:       { fa: "کنجکاوی",           short: "کنجکاوی" },
  creativity:      { fa: "خلاقیت",            short: "خلاقیت" },
  discipline:      { fa: "انضباط",            short: "انضباط" },
  adaptability:    { fa: "انعطاف‌پذیری",       short: "انعطاف" },
  leadership:      { fa: "رهبری",             short: "رهبری" },
  planning:        { fa: "برنامه‌ریزی",        short: "برنامه‌ریزی" },
  decisiveness:    { fa: "قاطعیت در تصمیم",    short: "قاطعیت" },
  socialEnergy:    { fa: "انرژی اجتماعی",      short: "انرژی اجتماعی" },
  riskTolerance:  { fa: "ریسک‌پذیری",         short: "ریسک‌پذیری" },
};

/* Reusable 5-point agreement scale.
   intensity multiplies the question's weight map. */
const AGREE = [
  { label: "کاملاً درست است",        intensity:  1.00 },
  { label: "تا حدی درست است",        intensity:  0.55 },
  { label: "نه این، نه آن",          intensity:  0.00 },
  { label: "چندان درست نیست",        intensity: -0.55 },
  { label: "اصلاً شبیه من نیست",      intensity: -1.00 },
];

/* Helper to build a Likert question */
function L(id, text, weights) {
  return { id, text, type: "likert", options: AGREE, w: weights };
}

/* Helper to build a forced-choice (A/B/C/D) question.
   Each option carries its own weight map. */
function C(id, text, options) {
  return { id, text, type: "choice", options };
}

/* =========================================================
   QUESTION BANK — 52 items, real-life scenarios
   ========================================================= */
const QUESTIONS = [
  /* --- Openness / Curiosity / Creativity --- */
  L("q1", "وقتی با یک ایده‌ی کاملاً نو روبه‌رو می‌شوم، اول هیجان‌زده می‌شوم نه محتاط.",
    { openness: 3, curiosity: 2, riskTolerance: 1 }),

  L("q2", "اغلب خودم را در حال فکر کردن به چیزهایی می‌بینم که هیچ کاربرد عملی فوری ندارند.",
    { curiosity: 3, openness: 2, creativity: 1 }),

  C("q3", "یک آخر هفته‌ی کاملاً خالی پیدا کرده‌ای. کدام برنامه بیشتر جذبت می‌کند؟", [
    { label: "رفتن به جایی که تا حالا نبوده‌ام", w: { openness: 3, riskTolerance: 2, adaptability: 1 } },
    { label: "شروع یک پروژه یا یادگیری مهارت تازه", w: { curiosity: 3, creativity: 2, conscientious: 1 } },
    { label: "دیدن دوستان و یک دورهمی پر‌انرژی", w: { extraversion: 3, socialEnergy: 3, agreeableness: 1 } },
    { label: "استراحت کامل با برنامه‌ای آشنا و آرام", w: { stability: 2, planning: 1, openness: -1 } },
  ]),

  L("q4", "ترجیح می‌دهم یک راه‌حل خلاقانه و نامتعارف را امتحان کنم تا یک راه امن و امتحان‌پس‌داده.",
    { creativity: 3, riskTolerance: 2, openness: 1 }),

  L("q5", "وقتی چیزی برایم سؤال می‌شود، نمی‌توانم تا پیدا کردن جواب راحت بخوابم.",
    { curiosity: 3, conscientious: 1 }),

  L("q6", "هنر، موسیقی یا داستان می‌تواند واقعاً حال درونی‌ام را عوض کند.",
    { openness: 2, creativity: 2 }),

  /* --- Conscientiousness / Discipline / Planning --- */
  L("q7", "قبل از شروع هر کاری، معمولاً یک نقشه‌ی ذهنی یا نوشته‌شده دارم.",
    { planning: 3, conscientious: 2, discipline: 1 }),

  C("q8", "یک پروژه‌ی مهم با مهلت دو هفته‌ای گرفته‌ای. واقعاً چه می‌کنی؟", [
    { label: "همان روز اول شروع و قدم‌به‌قدم جلو می‌روم", w: { discipline: 3, conscientious: 3, planning: 2 } },
    { label: "اول تحقیق و برنامه‌ریزی، بعد اجرای فشرده", w: { planning: 3, conscientious: 1, curiosity: 1 } },
    { label: "چند روز معطل می‌کنم، بعد با انرژی جبران", w: { adaptability: 2, discipline: -2, riskTolerance: 1 } },
    { label: "شب‌های آخر بهترین نسخه‌ی من بیدار می‌شود", w: { discipline: -3, riskTolerance: 2, stability: -1 } },
  ]),

  L("q9", "حتی وقتی کسی نظارت نمی‌کند، کارها را با همان دقت انجام می‌دهم.",
    { conscientious: 3, discipline: 2 }),

  L("q10", "میز کار، فایل‌ها و زندگی‌ام معمولاً مرتب و سازمان‌یافته است.",
    { conscientious: 2, discipline: 2, planning: 1 }),

  L("q11", "کارهای کسل‌کننده اما لازم را به‌موقع انجام می‌دهم، نه در لحظه‌ی آخر.",
    { discipline: 3, conscientious: 2, planning: 1 }),

  L("q12", "زیاد پیش می‌آید که چند پروژه را شروع کنم ولی کمتر کدام را تمام کنم.",
    { discipline: -3, conscientious: -2, curiosity: 1, openness: 1 }),

  /* --- Extraversion / Social Energy --- */
  L("q13", "بعد از یک مهمانی پرجمعیت، احساس شارژ می‌کنم نه خستگی.",
    { extraversion: 3, socialEnergy: 3 }),

  C("q14", "در یک جمع جدید که هیچ‌کس را نمی‌شناسی، معمولاً...", [
    { label: "خودم سر صحبت را باز می‌کنم", w: { extraversion: 3, socialEnergy: 2, leadership: 1 } },
    { label: "منتظر می‌مانم کسی نزدیک شود", w: { extraversion: -1, socialEnergy: -1, agreeableness: 1 } },
    { label: "با یکی-دو نفر عمیق حرف می‌زنم، نه با همه", w: { agreeableness: 2, socialEnergy: -1, openness: 1 } },
    { label: "ترجیح می‌دهم اصلاً نروم", w: { extraversion: -3, socialEnergy: -3, stability: -1 } },
  ]),

  L("q15", "سکوت در یک گفت‌وگو مرا معذب می‌کند و دوست دارم پُرَش کنم.",
    { extraversion: 2, socialEnergy: 2, stability: -1 }),

  L("q16", "برای فکر کردن و بازیابی انرژی، به تنهایی نیاز دارم.",
    { extraversion: -3, socialEnergy: -2 }),

  L("q17", "وقتی هیجان‌زده‌ام، دوست دارم همان لحظه آن را با کسی در میان بگذارم.",
    { extraversion: 2, socialEnergy: 2, agreeableness: 1 }),

  /* --- Agreeableness --- */
  L("q18", "وقتی کسی ناراحت است، حتی قبل از اینکه چیزی بگوید، حسش را می‌گیرم.",
    { agreeableness: 3, stability: 1 }),

  C("q19", "یک دوست تصمیمی می‌گیرد که فکر می‌کنی اشتباه است. چه می‌کنی؟", [
    { label: "مستقیم و صادقانه نظرم را می‌گویم", w: { decisiveness: 2, agreeableness: -1, leadership: 1 } },
    { label: "با ملایمت و غیرمستقیم اشاره می‌کنم", w: { agreeableness: 3, stability: 1 } },
    { label: "سؤال می‌پرسم تا خودش به نتیجه برسد", w: { agreeableness: 2, leadership: 1, openness: 1 } },
    { label: "چیزی نمی‌گویم؛ تصمیم خودش است", w: { agreeableness: 1, decisiveness: -1, adaptability: 1 } },
  ]),

  L("q20", "ترجیح می‌دهم کوتاه بیایم تا اینکه یک رابطه به‌خاطر بحث خراب شود.",
    { agreeableness: 3, decisiveness: -1, stability: 1 }),

  L("q21", "به انگیزه‌ها و حرف‌های آدم‌ها معمولاً خوش‌بینانه نگاه می‌کنم.",
    { agreeableness: 2, stability: 1, openness: 1 }),

  L("q22", "کمک کردن به دیگران، حتی وقتی برایم زحمت دارد، برایم ارزشمند است.",
    { agreeableness: 3 }),

  /* --- Emotional Stability --- */
  L("q23", "زیر فشار، معمولاً خونسردی‌ام را حفظ می‌کنم.",
    { stability: 3, decisiveness: 1, leadership: 1 }),

  L("q24", "بعد از یک اتفاق ناخوشایند، ذهنم مدت‌ها آن را مرور می‌کند.",
    { stability: -3, curiosity: 1 }),

  C("q25", "یک نقشه‌ی مهم در لحظه‌ی آخر به‌هم می‌خورد. اولین واکنش درونی‌ات؟", [
    { label: "خب، پلن ب چیست؟ سریع تطبیق می‌دهم", w: { adaptability: 3, stability: 2, decisiveness: 1 } },
    { label: "اول حسابی کلافه می‌شوم، بعد جمع‌وجور می‌کنم", w: { stability: -1, adaptability: 1 } },
    { label: "دنبال این می‌گردم که چه کسی مقصر بوده", w: { agreeableness: -2, stability: -1 } },
    { label: "کاملاً به‌هم می‌ریزم و تمرکزم را از دست می‌دهم", w: { stability: -3, adaptability: -2 } },
  ]),

  L("q26", "نگرانی درباره‌ی آینده بخش زیادی از ذهنم را می‌گیرد.",
    { stability: -3, planning: 1 }),

  L("q27", "نظر منفی دیگران درباره‌ام را به‌سختی فراموش می‌کنم.",
    { stability: -2, agreeableness: 1 }),

  /* --- Adaptability --- */
  L("q28", "تغییر ناگهانی در برنامه‌ها مرا اذیت نمی‌کند؛ زود کنار می‌آیم.",
    { adaptability: 3, stability: 1, planning: -1 }),

  L("q29", "در محیط‌های جدید و ناآشنا سریع احساس راحتی می‌کنم.",
    { adaptability: 3, openness: 1, extraversion: 1 }),

  L("q30", "اگر روشی جواب نداد، بدون لجاجت سراغ روش دیگری می‌روم.",
    { adaptability: 2, openness: 1, decisiveness: 1 }),

  L("q31", "روتین‌های ثابت و قابل‌پیش‌بینی به من حس امنیت می‌دهند.",
    { adaptability: -2, conscientious: 1, stability: 1 }),

  /* --- Leadership / Decisiveness --- */
  C("q32", "در یک کار گروهی که هیچ‌کس مسئولیت را به‌عهده نمی‌گیرد، تو...", [
    { label: "ناخودآگاه هدایت گروه را به‌دست می‌گیرم", w: { leadership: 3, decisiveness: 2, extraversion: 1 } },
    { label: "ساختار پیشنهاد می‌دهم ولی رهبر نمی‌شوم", w: { leadership: 1, planning: 2, agreeableness: 1 } },
    { label: "وظیفه‌ام را بی‌سروصدا و عالی انجام می‌دهم", w: { conscientious: 2, leadership: -1, discipline: 1 } },
    { label: "منتظر می‌مانم یکی دیگر تصمیم بگیرد", w: { leadership: -2, decisiveness: -2 } },
  ]),

  L("q33", "وقتی تصمیمی می‌گیرم، معمولاً قاطع پای آن می‌مانم.",
    { decisiveness: 3, stability: 1, leadership: 1 }),

  L("q34", "راحت می‌توانم به دیگران کار بسپارم و به نتیجه‌شان اعتماد کنم.",
    { leadership: 2, agreeableness: 1, conscientious: -1 }),

  L("q35", "وقتی لازم باشد، می‌توانم تصمیم سختی بگیرم که همه را خوشحال نمی‌کند.",
    { decisiveness: 3, leadership: 2, agreeableness: -1 }),

  L("q36", "دیگران اغلب در شرایط مبهم به‌سراغ من می‌آیند تا تکلیف را روشن کنم.",
    { leadership: 3, decisiveness: 2, stability: 1 }),

  /* --- Decision Style: logic vs emotion, speed vs caution --- */
  C("q37", "یک تصمیم بزرگ زندگی پیش رویت است. بیشتر به چه چیزی تکیه می‌کنی؟", [
    { label: "تحلیل منطقی، فهرست مزایا و معایب", w: { conscientious: 2, decisiveness: 1, stability: 1 } },
    { label: "حس درونی و شهودم", w: { creativity: 2, openness: 2, decisiveness: 1 } },
    { label: "مشورت با آدم‌های مورد اعتماد", w: { agreeableness: 2, socialEnergy: 1 } },
    { label: "ترکیبی از همه، ولی خیلی طولش می‌دهم", w: { decisiveness: -2, planning: 2, curiosity: 1 } },
  ]),

  L("q38", "ترجیح می‌دهم سریع تصمیم بگیرم و در مسیر اصلاح کنم تا اینکه بی‌نهایت تحلیل کنم.",
    { decisiveness: 3, riskTolerance: 2, planning: -1 }),

  L("q39", "قبل از یک خرید نسبتاً بزرگ، ساعت‌ها تحقیق و مقایسه می‌کنم.",
    { planning: 2, conscientious: 2, decisiveness: -1, curiosity: 1 }),

  L("q40", "وقتی تصمیمی گرفتم، تا مدت‌ها به این فکر می‌کنم که نکند اشتباه بوده.",
    { decisiveness: -2, stability: -2, planning: 1 }),

  /* --- Risk Tolerance --- */
  L("q41", "حاضرم یک شغل امن را برای فرصتی پرریسک ولی هیجان‌انگیز رها کنم.",
    { riskTolerance: 3, openness: 2, stability: -1 }),

  L("q42", "ریسک حساب‌شده برایم جذاب است، نه ترسناک.",
    { riskTolerance: 3, decisiveness: 1, leadership: 1 }),

  L("q43", "امنیت و قابلیت پیش‌بینی برایم از هیجانِ ناشناخته مهم‌تر است.",
    { riskTolerance: -3, conscientious: 1, planning: 2 }),

  C("q44", "یک سرمایه‌ی کوچک داری. کجا می‌گذاری‌اش؟", [
    { label: "جای پرریسک با احتمال سود بالا", w: { riskTolerance: 3, openness: 1 } },
    { label: "ترکیب متعادل از ریسک و امنیت", w: { planning: 2, decisiveness: 1, stability: 1 } },
    { label: "جای کاملاً امن، حتی با سود کم", w: { riskTolerance: -3, conscientious: 1, stability: 1 } },
    { label: "اول کلی می‌خوانم و آخر هیچ‌کاری نمی‌کنم", w: { decisiveness: -2, curiosity: 1, riskTolerance: -1 } },
  ]),

  /* --- Mixed / behavioral signal questions --- */
  L("q45", "وقتی موضوعی برایم جالب می‌شود، تا عمق ریزترین جزئیاتش پیش می‌روم.",
    { curiosity: 3, conscientious: 1, openness: 1 }),

  L("q46", "اغلب ایده‌هایی به ذهنم می‌رسد که بقیه می‌گویند «به این چطور فکر کردی؟».",
    { creativity: 3, openness: 2 }),

  L("q47", "زمانم را با دقت مدیریت می‌کنم و کمتر دیر می‌رسم.",
    { discipline: 3, conscientious: 2, planning: 1 }),

  L("q48", "وقتی همه ناامید شده‌اند، معمولاً من کسی هستم که روحیه را برمی‌گرداند.",
    { stability: 2, leadership: 2, agreeableness: 2, extraversion: 1 }),

  L("q49", "از به‌چالش‌کشیدن باورهای قدیمی خودم لذت می‌برم.",
    { openness: 3, curiosity: 2 }),

  L("q50", "ترجیح می‌دهم در پس‌زمینه بمانم تا اینکه مرکز توجه باشم.",
    { extraversion: -2, leadership: -1, socialEnergy: -1 }),

  L("q51", "وقتی قول کاری را می‌دهم، تقریباً همیشه به آن عمل می‌کنم.",
    { conscientious: 3, discipline: 1, agreeableness: 1 }),

  C("q52", "آخرین سؤال؛ صادقانه. در عمیق‌ترین حالت، بیشتر شبیه کدامی؟", [
    { label: "کاشفی که دنبال مرز بعدی است", w: { curiosity: 3, openness: 2, riskTolerance: 1 } },
    { label: "معماری که نظم را از دل بی‌نظمی می‌سازد", w: { planning: 3, conscientious: 2, discipline: 1 } },
    { label: "پلی که آدم‌ها را به هم وصل می‌کند", w: { agreeableness: 3, extraversion: 2, socialEnergy: 1 } },
    { label: "ناخدایی که در طوفان آرام می‌ماند", w: { stability: 3, leadership: 2, decisiveness: 2 } },
  ]),
];

/* Expose to other modules */
window.DPT_QUESTIONS = QUESTIONS;
window.DPT_TRAITS = TRAITS;
     
