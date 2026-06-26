/* ================================================================== *
 *  Sietse's Halve Marathon — Run Coach
 *  Vast schema + invullen/afvinken, Strava-achtige stats, badges.
 *  Alles lokaal in de browser. Geen server nodig (werkt ook via file://).
 *  Sturing: TIJD & GEVOEL leidend, kilometers slechts indicatief.
 * ================================================================== */

/* ========== INSTELLINGEN PER HARDLOPER — pas dit blok aan ==========
   Hergebruik deze app voor een andere loper: kopieer de map, wijzig dit
   blok, vervang coach.jpg, en pas zo nodig het PLAN/de ZONES aan.       */
const CONFIG = {
  appName:    "Op naar 1:45",            // titel boven in de app
  runner:     "Sietse",                   // naam van de loper
  goal:       "Halve marathon in 1:45",   // doel (groot in de hero)
  startDate:  new Date(2026, 5, 8),       // maandag van week 1 (maand 0-based: 5 = juni)
  storeKey:   "sietse-hm.log.v1",         // UNIEKE opslagsleutel — per loper anders!
  coachName:  "Coach Bart",               // naam van de coach
  coachHandle:"@bartlopen",               // TikTok/social van de coach
  coachPhoto: "coach.jpg",                // coachfoto (bestand in deze map)
  athleteWord:"strijder",                   // hoe de coach de loper aanspreekt
  catchphrase:"Train op tijd, niet op ego 💪", // jouw TikTok-leus
};
/* =================================================================== */

const RUNNER = CONFIG.runner;
const GOAL = CONFIG.goal;
const START_DATE = CONFIG.startDate;
const STORE_KEY = CONFIG.storeKey;
const COACH_INITIAL = (CONFIG.coachName.replace(/^coach\s+/i, "")[0] || "C").toUpperCase();
const TOTAL_WEEKS = 16;

/* --- Tempozones — tijd & RPE leidend, paces zijn indicatief --------- */
const ZONES = [
  { key: "herstel",  name: "Heel rustig",      pace: "langzamer dan 6:45", info: "RPE 2-3 · herstel & wennen" },
  { key: "duur",     name: "Rustige duurloop", pace: "6:15–6:45",          info: "RPE 3-4 · praten moet makkelijk" },
  { key: "opbouw",   name: "Opbouwloop",       pace: "6:15 → 5:45",        info: "RPE 4-6 · rustig start, steady eind" },
  { key: "tempo",    name: "Tempoblok (HM)",   pace: "≈ 5:00–5:20",        info: "RPE 6-7 · korte zinnen lukken nog" },
  { key: "interval", name: "Vlot / interval",  pace: "4:50–5:10",          info: "RPE 7 · soepel, geen sprint" },
];
const zoneByKey = Object.fromEntries(ZONES.map((z) => [z.key, z]));

/* --- Coach Bart (@bartlopen): motiverende, beheerste praat per type -- */
const COACH = {
  duur: [
    "Rustig tempo vandaag, strijder. Praten moet makkelijk kunnen.",
    "Geen haast — deze kalme minuten bouwen je basis op.",
    "Lekker ontspannen lopen. De knie mag stil blijven, strijder.",
    "Rustig is precies goed. Zo blijf je fit en blessurevrij.",
    "Op tijd, niet op ego, strijder. Vandaag telt het gevoel.",
    "Soepele pas, rustige adem. Niets forceren.",
    "Luister naar je lijf, strijder. Rustig is geen verlies.",
    "Geduldig de basis leggen. Hier word je sterker van.",
  ],
  opbouw: [
    "Opbouwloop, strijder. Rustig starten, pas later naar steady.",
    "Nooit jagen aan het begin — de winst zit in het laatste deel.",
    "Voel hoe je gecontroleerd versnelt. Beheerst, niet gehaast.",
    "Eerst rustig inschakelen, dan vloeiend naar tempo, strijder.",
    "Laat het tempo komen, dwing het niet. Mooi gedoseerd.",
    "Begin trager dan je wilt, strijder. Dat is de kunst.",
    "Tweede helft sterker dan de eerste. Dat is het doel.",
  ],
  tempo: [
    "Tempoblok op halve-marathongevoel, strijder. Stevig maar beheerst.",
    "Gecontroleerd stevig — korte zinnen moeten nog net lukken.",
    "Dit is je wedstrijdritme. Onthoud goed hoe het voelt, strijder.",
    "Net buiten je comfort, maar nooit verzuren. Daar zit de winst.",
    "Op tijd lopen, niet op ego, strijder. Houd 'm strak.",
    "Voel de drempel, blijf eronder. Beheerst doorbijten.",
    "Gelijkmatig en vlot, strijder. Geen schokken in je tempo.",
  ],
  interval: [
    "Vlotte stukjes, strijder. Soepel blijven, geen sprint najagen.",
    "Houd elke herhaling gelijk en ontspannen. Techniek voorop.",
    "Even pittig, daarna rustig herstellen. Jij hebt dit in de hand.",
    "Scherp maar licht. Hier komt je snelheid vandaan, strijder.",
    "Lichte voeten, hoge cadans. Niet stampen, strijder.",
    "Elke herhaling een kopie van de vorige. Beheerst.",
    "Kort en knap, dan loslaten. De knie blijft blij, strijder.",
  ],
  herstel: [
    "Hersteldag, strijder. Rustig aan, daar word je beter van.",
    "Vandaag laad je op. Herstel hoort net zo goed bij trainen.",
    "Houd het licht en kalm. Morgen sta je er sterker.",
    "Slim getraind is rustig getraind, strijder. De knie zegt dank je.",
    "Niets bewijzen vandaag. Gewoon losdraaien.",
    "Rust is waar de winst binnenkomt, strijder. Geniet ervan.",
  ],
};

const DONE = [
  "💪 Knap en beheerst, strijder!",
  "✅ Slim getraind, strijder!",
  "🙌 Sterk werk, strijder!",
  "🧠 Op tijd, niet op ego — top, strijder!",
  "🦵 Blessurevrij binnen, strijder!",
  "🔥 Mooi gedoseerd, strijder!",
];
const coachLine = (zone) => {
  const arr = COACH[zone] || COACH.duur;
  return arr[Math.floor(Math.random() * arr.length)];
};

/* --- Waarom deze training? (uitleg per type) ----------------------- */
const WHY = {
  duur:     "Rustige duurlopen bouwen je aerobe motor: sterker hart, meer haarvaten en betere vetverbranding. Voor jou doen ze nog meer — ze laten knie, pezen, kuiten en voeten rustig wennen aan de herhaalde schokbelasting. Daarom groeit vooral de zaterdagduurloop stap voor stap.",
  opbouw:   "Bij de opbouwloop start je bewust rustig en schakel je pas in het laatste deel naar steady. Zo leer je gecontroleerd versnellen op vermoeide benen — precies wat je in de finale van de halve marathon nodig hebt, zonder de knie vroeg te belasten.",
  tempo:    "Tempoblokken liggen rond je halve-marathoninspanning. Je leert sneller lopen zónder te verzuren en went aan het ritme van 1:45. Korte blokken met rust ertussen houden de belasting beheersbaar terwijl je drempel omhoog kruipt.",
  interval: "Korte, vlotte herhalingen prikkelen je loopeconomie en snelheid. Door soepel te blijven — geen sprint, geen verzuring — schakelen je benen vlotter, terwijl de schokbelasting laag en gedoseerd blijft.",
  herstel:  "Herstel is waar je sterker wordt. Lichte inspanning houdt het bloed stromen zonder nieuwe belasting, zodat de winst van de zware dagen echt binnenkomt en de knie de tijd krijgt om mee te groeien.",
};

/* --- Helpers om het schema compact te schrijven --------------------
   min = totale trainingstijd (incl. in- en uitlopen). km is indicatief. */
const ma = (o) => ({ day: "ma", dayLabel: "Maandag",  kind: "Techniek & tempo", ...o });
const za = (o) => ({ day: "za", dayLabel: "Zaterdag", kind: "Duurloop",         ...o });

/* --- Het 16-weken schema (tijd leidend) ----------------------------- */
const PLAN = [
  /* Fase 1 · Herstart en wennen aan belasting */
  { week: 1, dates: "8–14 jun", km: "8–10 km", phase: "Fase 1 · Herstart & wennen", sessions: [
    ma({ zone: "duur",    min: 30, title: "30 min rustig",        goal: "Weer op gang komen", blocks: ["30 min rustig (RPE 3)", "Optie: 5 min lopen / 1 min wandelen", "Ademhaling onder controle"] }),
    za({ zone: "duur",    min: 35, title: "35 min duurloop",      goal: "Knie laten wennen",  blocks: ["35 min rustige duurloop", "Knie moet stil blijven", "Stoppen bij stekende pijn"] }),
  ]},
  { week: 2, dates: "15–21 jun", km: "11–13 km", phase: "Fase 1 · Herstart & wennen", sessions: [
    ma({ zone: "duur",    min: 35, title: "35 min + versnellingen", goal: "Soepelheid",        blocks: ["35 min rustig", "Daarna 4×20 sec ontspannen versnellen", "Volledig herstel tussen de versnellingen"] }),
    za({ zone: "duur",    min: 45, title: "45 min duurloop",       goal: "Duur opbouwen",      blocks: ["45 min rustig", "Wandelpauze mag elke 12–15 min", "Gebruik de pauze vroeg, niet pas als het misgaat"] }),
  ]},
  { week: 3, dates: "22–28 jun", km: "13–15 km", phase: "Fase 1 · Herstart & wennen", sessions: [
    ma({ zone: "interval", min: 40, title: "6×1 min vlot",         goal: "Beentjes wakker",    blocks: ["8–10 min inlopen", "6×1 min vlot (RPE 7)", "2 min rustig ertussen", "Uitlopen — 40 min totaal"] }),
    za({ zone: "duur",     min: 50, title: "50 min duurloop",      goal: "Langer op de benen", blocks: ["50 min rustige duurloop", "Constant en ontspannen"] }),
  ]},
  { week: 4, dates: "29 jun–5 jul", km: "10–12 km", phase: "Fase 1 · Herstart & wennen", recovery: true, sessions: [
    ma({ zone: "herstel", min: 30, title: "30 min heel rustig",   goal: "Herstelweek",        blocks: ["30 min heel rustig (RPE 2-3)", "Niets forceren"] }),
    za({ zone: "duur",    min: 40, title: "40 min ontspannen",     goal: "Herstel",            blocks: ["40 min ontspannen", "Geen tempo"] }),
  ]},

  /* Fase 2 · Duur uitbouwen en lichte snelheid */
  { week: 5, dates: "6–12 jul", km: "15–17 km", phase: "Fase 2 · Duur uitbouwen", sessions: [
    ma({ zone: "tempo",  min: 45, title: "3×5 min steady",        goal: "Drempelgevoel",      blocks: ["8–10 min inlopen", "3×5 min steady (RPE 5-6)", "3 min rustig ertussen", "Uitlopen — 45 min totaal"] }),
    za({ zone: "duur",   min: 60, title: "60 min duurloop",       goal: "Eerste uur",         blocks: ["60 min rustig", "Verdeel je krachten"] }),
  ]},
  { week: 6, dates: "13–19 jul", km: "16–18 km", phase: "Fase 2 · Duur uitbouwen", sessions: [
    ma({ zone: "interval", min: 45, title: "6×2 min vlot",        goal: "Snelheidsuithouding", blocks: ["8–10 min inlopen", "6×2 min vlot (RPE 6-7)", "2 min rustig ertussen", "Uitlopen — 45 min totaal"] }),
    za({ zone: "duur",     min: 65, title: "65 min duurloop",     goal: "Duur vasthouden",     blocks: ["65 min rustige duurloop", "Drinken oefenen"] }),
  ]},
  { week: 7, dates: "20–26 jul", km: "18–20 km", phase: "Fase 2 · Duur uitbouwen", sessions: [
    ma({ zone: "opbouw", min: 45, title: "Opbouwloop 45 min",     goal: "Gecontroleerd schakelen", blocks: ["45 min opbouwloop", "Rustig starten", "Laatste 10 min steady"] }),
    za({ zone: "duur",   min: 70, title: "70 min duurloop",       goal: "Langste tot nu toe",  blocks: ["70 min rustig", "Constant tempo"] }),
  ]},
  { week: 8, dates: "27 jul–2 aug", km: "13–15 km", phase: "Fase 2 · Duur uitbouwen", recovery: true, sessions: [
    ma({ zone: "duur",  min: 35, title: "35 min + versnellingen", goal: "Los blijven",         blocks: ["35 min rustig", "5×20 sec los versnellen"] }),
    za({ zone: "duur",  min: 55, title: "55 min duurloop",        goal: "Herstelweek",         blocks: ["55 min rustig", "Geen tempo"] }),
  ]},

  /* Fase 3 · Halve-marathonritme opbouwen */
  { week: 9, dates: "3–9 aug", km: "20–22 km", phase: "Fase 3 · HM-ritme opbouwen", sessions: [
    ma({ zone: "tempo", min: 55, title: "4×6 min tempoblok",      goal: "HM-ritme voelen",     blocks: ["8–10 min inlopen", "4×6 min tempoblok (RPE 6)", "3 min rustig ertussen", "Uitlopen — 55 min totaal"] }),
    za({ zone: "duur",  min: 75, title: "75 min duurloop",        goal: "Piek-duur opbouwen",  blocks: ["75 min rustige duurloop", "Rustig en geduldig"] }),
  ]},
  { week: 10, dates: "10–16 aug", km: "20–22 km", phase: "Fase 3 · HM-ritme opbouwen", sessions: [
    ma({ zone: "interval", min: 50, title: "5×3 min vlot",        goal: "Scherpte",            blocks: ["8–10 min inlopen", "5×3 min vlot (RPE 6-7)", "2 min rustig ertussen", "Uitlopen — 50 min totaal"] }),
    za({ zone: "duur",     min: 80, title: "80 min duurloop",     goal: "Duur vasthouden",     blocks: ["80 min rustig", "Drinken & eten oefenen"] }),
  ]},
  { week: 11, dates: "17–23 aug", km: "22–24 km", phase: "Fase 3 · HM-ritme opbouwen", sessions: [
    ma({ zone: "opbouw", min: 55, title: "Opbouwloop 55 min",     goal: "Sterk afmaken",       blocks: ["55 min opbouwloop", "Rustig starten", "Laatste 15 min steady"] }),
    za({ zone: "duur",   min: 85, title: "85 min duurloop",       goal: "Lange duur",          blocks: ["85 min rustig", "Laatste 10 min steady als alles goed voelt"] }),
  ]},
  { week: 12, dates: "24–30 aug", km: "16–18 km", phase: "Fase 3 · HM-ritme opbouwen", recovery: true, sessions: [
    ma({ zone: "herstel", min: 40, title: "40 min heel rustig",   goal: "Herstelweek",         blocks: ["40 min heel rustig (RPE 3)", "Opladen"] }),
    za({ zone: "duur",    min: 65, title: "65 min ontspannen",    goal: "Herstel",             blocks: ["65 min ontspannen", "Geen tempo"] }),
  ]},

  /* Fase 4 · Specifiek trainen en fris worden */
  { week: 13, dates: "31 aug–6 sep", km: "24–26 km", phase: "Fase 4 · Specifiek & fris", sessions: [
    ma({ zone: "tempo", min: 60, title: "3×10 min tempoblok",     goal: "Specifieke scherpte", blocks: ["8–10 min inlopen", "3×10 min tempoblok (RPE 6-7)", "4 min rustig ertussen", "Uitlopen — 60 min totaal"] }),
    za({ zone: "duur",  min: 90, title: "90 min duurloop",        goal: "⭐ Belangrijk testmoment", kind: "Testmoment", test: true, blocks: ["90 min rustige duurloop", "Kantelpunt: lukt dit pijnvrij?", "Knie de dag erna normaal = groen licht voor 1:45"] }),
  ]},
  { week: 14, dates: "7–13 sep", km: "24–26 km", phase: "Fase 4 · Specifiek & fris", sessions: [
    ma({ zone: "interval", min: 55, title: "4×5 min vlot",        goal: "Fris & scherp",       blocks: ["8–10 min inlopen", "4×5 min vlot (RPE 6)", "3 min rustig ertussen", "Uitlopen — 55 min totaal"] }),
    za({ zone: "duur",     min: 95, title: "95 min duurloop",     goal: "Lange duur",          blocks: ["95 min rustig", "Laatste 15 min steady als de knie goed is"] }),
  ]},
  { week: 15, dates: "14–20 sep", km: "27–29 km", phase: "Fase 4 · Specifiek & fris", sessions: [
    ma({ zone: "tempo", min: 65, title: "2×15 min HM-inspanning", goal: "Wedstrijdritme",      blocks: ["8–10 min inlopen", "2×15 min op halve-marathoninspanning (RPE 6-7)", "5 min rustig ertussen", "Uitlopen — 65 min totaal"] }),
    za({ zone: "duur",  min: 102, title: "100–105 min lange duurloop", goal: "Piek-lange duur", blocks: ["100–105 min rustige lange duurloop", "Niet forceren"] }),
  ]},
  { week: 16, dates: "21–27 sep", km: "raceweek", phase: "Fase 4 · Specifiek & fris", taper: true, race: true, sessions: [
    ma({ zone: "tempo", min: 40, title: "Benen los + 3×3 min",    goal: "Aanscherpen op race", kind: "Taper", blocks: ["35–40 min rustig", "3×3 min op wedstrijdgevoel", "Alles licht en kort houden"] }),
    za({ zone: "tempo", min: 105, title: "🏁 Halve marathon",      goal: "Doelrace · richting 1:45", kind: "Doelrace", blocks: ["Wedstrijd zaterdag → halve marathon (≈ 5:00/km)", "Wedstrijd zondag → vandaag 15–20 min loslopen of rust", "Eerste 5 km iets rustiger starten", "Beheersing, geen bravoure"] }),
  ]},
];

/* --- Extra advies (info-kaarten) ----------------------------------- */
const INFO = [
  { icon: "🦵", title: "Knie: signaal → actie", items: [
    "Pijn tot 2/10 die niet verandert: rustig afmaken, daarna 24 uur checken.",
    "Pijn 3/10 of stijgend: stoppen met tempo, naar huis wandelen of rustig uitlopen.",
    "Mank lopen, stekende pijn of zwelling: training afbreken — eerst pijnvrij wandelen.",
    "Pijnvrij bouwen gaat altijd vóór tempo. Tijd is leidend, niet je ego.",
  ]},
  { icon: "🔄", title: "Altijd hetzelfde ritueel", items: [
    "Start met 8–10 min rustig inlopen + korte mobiliteit voor enkels, heupen en knie.",
    "Sluit af met 5–10 min uitlopen of wandelen.",
    "De tijden in het schema zijn de totale trainingstijd, inclusief dit ritueel.",
    "Wandelpauze is een slim hulpmiddel: gebruik 'm vroeg, niet pas als het misgaat.",
  ]},
  { icon: "💪", title: "Kracht, ondergrond & schoenen", items: [
    "Gym/krachttraining blijft ondersteunend — hou het erin.",
    "Geen zware beentraining op vrijdag en liever ook niet vlak vóór de maandagtraining.",
    "Loop meestal vlak; vermijd harde afdalingen voor de knie.",
    "Blijf bij vertrouwde schoenen.",
  ]},
  { icon: "🎯", title: "Wedstrijd & 1:45", items: [
    "Voor 1:45 is ongeveer 5:00 per kilometer nodig.",
    "Start de eerste 5 km iets rustiger dan dat gevoel, niet harder.",
    "Kantelpunt na week 13: lukt 90 min pijnvrij en voelt de knie de dag erna normaal, dan kun je echt specifiek naar 1:45 toe.",
    "Geeft week 13/14 reactie? Dan blijft uitlopen het doel en is 1:45 een bonus.",
  ]},
];

/* --- Badges -------------------------------------------------------- */
const BADGES = [
  { id: "first",  icon: "👟",  name: "Eerste run",        desc: "1 training afgevinkt",     test: (s) => s.done >= 1 },
  { id: "ten",    icon: "🔟",  name: "Tien op de teller", desc: "10 trainingen gedaan",     test: (s) => s.done >= 10 },
  { id: "half",   icon: "⚡",  name: "Halverwege",        desc: "50% van het schema",       test: (s) => s.done >= s.total / 2 },
  { id: "week",   icon: "✅",  name: "Week compleet",     desc: "Een hele week afgerond",   test: (s) => s.fullWeeks >= 1 },
  { id: "long",   icon: "🏔️", name: "Lange loper",       desc: "≥ 90 min gelopen",         test: (s) => s.maxTime >= 90 * 60 },
  { id: "fast",   icon: "💨",  name: "Snelle benen",      desc: "Een run onder 5:30/km",    test: (s) => s.bestPace > 0 && s.bestPace < 330 },
  { id: "test",   icon: "⭐",  name: "Testmoment",        desc: "Week 13 duurloop voltooid", test: (s) => s.testDone },
  { id: "finish", icon: "🏅",  name: "Finisher",          desc: "Halve marathon voltooid",  test: (s) => s.raceDone },
];

/* ================================================================== *
 *  State
 * ================================================================== */
function loadLog() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}
function saveLog() { localStorage.setItem(STORE_KEY, JSON.stringify(log)); }
let log = loadLog();

const sid = (week, day) => `w${week}-${day}`;
const flatSessions = PLAN.flatMap((w) => w.sessions.map((s) => ({ ...s, week: w.week })));
const totalSessions = flatSessions.length;

function autoTime(raw) {
  const digits = String(raw).replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  const parts = []; let s = digits;
  while (s.length > 2) { parts.unshift(s.slice(-2)); s = s.slice(0, -2); }
  parts.unshift(s);
  return parts.join(":");
}

function parseTime(str) {
  if (!str) return null;
  const parts = String(str).split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 60;
}
function paceSeconds(distance, timeStr) {
  const d = parseFloat(String(distance).replace(",", "."));
  const sec = parseTime(timeStr);
  if (!d || !sec) return null;
  return sec / d;
}
function fmtPace(perKm) {
  if (!perKm) return null;
  const m = Math.floor(perKm / 60);
  const s = Math.round(perKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

/* Afgeleide statistieken uit de log */
function computeStats() {
  let done = 0, km = 0, maxDist = 0, maxTime = 0, bestPace = 0, raceDone = false, testDone = false;
  flatSessions.forEach((s) => {
    const e = log[sid(s.week, s.day)];
    if (!e || !e.done) return;
    done++;
    const d = parseFloat(String(e.distance || "").replace(",", ".")) || 0;
    km += d;
    if (d > maxDist) maxDist = d;
    const t = parseTime(e.time) || 0;
    if (t > maxTime) maxTime = t;
    const p = paceSeconds(e.distance, e.time);
    if (p && (bestPace === 0 || p < bestPace)) bestPace = p;
    if (s.week === 16 && s.day === "za") raceDone = true;
    if (s.week === 13 && s.day === "za") testDone = true;
  });
  let streak = 0, run = 0;
  flatSessions.forEach((s) => {
    const e = log[sid(s.week, s.day)];
    if (e && e.done) { run++; streak = Math.max(streak, run); } else run = 0;
  });
  let fullWeeks = 0;
  PLAN.forEach((w) => {
    if (w.sessions.every((s) => log[sid(w.week, s.day)]?.done)) fullWeeks++;
  });
  return { done, total: totalSessions, km, maxDist, maxTime, bestPace, raceDone, testDone, streak, fullWeeks };
}

function currentWeek() {
  const diff = Math.floor((Date.now() - START_DATE.getTime()) / (7 * 864e5));
  return Math.min(TOTAL_WEEKS, Math.max(1, diff + 1));
}

/* ================================================================== *
 *  Rendering
 * ================================================================== */
const $ = (id) => document.getElementById(id);

function animateCount(el, to, suffix = "") {
  const dur = 700, t0 = performance.now();
  const dec = to % 1 !== 0;
  function step(t) {
    const k = Math.min(1, (t - t0) / dur);
    const v = to * (1 - Math.pow(1 - k, 3));
    el.textContent = (dec ? v.toFixed(1) : Math.round(v)) + suffix;
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderHero(stats) {
  $("runnerName").textContent = RUNNER;
  $("goalText").textContent = GOAL;
  const pct = Math.round((stats.done / stats.total) * 100);
  $("ringPct").textContent = `${pct}%`;
  const r = 52, c = 2 * Math.PI * r;
  const fg = $("ringFg");
  fg.style.strokeDasharray = c;
  fg.style.strokeDashoffset = c;
  requestAnimationFrame(() => { fg.style.strokeDashoffset = c * (1 - pct / 100); });
  const mottos = ["Stap voor stap, strijder!", "Lekker bezig, strijder!", "Je bouwt 'm rustig op.", "Halverwege — beheerst doorpakken! ⚡", "Bijna race-klaar, strijder!", "Finisher! Wat een strijder!"];
  $("heroMotto").textContent =
    stats.raceDone ? mottos[5] : pct >= 80 ? mottos[4] : pct >= 50 ? mottos[3] : pct >= 20 ? mottos[2] : pct > 0 ? mottos[1] : mottos[0];
  renderCountdown();
}

function raceInfo() {
  const rw = PLAN.find((w) => w.race) || PLAN[PLAN.length - 1];
  const rs = rw.sessions.find((s) => s.day === "za") || rw.sessions[rw.sessions.length - 1];
  const off = { ma: 0, di: 1, wo: 2, do: 3, vr: 4, za: 5, zo: 6 }[rs.day] ?? 5;
  const date = new Date(START_DATE.getTime() + ((rw.week - 1) * 7 + off) * 864e5);
  const days = Math.round((date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5);
  return { days, name: rs.title.replace(/^🏁\s*/, "") };
}
function renderCountdown() {
  const motto = $("heroMotto");
  if (!motto) return;
  let el = $("raceCountdown");
  if (!el) {
    el = document.createElement("p");
    el.id = "raceCountdown";
    el.className = "hero-countdown";
    motto.after(el);
  }
  const { days, name } = raceInfo();
  el.textContent =
    days > 1 ? `🗓\uFE0F nog ${days} dagen tot je ${name}` :
    days === 1 ? `🗓\uFE0F morgen is het zover: ${name}!` :
    days === 0 ? `🔥 vandaag is het zover: ${name}!` :
    `🎉 ${name} volbracht \u2014 chapeau!`;
}

function renderStats(stats) {
  animateCount($("statDone"), stats.done);
  animateCount($("statKm"), Math.round(stats.km * 10) / 10, " km");
  animateCount($("statStreak"), stats.streak);
  const cw = currentWeek();
  const wk = PLAN.find((w) => w.week === cw);
  const wkDone = wk.sessions.filter((s) => log[sid(cw, s.day)]?.done).length;
  $("statWeek").textContent = `${wkDone}/${wk.sessions.length}`;
}

function renderNextUp() {
  const cw = currentWeek();
  const next =
    flatSessions.find((s) => s.week >= cw && !log[sid(s.week, s.day)]?.done) ||
    flatSessions.find((s) => !log[sid(s.week, s.day)]?.done);
  const box = $("nextUp");
  if (!next) {
    box.innerHTML = `<div class="nextup-card done"><span class="nextup-eyebrow">🏅 Schema compleet</span><strong>Alles afgevinkt — chapeau, strijder!</strong></div>`;
    return;
  }
  const z = zoneByKey[next.zone];
  box.innerHTML = `
    <button class="nextup-card zone-${next.zone}" data-week="${next.week}" data-day="${next.day}">
      <span class="nextup-eyebrow">Volgende training · week ${next.week} · ${next.dayLabel}</span>
      <strong>${next.title}</strong>
      <span class="nextup-meta">${next.min} min · ${z.name}</span>
      <span class="nextup-go">Openen ›</span>
    </button>`;
  box.querySelector(".nextup-card").addEventListener("click", () => openDetail(next.week, next.day));
}

function renderZones() {
  $("zonesList").innerHTML = ZONES.map((z) => `
    <div class="zone-row zone-${z.key}">
      <span class="zone-dot"></span>
      <div class="zone-main"><strong>${z.name}</strong><span>${z.info}</span></div>
      <span class="zone-pace">${z.pace}<small>/km</small></span>
    </div>`).join("");
}

function renderChart() {
  const max = Math.max(...PLAN.map((w) => w.sessions.reduce((n, s) => n + s.min, 0)));
  $("volumeChart").innerHTML = PLAN.map((w) => {
    const planned = w.sessions.reduce((n, s) => n + s.min, 0);
    const doneMin = w.sessions.reduce((n, s) => n + (log[sid(w.week, s.day)]?.done ? s.min : 0), 0);
    const h = Math.round((planned / max) * 100);
    const fill = planned ? Math.round((doneMin / planned) * 100) : 0;
    const cls = w.race ? "is-race" : w.recovery ? "is-rest" : "";
    return `
      <div class="bar ${cls}" title="Week ${w.week}: ${planned} min gepland">
        <div class="bar-track" style="height:${h}%">
          <div class="bar-fill" style="height:${fill}%"></div>
        </div>
        <span class="bar-x">${w.week}</span>
      </div>`;
  }).join("");
}

function tagOf(w) {
  if (w.race) return `<span class="week-tag tag-race">Raceweek</span>`;
  if (w.recovery) return `<span class="week-tag tag-rest">Herstel</span>`;
  if (w.taper) return `<span class="week-tag tag-taper">Taper</span>`;
  return "";
}

function renderWeeks() {
  const cw = currentWeek();
  const todayCode = ["zo", "ma", "di", "wo", "do", "vr", "za"][new Date().getDay()];
  let html = "", lastPhase = "";
  PLAN.forEach((w, i) => {
    if (w.phase !== lastPhase) { html += `<h4 class="sub-phase reveal">${w.phase}</h4>`; lastPhase = w.phase; }
    const sess = w.sessions.map((s) => {
      const e = log[sid(w.week, s.day)] || {};
      const z = zoneByKey[s.zone];
      const pace = fmtPace(paceSeconds(e.distance, e.time));
      const bits = [];
      if (e.distance) bits.push(`${e.distance} km`);
      if (e.time) bits.push(e.time);
      if (pace) bits.push(pace);
      const logged = bits.length ? `<span class="session-logged">📊 ${bits.join(" · ")}</span>` : "";
      return `
        <button class="session zone-${s.zone} ${e.done ? "is-done" : ""} ${w.week === cw && s.day === todayCode ? "is-today" : ""}" data-week="${w.week}" data-day="${s.day}">
          <span class="session-day">${s.dayLabel.slice(0, 2)}</span>
          <span class="session-body">
            <span class="session-title">${s.title}${w.week === cw && s.day === todayCode ? ' <span class="today-badge">Vandaag</span>' : ""}</span>
            <span class="session-meta">${s.min} min · ${s.kind}</span>
            ${logged}
          </span>
          <span class="session-check">${e.done ? "✓" : ""}</span>
        </button>`;
    }).join("");
    html += `
      <article class="week-card reveal ${w.week === cw ? "is-current" : ""} ${w.week < cw ? (w.sessions.every((x) => log[sid(w.week, x.day)]?.done) ? "is-complete" : "is-missed") : ""}" style="--i:${i % 4}">
        <header class="week-head">
          <div><span class="week-no">Week ${w.week}</span><span class="week-dates">${w.dates} · ${w.km}</span></div>
          ${w.week === cw ? `<span class="week-tag tag-now">Nu</span>` : w.week < cw ? (w.sessions.every((x) => log[sid(w.week, x.day)]?.done) ? `<span class="week-tag tag-done">✓ af</span>` : `<span class="week-tag tag-missed">gemist</span>`) : tagOf(w)}
        </header>
        <div class="session-list">${sess}</div>
      </article>`;
  });
  $("weeksList").innerHTML = html;
  $("weeksList").querySelectorAll(".session").forEach((b) =>
    b.addEventListener("click", () => openDetail(+b.dataset.week, b.dataset.day)));
  observeReveals();
}

function renderBadges(stats) {
  $("badgeGrid").innerHTML = BADGES.map((b) => {
    const got = b.test(stats);
    return `
      <div class="badge ${got ? "got" : "locked"}" title="${b.desc}">
        <span class="badge-icon">${got ? b.icon : "🔒"}</span>
        <strong>${b.name}</strong>
        <span class="badge-desc">${b.desc}</span>
      </div>`;
  }).join("");
}

function renderInfo() {
  $("infoList").innerHTML = INFO.map((c, i) => `
    <article class="info-card reveal" style="--i:${i}">
      <span class="info-icon">${c.icon}</span>
      <h4>${c.title}</h4>
      <ul>${c.items.map((t) => `<li>${t}</li>`).join("")}</ul>
    </article>`).join("");
}

function addJumpButton() {
  const head = document.querySelector(".weeks .phase-head");
  if (!head || document.getElementById("jumpNow")) return;
  const btn = document.createElement("button");
  btn.id = "jumpNow";
  btn.type = "button";
  btn.className = "jump-now";
  btn.textContent = "Naar deze week \u2193";
  btn.addEventListener("click", () =>
    document.querySelector(".week-card.is-current")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  head.insertAdjacentElement("afterend", btn);
}

function renderAll() {
  const stats = computeStats();
  renderHero(stats);
  renderStats(stats);
  renderNextUp();
  renderChart();
  renderZones();
  renderWeeks();
  addJumpButton();
  renderBadges(stats);
  renderInfo();
  observeReveals();
}

/* ----- Detailweergave ---------------------------------------------- */
function openDetail(week, day) {
  const w = PLAN.find((x) => x.week === week);
  const s = w.sessions.find((x) => x.day === day);
  const id = sid(week, day);
  const e = log[id] || {};
  const z = zoneByKey[s.zone];

  $("detailTitle").textContent = `Week ${week} · ${s.dayLabel}`;
  $("detailBody").className = `zone-${s.zone}`;
  $("detailBody").innerHTML = `
    <div class="detail-hero zone-${s.zone}">
      <span class="detail-kind">${s.kind} · ${s.min} min</span>
      <h2>${s.title}</h2>
      <p class="detail-goal">${s.goal}</p>
      <span class="detail-zone">${z.name} · ${z.info}</span>
    </div>

    <div class="coach-bubble">
      <div class="coach-ava">
        <img src="${CONFIG.coachPhoto}" alt="${CONFIG.coachName}" onerror="this.style.display='none'">
        <span>${COACH_INITIAL}</span>
      </div>
      <div class="coach-text">
        <strong>${CONFIG.coachName} <span class="coach-handle">${CONFIG.coachHandle}</span></strong>
        <p>${coachLine(s.zone)}</p>
      </div>
    </div>

    <section class="detail-block why">
      <h4>Waarom deze training</h4>
      <p>${WHY[s.zone] || ""}</p>
    </section>

    <section class="detail-block">
      <h4>Opbouw</h4>
      <ol class="block-list">${s.blocks.map((b) => `<li>${b}</li>`).join("")}</ol>
    </section>

    <section class="detail-block">
      <h4>Invullen na de training</h4>
      <div class="form-grid">
        <label>Afstand (km)
          <input id="fDistance" type="text" inputmode="decimal" placeholder="bv. 8,5" value="${e.distance ?? ""}">
        </label>
        <label>Tijd (mm:ss)
          <input id="fTime" type="text" inputmode="numeric" placeholder="bv. 52:00" value="${e.time ?? ""}">
        </label>
        <label class="full">Gemiddeld tempo
          <output id="fPace" class="pace-out">${fmtPace(paceSeconds(e.distance, e.time)) || "—"}</output>
        </label>
        <label>Hartslag (bpm)
          <input id="fHr" type="number" inputmode="numeric" placeholder="bv. 148" value="${e.hr ?? ""}">
        </label>
        <label>Knie / gevoel
          <select id="fFeel">
            ${["", "👍 knie stil, prima", "🟡 lichte spanning", "🟠 pijn 2-3/10", "🔴 stoppen / afgebroken", "💪 sterk & vlot"]
              .map((o) => `<option value="${o}" ${String(e.feel ?? "") === o ? "selected" : ""}>${o || "Kies…"}</option>`).join("")}
          </select>
        </label>
        <label class="full">Notitie
          <textarea id="fNote" rows="2" placeholder="Hoe ging het? Knie?">${e.note ?? ""}</textarea>
        </label>
      </div>
    </section>

    <div class="detail-actions">
      <button id="toggleDone" class="btn-primary ${e.done ? "is-done" : ""}">${e.done ? "✓ Gedaan" : "Markeer als gedaan"}</button>
      <button id="saveSession" class="btn-ghost">Opslaan</button>
    </div>`;

  const recalc = () => ($("fPace").textContent = fmtPace(paceSeconds($("fDistance").value, $("fTime").value)) || "—");
  $("fDistance").addEventListener("input", recalc);
  $("fTime").addEventListener("input", () => { $("fTime").value = autoTime($("fTime").value); recalc(); });

  const collect = () => ({
    ...log[id],
    distance: $("fDistance").value.trim(),
    time: $("fTime").value.trim(),
    hr: $("fHr").value.trim(),
    feel: $("fFeel").value,
    note: $("fNote").value.trim(),
  });

  $("saveSession").addEventListener("click", () => {
    log[id] = collect(); saveLog();
    toast("Opgeslagen 💾");
    closeDetail();
  });
  $("toggleDone").addEventListener("click", () => {
    const cur = collect();
    cur.done = !cur.done;
    log[id] = cur; saveLog();
    if (cur.done) { celebrate(); toast(s.race ? "🏅 Finisher! Op tijd binnen — wat een strijder!" : DONE[Math.floor(Math.random() * DONE.length)]); }
    closeDetail();
  });

  showView("detail");
}

function closeDetail() { renderAll(); showView("list"); }

function showView(name) {
  const list = $("listView"), detail = $("detailView"), back = $("backButton");
  if (name === "detail") {
    list.classList.add("hidden");
    detail.classList.remove("hidden");
    requestAnimationFrame(() => detail.classList.add("is-in"));
    back.classList.remove("hidden");
    window.scrollTo(0, 0);
  } else {
    detail.classList.remove("is-in");
    back.classList.add("hidden");
    setTimeout(() => {
      detail.classList.add("hidden");
      list.classList.remove("hidden");
      window.scrollTo(0, 0);
    }, 280);
  }
}

/* ----- Invliegende beelden ----------------------------------------- */
let io;
function observeReveals() {
  io = io || new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
}

/* ----- Toast ------------------------------------------------------- */
let toastT;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ----- Confetti ---------------------------------------------------- */
function celebrate() {
  const cv = $("confetti");
  const ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ["#d7ff3e", "#ff5630", "#2fb8ff", "#9a7bff", "#ffab2e"];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2, y: innerHeight / 3,
    vx: (Math.random() - 0.5) * 14, vy: Math.random() * -16 - 4,
    s: Math.random() * 7 + 4, c: colors[(Math.random() * colors.length) | 0],
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
  }));
  let frame = 0;
  (function loop() {
    frame++;
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach((p) => {
      p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      ctx.restore();
    });
    if (frame < 120) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}

/* ================================================================== *
 *  Init
 * ================================================================== */
/* Branding uit CONFIG zetten (zodat templaten makkelijk is) */
document.title = `${CONFIG.appName} — ${CONFIG.coachHandle}`;
if ($("appName")) $("appName").textContent = CONFIG.appName;
if ($("brandHandle")) $("brandHandle").textContent = CONFIG.coachHandle;
if ($("footCredit")) {
  $("footCredit").innerHTML =
    `<span class="catch">${CONFIG.catchphrase}</span>` +
    `Coaching door ${CONFIG.coachName} · TikTok <strong>${CONFIG.coachHandle}</strong> 🏃‍♂️`;
}

$("backButton").addEventListener("click", closeDetail);
$("resetButton").addEventListener("click", () => {
  if (confirm("Alle ingevulde voortgang wissen?")) { log = {}; saveLog(); renderAll(); toast("Voortgang gewist"); }
});

/* ----- Back-up: exporteren / importeren ---------------------------- */
function downloadJSON(filename, obj) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }));
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$("exportBtn").addEventListener("click", () => {
  downloadJSON(`${CONFIG.appName.replace(/\s+/g, "-")}-voortgang.json`, {
    app: "bartlopen-runcoach", storeKey: STORE_KEY, runner: RUNNER,
    exportedAt: new Date().toISOString(), log,
  });
  toast("Back-up opgeslagen ⬇︎");
});
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const incoming = data && data.log ? data.log : data;
      if (!incoming || typeof incoming !== "object") throw new Error("ongeldig");
      log = { ...log, ...incoming };
      saveLog(); renderAll();
      toast("Back-up geladen ⬆︎ — welkom terug!");
    } catch {
      toast("Kon dit bestand niet lezen");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

/* Alles tekenen */
renderAll();

/* Intro-splash netjes weg laten faden (tikken slaat 'm over) */
(function () {
  const splash = $("splash");
  if (!splash) return;
  const hide = () => splash.classList.add("gone");
  setTimeout(hide, 1100);
  splash.addEventListener("click", hide);
  setTimeout(() => splash.remove(), 1700);
})();

/* Service worker voor offline gebruik (alleen op http/https, niet via file://) */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
