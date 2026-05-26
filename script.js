/* =========================================================
   ifNote — script.js (v2)
   Full mock interactions: forms, filters, display modes,
   hafalan modes, quiz types, AI actions, backup flow.
   Local-first: no real backend; storage via localStorage only.
   ========================================================= */

(() => {
  "use strict";

  /* ========== JAPANESE DISPLAY MODE ========== */
  let jpMode = localStorage.getItem("ifnote.jpMode") || "beginner";
  // beginner = hiragana friendly, normal = kanji no furigana, furigana = kanji + ruby

  const applyJpMode = () => {
    document.body.setAttribute("data-jp-mode", jpMode);
    localStorage.setItem("ifnote.jpMode", jpMode);
  };

  const getJpText = (item) => {
    if (jpMode === "furigana" && item.furigana) return item.furigana;
    if (jpMode === "normal" && item.normal) return item.normal;
    return item.beginner || item.contoh || "";
  };

  /* ========== DUMMY DATA ========== */
  const KOTOBA = [
    {
      id: 1, jp: "たべます", romaji: "tabemasu", arti: "makan",
      jenis: "kata kerja", level: "N5", tags: ["makanan"],
      beginner: "わたしは ごはんを たべます。",
      normal: "私はご飯を食べます。",
      furigana: '<ruby>私<rt>わたし</rt></ruby>は<ruby>ご飯<rt>ごはん</rt></ruby>を<ruby>食<rt>た</rt></ruby>べます。',
      contohArti: "Saya makan nasi.",
      mastery: "good",
    },
    {
      id: 2, jp: "のみます", romaji: "nomimasu", arti: "minum",
      jenis: "kata kerja", level: "N5", tags: ["minuman"],
      beginner: "おちゃを のみます。",
      normal: "お茶を飲みます。",
      furigana: 'お<ruby>茶<rt>ちゃ</rt></ruby>を<ruby>飲<rt>の</rt></ruby>みます。',
      contohArti: "Saya minum teh.",
      mastery: "good",
    },
    {
      id: 3, jp: "いきます", romaji: "ikimasu", arti: "pergi",
      jenis: "kata kerja", level: "N5", tags: ["pergerakan"],
      beginner: "がっこうに いきます。",
      normal: "学校に行きます。",
      furigana: '<ruby>学校<rt>がっこう</rt></ruby>に<ruby>行<rt>い</rt></ruby>きます。',
      contohArti: "Saya pergi ke sekolah.",
      mastery: "weak",
    },
    {
      id: 4, jp: "きれい", romaji: "kirei", arti: "cantik / bersih",
      jenis: "sifat-na", level: "N5", tags: ["sifat"],
      beginner: "この へやは きれいです。",
      normal: "この部屋はきれいです。",
      furigana: 'この<ruby>部屋<rt>へや</rt></ruby>はきれいです。',
      contohArti: "Kamar ini bersih.",
      mastery: "mid",
    },
    {
      id: 5, jp: "たかい", romaji: "takai", arti: "tinggi / mahal",
      jenis: "sifat-i", level: "N5", tags: ["sifat"],
      beginner: "この やまは たかいです。",
      normal: "この山は高いです。",
      furigana: 'この<ruby>山<rt>やま</rt></ruby>は<ruby>高<rt>たか</rt></ruby>いです。',
      contohArti: "Gunung ini tinggi.",
      mastery: "good",
    },
    {
      id: 6, jp: "ゆっくり", romaji: "yukkuri", arti: "pelan-pelan",
      jenis: "kata keterangan", level: "N4", tags: ["keterangan"],
      beginner: "ゆっくり はなして ください。",
      normal: "ゆっくり話してください。",
      furigana: 'ゆっくり<ruby>話<rt>はな</rt></ruby>してください。',
      contohArti: "Tolong bicara pelan-pelan.",
      mastery: "mid",
    },
  ];

  const BUNPOU = [
    {
      id: 1, jp: "〜ながら", arti: "sambil",
      rumus: "kata kerja bentuk ます tanpa ます + ながら",
      kapan: "Dipakai saat melakukan dua kegiatan dalam waktu yang sama.",
      level: "N4", tags: ["kegiatan"], mastery: "mid",
      beginner: "おんがくを ききながら、べんきょうします。",
      normal: "音楽を聞きながら、勉強します。",
      furigana: '<ruby>音楽<rt>おんがく</rt></ruby>を<ruby>聞<rt>き</rt></ruby>きながら、<ruby>勉強<rt>べんきょう</rt></ruby>します。',
      contohArti: "Saya belajar sambil mendengarkan musik.",
      catatan: "Kegiatan utama ada di belakang kalimat.",
      kesalahan: "Jangan pakai untuk dua kegiatan yang tidak bisa dilakukan bersamaan.",
    },
    {
      id: 2, jp: "〜たい", arti: "ingin",
      rumus: "kata kerja bentuk ます tanpa ます + たい",
      kapan: "Dipakai untuk mengatakan keinginan diri sendiri.",
      level: "N5", tags: ["keinginan"], mastery: "good",
      beginner: "わたしは すしを たべたいです。",
      normal: "私は寿司を食べたいです。",
      furigana: '<ruby>私<rt>わたし</rt></ruby>は<ruby>寿司<rt>すし</rt></ruby>を<ruby>食<rt>た</rt></ruby>べたいです。',
      contohArti: "Saya ingin makan sushi.",
      catatan: "Hanya untuk keinginan sendiri, bukan orang lain.",
      kesalahan: "Jangan pakai 〜たい untuk orang lain. Pakai 〜たがっている.",
    },
    {
      id: 3, jp: "〜に / 〜で", arti: "partikel tempat & arah",
      rumus: "tempat + に (arah/tujuan) · tempat + で (lokasi kegiatan)",
      kapan: "に dipakai untuk arah atau tujuan. で dipakai untuk lokasi sebuah kegiatan.",
      level: "N5", tags: ["partikel", "sering salah"], mastery: "weak",
      beginner: "がっこうに いきます。 / としょかんで べんきょうします。",
      normal: "学校に行きます。/ 図書館で勉強します。",
      furigana: '<ruby>学校<rt>がっこう</rt></ruby>に<ruby>行<rt>い</rt></ruby>きます。/ <ruby>図書館<rt>としょかん</rt></ruby>で<ruby>勉強<rt>べんきょう</rt></ruby>します。',
      contohArti: "Saya pergi ke sekolah. / Saya belajar di perpustakaan.",
      catatan: "に = arah/tujuan, で = tempat kegiatan berlangsung.",
      kesalahan: "Sering tertukar: がっこうで いきます (salah).",
    },
    {
      id: 4, jp: "〜てから", arti: "setelah",
      rumus: "kata kerja bentuk て + から",
      kapan: "Dipakai untuk urutan kegiatan: A dulu baru B.",
      level: "N4", tags: ["urutan"], mastery: "mid",
      beginner: "ごはんを たべてから、テレビを みます。",
      normal: "ご飯を食べてから、テレビを見ます。",
      furigana: '<ruby>ご飯<rt>ごはん</rt></ruby>を<ruby>食<rt>た</rt></ruby>べてから、テレビを<ruby>見<rt>み</rt></ruby>ます。',
      contohArti: "Setelah makan, saya menonton TV.",
      catatan: "Urutan harus jelas: A てから B.",
      kesalahan: "Jangan pakai untuk kegiatan yang terjadi bersamaan.",
    },
  ];

  const FLASHCARDS = [
    { front: "たべます", romaji: "tabemasu", back: "makan", type: "kotoba",
      beginner: "わたしは ごはんを たべます。", normal: "私はご飯を食べます。",
      furigana: '<ruby>私<rt>わたし</rt></ruby>は<ruby>ご飯<rt>ごはん</rt></ruby>を<ruby>食<rt>た</rt></ruby>べます。',
      exArti: "Saya makan nasi.", mastery: "good" },
    { front: "のみます", romaji: "nomimasu", back: "minum", type: "kotoba",
      beginner: "おちゃを のみます。", normal: "お茶を飲みます。",
      furigana: 'お<ruby>茶<rt>ちゃ</rt></ruby>を<ruby>飲<rt>の</rt></ruby>みます。',
      exArti: "Saya minum teh.", mastery: "good" },
    { front: "いきます", romaji: "ikimasu", back: "pergi", type: "kotoba",
      beginner: "がっこうに いきます。", normal: "学校に行きます。",
      furigana: '<ruby>学校<rt>がっこう</rt></ruby>に<ruby>行<rt>い</rt></ruby>きます。',
      exArti: "Saya pergi ke sekolah.", mastery: "weak" },
    { front: "ゆっくり", romaji: "yukkuri", back: "pelan-pelan", type: "kotoba",
      beginner: "ゆっくり はなして ください。", normal: "ゆっくり話してください。",
      furigana: 'ゆっくり<ruby>話<rt>はな</rt></ruby>してください。',
      exArti: "Tolong bicara pelan-pelan.", mastery: "mid" },
    { front: "たかい", romaji: "takai", back: "tinggi / mahal", type: "kotoba",
      beginner: "この やまは たかいです。", normal: "この山は高いです。",
      furigana: 'この<ruby>山<rt>やま</rt></ruby>は<ruby>高<rt>たか</rt></ruby>いです。',
      exArti: "Gunung ini tinggi.", mastery: "good" },
    { front: "〜ながら", romaji: "", back: "sambil", type: "bunpou",
      beginner: "おんがくを ききながら、べんきょうします。", normal: "音楽を聞きながら、勉強します。",
      furigana: '<ruby>音楽<rt>おんがく</rt></ruby>を<ruby>聞<rt>き</rt></ruby>きながら、<ruby>勉強<rt>べんきょう</rt></ruby>します。',
      exArti: "Saya belajar sambil mendengarkan musik.", mastery: "mid" },
    { front: "〜たい", romaji: "", back: "ingin", type: "bunpou",
      beginner: "わたしは すしを たべたいです。", normal: "私は寿司を食べたいです。",
      furigana: '<ruby>私<rt>わたし</rt></ruby>は<ruby>寿司<rt>すし</rt></ruby>を<ruby>食<rt>た</rt></ruby>べたいです。',
      exArti: "Saya ingin makan sushi.", mastery: "good" },
    { front: "〜に / 〜で", romaji: "", back: "partikel tempat & arah", type: "bunpou",
      beginner: "がっこうに いきます。", normal: "学校に行きます。",
      furigana: '<ruby>学校<rt>がっこう</rt></ruby>に<ruby>行<rt>い</rt></ruby>きます。',
      exArti: "Saya pergi ke sekolah.", mastery: "weak" },
  ];

  const QUIZ_SETS = {
    kotoba: [
      { prompt: "Pilih arti dari:", word: "たべます", meta: "Kotoba · N5", mode: "mc",
        options: [
          { key: "A", text: "minum", correct: false },
          { key: "B", text: "makan", correct: true },
          { key: "C", text: "pergi", correct: false },
          { key: "D", text: "melihat", correct: false },
        ],
        explain: 'たべます artinya <strong>makan</strong>. Ini termasuk <em>kata kerja</em>.' },
      { prompt: "Pilih arti dari:", word: "ゆっくり", meta: "Kotoba · N4", mode: "mc",
        options: [
          { key: "A", text: "pelan-pelan", correct: true },
          { key: "B", text: "cepat", correct: false },
          { key: "C", text: "lapar", correct: false },
          { key: "D", text: "sudah", correct: false },
        ],
        explain: 'ゆっくり artinya <strong>pelan-pelan</strong>. Ini termasuk <em>kata keterangan</em>.' },
      { prompt: "Terjemahkan ke Jepang:", word: "makan", meta: "Kotoba · N5", mode: "blank",
        answer: "たべます",
        explain: '"makan" dalam bahasa Jepang adalah <strong>たべます</strong> (tabemasu).' },
    ],
    bunpou: [
      { prompt: "Pilih partikel yang tepat:", word: "がっこう ___ いきます。", meta: "Bunpou · N5", mode: "mc",
        options: [
          { key: "A", text: "で", correct: false },
          { key: "B", text: "を", correct: false },
          { key: "C", text: "に", correct: true },
          { key: "D", text: "が", correct: false },
        ],
        explain: 'Partikel <strong>に</strong> dipakai untuk menunjukkan <em>arah atau tujuan</em>.' },
      { prompt: "Lengkapi kalimat:", word: "おんがくを きき___、べんきょうします。", meta: "Bunpou · N4", mode: "blank",
        answer: "ながら",
        explain: 'Pola <strong>〜ながら</strong> artinya "sambil". Rumus: bentuk ます tanpa ます + ながら.' },
    ],
    mixed: [
      { prompt: "Pilih arti dari:", word: "たべます", meta: "Kotoba · N5", mode: "mc",
        options: [
          { key: "A", text: "minum", correct: false },
          { key: "B", text: "makan", correct: true },
          { key: "C", text: "pergi", correct: false },
          { key: "D", text: "melihat", correct: false },
        ],
        explain: 'たべます artinya <strong>makan</strong>.' },
      { prompt: "Pilih partikel yang tepat:", word: "がっこう ___ いきます。", meta: "Bunpou · N5", mode: "mc",
        options: [
          { key: "A", text: "で", correct: false },
          { key: "B", text: "を", correct: false },
          { key: "C", text: "に", correct: true },
          { key: "D", text: "が", correct: false },
        ],
        explain: 'Partikel <strong>に</strong> dipakai untuk <em>arah atau tujuan</em>.' },
      { prompt: "Koreksi partikel yang salah:", word: "としょかん に べんきょうします。", meta: "Bunpou · N5", mode: "blank",
        answer: "で",
        explain: 'Untuk lokasi kegiatan, pakai partikel <strong>で</strong>, bukan に.' },
    ],
    ai: [
      { prompt: "AI Generated: Pilih arti dari:", word: "きれい", meta: "AI · N5", mode: "mc",
        options: [
          { key: "A", text: "kotor", correct: false },
          { key: "B", text: "cantik / bersih", correct: true },
          { key: "C", text: "besar", correct: false },
          { key: "D", text: "kecil", correct: false },
        ],
        explain: 'きれい artinya <strong>cantik / bersih</strong>. Ini <em>sifat-na</em>, bukan sifat-i.' },
      { prompt: "AI Generated: Lengkapi:", word: "わたしは すしを たべ___です。", meta: "AI · N5", mode: "blank",
        answer: "たい",
        explain: 'Pola <strong>〜たい</strong> artinya "ingin". Bentuk ます tanpa ます + たい.' },
    ],
  };

  /* ========== HELPERS ========== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ========== LOCAL-FIRST STORAGE ========== */
  const STORAGE_KEYS = {
    kotoba:        "ifnote.kotoba",
    bunpou:        "ifnote.bunpou",
    hafalanOrder:  "ifnote.hafalanOrder",
    quizProgress:  "ifnote.quizProgress",
    theme:         "ifnote.theme",
    jpMode:        "ifnote.jpMode",
    onboardingSeen:"ifnote.onboardingSeen",
    kanjiCache:    "ifnote.kanjiCache",
    aiSettings:    "ifnote.aiSettings",
  };

  const lsRead = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch { return fallback; }
  };
  const lsWrite = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };
  const lsRemove = (key) => {
    try { localStorage.removeItem(key); } catch {}
  };

  // Hydrate user data from localStorage on boot
  // Capture seed snapshots first so reset can restore them
  const KOTOBA_SEED = JSON.parse(JSON.stringify(KOTOBA));
  const BUNPOU_SEED = JSON.parse(JSON.stringify(BUNPOU));

  const hydrateData = () => {
    const savedK = lsRead(STORAGE_KEYS.kotoba);
    if (Array.isArray(savedK) && savedK.length) {
      KOTOBA.length = 0;
      savedK.forEach(k => KOTOBA.push(k));
    }
    const savedB = lsRead(STORAGE_KEYS.bunpou);
    if (Array.isArray(savedB) && savedB.length) {
      BUNPOU.length = 0;
      savedB.forEach(b => BUNPOU.push(b));
    }
  };

  const persistKotoba = () => lsWrite(STORAGE_KEYS.kotoba, KOTOBA);
  const persistBunpou = () => lsWrite(STORAGE_KEYS.bunpou, BUNPOU);

  /* ========== HAFALAN ORDER HELPERS ========== */
  // Stable order key:
  //   [{ type: "kotoba", id: 1 }, { type: "bunpou", id: 1 }, ...]
  const getHafalanOrder = () => {
    const raw = lsRead(STORAGE_KEYS.hafalanOrder);
    if (!Array.isArray(raw)) return null;
    return raw.filter(o => o && (o.type === "kotoba" || o.type === "bunpou") && o.id !== undefined);
  };
  const saveHafalanOrder = (order) => lsWrite(STORAGE_KEYS.hafalanOrder, order);

  // Build initial order from current KOTOBA then BUNPOU
  const buildInitialHafalanOrder = () => {
    const order = [];
    (KOTOBA || []).forEach(k => order.push({ type: "kotoba", id: k.id }));
    (BUNPOU || []).forEach(b => order.push({ type: "bunpou", id: b.id }));
    return order;
  };

  // Make sure order matches current KOTOBA + BUNPOU
  // - Drops missing items silently
  // - Appends new items not yet in order
  const syncHafalanOrder = () => {
    let order = getHafalanOrder();
    if (!order) {
      order = buildInitialHafalanOrder();
      saveHafalanOrder(order);
      return order;
    }
    const have = new Set(order.map(o => `${o.type}:${o.id}`));
    let mutated = false;
    (KOTOBA || []).forEach(k => {
      const key = `kotoba:${k.id}`;
      if (!have.has(key)) { order.push({ type: "kotoba", id: k.id }); have.add(key); mutated = true; }
    });
    (BUNPOU || []).forEach(b => {
      const key = `bunpou:${b.id}`;
      if (!have.has(key)) { order.push({ type: "bunpou", id: b.id }); have.add(key); mutated = true; }
    });
    if (mutated) saveHafalanOrder(order);
    return order;
  };

  const appendToHafalanOrder = (type, id) => {
    const order = getHafalanOrder() || buildInitialHafalanOrder();
    const key = `${type}:${id}`;
    if (order.some(o => `${o.type}:${o.id}` === key)) return;
    order.push({ type, id });
    saveHafalanOrder(order);
  };

  const removeFromHafalanOrder = (type, id) => {
    const order = getHafalanOrder();
    if (!order) return;
    const next = order.filter(o => !(o.type === type && String(o.id) === String(id)));
    if (next.length !== order.length) saveHafalanOrder(next);
  };

  // Resolve order items into real KOTOBA / BUNPOU references, filtered by mode
  const resolveHafalanOrderItems = (mode = "mixed") => {
    const order = syncHafalanOrder();
    const kMap = new Map((KOTOBA || []).map(k => [String(k.id), k]));
    const bMap = new Map((BUNPOU || []).map(b => [String(b.id), b]));
    const items = [];
    order.forEach(o => {
      let it = null;
      if (o.type === "kotoba") it = kMap.get(String(o.id));
      else if (o.type === "bunpou") it = bMap.get(String(o.id));
      if (!it) return; // missing item, skip silently
      items.push({ ...it, _type: o.type });
    });
    if (mode === "kotoba") return items.filter(it => it._type === "kotoba");
    if (mode === "bunpou") return items.filter(it => it._type === "bunpou");
    if (mode === "weak")   return items.filter(it => it.mastery === "weak" || it.mastery === "mid");
    return items;
  };

  /* ========== AI SETTINGS ========== */
  const getAiSettings = () => {
    const s = lsRead(STORAGE_KEYS.aiSettings);
    if (!s || typeof s !== "object") return {
      provider: "", baseUrl: "", apiKey: "", model: "", format: "openai", useReal: false,
    };
    return {
      provider: s.provider || "",
      baseUrl:  s.baseUrl  || "",
      apiKey:   s.apiKey   || "",
      model:    s.model    || "",
      format:   s.format   || "openai",
      useReal:  !!s.useReal,
    };
  };
  const saveAiSettings = (settings) => lsWrite(STORAGE_KEYS.aiSettings, settings);
  const clearAiSettings = () => lsRemove(STORAGE_KEYS.aiSettings);
  const isAiConfigured = () => {
    const s = getAiSettings();
    return !!(s.baseUrl && s.apiKey && s.model);
  };
  const maskApiKey = (key) => {
    const k = String(key || "").trim();
    if (!k) return "—";
    if (k.length <= 6) return "•".repeat(k.length);
    const head = k.slice(0, 3);
    const tail = k.slice(-4);
    return `${head}••••${tail}`;
  };
  /* ========== Real AI helpers ========== */
  // Test connection: hit /models endpoint (OpenAI-compatible) or /chat/completions for Azure
  const testAiConnectionReal = async () => {
    const s = getAiSettings();
    if (!s.baseUrl || !s.apiKey || !s.model) {
      return { ok: false, message: "Lengkapi Base URL, API Key, dan Model ID dulu." };
    }
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      let url, headers;
      if (s.format === "azure") {
        // Azure: list deployments would need different endpoint; do a tiny chat instead
        url = `${s.baseUrl.replace(/\/+$/, "")}/openai/deployments/${encodeURIComponent(s.model)}/chat/completions?api-version=2024-02-01`;
        headers = { "Content-Type": "application/json", "api-key": s.apiKey };
        const res = await fetch(url, {
          method: "POST", headers, signal: ctrl.signal,
          body: JSON.stringify({ messages: [{ role: "user", content: "ping" }], max_tokens: 1 }),
        });
        clearTimeout(t);
        if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
        return { ok: true, message: "Test connection berhasil." };
      }
      // OpenAI-compatible: /v1/models
      url = `${s.baseUrl.replace(/\/+$/, "")}/models`;
      headers = { "Content-Type": "application/json", "Authorization": `Bearer ${s.apiKey}` };
      const res = await fetch(url, { method: "GET", headers, signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
      return { ok: true, message: "Test connection berhasil." };
    } catch (err) {
      return { ok: false, message: err?.name === "AbortError" ? "Timeout 12s." : (err?.message || "Network error") };
    }
  };

  // Real list models from /v1/models (OpenAI-compatible only)
  const listModelsReal = async () => {
    const s = getAiSettings();
    if (!s.baseUrl || !s.apiKey) throw new Error("Base URL & API Key wajib");
    if (s.format === "azure") return []; // Azure tidak expose /models publicly
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const url = `${s.baseUrl.replace(/\/+$/, "")}/models`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Authorization": `Bearer ${s.apiKey}` },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const arr = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
    return arr.map(m => m.id || m.model || m.name).filter(Boolean);
  };

  /* ========== ApiClient (REAL — no mocks) ==========
     Centralized AI entry point. Real OpenAI-compatible chat completions.
     Returns:
       { ok: true,  data: <parsed result> }
       { ok: false, message: <error string> }   // never throws
     If AI not configured → returns ok:false with clear message.
     UI must show toast / settings prompt on failure.
  ========================================================= */
  const ApiClient = (() => {
    const buildChatUrl = (s) => {
      const base = (s.baseUrl || "").replace(/\/+$/, "");
      if (s.format === "azure") {
        return `${base}/openai/deployments/${encodeURIComponent(s.model)}/chat/completions?api-version=2024-02-01`;
      }
      return `${base}/chat/completions`;
    };

    const buildHeaders = (s) => {
      if (s.format === "azure") {
        return { "Content-Type": "application/json", "api-key": s.apiKey };
      }
      return { "Content-Type": "application/json", "Authorization": `Bearer ${s.apiKey}` };
    };

    // Core: chat completion. Returns assistant string content on success.
    const chat = async (messages, opts = {}) => {
      const s = getAiSettings();
      if (!isAiConfigured()) {
        return { ok: false, message: "AI belum diatur. Buka Settings." };
      }
      if (!s.useReal) {
        return { ok: false, message: "Toggle 'Gunakan AI asli' di Settings belum aktif." };
      }
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), opts.timeoutMs || 60000);
        const body = {
          model: s.model,
          messages,
          temperature: opts.temperature ?? 0.4,
        };
        if (opts.json) body.response_format = { type: "json_object" };
        if (opts.maxTokens) body.max_tokens = opts.maxTokens;
        const res = await fetch(buildChatUrl(s), {
          method: "POST",
          headers: buildHeaders(s),
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          let errBody = "";
          try { errBody = (await res.json())?.error?.message || ""; } catch {}
          return { ok: false, message: `HTTP ${res.status}${errBody ? " — " + errBody : ""}` };
        }
        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content || "";
        if (!content) return { ok: false, message: "Respons AI kosong." };
        return { ok: true, data: content };
      } catch (err) {
        return { ok: false, message: err?.name === "AbortError" ? "Timeout 60s." : (err?.message || "Network error") };
      }
    };

    // Chat that expects JSON object response. Auto-parse + retry if invalid.
    const chatJson = async (messages, opts = {}) => {
      const r = await chat(messages, { ...opts, json: true });
      if (!r.ok) return r;
      try {
        // Try strict parse
        return { ok: true, data: JSON.parse(r.data) };
      } catch {
        // Try extracting first {...} block
        const m = r.data.match(/\{[\s\S]*\}/);
        if (m) {
          try { return { ok: true, data: JSON.parse(m[0]) }; } catch {}
        }
        return { ok: false, message: "Respons AI bukan JSON valid." };
      }
    };

    /* ---- High-level methods ---- */
    const SYS = "Kamu adalah AI Tutor bahasa Jepang yang menjelaskan dalam Bahasa Indonesia mudah untuk pemula N5/N4. Selalu sertakan furigana untuk kanji bila relevan. Output rapi.";
    const SYS_JSON = SYS + " Selalu kembalikan JSON valid sesuai schema yang diminta tanpa teks lain.";

    const explainKotoba = async (jp) => chatJson([
      { role: "system", content: SYS_JSON },
      { role: "user", content: `Jelaskan kata Jepang "${jp}". Kembalikan JSON: {"jp":string,"romaji":string,"arti":string,"jenis":"kata kerja|kata benda|sifat-i|sifat-na|kata keterangan|partikel|lainnya","level":"N5|N4|N3|N2|N1","contoh":string,"contohArti":string,"catatan":string}` },
    ]);

    const explainBunpou = async (pattern) => chatJson([
      { role: "system", content: SYS_JSON },
      { role: "user", content: `Jelaskan pola tata bahasa Jepang "${pattern}". Kembalikan JSON: {"jp":string,"arti":string,"rumus":string,"kapan":string,"level":"N5|N4|N3|N2|N1","contoh":string,"contohArti":string,"kesalahan":string,"catatan":string}` },
    ]);

    const correctSentence = async (sentence) => chatJson([
      { role: "system", content: SYS_JSON },
      { role: "user", content: `Koreksi kalimat Jepang ini: "${sentence}". Kembalikan JSON: {"original":string,"hasError":boolean,"corrected":string,"explanation":string,"natural":string}` },
    ]);

    const generateExamples = async (topic) => chatJson([
      { role: "system", content: SYS_JSON },
      { role: "user", content: `Buat 5 contoh kalimat Jepang sederhana N5/N4 untuk topik "${topic}". Kembalikan JSON: {"topic":string,"examples":[{"jp":string,"romaji":string,"arti":string}]}` },
    ]);

    const generateQuiz = async (topic) => chatJson([
      { role: "system", content: SYS_JSON },
      { role: "user", content: `Buat 5 soal pilihan ganda bahasa Jepang N5/N4 untuk topik "${topic}". Kembalikan JSON: {"topic":string,"questions":[{"prompt":string,"word":string,"meta":string,"options":[{"key":"A|B|C|D","text":string,"correct":boolean}],"explain":string}]}` },
    ]);

    const buildHafalanSet = async (topic) => chatJson([
      { role: "system", content: SYS_JSON },
      { role: "user", content: `Buat set kartu hafalan bahasa Jepang untuk topik "${topic}". 6-8 kartu campuran kotoba dan bunpou. Kembalikan JSON: {"topic":string,"cards":[{"jp":string,"romaji":string,"arti":string,"type":"kotoba|bunpou","level":"N5|N4|N3|N2|N1"}]}` },
    ]);

    // Bulk kotoba analyze: feed list of JP words, get analyzed array + dedupe info computed locally
    const analyzeKotobaBulk = async (text) => {
      const items = parseBulkKotobaInput(text);
      if (!items.length) return { ok: true, data: [] };
      const r = await chatJson([
        { role: "system", content: SYS_JSON },
        { role: "user", content: `Analisa tiap kotoba berikut, satu per baris:\n${items.join("\n")}\n\nKembalikan JSON: {"items":[{"jp":string,"romaji":string,"arti":string,"jenis":string,"level":string,"reason":string}]}` },
      ], { temperature: 0.2 });
      if (!r.ok) return r;
      const arr = Array.isArray(r.data?.items) ? r.data.items : [];
      // Compute status (new/exists) locally against KOTOBA
      const out = arr.map(a => ({
        ...a,
        status: isKotobaDuplicate(a.jp) ? "exists" : (a.jp ? "new" : "manual"),
      }));
      return { ok: true, data: out };
    };

    // Sentence analysis: AI returns full breakdown
    const analyzeSentence = async (sentence) => {
      const r = await chatJson([
        { role: "system", content: SYS_JSON },
        { role: "user", content: `Analisa kalimat Jepang ini: "${sentence}". Kembalikan JSON: {"sentence":string,"meaning":string,"bunpouFound":[{"jp":string,"arti":string,"rumus":string,"level":string}],"kotobaFound":[{"jp":string,"arti":string,"level":string}],"particles":[{"p":string,"role":string}],"recommendation":string}` },
      ], { temperature: 0.3 });
      if (!r.ok) return r;
      const d = r.data || {};
      // Tag duplicates locally
      const bunpouFound = (d.bunpouFound || []).map(b => ({ ...b, status: BUNPOU.some(x => x.jp === b.jp) ? "exists" : "new" }));
      const kotobaFound = (d.kotobaFound || []).map(k => ({ ...k, status: isKotobaDuplicate(k.jp) ? "exists" : "new" }));
      return { ok: true, data: { ...d, bunpouFound, kotobaFound, particles: d.particles || [] } };
    };

    // Kanji lookup: structured JSON
    const lookupKanji = async (kanji) => chatJson([
      { role: "system", content: SYS_JSON },
      { role: "user", content: `Jelaskan kanji 「${kanji}」. Kembalikan JSON: {"kanji":string,"meaning":string,"onyomi":string,"kunyomi":string,"jlpt":string,"strokes":number,"examples":[{"jp":string,"reading":string,"arti":string}],"tip":string}` },
    ], { temperature: 0.2 });

    // Plain free-form chat (default mode)
    const freeChat = async (text) => chat([
      { role: "system", content: SYS },
      { role: "user", content: text },
    ]);

    return {
      chat, chatJson,
      explainKotoba, explainBunpou, correctSentence, generateExamples,
      generateQuiz, buildHafalanSet, analyzeKotobaBulk, analyzeSentence,
      lookupKanji, freeChat,
    };
  })();

  const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const masteryDot = (m) => {
    const cls = m === "good" ? "dot--good" : m === "mid" ? "dot--mid" : "dot--weak";
    const label = m === "good" ? "Sudah hafal" : m === "mid" ? "Lumayan" : "Masih lemah";
    return `<span class="dot ${cls}"></span> ${label}`;
  };

  /* ========== KANJI POPUP ========== */
  const KANJI_RE = /[\u4E00-\u9FFF]/;
  const KANJI_RE_GLOBAL = /[\u4E00-\u9FFF]/g;

  const KANJI_CACHE_KEY = "ifnote.kanjiCache";

  const getKanjiCache = () => {
    try {
      const raw = localStorage.getItem(KANJI_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  };
  const saveKanjiCache = (cache) => {
    try { localStorage.setItem(KANJI_CACHE_KEY, JSON.stringify(cache)); } catch {}
  };

  // Normalize AI response into the popup shape
  const normalizeKanjiInfo = (kanji, ai) => {
    const examples = Array.isArray(ai?.examples) ? ai.examples : [];
    const first = examples[0] || {};
    return {
      kanji,
      meaning: ai?.meaning || "-",
      onyomi:  ai?.onyomi  || "-",
      kunyomi: ai?.kunyomi || "-",
      jlpt:    ai?.jlpt    || "",
      strokes: ai?.strokes || 0,
      explanation: ai?.tip || "",
      words: examples.map(e => ({ jp: e.jp || "", reading: e.reading || "", id: e.arti || "" })),
      exampleJp: first.jp || "",
      exampleId: first.arti || "",
    };
  };

  // Async kanji lookup. Uses cache first; on miss, calls AI.
  // Returns { data, source: "cache"|"fresh"|"error", message? }
  const fetchKanjiInfo = async (kanji) => {
    const cache = getKanjiCache();
    if (cache[kanji]) return { data: cache[kanji], source: "cache" };
    const r = await ApiClient.lookupKanji(kanji);
    if (!r.ok) return { data: null, source: "error", message: r.message };
    const info = normalizeKanjiInfo(kanji, r.data);
    cache[kanji] = info;
    saveKanjiCache(cache);
    return { data: info, source: "fresh" };
  };

  // Wrap kanji chars in clickable buttons WITHOUT breaking HTML tags.
  // Walks the string; inside <...> tags, output is copied as-is.
  const makeKanjiClickable = (htmlOrText) => {
    if (!htmlOrText) return "";
    const s = String(htmlOrText);
    let out = "";
    let inTag = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (inTag) {
        out += ch;
        if (ch === ">") inTag = false;
      } else {
        if (ch === "<") {
          out += ch;
          inTag = true;
        } else if (KANJI_RE.test(ch)) {
          out += `<button type="button" class="kanji-click" data-kanji="${ch}" aria-label="Lihat kanji ${ch}">${ch}</button>`;
        } else {
          out += ch;
        }
      }
    }
    return out;
  };

  const renderKanjiPopup = (info, source, message) => {
    const m = $("#kanjiModal");
    if (!m) return;
    const isLoading = source === "loading";
    const isError = source === "error";

    $("#kanjiChar").textContent = info?.kanji || "";
    $("#kanjiMeaning").textContent = isLoading ? "Mencari..." : (info?.meaning || "-");
    $("#kanjiOnyomi").textContent  = isLoading ? "..." : (info?.onyomi  || "-");
    $("#kanjiKunyomi").textContent = isLoading ? "..." : (info?.kunyomi || "-");
    $("#kanjiExplanation").textContent = isLoading
      ? "Sedang menanyakan AI..."
      : isError
        ? `Gagal mengambil data kanji. ${message || ""}`.trim()
        : (info?.explanation || "");
    const wordsEl = $("#kanjiWords");
    if (wordsEl) {
      if (isLoading) {
        wordsEl.innerHTML = '<span class="muted small">Memuat contoh kata...</span>';
      } else if (info?.words && info.words.length) {
        wordsEl.innerHTML = info.words.map(w => `
          <span class="kanji-word-pill">
            <span class="kanji-word-pill__jp">${escapeHtml(w.jp)}</span>
            <span class="kanji-word-pill__reading">${escapeHtml(w.reading || "")}</span>
            <span class="kanji-word-pill__id">${escapeHtml(w.id || "")}</span>
          </span>`).join("");
      } else {
        wordsEl.innerHTML = '<span class="muted small">Belum ada contoh kata.</span>';
      }
    }
    $("#kanjiExampleJp").textContent = info?.exampleJp || "";
    $("#kanjiExampleId").textContent = info?.exampleId ? `Arti: ${info.exampleId}` : "";

    const status = $("#kanjiSourceStatus");
    if (status) {
      status.classList.remove("is-cache", "is-fresh", "is-loading", "is-error");
      if (isLoading) { status.textContent = "Memuat..."; status.classList.add("is-loading"); }
      else if (isError) { status.textContent = `Error: ${message || "AI gagal"}`; status.classList.add("is-error"); }
      else if (source === "cache") { status.textContent = "Dari cache lokal"; status.classList.add("is-cache"); }
      else { status.textContent = "Dijelaskan oleh AI"; status.classList.add("is-fresh"); }
    }

    m.hidden = false;
    const closeBtn = m.querySelector(".kanji-modal__close");
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  };

  // Backward-compat alias used elsewhere in code
  const openKanjiPopup = (info, source) => renderKanjiPopup(info, source);

  // Async opener: shows loading state, then fetches via AI, then renders
  const showKanjiPopup = async (kanji) => {
    if (!kanji) return;
    // Cache hit → instant render, no loading state
    const cache = getKanjiCache();
    if (cache[kanji]) {
      renderKanjiPopup(cache[kanji], "cache");
      return;
    }
    if (!isAiConfigured()) {
      toast("AI belum diatur. Buka Settings dulu.", "warn");
      return;
    }
    renderKanjiPopup({ kanji }, "loading");
    const r = await fetchKanjiInfo(kanji);
    if (r.source === "error") {
      renderKanjiPopup({ kanji }, "error", r.message);
      toast(`Lookup kanji gagal: ${r.message}`, "error");
      return;
    }
    renderKanjiPopup(r.data, r.source);
  };

  const closeKanjiPopup = () => {
    const m = $("#kanjiModal");
    if (m) m.hidden = true;
  };

  /* ========== CONFIRM DIALOG ========== */
  let confirmCallback = null;
  let confirmCancelCallback = null;

  const openConfirm = (options = {}, onConfirm, onCancel) => {
    const m = $("#confirmModal");
    if (!m) {
      // Safe fallback if dialog missing
      if (typeof onConfirm === "function" && window.confirm(options.text || options.title || "Lanjutkan?")) {
        onConfirm();
      } else if (typeof onCancel === "function") {
        onCancel();
      }
      return;
    }
    const titleEl = $("#confirmTitle");
    const textEl = $("#confirmText");
    const iconEl = $("#confirmIcon");
    const okBtn = $("#confirmOk");
    if (titleEl) titleEl.textContent = options.title || "Konfirmasi";
    if (textEl)  textEl.textContent  = options.text  || "Apakah kamu yakin?";
    if (iconEl) {
      iconEl.textContent = options.icon || "?";
      iconEl.classList.remove("confirm-modal__icon--danger", "confirm-modal__icon--warn");
      if (options.danger) iconEl.classList.add("confirm-modal__icon--danger");
      else if (options.warn) iconEl.classList.add("confirm-modal__icon--warn");
    }
    if (okBtn) {
      okBtn.textContent = options.okLabel || "Lanjutkan";
      okBtn.className = `btn ${options.danger ? "btn--danger" : "btn--primary"}`;
    }
    confirmCallback = typeof onConfirm === "function" ? onConfirm : null;
    confirmCancelCallback = typeof onCancel === "function" ? onCancel : null;
    m.hidden = false;
    if (okBtn) setTimeout(() => okBtn.focus(), 50);
  };

  const closeConfirm = (fromConfirm = false) => {
    const m = $("#confirmModal");
    if (m) m.hidden = true;
    if (!fromConfirm && typeof confirmCancelCallback === "function") {
      try { confirmCancelCallback(); } catch {}
    }
    confirmCallback = null;
    confirmCancelCallback = null;
  };

  /* ========== TOAST ========== */
  const ICONS = { info: "i", success: "✓", error: "!", warn: "!" };
  const toast = (message, kind = "info") => {
    const host = $("#toastHost");
    if (!host) return;
    const el = document.createElement("div");
    el.className = `toast toast--${kind}`;
    el.innerHTML = `<span class="toast__icon">${ICONS[kind] || "i"}</span><span>${message}</span>`;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-in"));
    setTimeout(() => {
      el.classList.remove("is-in");
      setTimeout(() => el.remove(), 280);
    }, 2400);
  };


  /* ========== NAVIGATION ========== */
  // Back stack for Android/browser back button
  const NAV_HISTORY = []; // stack of screens we came from, current screen is NOT in here
  let currentScreen = "home";
  let suppressHistoryPush = false; // when true, navigate() won't pushState (used by popstate handler)
  let exitConfirmShown = false;

  const _applyScreen = (target) => {
    $$(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === target));
    $$(".bnav").forEach((b) => b.classList.toggle("is-active", b.dataset.nav === target));
    $$(".side-link").forEach((b) => b.classList.toggle("is-active", b.dataset.nav === target));
    const active = $(`.screen[data-screen="${target}"]`);
    if (active) active.scrollTop = 0;
    window.scrollTo({ top: 0 });
    // Refresh AI status card whenever AI screen becomes active
    if (target === "ai" && typeof renderAiStatusCard === "function") renderAiStatusCard();
    if (target === "ai" && typeof updateAIContext === "function") updateAIContext();
    // Refresh Settings AI form whenever Settings becomes active
    if (target === "settings" && typeof renderAiSettingsForm === "function") renderAiSettingsForm();
  };

  const navigate = (target) => {
    if (!target) return;
    if (target === currentScreen) return;
    // Push current screen onto history stack before swapping
    NAV_HISTORY.push(currentScreen);
    currentScreen = target;
    _applyScreen(target);
    // Add a browser history entry so device back button has something to pop
    if (!suppressHistoryPush) {
      try { history.pushState({ screen: target }, "", ""); } catch {}
    }
  };

  // Detect any open overlay/modal/popup and close the topmost one. Returns true if something was closed.
  const closeTopmostOverlay = () => {
    // 1. Confirm dialog (highest priority)
    const confirmM = $("#confirmModal");
    if (confirmM && !confirmM.hidden && typeof closeConfirm === "function") {
      closeConfirm();
      return true;
    }
    // 2. Kanji popup
    const kanjiP = $("#kanjiPopup");
    if (kanjiP && !kanjiP.hidden && typeof closeKanjiPopup === "function") {
      closeKanjiPopup();
      return true;
    }
    // 3. Form modal (kotoba/bunpou/reset)
    const m = $("#modal");
    if (m && !m.hidden && typeof closeModal === "function") {
      closeModal();
      return true;
    }
    // 4. Onboarding overlay
    const onb = $("#onboarding");
    if (onb && !onb.hidden) {
      // Don't close onboarding on back — it's a forced first-run flow.
      // Returning true keeps user inside it.
      return true;
    }
    // 5. Open filter panels
    const openFilter = document.querySelector(".filter-panel.is-open");
    if (openFilter) {
      const target = openFilter.dataset.filterPanel || openFilter.id?.replace(/Filter$/i, "").toLowerCase();
      if (target && typeof closeFilterPanel === "function") closeFilterPanel(target);
      else openFilter.classList.remove("is-open");
      return true;
    }
    return false;
  };

  const navigateBack = () => {
    if (!NAV_HISTORY.length) return false;
    const prev = NAV_HISTORY.pop();
    currentScreen = prev;
    _applyScreen(prev);
    return true;
  };

  const showExitConfirm = () => {
    if (exitConfirmShown) return;
    exitConfirmShown = true;
    if (typeof openConfirm === "function") {
      openConfirm({
        title: "Keluar dari ifNote?",
        text: "Tekan Keluar untuk menutup aplikasi, atau Batal untuk tetap di Home.",
        icon: "👋",
        okLabel: "Keluar",
        danger: true,
      }, () => {
        // Try Capacitor App plugin if available, else fallback
        try {
          // @ts-ignore
          if (window.Capacitor?.Plugins?.App?.exitApp) {
            window.Capacitor.Plugins.App.exitApp();
            return;
          }
        } catch {}
        // Browser fallback: just go back further (effectively closes the WebView)
        try { history.back(); } catch {}
        exitConfirmShown = false;
      }, () => {
        // Cancel: stay on Home, re-arm history so back works again
        exitConfirmShown = false;
        try { history.pushState({ screen: "home" }, "", ""); } catch {}
      });
    } else {
      const ok = window.confirm("Keluar dari ifNote?");
      exitConfirmShown = false;
      if (ok) {
        try { window.Capacitor?.Plugins?.App?.exitApp?.(); } catch {}
      } else {
        try { history.pushState({ screen: "home" }, "", ""); } catch {}
      }
    }
  };

  // Handle browser/Android back button via popstate
  window.addEventListener("popstate", (ev) => {
    // 1. If any overlay open, consume the back press to close it
    if (closeTopmostOverlay()) {
      // Re-push to keep history aligned with current screen
      try { history.pushState({ screen: currentScreen }, "", ""); } catch {}
      return;
    }
    // 2. Try to go back to previous screen
    if (currentScreen !== "home" && NAV_HISTORY.length) {
      suppressHistoryPush = true;
      const ok = navigateBack();
      suppressHistoryPush = false;
      if (ok) return;
    }
    // 3. On Home → show exit confirm and re-arm history
    showExitConfirm();
  });

  // Seed initial history entries so first back press from Home triggers popstate
  // (else WebView would just close without showing exit confirm)
  try {
    history.replaceState({ screen: "home", _guard: true }, "", "");
    history.pushState({ screen: "home" }, "", "");
  } catch {}

  /* ========== THEME ========== */
  const setTheme = (mode) => {
    document.documentElement.setAttribute("data-theme", mode);
    const tt = $("#themeToggle span");
    if (tt) tt.textContent = mode === "dark" ? "☀️" : "🌙";
    $$(".theme-opt").forEach((o) => o.classList.toggle("is-active", o.dataset.theme === mode));
  };

  /* ========== MODAL ========== */
  let modalSaveCallback = null;

  const openModal = (title, sub, bodyHtml, primaryLabel, onSave) => {
    const m = $("#modal");
    if (!m) return;
    $("#modalTitle").textContent = title;
    $("#modalSub").textContent = sub || "";
    $("#modalBody").innerHTML = bodyHtml || "";
    const btn = $("#modalPrimary");
    btn.textContent = primaryLabel || "Simpan";
    modalSaveCallback = onSave || null;
    m.hidden = false;
    // Focus first input
    const firstInput = $(".modal__body input, .modal__body select, .modal__body textarea");
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  };

  const closeModal = () => {
    const m = $("#modal");
    if (!m) return;
    m.hidden = true;
    modalSaveCallback = null;
  };

  /* ========== KOTOBA FORM MODAL ========== */
  const kotobaFormHtml = (item) => {
    const i = item || {};
    return `
      <div class="form-grid">
        <div class="form-field">
          <label for="kf-jp">Kata Jepang</label>
          <input id="kf-jp" class="input" placeholder="たべます" value="${escapeHtml(i.jp || "")}" />
        </div>
        <div class="form-field">
          <label for="kf-reading">Cara baca</label>
          <input id="kf-reading" class="input" placeholder="たべます" value="${escapeHtml(i.jp || "")}" />
        </div>
        <div class="form-field">
          <label for="kf-romaji">Romaji</label>
          <input id="kf-romaji" class="input" placeholder="tabemasu" value="${escapeHtml(i.romaji || "")}" />
        </div>
        <div class="form-field">
          <label for="kf-arti">Arti Indonesia</label>
          <input id="kf-arti" class="input" placeholder="makan" value="${escapeHtml(i.arti || "")}" />
        </div>
        <div class="form-field">
          <label for="kf-jenis">Jenis kata</label>
          <select id="kf-jenis" class="input">
            <option value="kata benda" ${i.jenis === "kata benda" ? "selected" : ""}>kata benda</option>
            <option value="kata kerja" ${i.jenis === "kata kerja" ? "selected" : ""}>kata kerja</option>
            <option value="sifat-i" ${i.jenis === "sifat-i" ? "selected" : ""}>sifat-i</option>
            <option value="sifat-na" ${i.jenis === "sifat-na" ? "selected" : ""}>sifat-na</option>
            <option value="kata keterangan" ${i.jenis === "kata keterangan" ? "selected" : ""}>kata keterangan</option>
            <option value="partikel" ${i.jenis === "partikel" ? "selected" : ""}>partikel</option>
            <option value="ungkapan" ${i.jenis === "ungkapan" ? "selected" : ""}>ungkapan</option>
            <option value="lainnya" ${i.jenis === "lainnya" ? "selected" : ""}>lainnya</option>
          </select>
        </div>
        <div class="form-field">
          <label for="kf-level">JLPT Level</label>
          <select id="kf-level" class="input">
            <option ${i.level === "N5" ? "selected" : ""}>N5</option>
            <option ${i.level === "N4" ? "selected" : ""}>N4</option>
            <option ${i.level === "N3" ? "selected" : ""}>N3</option>
            <option ${i.level === "N2" ? "selected" : ""}>N2</option>
            <option ${i.level === "N1" ? "selected" : ""}>N1</option>
            <option ${i.level === "Custom" ? "selected" : ""}>Custom</option>
          </select>
        </div>
        <div class="form-section-title">Contoh kalimat</div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="kf-beginner">Beginner (hiragana)</label>
          <input id="kf-beginner" class="input" placeholder="わたしは ごはんを たべます。" value="${escapeHtml(i.beginner || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="kf-normal">Normal Japanese</label>
          <input id="kf-normal" class="input" placeholder="私はご飯を食べます。" value="${escapeHtml(i.normal || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="kf-furigana">Furigana (ruby HTML)</label>
          <input id="kf-furigana" class="input" placeholder="<ruby>私<rt>わたし</rt></ruby>は..." value="${escapeHtml(i.furigana || "")}" />
          <small>Gunakan tag &lt;ruby&gt; untuk furigana di atas kanji.</small>
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="kf-contohArti">Arti contoh</label>
          <input id="kf-contohArti" class="input" placeholder="Saya makan nasi." value="${escapeHtml(i.contohArti || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="kf-tags">Tag (pisah koma)</label>
          <input id="kf-tags" class="input" placeholder="makanan, sehari-hari" value="${(i.tags || []).join(", ")}" />
        </div>
        <div class="form-section-title">Mastery level</div>
        <div class="mastery-pick">
          <button type="button" class="mastery-pick__btn ${i.mastery === "weak" ? "is-active" : ""}" data-mastery="weak"><span class="dot dot--weak"></span> Masih lemah</button>
          <button type="button" class="mastery-pick__btn ${i.mastery === "mid" || !i.mastery ? "is-active" : ""}" data-mastery="mid"><span class="dot dot--mid"></span> Lumayan</button>
          <button type="button" class="mastery-pick__btn ${i.mastery === "good" ? "is-active" : ""}" data-mastery="good"><span class="dot dot--good"></span> Sudah hafal</button>
        </div>
      </div>`;
  };

  const openKotobaModal = (item) => {
    const isEdit = !!item;
    openModal(
      isEdit ? "Edit Kotoba" : "Tambah Kotoba",
      isEdit ? "Perbarui data kotoba ini." : "Catat kata baru yang ingin kamu ingat.",
      kotobaFormHtml(item),
      isEdit ? "Simpan Perubahan" : "Simpan Kotoba",
      () => {
        const jp = ($("#kf-jp") || {}).value || "";
        if (!jp.trim()) { toast("Kata Jepang wajib diisi.", "warn"); return false; }
        const newItem = {
          id: isEdit ? item.id : Date.now(),
          jp: jp.trim(),
          romaji: ($("#kf-romaji") || {}).value || "",
          arti: ($("#kf-arti") || {}).value || "",
          jenis: ($("#kf-jenis") || {}).value || "lainnya",
          level: ($("#kf-level") || {}).value || "N5",
          beginner: ($("#kf-beginner") || {}).value || "",
          normal: ($("#kf-normal") || {}).value || "",
          furigana: ($("#kf-furigana") || {}).value || "",
          contohArti: ($("#kf-contohArti") || {}).value || "",
          tags: ($("#kf-tags") || {}).value.split(",").map(t => t.trim()).filter(Boolean),
          mastery: ($(".mastery-pick__btn.is-active") || {}).dataset?.mastery || "mid",
        };
        if (isEdit) {
          const idx = KOTOBA.findIndex(k => k.id === item.id);
          if (idx >= 0) KOTOBA[idx] = newItem;
          toast("Kotoba diperbarui.", "success");
        } else {
          KOTOBA.push(newItem);
          appendToHafalanOrder("kotoba", newItem.id);
          toast("Kotoba disimpan lokal.", "success");
        }
        persistKotoba();
        renderKotoba();
        renderCatatan();
        renderHafalan();
        return true;
      }
    );
  };


  /* ========== BUNPOU FORM MODAL ========== */
  const bunpouFormHtml = (item) => {
    const i = item || {};
    return `
      <div class="form-grid">
        <div class="form-field" style="grid-column:1/-1">
          <label for="bf-jp">Pola bunpou</label>
          <input id="bf-jp" class="input" placeholder="〜ながら" value="${escapeHtml(i.jp || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="bf-arti">Arti sederhana</label>
          <input id="bf-arti" class="input" placeholder="sambil" value="${escapeHtml(i.arti || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="bf-rumus">Rumus</label>
          <input id="bf-rumus" class="input" placeholder="kata kerja bentuk ます tanpa ます + ながら" value="${escapeHtml(i.rumus || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="bf-kapan">Kapan dipakai</label>
          <textarea id="bf-kapan" class="input" rows="2" placeholder="Dipakai saat...">${escapeHtml(i.kapan || "")}</textarea>
        </div>
        <div class="form-field">
          <label for="bf-level">JLPT Level</label>
          <select id="bf-level" class="input">
            <option ${i.level === "N5" ? "selected" : ""}>N5</option>
            <option ${i.level === "N4" ? "selected" : ""}>N4</option>
            <option ${i.level === "N3" ? "selected" : ""}>N3</option>
            <option ${i.level === "N2" ? "selected" : ""}>N2</option>
            <option ${i.level === "N1" ? "selected" : ""}>N1</option>
            <option ${i.level === "Custom" ? "selected" : ""}>Custom</option>
          </select>
        </div>
        <div class="form-field">
          <label for="bf-tags">Tag (pisah koma)</label>
          <input id="bf-tags" class="input" placeholder="partikel, sering salah" value="${(i.tags || []).join(", ")}" />
        </div>
        <div class="form-section-title">Contoh kalimat</div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="bf-beginner">Beginner (hiragana)</label>
          <input id="bf-beginner" class="input" placeholder="おんがくを ききながら..." value="${escapeHtml(i.beginner || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="bf-normal">Normal Japanese</label>
          <input id="bf-normal" class="input" placeholder="音楽を聞きながら..." value="${escapeHtml(i.normal || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="bf-furigana">Furigana (ruby HTML)</label>
          <input id="bf-furigana" class="input" placeholder="<ruby>音楽<rt>おんがく</rt></ruby>を..." value="${escapeHtml(i.furigana || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="bf-contohArti">Arti contoh</label>
          <input id="bf-contohArti" class="input" placeholder="Saya belajar sambil..." value="${escapeHtml(i.contohArti || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="bf-catatan">Catatan gampang</label>
          <input id="bf-catatan" class="input" placeholder="Tips singkat..." value="${escapeHtml(i.catatan || "")}" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label for="bf-kesalahan">Kesalahan umum</label>
          <input id="bf-kesalahan" class="input" placeholder="Jangan pakai untuk..." value="${escapeHtml(i.kesalahan || "")}" />
        </div>
        <div class="form-section-title">Mastery level</div>
        <div class="mastery-pick">
          <button type="button" class="mastery-pick__btn ${i.mastery === "weak" ? "is-active" : ""}" data-mastery="weak"><span class="dot dot--weak"></span> Masih lemah</button>
          <button type="button" class="mastery-pick__btn ${i.mastery === "mid" || !i.mastery ? "is-active" : ""}" data-mastery="mid"><span class="dot dot--mid"></span> Lumayan</button>
          <button type="button" class="mastery-pick__btn ${i.mastery === "good" ? "is-active" : ""}" data-mastery="good"><span class="dot dot--good"></span> Sudah hafal</button>
        </div>
      </div>`;
  };

  const openBunpouModal = (item) => {
    const isEdit = !!item;
    openModal(
      isEdit ? "Edit Bunpou" : "Tambah Bunpou",
      isEdit ? "Perbarui data bunpou ini." : "Catat pola grammar baru yang sedang kamu pelajari.",
      bunpouFormHtml(item),
      isEdit ? "Simpan Perubahan" : "Simpan Bunpou",
      () => {
        const jp = ($("#bf-jp") || {}).value || "";
        if (!jp.trim()) { toast("Pola bunpou wajib diisi.", "warn"); return false; }
        const newItem = {
          id: isEdit ? item.id : Date.now(),
          jp: jp.trim(),
          arti: ($("#bf-arti") || {}).value || "",
          rumus: ($("#bf-rumus") || {}).value || "",
          kapan: ($("#bf-kapan") || {}).value || "",
          level: ($("#bf-level") || {}).value || "N5",
          tags: ($("#bf-tags") || {}).value.split(",").map(t => t.trim()).filter(Boolean),
          beginner: ($("#bf-beginner") || {}).value || "",
          normal: ($("#bf-normal") || {}).value || "",
          furigana: ($("#bf-furigana") || {}).value || "",
          contohArti: ($("#bf-contohArti") || {}).value || "",
          catatan: ($("#bf-catatan") || {}).value || "",
          kesalahan: ($("#bf-kesalahan") || {}).value || "",
          mastery: ($(".mastery-pick__btn.is-active") || {}).dataset?.mastery || "mid",
        };
        if (isEdit) {
          const idx = BUNPOU.findIndex(b => b.id === item.id);
          if (idx >= 0) BUNPOU[idx] = newItem;
          toast("Bunpou diperbarui.", "success");
        } else {
          BUNPOU.push(newItem);
          appendToHafalanOrder("bunpou", newItem.id);
          toast("Bunpou disimpan lokal.", "success");
        }
        persistBunpou();
        renderBunpou();
        renderCatatan();
        renderHafalan();
        return true;
      }
    );
  };


  /* ========== RENDER: KOTOBA ========== */
  let kotobaQuery = "";
  let kotobaActiveFilter = "Semua";

  const filterKotoba = () => {
    let items = [...KOTOBA];
    const q = kotobaQuery.trim().toLowerCase();
    if (q) {
      items = items.filter((k) =>
        [k.jp, k.romaji, k.arti, k.jenis, k.level, ...(k.tags || [])]
          .join(" ").toLowerCase().includes(q)
      );
    }
    const f = kotobaActiveFilter;
    if (f && f !== "Semua") {
      const jlpt = ["N5","N4","N3","N2","N1"];
      const jenisFilters = ["kata kerja","sifat-i","sifat-na"];
      if (jlpt.includes(f)) {
        items = items.filter(k => k.level === f);
      } else if (jenisFilters.includes(f)) {
        items = items.filter(k => k.jenis === f);
      } else if (f === "Lainnya") {
        items = items.filter(k =>
          !jlpt.includes(k.level) || !jenisFilters.includes(k.jenis)
        ).filter(k =>
          // Items that don't fit common buckets (rough heuristic for mock)
          k.jenis === "kata benda" || k.jenis === "kata keterangan" ||
          k.jenis === "partikel" || k.jenis === "ungkapan" || k.jenis === "lainnya"
        );
      }
    }
    return items;
  };

  const renderKotoba = () => {
    const list = $("#kotobaList");
    const empty = $("#kotobaEmpty");
    if (!list) return;
    const items = filterKotoba();
    if (empty) empty.hidden = items.length > 0;
    list.hidden = items.length === 0;
    list.innerHTML = items.map((k) => `
      <article class="card k-card k-card--compact" data-kotoba-id="${k.id}">
        <button type="button" class="k-card__summary" data-toggle-kotoba="${k.id}" aria-expanded="false">
          <div class="k-card__summary-main">
            <div class="k-card__jp jp">${escapeHtml(k.jp)}</div>
            <div class="k-card__summary-meta">
              <span class="k-card__romaji">${escapeHtml(k.romaji)}</span>
              <span class="k-card__bullet" aria-hidden="true">·</span>
              <span class="k-card__meaning-line">${escapeHtml(k.arti)}</span>
            </div>
          </div>
          <div class="k-card__summary-side">
            <span class="chip chip--blue">${k.level}</span>
            ${k.mastery === "weak" ? '<span class="chip chip--red">Weak</span>' : k.mastery === "mid" ? '<span class="chip chip--amber">Review</span>' : '<span class="chip chip--green">Hafal</span>'}
            <span class="k-card__chevron" aria-hidden="true">⌄</span>
          </div>
        </button>

        <div class="k-card__detail" hidden>
          <div class="k-card__detail-inner">
            <div class="k-card__detail-row">
              <span class="k-card__type-chip">${escapeHtml(k.jenis)}</span>
              <span class="k-card__mastery">${masteryDot(k.mastery)}</span>
            </div>
            <div class="k-card__example">
              <div class="jp jp-furigana">${makeKanjiClickable(getJpText(k))}</div>
              <div class="mini-item__sub">Arti: ${escapeHtml(k.contohArti)}</div>
            </div>
            ${(k.tags && k.tags.length) ? `<div class="k-card__tags">${k.tags.map(t => `<span class="k-card__tag">#${escapeHtml(t)}</span>`).join("")}</div>` : ""}
            <div class="k-card__actions">
              <button class="btn btn--ghost k-card__action-icon" data-edit-kotoba="${k.id}" aria-label="Edit kotoba" title="Edit">✎</button>
              <button class="btn btn--ghost k-card__action-icon" data-nav="ai" data-toast="AI menjelaskan ${escapeHtml(k.jp)}" aria-label="AI Jelaskan" title="AI Jelaskan">✨</button>
              <button class="btn btn--ghost k-card__action-icon" data-nav="quiz" data-toast="Quiz dibuat dari ${escapeHtml(k.jp)}" aria-label="Buat Quiz" title="Buat Quiz">❓</button>
              <button class="btn btn--primary" data-nav="hafalan" data-toast="Hafalan dimuat">Hafalan</button>
            </div>
          </div>
        </div>
      </article>
    `).join("");
  };

  /* ========== RENDER: BUNPOU ========== */
  let bunpouQuery = "";
  let bunpouActiveFilter = "Semua";

  const filterBunpou = () => {
    let items = [...BUNPOU];
    const q = bunpouQuery.trim().toLowerCase();
    if (q) {
      items = items.filter((b) =>
        [b.jp, b.arti, b.rumus, b.kapan, b.level, ...(b.tags || [])]
          .join(" ").toLowerCase().includes(q)
      );
    }
    const f = bunpouActiveFilter;
    if (f && f !== "Semua") {
      const jlpt = ["N5","N4","N3","N2","N1"];
      if (jlpt.includes(f)) {
        items = items.filter(b => b.level === f);
      } else if (f === "Sering salah") {
        items = items.filter(b =>
          (b.tags || []).some(t => t.toLowerCase().includes("sering salah")) ||
          b.mastery === "weak"
        );
      } else if (f === "Lainnya") {
        items = items.filter(b => !jlpt.includes(b.level));
      }
    }
    return items;
  };

  const renderBunpou = () => {
    const list = $("#bunpouList");
    const empty = $("#bunpouEmpty");
    if (!list) return;
    const items = filterBunpou();
    if (empty) empty.hidden = items.length > 0;
    list.hidden = items.length === 0;
    list.innerHTML = items.map((b) => `
      <article class="card k-card b-card k-card--compact" data-bunpou-id="${b.id}">
        <button type="button" class="k-card__summary" data-toggle-bunpou="${b.id}" aria-expanded="false">
          <div class="k-card__summary-main">
            <div class="k-card__jp jp">${escapeHtml(b.jp)}</div>
            <div class="k-card__summary-meta">
              <span class="k-card__meaning-line">${escapeHtml(b.arti)}</span>
            </div>
          </div>
          <div class="k-card__summary-side">
            <span class="chip chip--green">${b.level}</span>
            ${b.mastery === "weak" ? '<span class="chip chip--red">Weak</span>' : b.mastery === "mid" ? '<span class="chip chip--amber">Review</span>' : '<span class="chip chip--green">Hafal</span>'}
            <span class="k-card__chevron" aria-hidden="true">⌄</span>
          </div>
        </button>

        <div class="k-card__detail" hidden>
          <div class="k-card__detail-inner">
            <div class="b-card__formula">
              <strong>Rumus:</strong> ${escapeHtml(b.rumus)}
            </div>
            <p class="muted" style="margin: 8px 0 0; font-size: 13px;">
              <strong style="color: var(--ink);">Kapan dipakai:</strong> ${escapeHtml(b.kapan)}
            </p>
            <div class="k-card__example">
              <div class="jp jp-furigana">${makeKanjiClickable(getJpText(b))}</div>
              <div class="mini-item__sub">Arti: ${escapeHtml(b.contohArti)}</div>
            </div>
            ${b.catatan ? `<div class="b-card__note"><strong>Catatan:</strong> ${escapeHtml(b.catatan)}</div>` : ""}
            ${b.kesalahan ? `<div class="b-card__warn"><strong>Kesalahan umum:</strong> ${escapeHtml(b.kesalahan)}</div>` : ""}
            ${(b.tags && b.tags.length) ? `<div class="k-card__tags">${b.tags.map(t => `<span class="k-card__tag">#${escapeHtml(t)}</span>`).join("")}</div>` : ""}
            <div class="k-card__detail-row">
              <span class="k-card__mastery">${masteryDot(b.mastery)}</span>
            </div>
            <div class="k-card__actions">
              <button class="btn btn--ghost k-card__action-icon" data-edit-bunpou="${b.id}" aria-label="Edit bunpou" title="Edit">✎</button>
              <button class="btn btn--ghost k-card__action-icon" data-nav="ai" data-toast="AI menjelaskan ${escapeHtml(b.jp)}" aria-label="AI Jelaskan" title="AI Jelaskan">✨</button>
              <button class="btn btn--ghost k-card__action-icon" data-nav="quiz" data-toast="Latihan dibuat" aria-label="Buat Latihan" title="Buat Latihan">❓</button>
              <button class="btn btn--primary" data-nav="hafalan" data-toast="Hafalan dimuat">Hafalan</button>
            </div>
          </div>
        </div>
      </article>
    `).join("");
  };


  /* ========== FLASHCARD ========== */
  let fcMode = "today";
  let fcIndex = 0;

  const getFcDeck = () => {
    if (fcMode === "kotoba") return FLASHCARDS.filter(f => f.type === "kotoba");
    if (fcMode === "bunpou") return FLASHCARDS.filter(f => f.type === "bunpou");
    if (fcMode === "weak") return FLASHCARDS.filter(f => f.mastery === "weak");
    if (fcMode === "mixed") return [...FLASHCARDS].sort(() => Math.random() - 0.5);
    return FLASHCARDS; // today
  };

  const renderReviewQueue = () => {
    const list = $("#reviewQueueList");
    const meta = $("#reviewQueueMeta");
    if (!list) return;
    const deck = getFcDeck();
    const kotobaCount = deck.filter(d => d.type === "kotoba").length;
    const bunpouCount = deck.filter(d => d.type === "bunpou").length;
    if (meta) {
      meta.textContent = `${deck.length} kartu menunggu · Kotoba ${kotobaCount} · Bunpou ${bunpouCount}`;
    }
    if (deck.length === 0) {
      list.innerHTML = '<div class="muted small" style="padding:8px 2px;">Tidak ada kartu untuk mode ini.</div>';
      return;
    }
    list.innerHTML = deck.slice(0, 6).map((c, i) => {
      const fullIdx = FLASHCARDS.indexOf(c);
      const masteryLabel = c.mastery === "good" ? "Hafal" : c.mastery === "mid" ? "Lumayan" : "Lemah";
      const masteryClass = c.mastery === "good" ? "is-good" : c.mastery === "mid" ? "is-mid" : "is-weak";
      return `
        <button type="button" class="review-queue-item" data-review-card-index="${fullIdx}">
          <div class="review-queue-item__main">
            <span class="review-queue-item__jp jp">${escapeHtml(c.front)}</span>
            <span class="review-queue-item__meta">${escapeHtml(c.back)} · ${escapeHtml(c.type === "bunpou" ? "Bunpou" : "Kotoba")}</span>
          </div>
          <div class="review-queue-item__side">
            <span class="review-queue-item__status ${masteryClass}"><span class="dot dot--${c.mastery}"></span> ${masteryLabel}</span>
          </div>
        </button>
      `;
    }).join("");
  };

  const renderFlashcard = () => {
    // Safe early exit: old flashcard UI was replaced by Hafalan slide-table
    const flashcard = $("#flashcard");
    if (!flashcard) { renderReviewQueue(); return; }

    const deck = getFcDeck();
    const fcEmpty = $("#fcEmpty");
    const rating = $("#fcRating");

    if (deck.length === 0) {
      if (fcEmpty) fcEmpty.hidden = false;
      flashcard.style.display = "none";
      if (rating) rating.hidden = true;
      const fp = $("#fcProgress"); if (fp) fp.textContent = "0 / 0";
      const fb = $("#fcProgressBar"); if (fb) fb.style.width = "0%";
      renderReviewQueue();
      return;
    }

    if (fcEmpty) fcEmpty.hidden = true;
    if (flashcard) flashcard.style.display = "";

    const card = deck[fcIndex % deck.length];
    const total = deck.length;
    const idx = fcIndex % total;

    $("#fcFront").textContent = card.front;
    const romaji = $("#fcRomaji");
    if (romaji) romaji.textContent = card.romaji || "";
    $("#fcBack").textContent = card.back;

    // Card label (Kotoba/Bunpou + level)
    const labelEl = $("#fcLabel");
    if (labelEl) {
      const cardKind = card.type === "bunpou" ? "Bunpou" : "Kotoba";
      // pick level from KOTOBA/BUNPOU if matching
      let lvl = "";
      const kotoba = KOTOBA.find(k => k.jp === card.front);
      const bunpou = BUNPOU.find(b => b.jp === card.front);
      lvl = kotoba?.level || bunpou?.level || "";
      labelEl.textContent = lvl ? `${cardKind} · ${lvl}` : cardKind;
    }

    const ex = $("#fcExample");
    if (ex) {
      const jpText = getJpText(card);
      ex.innerHTML = `<div class="jp jp-furigana">${makeKanjiClickable(jpText)}</div><div class="mini-item__sub">${escapeHtml(card.exArti)}</div>`;
    }

    // Topbar progress text (compact) — only if old flashcard UI exists
    const fpEl = $("#fcProgress"); if (fpEl) fpEl.textContent = `Card ${idx + 1} / ${total}`;
    const fbEl = $("#fcProgressBar"); if (fbEl) fbEl.style.width = `${((idx + 1) / total) * 100}%`;

    // Session card progress
    const sessionMeta = $("#sessionMeta");
    if (sessionMeta) {
      const kotobaCount = deck.filter(d => d.type === "kotoba").length;
      const bunpouCount = deck.filter(d => d.type === "bunpou").length;
      const minutes = Math.max(1, Math.round(total * 0.3));
      sessionMeta.textContent = `${total} kartu · Kotoba ${kotobaCount} · Bunpou ${bunpouCount} · ~${minutes} menit`;
    }
    const sessionNum = $("#sessionProgressNum");
    if (sessionNum) sessionNum.textContent = `${idx + 1} / ${total}`;
    const sessionBar = $("#sessionProgressBar");
    if (sessionBar) sessionBar.style.width = `${((idx + 1) / total) * 100}%`;

    if (flashcard) flashcard.classList.remove("is-flipped");
    if (rating) rating.hidden = true;
    renderReviewQueue();
  };

  const flipFlashcard = () => {
    const fc = $("#flashcard");
    if (!fc) return;
    fc.classList.toggle("is-flipped");
    const rating = $("#fcRating");
    if (rating) rating.hidden = !fc.classList.contains("is-flipped");
  };

  /* ========== QUIZ ========== */
  let quizType = "kotoba";
  let quizIdx = 0;
  let quizAnswered = false;
  let quizCorrect = 0;
  let quizWrong = 0;

  /* ========== QUIZ PROGRESS (local-first) ========== */
  // Shape: { type: "kotoba"|"bunpou"|"mixed"|"ai", idx, correct, wrong }
  const persistQuizProgress = () => {
    lsWrite(STORAGE_KEYS.quizProgress, {
      type: quizType, idx: quizIdx, correct: quizCorrect, wrong: quizWrong,
    });
  };
  const hydrateQuizProgress = () => {
    const p = lsRead(STORAGE_KEYS.quizProgress);
    if (!p || typeof p !== "object") return;
    if (["kotoba","bunpou","mixed","ai"].includes(p.type)) quizType = p.type;
    if (Number.isFinite(p.idx)) quizIdx = Math.max(0, p.idx | 0);
    if (Number.isFinite(p.correct)) quizCorrect = Math.max(0, p.correct | 0);
    if (Number.isFinite(p.wrong))   quizWrong   = Math.max(0, p.wrong | 0);
    // Sync chip active state if DOM ready (defensive)
    $$("#quizTypeChips .chip-btn").forEach(c =>
      c.classList.toggle("is-active", c.dataset.quiztype === quizType)
    );
  };

  const getQuizSet = () => QUIZ_SETS[quizType] || QUIZ_SETS.kotoba;

  const updateQuizScoreStrip = () => {
    const c = $("#quizCorrect");
    const w = $("#quizWrong");
    const a = $("#quizAccuracy");
    const total = quizCorrect + quizWrong;
    if (c) c.textContent = quizCorrect;
    if (w) w.textContent = quizWrong;
    if (a) a.textContent = total > 0 ? `${Math.round((quizCorrect / total) * 100)}%` : "—";
  };

  const renderQuiz = () => {
    const set = getQuizSet();
    if (!set.length) return;
    const q = set[quizIdx % set.length];
    const total = set.length;
    const idx = quizIdx % total;

    $("#quizMeta").textContent = `${quizType.charAt(0).toUpperCase() + quizType.slice(1)} Quiz · ${idx + 1} / ${total}`;

    // Session card numbers
    const sessNum = $("#quizSessionNum");
    if (sessNum) sessNum.textContent = `${idx + 1} / ${total}`;
    const sessSub = $("#quizSessionSub");
    if (sessSub) {
      const minutes = Math.max(2, Math.round(total * 0.3));
      sessSub.textContent = `${total} soal · ${q.meta} · estimasi ${minutes} menit`;
    }
    updateQuizScoreStrip();

    const card = $(".card--quiz");
    if (!card) return;
    card.querySelector(".badge").textContent = `Soal ${idx + 1} / ${total}`;
    card.querySelector(".card__meta").textContent = q.meta;
    card.querySelector(".quiz__prompt").textContent = q.prompt;
    card.querySelector(".quiz__word").innerHTML = makeKanjiClickable(escapeHtml(q.word));

    const opts = $("#quizOptions");
    const blank = $("#quizBlank");

    if (q.mode === "blank") {
      if (opts) opts.hidden = true;
      if (blank) {
        blank.hidden = false;
        blank.innerHTML = `
          <input class="quiz__blank-input" id="blankInput" type="text" placeholder="Tulis jawaban..." aria-label="Jawaban" />
          <div class="quiz__blank-actions">
            <button class="btn btn--primary" id="checkBlank">Cek Jawaban</button>
          </div>`;
      }
    } else {
      if (blank) blank.hidden = true;
      if (opts) {
        opts.hidden = false;
        opts.innerHTML = q.options.map((o) => `
          <button class="quiz-opt" data-correct="${o.correct}">
            <span class="quiz-opt__key">${o.key}</span> ${escapeHtml(o.text)}
          </button>
        `).join("");
      }
    }

    const ex = $("#quizExplain");
    if (ex) {
      ex.hidden = true;
      ex.classList.remove("is-correct", "is-wrong");
      ex.querySelector("p").innerHTML = q.explain;
    }
    quizAnswered = false;
  };

  const answerQuiz = (btn) => {
    if (quizAnswered) return;
    quizAnswered = true;
    const correctBtn = $$("#quizOptions .quiz-opt").find(b => b.dataset.correct === "true");
    const isRight = btn.dataset.correct === "true";
    if (isRight) btn.classList.add("is-correct");
    else {
      btn.classList.add("is-wrong");
      if (correctBtn) correctBtn.classList.add("is-correct");
    }
    $$("#quizOptions .quiz-opt").forEach(b => (b.disabled = true));
    if (isRight) quizCorrect++; else quizWrong++;
    updateQuizScoreStrip();
    persistQuizProgress();
    const ex = $("#quizExplain");
    if (ex) {
      ex.hidden = false;
      ex.classList.add(isRight ? "is-correct" : "is-wrong");
      $("#quizExplainTitle").innerHTML = isRight ? '<span aria-hidden="true">✨</span> Benar' : '<span aria-hidden="true">💡</span> Belum tepat';
    }
  };

  const checkBlankAnswer = () => {
    if (quizAnswered) return;
    quizAnswered = true;
    const set = getQuizSet();
    const q = set[quizIdx % set.length];
    const input = $("#blankInput");
    if (!input) return;
    const userAns = input.value.trim();
    const isRight = userAns === q.answer;
    input.classList.add(isRight ? "is-correct" : "is-wrong");
    input.disabled = true;
    if (isRight) quizCorrect++; else quizWrong++;
    updateQuizScoreStrip();
    persistQuizProgress();
    if (!isRight) {
      const actions = $(".quiz__blank-actions");
      if (actions) {
        actions.innerHTML += `<span class="muted small" style="margin-top:4px;">Jawaban: <strong class="jp">${escapeHtml(q.answer)}</strong></span>`;
      }
    }
    const ex = $("#quizExplain");
    if (ex) {
      ex.hidden = false;
      ex.classList.add(isRight ? "is-correct" : "is-wrong");
      $("#quizExplainTitle").innerHTML = isRight ? '<span aria-hidden="true">✨</span> Benar' : '<span aria-hidden="true">💡</span> Belum tepat';
    }
  };

  const nextQuiz = () => {
    quizIdx = (quizIdx + 1) % getQuizSet().length;
    persistQuizProgress();
    renderQuiz();
  };


  /* ========== CATATAN (combined Kotoba + Bunpou) ========== */
  let catatanQuery = "";
  let catatanFilter = "Semua";

  const buildCatatanItems = () => {
    const k = (KOTOBA || []).map(item => ({ ...item, _type: "kotoba" }));
    const b = (BUNPOU || []).map(item => ({ ...item, _type: "bunpou" }));
    return [...k, ...b];
  };

  const filterCatatan = () => {
    let items = buildCatatanItems();
    const q = catatanQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(it =>
        [it.jp, it.romaji || "", it.arti || "", it.rumus || "", it.kapan || "", it.jenis || "", it.level || "", ...(it.tags || [])]
          .join(" ").toLowerCase().includes(q)
      );
    }
    const f = catatanFilter;
    if (f && f !== "Semua") {
      const jlpt = ["N5","N4","N3","N2","N1"];
      if (f === "Kotoba") items = items.filter(it => it._type === "kotoba");
      else if (f === "Bunpou") items = items.filter(it => it._type === "bunpou");
      else if (jlpt.includes(f)) items = items.filter(it => it.level === f);
      else if (f === "Weak") items = items.filter(it => it.mastery === "weak");
      else if (f === "Review") items = items.filter(it => it.mastery === "weak" || it.mastery === "mid");
      else if (f === "Baru") items = items.filter(it => (it.tags || []).includes("import") || (it.tags || []).includes("baru"));
      else if (f === "Lainnya") items = items.filter(it => !jlpt.includes(it.level));
    }
    return items;
  };

  const renderCatatan = () => {
    const list = $("#noteList");
    const empty = $("#noteEmpty");
    if (!list) return;

    // Update summary counts
    const allItems = buildCatatanItems();
    const ck = $("#catatanCountKotoba"); if (ck) ck.textContent = (KOTOBA || []).length;
    const cb = $("#catatanCountBunpou"); if (cb) cb.textContent = (BUNPOU || []).length;
    const cr = $("#catatanCountReview");
    if (cr) cr.textContent = allItems.filter(it => it.mastery === "weak" || it.mastery === "mid").length;
    const cw = $("#catatanCountWeak");
    if (cw) cw.textContent = allItems.filter(it => it.mastery === "weak").length;

    const items = filterCatatan();
    if (empty) empty.hidden = items.length > 0;
    list.hidden = items.length === 0;

    list.innerHTML = items.map(it => {
      const isKotoba = it._type === "kotoba";
      const noteKey = `${it._type}-${it.id}`;
      const masteryChip = it.mastery === "weak"
        ? '<span class="chip chip--red">Weak</span>'
        : it.mastery === "mid" ? '<span class="chip chip--amber">Review</span>'
        : '<span class="chip chip--green">Hafal</span>';
      const detail = isKotoba ? `
        <div class="note-card__detail-inner">
          <div class="k-card__row">
            <span><strong>Romaji:</strong> ${escapeHtml(it.romaji || "-")}</span>
            <span><strong>Jenis:</strong> ${escapeHtml(it.jenis || "-")}</span>
          </div>
          <div class="k-card__example">
            <div class="jp jp-furigana">${makeKanjiClickable(getJpText(it))}</div>
            <div class="mini-item__sub">Arti: ${escapeHtml(it.contohArti || "")}</div>
          </div>
          ${(it.tags && it.tags.length) ? `<div class="k-card__tags">${it.tags.map(t => `<span class="k-card__tag">#${escapeHtml(t)}</span>`).join("")}</div>` : ""}
          <div class="k-card__mastery">${masteryDot(it.mastery)}</div>
          <div class="k-card__actions">
            <button class="btn btn--ghost k-card__action-icon" data-edit-kotoba="${it.id}" aria-label="Edit" title="Edit">✎</button>
            <button class="btn btn--ghost k-card__action-icon" data-nav="ai" data-toast="AI menjelaskan ${escapeHtml(it.jp)}" aria-label="AI Jelaskan" title="AI Jelaskan">✨</button>
            <button class="btn btn--ghost k-card__action-icon" data-nav="quiz" data-toast="Quiz dibuat" aria-label="Buat Quiz" title="Buat Quiz">❓</button>
            <button class="btn btn--primary" data-nav="hafalan" data-toast="Ditambahkan ke Hafalan">Tambah ke Hafalan</button>
          </div>
        </div>` : `
        <div class="note-card__detail-inner">
          <div class="b-card__formula">
            <strong>Rumus:</strong> ${escapeHtml(it.rumus || "-")}
          </div>
          <p class="muted" style="margin: 0; font-size: 13px;">
            <strong style="color: var(--ink);">Kapan dipakai:</strong> ${escapeHtml(it.kapan || "-")}
          </p>
          <div class="k-card__example">
            <div class="jp jp-furigana">${makeKanjiClickable(getJpText(it))}</div>
            <div class="mini-item__sub">Arti: ${escapeHtml(it.contohArti || "")}</div>
          </div>
          ${it.catatan ? `<div class="b-card__note"><strong>Catatan:</strong> ${escapeHtml(it.catatan)}</div>` : ""}
          ${it.kesalahan ? `<div class="b-card__warn"><strong>Kesalahan umum:</strong> ${escapeHtml(it.kesalahan)}</div>` : ""}
          ${(it.tags && it.tags.length) ? `<div class="k-card__tags">${it.tags.map(t => `<span class="k-card__tag">#${escapeHtml(t)}</span>`).join("")}</div>` : ""}
          <div class="k-card__mastery">${masteryDot(it.mastery)}</div>
          <div class="k-card__actions">
            <button class="btn btn--ghost k-card__action-icon" data-edit-bunpou="${it.id}" aria-label="Edit" title="Edit">✎</button>
            <button class="btn btn--ghost k-card__action-icon" data-nav="ai" data-toast="AI menjelaskan ${escapeHtml(it.jp)}" aria-label="AI Jelaskan" title="AI Jelaskan">✨</button>
            <button class="btn btn--ghost k-card__action-icon" data-nav="quiz" data-toast="Latihan dibuat" aria-label="Buat Quiz" title="Buat Quiz">❓</button>
            <button class="btn btn--primary" data-nav="hafalan" data-toast="Ditambahkan ke Hafalan">Tambah ke Hafalan</button>
          </div>
        </div>`;

      const subline = isKotoba
        ? `${escapeHtml(it.romaji || "")} · ${escapeHtml(it.arti || "")}`
        : escapeHtml(it.arti || "-");

      return `
        <article class="note-card" data-note-key="${noteKey}">
          <button type="button" class="note-card__summary" data-toggle-note="${noteKey}" aria-expanded="false">
            <div class="note-card__main">
              <div class="note-card__jp jp">${escapeHtml(it.jp)}</div>
              <div class="note-card__meaning">
                <span>${subline}</span>
                <span class="note-type-badge note-type-badge--${it._type}">${isKotoba ? "Kotoba" : "Bunpou"}</span>
              </div>
            </div>
            <div class="note-card__side">
              <span class="chip ${isKotoba ? "chip--blue" : "chip--green"}">${escapeHtml(it.level || "")}</span>
              ${masteryChip}
              <span class="note-card__chevron" aria-hidden="true">⌄</span>
            </div>
          </button>
          <div class="note-card__detail" hidden>${detail}</div>
        </article>`;
    }).join("");
  };

  /* ========== HAFALAN (slide-based fixed batch) ========== */
  let hafalanMode = "mixed";
  let hafalanSlideIndex = 0;
  let hafalanShowMeaning = true;
  let hafalanTempShuffleIds = null; // when set, override visual order for current slide only

  // Ensure dummy data is large enough so slides feel real
  const HAFALAN_EXTRA = [
    { jp: "はなします", romaji: "hanashimasu", arti: "berbicara", level: "N5", jenis: "kata kerja", mastery: "good", _type: "kotoba", id: "hx1" },
    { jp: "よみます",    romaji: "yomimasu",    arti: "membaca",   level: "N5", jenis: "kata kerja", mastery: "mid",  _type: "kotoba", id: "hx2" },
    { jp: "かきます",    romaji: "kakimasu",    arti: "menulis",   level: "N5", jenis: "kata kerja", mastery: "good", _type: "kotoba", id: "hx3" },
    { jp: "たのしい",    romaji: "tanoshii",    arti: "menyenangkan", level: "N5", jenis: "sifat-i", mastery: "good", _type: "kotoba", id: "hx4" },
    { jp: "さむい",      romaji: "samui",       arti: "dingin",    level: "N5", jenis: "sifat-i", mastery: "mid",  _type: "kotoba", id: "hx5" },
    { jp: "あつい",      romaji: "atsui",       arti: "panas",     level: "N5", jenis: "sifat-i", mastery: "good", _type: "kotoba", id: "hx6" },
    { jp: "コーヒー",    romaji: "koohii",      arti: "kopi",      level: "N5", jenis: "kata benda", mastery: "good", _type: "kotoba", id: "hx7" },
    { jp: "テレビ",      romaji: "terebi",      arti: "TV",        level: "N5", jenis: "kata benda", mastery: "good", _type: "kotoba", id: "hx8" },
    { jp: "てしょく",   romaji: "teshoku",     arti: "set menu",  level: "N4", jenis: "kata benda", mastery: "weak", _type: "kotoba", id: "hx9" },
    { jp: "べんり",      romaji: "benri",       arti: "praktis",   level: "N5", jenis: "sifat-na", mastery: "mid", _type: "kotoba", id: "hx10" },
    { jp: "〜てください", arti: "tolong (request)", level: "N5", _type: "bunpou", id: "hxb1", mastery: "mid" },
    { jp: "〜ことがある", arti: "pernah", level: "N4", _type: "bunpou", id: "hxb2", mastery: "weak" },
    { jp: "〜ことができる", arti: "bisa", level: "N4", _type: "bunpou", id: "hxb3", mastery: "good" },
  ];

  const buildHafalanItems = (mode) => {
    // Source of truth: ordered KOTOBA + BUNPOU via hafalanOrder
    const ordered = resolveHafalanOrderItems(mode);
    // Demo extras: keep mock-only items appended at end (filtered by mode)
    let extras = HAFALAN_EXTRA.slice();
    if (mode === "kotoba") extras = extras.filter(it => it._type === "kotoba");
    else if (mode === "bunpou") extras = extras.filter(it => it._type === "bunpou");
    else if (mode === "weak") extras = extras.filter(it => it.mastery === "weak" || it.mastery === "mid");
    return [...ordered, ...extras];
  };

  const chunkFixedSlides = (items, size = 20) => {
    const slides = [];
    for (let i = 0; i < items.length; i += size) {
      slides.push(items.slice(i, i + size));
    }
    return slides.length ? slides : [[]];
  };

  const renderHafalan = () => {
    const tableBody = $("#hafalanTableBody");
    if (!tableBody) return;
    const items = buildHafalanItems(hafalanMode);
    const slides = chunkFixedSlides(items, 20);
    if (hafalanSlideIndex >= slides.length) hafalanSlideIndex = slides.length - 1;
    if (hafalanSlideIndex < 0) hafalanSlideIndex = 0;

    let currentSlide = slides[hafalanSlideIndex] || [];
    if (hafalanTempShuffleIds && currentSlide.length) {
      const idMap = new Map(currentSlide.map(c => [`${c._type}-${c.id}`, c]));
      const shuffled = hafalanTempShuffleIds.map(k => idMap.get(k)).filter(Boolean);
      // Append any items missing from id list (safety)
      currentSlide.forEach(it => {
        const k = `${it._type}-${it.id}`;
        if (!hafalanTempShuffleIds.includes(k)) shuffled.push(it);
      });
      currentSlide = shuffled;
    }

    const empty = $("#hafalanEmpty");
    const table = $("#hafalanTable");
    if (!items.length) {
      if (empty) empty.hidden = false;
      if (table) table.hidden = true;
    } else {
      if (empty) empty.hidden = true;
      if (table) table.hidden = false;
    }

    const meaningHidden = !hafalanShowMeaning;
    if (table) table.classList.toggle("hafalan-meaning-hidden", meaningHidden);

    tableBody.innerHTML = currentSlide.map(it => {
      const itemKey = `${it._type}-${it.id}`;
      const isKotoba = it._type === "kotoba";
      const masteryClass = it.mastery === "good" ? "is-good" : it.mastery === "mid" ? "is-mid" : "is-weak";
      const masteryLabel = it.mastery === "good" ? "Hafal" : it.mastery === "mid" ? "Lumayan" : "Lemah";
      const meaningText = meaningHidden ? "••••" : escapeHtml(it.arti || "-");
      const detail = isKotoba ? `
        <div class="hafalan-row__detail-inner">
          <div class="hafalan-row__detail-row">
            <span class="k-card__type-chip">${escapeHtml(it.jenis || "-")}</span>
            <span class="chip chip--blue">${escapeHtml(it.level || "")}</span>
          </div>
          <div><strong>Romaji:</strong> ${escapeHtml(it.romaji || "-")}</div>
          <div class="hafalan-row__example">
            <div class="jp jp-furigana">${makeKanjiClickable(getJpText(it))}</div>
            <div class="mini-item__sub">${escapeHtml(it.contohArti || "")}</div>
          </div>
          <div class="hafalan-actions">
            <button class="btn btn--ghost" data-mark-mastery="good" data-mark-key="${itemKey}">✨ Tandai Hafal</button>
            <button class="btn btn--ghost" data-mark-mastery="weak" data-mark-key="${itemKey}">⚠ Tandai Lemah</button>
            <button class="btn btn--ghost" data-nav="quiz" data-toast="Quiz dibuat dari ${escapeHtml(it.jp)}">❓ Buat Quiz</button>
            <button class="btn btn--ghost" data-nav="ai" data-toast="AI menjelaskan ${escapeHtml(it.jp)}">✨ AI Jelaskan</button>
          </div>
        </div>` : `
        <div class="hafalan-row__detail-inner">
          <div class="hafalan-row__detail-row">
            <span class="k-card__type-chip">grammar</span>
            <span class="chip chip--green">${escapeHtml(it.level || "")}</span>
          </div>
          ${it.rumus ? `<div><strong>Rumus:</strong> ${escapeHtml(it.rumus)}</div>` : ""}
          ${it.kapan ? `<div class="muted small">${escapeHtml(it.kapan)}</div>` : ""}
          ${getJpText(it) ? `<div class="hafalan-row__example">
            <div class="jp jp-furigana">${makeKanjiClickable(getJpText(it))}</div>
            <div class="mini-item__sub">${escapeHtml(it.contohArti || "")}</div>
          </div>` : ""}
          <div class="hafalan-actions">
            <button class="btn btn--ghost" data-mark-mastery="good" data-mark-key="${itemKey}">✨ Tandai Hafal</button>
            <button class="btn btn--ghost" data-mark-mastery="weak" data-mark-key="${itemKey}">⚠ Tandai Lemah</button>
            <button class="btn btn--ghost" data-nav="quiz" data-toast="Latihan dibuat">❓ Buat Quiz</button>
            <button class="btn btn--ghost" data-nav="ai" data-toast="AI menjelaskan ${escapeHtml(it.jp)}">✨ AI Jelaskan</button>
          </div>
        </div>`;

      return `
        <div class="hafalan-row" data-row-key="${itemKey}">
          <button type="button" class="hafalan-row__summary" data-toggle-hafalan-row="${itemKey}" aria-expanded="false">
            <div class="hafalan-row__jp">
              <span class="hafalan-row__jp-text">${escapeHtml(it.jp)}</span>
              <span class="hafalan-row__meta">
                <span class="note-type-badge note-type-badge--${it._type}">${isKotoba ? "Kotoba" : "Bunpou"}</span>
                <span class="chip ${isKotoba ? "chip--blue" : "chip--green"}">${escapeHtml(it.level || "")}</span>
                <span class="review-queue-item__status ${masteryClass}"><span class="dot dot--${it.mastery || "mid"}"></span>${masteryLabel}</span>
              </span>
            </div>
            <div class="hafalan-row__meaning">
              <span class="hafalan-row__meaning-text">${meaningText}</span>
              <span class="hafalan-row__chevron" aria-hidden="true">⌄</span>
            </div>
          </button>
          <div class="hafalan-row__detail" hidden>${detail}</div>
        </div>`;
    }).join("");

    // Slide nav + stats
    const slideTotal = slides.length;
    const slideCount = currentSlide.length;
    const ind = $("#hafalanSlideIndicator");
    if (ind) ind.textContent = `Slide ${hafalanSlideIndex + 1} / ${slideTotal}`;
    const stat1 = $("#hafalanSlideStat");
    if (stat1) stat1.textContent = `Slide ${hafalanSlideIndex + 1} / ${slideTotal}`;
    const stat2 = $("#hafalanItemStat");
    if (stat2) stat2.textContent = `${slideCount} item`;
    const stat3 = $("#hafalanTimeStat");
    if (stat3) stat3.textContent = `~${Math.max(1, Math.round(slideCount * 0.3))} menit`;
    const prevBtn = $("#hafalanPrevBtn");
    const nextBtn = $("#hafalanNextBtn");
    if (prevBtn) prevBtn.disabled = hafalanSlideIndex === 0;
    if (nextBtn) nextBtn.disabled = hafalanSlideIndex >= slideTotal - 1;
    // Mode card active state
    $$(".hafalan-mode-card").forEach(c =>
      c.classList.toggle("is-active", c.dataset.hafalanMode === hafalanMode)
    );
    // Toggle meaning button label
    const tBtn = $("#toggleMeaningBtn");
    if (tBtn) tBtn.textContent = hafalanShowMeaning ? "👁 Sembunyikan Arti" : "👁 Tampilkan Arti";
  };

  /* ========== AI TUTOR ========== */
  let aiMode = "default";

  const AI_MODES = {
    "default": {
      label: "Default",
      icon: "✨",
      sub: "Tanya apa saja",
      input: "Pertanyaan bebas",
      output: "Jawaban umum",
      placeholder: "Pilih mode dulu, lalu tulis pertanyaan...",
      sample: "",
    },
    "kotoba": {
      label: "Jelaskan Kotoba",
      icon: "📖",
      sub: "Arti, jenis kata, contoh kalimat",
      input: "Masukkan kata seperti 食べます",
      output: "Arti, jenis kata, contoh, kartu hafalan",
      placeholder: "Masukkan kotoba, contoh: 食べます",
      sample: "食べます",
    },
    "bunpou": {
      label: "Jelaskan Bunpou",
      icon: "📐",
      sub: "Rumus, fungsi, contoh mudah",
      input: "Masukkan pola seperti 〜ながら",
      output: "Arti, rumus, contoh, kesalahan umum",
      placeholder: "Masukkan bunpou, contoh: 〜ながら",
      sample: "〜ながら",
    },
    "correction": {
      label: "Koreksi Kalimat",
      icon: "✍️",
      sub: "Cek partikel dan grammar",
      input: "Tulis kalimat Jepang",
      output: "Koreksi, penjelasan, versi natural",
      placeholder: "Tulis kalimat Jepang yang ingin dikoreksi...",
      sample: "私は学校で行きます。",
    },
    "example": {
      label: "Buat Contoh",
      icon: "📝",
      sub: "Buat contoh N5/N4",
      input: "Tulis kata atau pola",
      output: "5 contoh kalimat sederhana",
      placeholder: "Tulis kata/bunpou yang ingin dibuatkan contoh...",
      sample: "たべます",
    },
    "quiz": {
      label: "Buat Quiz",
      icon: "🧠",
      sub: "Latihan dari catatan",
      input: "Tulis materi quiz",
      output: "5 soal pilihan ganda",
      placeholder: "Tulis materi untuk dibuat quiz...",
      sample: "partikel に dan で",
    },
    "flashcard": {
      label: "Tambahkan ke Hafalan",
      icon: "🃏",
      sub: "Ubah materi jadi hafalan",
      input: "Tulis materi hafalan",
      output: "Kartu hafalan siap ditambahkan",
      placeholder: "Tulis materi untuk dibuat hafalan...",
      sample: "kata kerja N5",
    },
    "bulk-kotoba": {
      label: "Import Kotoba Massal",
      icon: "📥",
      sub: "Paste banyak kata sekaligus",
      input: "Paste banyak kotoba, satu kata per baris",
      output: "Preview baru, duplikat, dan perlu edit manual",
      placeholder: "Paste banyak kotoba, satu baris satu kata:\n食べます\n飲みます\n行きます\n勉強します",
      sample: "食べます\n飲みます\n行きます\n勉強します\nへんかします",
    },
    "sentence-analysis": {
      label: "Analisa Kalimat",
      icon: "🔎",
      sub: "Cari kotoba dan bunpou otomatis",
      input: "Masukkan kalimat Jepang",
      output: "Arti, kotoba, bunpou, rekomendasi",
      placeholder: "Masukkan kalimat Jepang, contoh:\nごはんを食べてから、テレビを見ます。",
      sample: "ごはんを食べてから、テレビを見ます。",
    },
  };

  const aiActionButtons = `
    <div class="msg__actions">
      <button class="msg-action" data-ai-action="save-kotoba"><span class="msg-action__icon">📖</span> Simpan ke Kotoba</button>
      <button class="msg-action" data-ai-action="save-bunpou"><span class="msg-action__icon">📐</span> Simpan ke Bunpou</button>
      <button class="msg-action" data-ai-action="make-flashcard"><span class="msg-action__icon">🃏</span> Tambahkan ke Hafalan</button>
      <button class="msg-action" data-ai-action="make-quiz"><span class="msg-action__icon">❓</span> Buat Quiz</button>
      <button class="msg-action" data-ai-action="copy"><span class="msg-action__icon">📋</span> Copy</button>
    </div>`;

  /* ---------- Helpers for AI ---------- */
  const isKotobaDuplicate = (jp) =>
    KOTOBA.some(item => (item.jp || "").trim() === (jp || "").trim());

  const parseBulkKotobaInput = (text) => {
    if (!text) return [];
    return [...new Set(
      text.split(/[\n,\u3001\u3002]+/)
        .map(s => s.trim())
        .filter(s => s.length && s.length <= 30)
    )];
  };

  /* ---------- Mode-specific response builders ---------- */
  const noteActions = (kinds = ["copy"]) => {
    const map = {
      kotoba:    `<button class="msg-action" data-ai-action="save-kotoba"><span class="msg-action__icon">📖</span> Simpan ke Kotoba</button>`,
      bunpou:    `<button class="msg-action" data-ai-action="save-bunpou"><span class="msg-action__icon">📐</span> Simpan ke Bunpou</button>`,
      flashcard: `<button class="msg-action" data-ai-action="make-flashcard"><span class="msg-action__icon">🃏</span> Tambahkan ke Hafalan</button>`,
      quiz:      `<button class="msg-action" data-ai-action="make-quiz"><span class="msg-action__icon">❓</span> Buat Quiz</button>`,
      copy:      `<button class="msg-action" data-ai-action="copy"><span class="msg-action__icon">📋</span> Copy</button>`,
    };
    return `<div class="ai-action-row">${kinds.map(k => map[k] || "").join("")}</div>`;
  };

  const buildKotobaNote = (word) => {
    const w = (word || "").trim() || "食べます";
    const info = mockAnalyzeKotoba(w);
    const arti = info.arti && info.arti !== "Perlu diisi manual" ? info.arti : "makan";
    const jenis = info.jenis || "kata kerja";
    const level = info.level || "N5";
    return `
      <div class="ai-study-note">
        <div class="ai-study-note__title jp">${escapeHtml(w)}</div>
        <div class="ai-study-note__chips">
          <span class="chip chip--blue">${escapeHtml(level)}</span>
          <span class="chip chip--lilac">${escapeHtml(jenis)}</span>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Arti</div>
          <div>${escapeHtml(arti)}</div>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Contoh</div>
          <div class="jp jp-furigana ai-study-note__jp">ごはんを食べます。</div>
          <div class="mini-item__sub">Saya makan nasi.</div>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Catatan</div>
          <div>Bentuk kamus: <span class="jp">食べる</span>. Bentuk sopan: <span class="jp">食べます</span>.</div>
        </div>
        ${noteActions(["kotoba", "flashcard", "quiz", "copy"])}
      </div>`;
  };

  const buildBunpouNote = (pattern) => {
    const p = (pattern || "").trim() || "〜ながら";
    return `
      <div class="ai-study-note">
        <div class="ai-study-note__title jp">${escapeHtml(p)}</div>
        <div class="ai-study-note__chips">
          <span class="chip chip--green">N4</span>
          <span class="chip">grammar</span>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Arti</div>
          <div>sambil</div>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Rumus</div>
          <div>Vます tanpa ます + ながら</div>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Contoh</div>
          <div class="jp jp-furigana ai-study-note__jp">おんがくを ききながら、べんきょうします。</div>
          <div class="mini-item__sub">Saya belajar sambil mendengarkan musik.</div>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Catatan</div>
          <div>Kegiatan utama ada di belakang kalimat.</div>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Kesalahan umum</div>
          <div>Jangan pakai untuk dua kegiatan yang tidak bisa dilakukan bersamaan.</div>
        </div>
        ${noteActions(["bunpou", "quiz", "flashcard", "copy"])}
      </div>`;
  };

  const buildCorrectionNote = (input) => {
    const txt = (input || "").trim() || "私は学校で行きます。";
    return `
      <div class="ai-study-note">
        <div class="ai-study-note__title">Koreksi Kalimat</div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Asli</div>
          <div class="jp ai-study-note__jp ai-study-note__jp--wrong">${escapeHtml(txt)}</div>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Koreksi</div>
          <div class="jp ai-study-note__jp ai-study-note__jp--right">私は学校に行きます。</div>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Penjelasan</div>
          <div>Untuk arah/tujuan pergi, gunakan partikel <strong>に</strong>, bukan <strong>で</strong>.</div>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Versi natural</div>
          <div class="jp ai-study-note__jp">学校に行きます。</div>
        </div>
        ${noteActions(["bunpou", "quiz", "copy"])}
      </div>`;
  };

  const buildExampleNote = (topic) => {
    const t = (topic || "").trim() || "たべます";
    return `
      <div class="ai-study-note">
        <div class="ai-study-note__title">Contoh untuk: <span class="jp">${escapeHtml(t)}</span></div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">5 contoh sederhana</div>
          <ol class="ai-study-note__list">
            <li><span class="jp">わたしは ごはんを たべます。</span> — Saya makan nasi.</li>
            <li><span class="jp">たまごを たべます。</span> — Saya makan telur.</li>
            <li><span class="jp">ともだちと よるごはんを たべます。</span> — Saya makan malam dengan teman.</li>
            <li><span class="jp">りんごを たべたいです。</span> — Saya ingin makan apel.</li>
            <li><span class="jp">ずっと さしみを たべたいです。</span> — Saya ingin makan sushi.</li>
          </ol>
        </div>
        ${noteActions(["flashcard", "quiz", "copy"])}
      </div>`;
  };

  const buildQuizNote = (topic) => {
    const t = (topic || "").trim() || "materi";
    return `
      <div class="ai-study-note">
        <div class="ai-study-note__title">Quiz: ${escapeHtml(t)}</div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Soal 1</div>
          <div>Pilih partikel yang tepat: <span class="jp">がっこう ___ いきます。</span></div>
          <div class="muted small">A. で · B. に · C. を · D. が</div>
          <div class="muted small">Jawaban: <strong>B. に</strong></div>
        </div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Soal 2</div>
          <div>Apa arti <span class="jp">たべます</span>?</div>
          <div class="muted small">A. minum · B. makan · C. pergi · D. tidur</div>
          <div class="muted small">Jawaban: <strong>B. makan</strong></div>
        </div>
        ${noteActions(["quiz", "flashcard", "copy"])}
      </div>`;
  };

  const buildFlashcardNote = (topic) => {
    const t = (topic || "").trim() || "materi";
    return `
      <div class="ai-study-note">
        <div class="ai-study-note__title">Hafalan: ${escapeHtml(t)}</div>
        <div class="ai-study-note__section">
          <div class="ai-study-note__label">Set siap review (5 kartu)</div>
          <ul class="ai-study-note__list">
            <li><span class="jp">たべます</span> — makan</li>
            <li><span class="jp">のみます</span> — minum</li>
            <li><span class="jp">いきます</span> — pergi</li>
            <li><span class="jp">見ます</span> — melihat</li>
            <li><span class="jp">聞きます</span> — mendengar</li>
          </ul>
        </div>
        ${noteActions(["flashcard", "quiz", "copy"])}
      </div>`;
  };

  const buildBulkPreview = (text) => {
    const items = parseBulkKotobaInput(text);
    if (!items.length) {
      return `<div class="ai-bulk-preview"><p>Tidak ada kotoba untuk dianalisa.</p></div>`;
    }
    const analyzed = items.map(mockAnalyzeKotoba);
    const newCount = analyzed.filter(a => a.status === "new").length;
    const exCount  = analyzed.filter(a => a.status === "exists").length;
    const manualCount = analyzed.filter(a => a.status === "manual").length;

    const itemsHtml = analyzed.map((a, i) => {
      const statusLabel =
        a.status === "new" ? "Baru" :
        a.status === "exists" ? "Sudah ada" : "Perlu edit manual";
      const statusClass = a.status === "new" ? "new" : a.status === "exists" ? "exists" : "manual";
      const action =
        a.status === "new" ? `<button class="btn btn--ghost btn--sm" data-action="bulk-add-one-kotoba" data-bulk-jp="${escapeHtml(a.jp)}">Tambahkan</button>` :
        a.status === "exists" ? `<button class="btn btn--ghost btn--sm" disabled>Sudah ada</button>` :
        `<button class="btn btn--ghost btn--sm" data-action="bulk-edit-manual" data-bulk-jp="${escapeHtml(a.jp)}">Edit Manual</button>`;
      return `
        <div class="ai-bulk-item">
          <div class="ai-bulk-item__main">
            <div class="ai-bulk-item__jp jp">${escapeHtml(a.jp || "-")}</div>
            <div class="ai-bulk-item__meta">
              ${a.arti ? escapeHtml(a.arti) : "-"} · ${a.jenis ? escapeHtml(a.jenis) : "-"} · ${a.level ? escapeHtml(a.level) : "-"}
            </div>
            ${a.reason ? `<div class="muted small">${escapeHtml(a.reason)}</div>` : ""}
          </div>
          <div class="ai-bulk-item__side">
            <span class="ai-bulk-status ai-bulk-status--${statusClass}">${statusLabel}</span>
            ${action}
          </div>
        </div>`;
    }).join("");

    return `
      <div class="ai-bulk-preview">
        <div class="ai-bulk-head">
          <strong>Preview Import (${analyzed.length} kotoba)</strong>
          <div class="muted small">Baru: ${newCount} · Sudah ada: ${exCount} · Manual: ${manualCount}</div>
        </div>
        <div class="ai-bulk-list">${itemsHtml}</div>
        <div class="ai-bulk-actions">
          <button class="btn btn--primary" data-action="bulk-add-new-kotoba">Tambahkan semua yang baru</button>
          <button class="btn btn--ghost" data-action="bulk-ignore">Abaikan</button>
        </div>
      </div>`;
  };

  const buildSentenceAnalysis = (text) => {
    const a = mockAnalyzeSentence(text);
    const bunpouHtml = a.bunpouFound.map(b => `
      <div class="ai-analysis-item">
        <div class="jp" style="font-weight:600;">${escapeHtml(b.jp)}</div>
        <div class="muted small">${escapeHtml(b.arti)} · ${escapeHtml(b.rumus)} · ${escapeHtml(b.level)} · 
          <span class="ai-bulk-status ai-bulk-status--${b.status === "exists" ? "exists" : "new"}">
            ${b.status === "exists" ? "Sudah ada" : "Baru"}
          </span>
        </div>
      </div>`).join("");
    const kotobaHtml = a.kotobaFound.map(k => `
      <div class="ai-analysis-item">
        <span class="jp" style="font-weight:600;">${escapeHtml(k.jp)}</span>
        <span class="muted small"> = ${escapeHtml(k.arti)}</span>
        <span class="ai-bulk-status ai-bulk-status--${k.status === "exists" ? "exists" : "new"}" style="margin-left:6px;">
          ${k.status === "exists" ? "Sudah ada" : "Baru"}
        </span>
      </div>`).join("");
    const particlesHtml = a.particles.map(p => `
      <div class="ai-analysis-item"><span class="jp">${escapeHtml(p.p)}</span> — ${escapeHtml(p.role)}</div>
    `).join("");

    return `
      <div class="ai-analysis-card">
        <div class="ai-analysis-section">
          <div class="ai-study-note__label">Kalimat</div>
          <div class="jp jp-furigana">${makeKanjiClickable(escapeHtml(a.sentence))}</div>
        </div>
        <div class="ai-analysis-section">
          <div class="ai-study-note__label">Arti</div>
          <div>${escapeHtml(a.meaning)}</div>
        </div>
        <div class="ai-analysis-section">
          <div class="ai-study-note__label">Bunpou ditemukan</div>
          <div class="ai-analysis-list">${bunpouHtml}</div>
        </div>
        <div class="ai-analysis-section">
          <div class="ai-study-note__label">Kotoba ditemukan</div>
          <div class="ai-analysis-list">${kotobaHtml}</div>
        </div>
        <div class="ai-analysis-section">
          <div class="ai-study-note__label">Partikel / struktur</div>
          <div class="ai-analysis-list">${particlesHtml}</div>
        </div>
        <div class="ai-recommendation-box">
          <strong>Rekomendasi:</strong> Simpan bunpou <span class="jp">〜てから</span> dan kotoba baru ke catatan?
        </div>
        ${noteActions(["bunpou", "kotoba", "flashcard", "quiz", "copy"])}
      </div>`;
  };

  /* ---------- Auto-detect for default mode ---------- */
  const detectMode = (text) => {
    const t = (text || "").trim();
    if (!t) return "default";
    if (t.split("\n").filter(s => s.trim()).length > 1) return "bulk-kotoba";
    if (t.startsWith("〜") || t.startsWith("~") || /[\u3041-\u309F\u30A1-\u30FF\u4E00-\u9FFF]+\u3002$/.test(t) === false && /\u301c|\uFF5E/.test(t)) return "bunpou";
    if (/[\u4E00-\u9FFF\u3040-\u30FF].*[\u3002\u3001]/.test(t) || (/[\u4E00-\u9FFF\u3040-\u30FF]/.test(t) && t.length > 6)) return "sentence-analysis";
    return "default";
  };

  /* ---------- Compose AI message ---------- */
  const buildResponse = (mode, text) => {
    switch (mode) {
      case "kotoba":            return buildKotobaNote(text);
      case "bunpou":            return buildBunpouNote(text);
      case "correction":        return buildCorrectionNote(text);
      case "example":           return buildExampleNote(text);
      case "quiz":              return buildQuizNote(text);
      case "flashcard":         return buildFlashcardNote(text);
      case "bulk-kotoba":       return buildBulkPreview(text);
      case "sentence-analysis": return buildSentenceAnalysis(text);
      default:
        return `Aku belum yakin maksud kamu. Pilih mode di atas (Jelaskan Kotoba / Bunpou / Koreksi Kalimat / dll) supaya jawabanku rapi.`;
    }
  };

  const appendMessage = (html, who = "ai", { withActions = true } = {}) => {
    const chat = $("#chat");
    if (!chat) return;
    const wrap = document.createElement("div");
    wrap.className = `msg msg--${who}`;
    if (who === "ai") {
      const actions = withActions ? aiActionButtons : "";
      wrap.innerHTML = `<div class="msg__avatar" aria-hidden="true">✨</div><div class="msg__bubble">${makeKanjiClickable(html)}${actions}</div>`;
    } else {
      wrap.innerHTML = `<div class="msg__bubble">${html}</div>`;
    }
    chat.appendChild(wrap);
    chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
    return wrap;
  };

  const appendTyping = () => {
    const chat = $("#chat");
    if (!chat) return;
    const wrap = document.createElement("div");
    wrap.className = "msg msg--ai msg--loading";
    wrap.innerHTML = `
      <div class="msg__avatar" aria-hidden="true">✨</div>
      <div class="msg__bubble">
        <span class="dot-typing"></span>
        <span class="dot-typing"></span>
        <span class="dot-typing"></span>
      </div>`;
    chat.appendChild(wrap);
    chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
    return wrap;
  };

  const askAI = (text) => {
    if (!text.trim()) return;
    appendMessage(escapeHtml(text).replace(/\n/g, "<br>"), "user", { withActions: false });
    const typing = appendTyping();
    let usedMode = aiMode;
    if (aiMode === "default") usedMode = detectMode(text);
    setTimeout(() => {
      if (typing) typing.remove();
      const reply = buildResponse(usedMode, text);
      // For structured notes, drop the generic action buttons since note has its own
      const noActions = usedMode !== "default";
      appendMessage(reply, "ai", { withActions: !noActions });
    }, 700 + Math.random() * 500);
  };

  const getAiStatusForContext = () => {
    const s = (typeof getAiSettings === "function") ? getAiSettings() : null;
    if (!s) return { label: "Mock AI", cls: "ai-status-pill--mock", icon: "✨" };
    if (typeof isAiConfigured === "function" && isAiConfigured() && s.useReal) {
      return { label: "AI Configured", cls: "ai-status-pill--ok", icon: "✅" };
    }
    if (typeof isAiConfigured === "function" && isAiConfigured() && !s.useReal) {
      return { label: "Mock AI", cls: "ai-status-pill--mock", icon: "📝" };
    }
    return { label: "AI belum diatur", cls: "ai-status-pill--warn", icon: "⚠" };
  };

  const renderAIModeIntro = () => {
    const cfg = AI_MODES[aiMode] || AI_MODES.default;
    const cards = Object.entries(AI_MODES)
      .filter(([k]) => k !== "default")
      .map(([k, v]) => `
        <button type="button" class="ai-mode-card${k === aiMode ? " is-active" : ""}" data-ai-mode="${k}">
          <span class="ai-mode-card__icon" aria-hidden="true">${v.icon}</span>
          <span class="ai-mode-card__title">${escapeHtml(v.label)}</span>
          <span class="ai-mode-card__sub">${escapeHtml(v.sub)}</span>
        </button>`).join("");

    const st = getAiStatusForContext();

    return `
      <div class="msg msg--ai">
        <div class="msg__avatar" aria-hidden="true">✨</div>
        <div class="msg__bubble">
          <div class="ai-intro-card">
            <div class="ai-intro-card__title">Mau dibantu apa hari ini?</div>
            <p class="ai-intro-card__text">Pilih mode dulu supaya AI menjawab dengan format catatan belajar yang rapi.</p>
          </div>
          <div class="ai-mode-grid" id="aiModeGrid">${cards}</div>
          <div class="ai-context-card" id="aiContextCard">
            <div class="ai-context-row"><span class="ai-context-label">Mode</span><span class="ai-context-value" id="aiCtxMode">${escapeHtml(cfg.label)}</span></div>
            <div class="ai-context-row"><span class="ai-context-label">Input</span><span class="ai-context-value" id="aiCtxInput">${escapeHtml(cfg.input)}</span></div>
            <div class="ai-context-row"><span class="ai-context-label">Output</span><span class="ai-context-value" id="aiCtxOutput">${escapeHtml(cfg.output)}</span></div>
            <div class="ai-context-row"><span class="ai-context-label">Status AI</span><span class="ai-context-value"><span class="ai-status-pill ${st.cls}" id="aiCtxStatus">${st.icon} ${escapeHtml(st.label)}</span></span></div>
          </div>
        </div>
      </div>`;
  };

  const updateAIContext = () => {
    const cfg = AI_MODES[aiMode] || AI_MODES.default;
    const ctxMode = $("#aiCtxMode");
    const ctxInput = $("#aiCtxInput");
    const ctxOutput = $("#aiCtxOutput");
    if (ctxMode) ctxMode.textContent = cfg.label;
    if (ctxInput) ctxInput.textContent = cfg.input;
    if (ctxOutput) ctxOutput.textContent = cfg.output;
    const ctxStatus = $("#aiCtxStatus");
    if (ctxStatus) {
      const st = getAiStatusForContext();
      ctxStatus.className = `ai-status-pill ${st.cls}`;
      ctxStatus.textContent = `${st.icon} ${st.label}`;
    }
    $$("#aiModeGrid .ai-mode-card").forEach(card => {
      card.classList.toggle("is-active", card.dataset.aiMode === aiMode);
    });
    const inp = $("#aiInput");
    if (inp) {
      inp.placeholder = cfg.placeholder;
      // Pre-fill sample if input is empty and mode picked
      if (!inp.value && cfg.sample && aiMode !== "default") {
        inp.value = cfg.sample;
      }
    }
  };

  const initAIChat = () => {
    const chat = $("#chat");
    if (!chat) return;
    chat.innerHTML = "";
    chat.insertAdjacentHTML("beforeend", renderAIModeIntro());
    appendMessage(
      `Halo! Aku <strong>AI Tutor ifNote</strong>. Pilih mode di atas atau langsung tulis pertanyaan, ya.`,
      "ai",
      { withActions: false }
    );
  };


  /* ========== BACKUP FLOW ========== */
  const openResetModal = () => {
    openConfirm({
      title: "Yakin reset semua data lokal?",
      text: "Aksi ini tidak bisa dibatalkan. Data kotoba, bunpou, hafalan, dan quiz akan dikembalikan ke data dummy.",
      icon: "⚠",
      okLabel: "Reset Data",
      danger: true,
    }, () => {
      // Clear local data + restore seeds
      lsRemove(STORAGE_KEYS.kotoba);
      lsRemove(STORAGE_KEYS.bunpou);
      lsRemove(STORAGE_KEYS.hafalanOrder);
      lsRemove(STORAGE_KEYS.quizProgress);
      lsRemove(STORAGE_KEYS.kanjiCache);
      KOTOBA.length = 0;
      JSON.parse(JSON.stringify(KOTOBA_SEED)).forEach(k => KOTOBA.push(k));
      BUNPOU.length = 0;
      JSON.parse(JSON.stringify(BUNPOU_SEED)).forEach(b => BUNPOU.push(b));
      // Rebuild hafalanOrder from seed
      saveHafalanOrder(buildInitialHafalanOrder());
      // Reset in-memory quiz state
      quizType = "kotoba"; quizIdx = 0; quizCorrect = 0; quizWrong = 0;
      renderKotoba();
      renderBunpou();
      renderCatatan();
      renderHafalan();
      renderQuiz();
      toast("Data lokal direset.", "success");
    });
  };

  const exportLocalData = () => {
    const aiSettings = getAiSettings();
    // Strip API key by default for safety
    const safeAiSettings = { ...aiSettings, apiKey: "" };
    const data = {
      version: 1,
      exported: new Date().toISOString(),
      kotoba: KOTOBA,
      bunpou: BUNPOU,
      hafalanOrder:  lsRead(STORAGE_KEYS.hafalanOrder),
      quizProgress:  lsRead(STORAGE_KEYS.quizProgress),
      jpMode:        lsRead(STORAGE_KEYS.jpMode),
      theme:         lsRead(STORAGE_KEYS.theme),
      kanjiCache:    lsRead(STORAGE_KEYS.kanjiCache),
      aiSettings:    safeAiSettings,
    };
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ifnote-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Backup berhasil dibuat. API key tidak ikut di-export.", "success");
    } catch {
      toast("Gagal export. Coba lagi.", "error");
    }
  };
  // Keep alias for back-compat with existing handlers
  const mockExportJSON = exportLocalData;

  const importLocalData = () => {
    const fileInput = $("#importFileInput");
    if (!fileInput) {
      toast("File picker tidak tersedia.", "warn");
      return;
    }
    fileInput.value = "";
    fileInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        let parsed;
        try { parsed = JSON.parse(ev.target.result); }
        catch {
          toast("File JSON tidak valid.", "error");
          return;
        }
        if (!parsed || (!Array.isArray(parsed.kotoba) && !Array.isArray(parsed.bunpou))) {
          toast("Struktur backup tidak dikenali.", "error");
          return;
        }
        openConfirm({
          title: "Import data backup?",
          text: "Data lokal saat ini akan diganti dengan data dari file backup.",
          icon: "📥",
          okLabel: "Import",
          warn: true,
        }, () => {
          if (Array.isArray(parsed.kotoba)) {
            KOTOBA.length = 0;
            parsed.kotoba.forEach(k => KOTOBA.push(k));
            persistKotoba();
          }
          if (Array.isArray(parsed.bunpou)) {
            BUNPOU.length = 0;
            parsed.bunpou.forEach(b => BUNPOU.push(b));
            persistBunpou();
          }
          if (Array.isArray(parsed.hafalanOrder)) {
            // Validate shape, drop unrecognized
            const safe = parsed.hafalanOrder.filter(o => o && (o.type === "kotoba" || o.type === "bunpou") && o.id !== undefined);
            saveHafalanOrder(safe);
          } else {
            // No order in backup — rebuild from imported KOTOBA + BUNPOU
            lsRemove(STORAGE_KEYS.hafalanOrder);
          }
          // Make sure any items not in order get appended
          syncHafalanOrder();
          if (parsed.kanjiCache)   lsWrite(STORAGE_KEYS.kanjiCache,   parsed.kanjiCache);
          if (parsed.jpMode)       lsWrite(STORAGE_KEYS.jpMode,       parsed.jpMode);
          if (parsed.theme)        lsWrite(STORAGE_KEYS.theme,        parsed.theme);
          // Skip aiSettings on import unless apiKey is present (default skips, since export strips key)
          renderKotoba();
          renderBunpou();
          renderCatatan();
          renderHafalan();
          toast("Data berhasil diimport.", "success");
        });
      };
      reader.onerror = () => toast("Gagal membaca file.", "error");
      reader.readAsText(file);
    };
    fileInput.click();
  };
  const mockImportJSON = importLocalData;

  /* ========== AI SETTINGS: MODEL FETCH MOCK ========== */
  const mockRefreshModels = () => {
    const state = $("#modelState");
    const text = $("#modelStateText");
    const baseUrl = ($("#aiBaseUrl") || {}).value || "";
    const apiKey = ($("#aiApiKey") || {}).value || "";

    if (!baseUrl || !apiKey) {
      if (state) { state.className = "model-state is-error"; }
      if (text) text.textContent = "Gagal: Base URL dan API Key harus diisi.";
      toast("Gagal memuat models. Isi Base URL dan API Key.", "error");
      return;
    }

    if (state) { state.className = "model-state is-loading"; }
    if (text) text.textContent = "Fetching models...";

    setTimeout(() => {
      // Mock success
      if (state) { state.className = "model-state is-ok"; }
      if (text) text.textContent = "5 models loaded.";
      toast("AI Provider / Models loaded", "success");
    }, 800);
  };

  /* ========== JAPANESE DISPLAY MODE SWITCH ========== */
  const handleJpModeChange = () => {
    const radios = $$('input[name="jpdisplay"]');
    const modes = ["beginner", "normal", "furigana"];
    radios.forEach((r, i) => {
      if (r.checked) jpMode = modes[i];
    });
    applyJpMode();
    renderKotoba();
    renderBunpou();
    renderFlashcard();
    toast("Tampilan Jepang diperbarui.", "success");
  };


  /* ========== FILTER DROPDOWN ========== */
  const FILTER_PANELS = { kotoba: "#kotobaFilterPanel", bunpou: "#bunpouFilterPanel", catatan: "#catatanFilterPanel" };
  const FILTER_TOGGLES = { kotoba: '[data-filter-toggle="kotoba"]', bunpou: '[data-filter-toggle="bunpou"]', catatan: '[data-filter-toggle="catatan"]' };
  const FILTER_LABELS = { kotoba: "#kotobaActiveLabel", bunpou: "#bunpouActiveLabel", catatan: "#catatanActiveLabel" };
  const FILTER_LABEL_TEXT = { kotoba: "#kotobaActiveText", bunpou: "#bunpouActiveText", catatan: "#catatanActiveText" };

  const closeFilterPanel = (target) => {
    const panel = $(FILTER_PANELS[target]);
    const toggle = $(FILTER_TOGGLES[target]);
    if (!panel) return;
    panel.classList.remove("is-open");
    if (toggle) {
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
    }
    // Hide after animation
    setTimeout(() => {
      if (!panel.classList.contains("is-open")) panel.hidden = true;
    }, 260);
  };

  const closeAllFilterPanels = () => {
    closeFilterPanel("kotoba");
    closeFilterPanel("bunpou");
  };

  const openFilterPanel = (target) => {
    const panel = $(FILTER_PANELS[target]);
    const toggle = $(FILTER_TOGGLES[target]);
    if (!panel) return;
    // Close the other panel
    Object.keys(FILTER_PANELS).forEach(k => { if (k !== target) closeFilterPanel(k); });
    panel.hidden = false;
    // Force reflow so transition runs
    void panel.offsetHeight;
    panel.classList.add("is-open");
    if (toggle) {
      toggle.classList.add("is-active");
      toggle.setAttribute("aria-expanded", "true");
    }
  };

  const toggleFilterPanel = (target) => {
    const panel = $(FILTER_PANELS[target]);
    if (!panel) return;
    if (panel.classList.contains("is-open")) closeFilterPanel(target);
    else openFilterPanel(target);
  };

  const applyFilter = (target, value) => {
    if (target === "kotoba") {
      kotobaActiveFilter = value;
      // Update active states in the panel
      $$(`#kotobaFilterPanel .filter-option`).forEach(opt =>
        opt.classList.toggle("is-active", opt.dataset.filter === value)
      );
      renderKotoba();
    } else if (target === "bunpou") {
      bunpouActiveFilter = value;
      $$(`#bunpouFilterPanel .filter-option`).forEach(opt =>
        opt.classList.toggle("is-active", opt.dataset.filter === value)
      );
      renderBunpou();
    } else if (target === "catatan") {
      catatanFilter = value;
      $$(`#catatanFilterPanel .filter-option`).forEach(opt =>
        opt.classList.toggle("is-active", opt.dataset.filter === value)
      );
      renderCatatan();
    }
    // Update active label
    const labelEl = $(FILTER_LABELS[target]);
    const textEl = $(FILTER_LABEL_TEXT[target]);
    if (labelEl && textEl) {
      if (value && value !== "Semua") {
        textEl.textContent = value;
        labelEl.hidden = false;
      } else {
        labelEl.hidden = true;
      }
    }
    // Toggle .has-filter on filter toggle button
    const toggleBtn = $(FILTER_TOGGLES[target]);
    if (toggleBtn) {
      toggleBtn.classList.toggle("has-filter", value && value !== "Semua");
    }
    closeFilterPanel(target);
  };

  /* ========== ONBOARDING ========== */
  const ONBOARDING_KEY = "ifnote.onboardingSeen";
  let onboardingIndex = 0;

  const ONBOARDING_SLIDES = [
    {
      icon: "📖",
      jp: "にほんごを すこしずつ",
      title: "Selamat datang di ifNote",
      text: "Simpan kotoba, bunpou, dan contoh kalimat Jepang dalam satu tempat.",
      chips: [],
      next: "Lanjut",
    },
    {
      icon: "📚",
      jp: "ノートを すっきり",
      title: "Belajar dari Catatan",
      text: "Gabungkan kotoba dan bunpou, lalu buka detailnya saat dibutuhkan.",
      chips: ["Catatan", "Filter", "Kanji popup"],
      next: "Lanjut",
    },
    {
      icon: "🧠",
      jp: "やるぞ！",
      title: "Hafalan & Quiz",
      text: "Hafalkan materi dengan slide tetap, lalu uji kemampuanmu lewat quiz.",
      chips: ["Hafalan", "Quiz", "AI Tutor"],
      next: "Mulai Belajar",
    },
  ];

  const renderOnboardingSlide = () => {
    const slide = ONBOARDING_SLIDES[onboardingIndex];
    if (!slide) return;
    const slideEl = $("#onboardingSlide");
    if (slideEl) {
      slideEl.innerHTML = `
        <div class="onboarding__icon" aria-hidden="true">${slide.icon}</div>
        <div class="onboarding__jp">${escapeHtml(slide.jp)}</div>
        <h3 class="onboarding__title" id="onboardingTitle">${escapeHtml(slide.title)}</h3>
        <p class="onboarding__text">${escapeHtml(slide.text)}</p>
        ${slide.chips.length ? `<div class="onboarding__chips">${slide.chips.map(c => `<span class="onboarding__chip">${escapeHtml(c)}</span>`).join("")}</div>` : ""}
      `;
    }
    // Update dots
    $$("#onboardingDots .onboarding__dot").forEach((d, i) =>
      d.classList.toggle("is-active", i === onboardingIndex)
    );
    // Update buttons
    const nextBtn = $("#onboardingNext");
    const prevBtn = $("#onboardingPrev");
    if (nextBtn) nextBtn.textContent = slide.next;
    if (prevBtn) prevBtn.hidden = onboardingIndex === 0;
  };

  const showOnboarding = () => {
    const ob = $("#onboarding");
    if (!ob) return;
    onboardingIndex = 0;
    renderOnboardingSlide();
    ob.hidden = false;
  };

  const hideOnboarding = () => {
    const ob = $("#onboarding");
    if (!ob) return;
    ob.hidden = true;
  };

  const nextOnboardingSlide = () => {
    if (onboardingIndex < ONBOARDING_SLIDES.length - 1) {
      onboardingIndex++;
      renderOnboardingSlide();
    } else {
      finishOnboarding();
    }
  };

  const prevOnboardingSlide = () => {
    if (onboardingIndex > 0) {
      onboardingIndex--;
      renderOnboardingSlide();
    }
  };

  const finishOnboarding = () => {
    try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch {}
    hideOnboarding();
    showWelcomeBack();
  };

  const skipOnboarding = () => finishOnboarding();

  const initOnboarding = () => {
    let seen = false;
    try { seen = localStorage.getItem(ONBOARDING_KEY) === "true"; } catch {}
    if (!seen) {
      // Wait for splash to fade then show onboarding
      setTimeout(showOnboarding, 1100);
    } else {
      showWelcomeBack();
    }
  };

  const showWelcomeBack = () => {
    const wb = $("#welcomeBackCard");
    if (wb) wb.hidden = false;
  };

  /* ========== SPLASH ========== */
  const hideSplash = () => {
    const sp = $("#splash");
    if (!sp) return;
    setTimeout(() => { sp.hidden = true; }, 1300);
  };

  /* ========== AI SETTINGS RENDER ========== */
  const renderAiSettingsForm = () => {
    const s = getAiSettings();
    const fields = {
      provider: $("#aiProvider"),
      baseUrl:  $("#aiBaseUrl"),
      apiKey:   $("#aiApiKey"),
      model:    $("#aiModel"),
      format:   $("#aiFormat"),
      useReal:  $("#aiUseRealToggle"),
    };
    if (fields.provider) fields.provider.value = s.provider;
    if (fields.baseUrl)  fields.baseUrl.value  = s.baseUrl;
    if (fields.apiKey)   fields.apiKey.value   = s.apiKey;
    if (fields.model)    fields.model.value    = s.model;
    if (fields.format)   fields.format.value   = s.format;
    if (fields.useReal)  fields.useReal.checked = s.useReal;

    const mask = $("#aiApiKeyMask");
    if (mask) mask.textContent = s.apiKey ? `Tersimpan: ${maskApiKey(s.apiKey)}` : "—";

    const status = $("#aiSettingsStatus");
    const statusText = $("#aiSettingsStatusText");
    if (status && statusText) {
      status.classList.remove("settings-status--ok", "settings-status--warn", "settings-status--error");
      if (isAiConfigured()) {
        status.classList.add("settings-status--ok");
        statusText.textContent = "AI tersimpan lokal";
      } else if (s.baseUrl || s.apiKey || s.model) {
        status.classList.add("settings-status--warn");
        statusText.textContent = "AI belum lengkap. Isi Base URL, API Key, dan Model ID.";
      } else {
        statusText.textContent = "AI belum diatur";
      }
    }
  };

  const collectAiSettingsFromForm = () => ({
    provider: ($("#aiProvider") || {}).value || "",
    baseUrl:  ($("#aiBaseUrl")  || {}).value || "",
    apiKey:   ($("#aiApiKey")   || {}).value || "",
    model:    ($("#aiModel")    || {}).value || "",
    format:   ($("#aiFormat")   || {}).value || "openai",
    useReal:  !!(($("#aiUseRealToggle")  || {}).checked),
  });

  /* ========== AI STATUS CARD (in AI Tutor screen) ========== */
  const renderAiStatusCard = () => {
    const chat = $("#chat");
    if (!chat) return;
    const existing = chat.querySelector(".ai-status-card");
    if (existing) existing.remove();

    const s = getAiSettings();
    let cls = "ai-status-card--mock";
    let icon = "✨";
    let title = "Mock AI";
    let text = "Pakai jawaban contoh lokal. AI belum dikonfigurasi.";
    let actions = `<button class="btn btn--ghost" data-nav="settings">Buka Settings</button>`;

    if (isAiConfigured() && s.useReal) {
      cls = "ai-status-card--configured";
      icon = "✅";
      title = "AI Configured";
      const provider = s.provider || "AI Lokal";
      text = `${escapeHtml(provider)} · ${escapeHtml(s.model)} · ${escapeHtml(maskApiKey(s.apiKey))}`;
      actions = `<button class="btn btn--ghost" data-nav="settings">Ubah</button>`;
    } else if (isAiConfigured() && !s.useReal) {
      cls = "ai-status-card--mock";
      icon = "📝";
      title = "Mock AI (config tersimpan)";
      text = "Settings AI tersimpan, tapi 'Gunakan AI asli' belum aktif.";
      actions = `<button class="btn btn--ghost" data-nav="settings">Buka Settings</button>`;
    } else if (!isAiConfigured()) {
      // Default: show warning when AI not configured AT ALL
      const anyEnteredField = !!(s.baseUrl || s.apiKey || s.model);
      if (!anyEnteredField) {
        cls = "ai-status-card--warning";
        icon = "⚠";
        title = "AI belum diatur";
        text = "Buka Settings untuk memasukkan Base URL, API Key, dan Model ID.";
        actions = `
          <button class="btn btn--primary" data-nav="settings">Buka Settings</button>
          <button class="btn btn--ghost" data-action="use-mock-ai">Pakai Mock AI</button>
        `;
      }
    }

    const card = document.createElement("div");
    card.className = `ai-status-card ${cls}`;
    card.innerHTML = `
      <div class="ai-status-card__icon" aria-hidden="true">${icon}</div>
      <div class="ai-status-card__body">
        <div class="ai-status-card__title">${escapeHtml(title)}</div>
        <div class="ai-status-card__text">${text}</div>
      </div>
      <div class="ai-status-card__actions">${actions}</div>
    `;
    chat.insertBefore(card, chat.firstChild);
  };

  /* ========== INIT & EVENT WIRING ========== */
  const init = () => {
    hydrateData();
    syncHafalanOrder();
    hydrateQuizProgress();
    applyJpMode();
    renderKotoba();
    renderBunpou();
    renderCatatan();
    renderHafalan();
    renderFlashcard();
    renderQuiz();
    initAIChat();
    renderAiSettingsForm();
    renderAiStatusCard();

    // Splash + onboarding
    hideSplash();
    initOnboarding();

    // Set today date in home hero
    const dateEl = $("#homeHeroDate");
    if (dateEl) {
      const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
      const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
      const d = new Date();
      dateEl.textContent = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    }

    // Set time-aware greeting in home topbar
    const greetEl = $("#homeGreeting");
    if (greetEl) {
      const h = new Date().getHours();
      let jp, id;
      if (h >= 4 && h < 11)       { jp = "おはよう ございます";   id = "selamat pagi"; }
      else if (h >= 11 && h < 15) { jp = "こんにちは";       id = "selamat siang"; }
      else if (h >= 15 && h < 18) { jp = "こんにちは";       id = "selamat sore";  }
      else                        { jp = "こんばんは";       id = "selamat malam"; }
      greetEl.textContent = `${jp} · ${id} · Belajar Jepang hari ini`;
    }

    // Set JP mode radio from saved state
    const radios = $$('input[name="jpdisplay"]');
    const modes = ["beginner", "normal", "furigana"];
    const modeIdx = modes.indexOf(jpMode);
    if (modeIdx >= 0 && radios[modeIdx]) radios[modeIdx].checked = true;

    // Detect saved theme or system preference
    const saved = localStorage.getItem("ifnote.theme");
    if (saved) setTheme(saved);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
    else setTheme("light");

    /* ---------- Global click delegation ---------- */
    document.addEventListener("click", (e) => {
      // Kanji clickable -> popup
      const kanjiBtn = e.target.closest(".kanji-click");
      if (kanjiBtn) {
        e.stopPropagation();
        const ch = kanjiBtn.dataset.kanji;
        if (ch) {
          showKanjiPopup(ch);
        }
        return;
      }

      // Kanji popup close
      if (e.target.closest("[data-kanji-close]") ||
          e.target.classList.contains("kanji-modal__backdrop")) {
        closeKanjiPopup();
        return;
      }

      // Confirm dialog
      if (e.target.closest("[data-confirm-cancel]") ||
          e.target.classList.contains("confirm-modal__backdrop")) {
        closeConfirm();
        return;
      }
      if (e.target.id === "confirmOk" || e.target.closest("#confirmOk")) {
        const cb = confirmCallback;
        closeConfirm(true); // fromConfirm=true → don't fire cancel callback
        if (typeof cb === "function") cb();
        return;
      }

      // Onboarding navigation
      if (e.target.id === "onboardingNext" || e.target.closest("#onboardingNext")) {
        nextOnboardingSlide();
        return;
      }
      if (e.target.id === "onboardingPrev" || e.target.closest("#onboardingPrev")) {
        prevOnboardingSlide();
        return;
      }
      if (e.target.closest('[data-onboarding="skip"]')) {
        skipOnboarding();
        return;
      }

      // Navigation
      const navTarget = e.target.closest("[data-nav]");
      if (navTarget) navigate(navTarget.dataset.nav);

      // Toast triggers
      const toastTarget = e.target.closest("[data-toast]");
      if (toastTarget && toastTarget.dataset.toast) {
        toast(toastTarget.dataset.toast, "success");
      }

      // Close modal
      if (e.target.matches("[data-modal-close]") || e.target.classList.contains("modal__backdrop")) {
        closeModal();
      }

      // Modal primary button (save)
      if (e.target.id === "modalPrimary" || e.target.closest("#modalPrimary")) {
        if (modalSaveCallback) {
          const result = modalSaveCallback();
          if (result !== false) closeModal();
        } else {
          closeModal();
        }
      }

      // Mastery pick buttons inside modal
      const masteryBtn = e.target.closest(".mastery-pick__btn");
      if (masteryBtn) {
        $$(".mastery-pick__btn").forEach(b => b.classList.remove("is-active"));
        masteryBtn.classList.add("is-active");
      }

      // Actions: add kotoba / bunpou
      const action = e.target.closest("[data-action]");
      if (action) {
        const a = action.dataset.action;
        if (a === "add-kotoba") openKotobaModal(null);
        else if (a === "add-bunpou") openBunpouModal(null);
        else if (a === "shuffle") { toast("Kartu diacak", "info"); }
        else if (a === "export-json") mockExportJSON();
        else if (a === "import-json") mockImportJSON();
        else if (a === "reset-data") openResetModal();
        else if (a === "replay-onboarding") {
          try { localStorage.removeItem(ONBOARDING_KEY); } catch {}
          showOnboarding();
          toast("Onboarding ditampilkan ulang.", "info");
        }
        else if (a === "open-daily-kanji") {
          const k = action.dataset.kanji || "食";
          showKanjiPopup(k);
        }
        else if (a === "start-weak-review") {
          // Switch Hafalan into weak-only mode and open it
          if (typeof hafalanMode !== "undefined") hafalanMode = "weak";
          if (typeof hafalanSlideIndex !== "undefined") hafalanSlideIndex = 0;
          if (typeof hafalanTempShuffle !== "undefined") hafalanTempShuffle = false;
          if (typeof hafalanTempShuffleIds !== "undefined") hafalanTempShuffleIds = null;
          if (typeof renderHafalan === "function") renderHafalan();
          navigate("hafalan");
          toast("Mode Weak Only dibuka", "info");
        }
        else if (a === "bulk-add-new-kotoba") {
          // Find current bulk preview's analyzed items by re-parsing the inputs from buttons
          const newItems = $$("[data-action='bulk-add-one-kotoba']")
            .map(b => b.dataset.bulkJp)
            .filter(Boolean)
            .map(jp => mockAnalyzeKotoba(jp))
            .filter(a => a.status === "new");
          if (!newItems.length) {
            toast("Tidak ada kotoba baru untuk ditambahkan.", "info");
          } else {
            openConfirm({
              title: "Tambahkan kotoba baru?",
              text: `AI menemukan ${newItems.length} kotoba baru. Kotoba yang sudah ada tidak akan ditambahkan ulang.`,
              icon: "✨",
              okLabel: "Tambahkan",
            }, () => {
              newItems.forEach(a => {
                if (!isKotobaDuplicate(a.jp)) {
                  const newId = Date.now() + Math.random();
                  KOTOBA.push({
                    id: newId,
                    jp: a.jp,
                    romaji: a.romaji || "",
                    arti: a.arti || "",
                    jenis: a.jenis || "lainnya",
                    level: a.level || "N5",
                    beginner: "", normal: "", furigana: "",
                    contoh: "", contohArti: "",
                    tags: ["import"],
                    mastery: "weak",
                  });
                  appendToHafalanOrder("kotoba", newId);
                }
              });
              persistKotoba();
              renderKotoba();
              renderCatatan();
              renderHafalan();
              toast(`${newItems.length} kotoba baru ditambahkan ke Catatan.`, "success");
              $$("[data-action='bulk-add-one-kotoba']").forEach(btn => {
                if (btn.dataset.bulkJp && isKotobaDuplicate(btn.dataset.bulkJp)) {
                  btn.disabled = true;
                  btn.textContent = "Sudah ada";
                }
              });
            });
          }
        }
        else if (a === "bulk-add-one-kotoba") {
          const jp = action.dataset.bulkJp;
          if (!jp) return;
          if (isKotobaDuplicate(jp)) {
            toast("Kotoba ini sudah ada di Catatan.", "warn");
          } else {
            openConfirm({
              title: "Tambahkan kotoba ini?",
              text: `Tambahkan “${jp}” ke Catatan?`,
              icon: "📖",
              okLabel: "Tambahkan",
            }, () => {
              const a2 = mockAnalyzeKotoba(jp);
              const newId = Date.now() + Math.random();
              KOTOBA.push({
                id: newId,
                jp: a2.jp,
                romaji: a2.romaji || "",
                arti: a2.arti || "",
                jenis: a2.jenis || "lainnya",
                level: a2.level || "N5",
                beginner: "", normal: "", furigana: "",
                contoh: "", contohArti: "",
                tags: ["import"],
                mastery: "weak",
              });
              appendToHafalanOrder("kotoba", newId);
              persistKotoba();
              renderKotoba();
              renderCatatan();
              renderHafalan();
              toast(`Kotoba ${jp} ditambahkan.`, "success");
              action.disabled = true;
              action.textContent = "Sudah ada";
            });
          }
        }
        else if (a === "bulk-edit-manual") {
          const jp = action.dataset.bulkJp || "";
          openKotobaModal({ jp, romaji: "", arti: "", jenis: "lainnya", level: "N5" });
        }
        else if (a === "bulk-ignore") {
          toast("Preview diabaikan.", "info");
        }
      }

      // Toggle Kotoba accordion
      const toggleKotoba = e.target.closest("[data-toggle-kotoba]");
      if (toggleKotoba) {
        const card = toggleKotoba.closest(".k-card");
        const detail = card?.querySelector(".k-card__detail");
        if (card && detail) {
          const isOpen = card.classList.toggle("is-expanded");
          toggleKotoba.setAttribute("aria-expanded", String(isOpen));
          if (isOpen) {
            detail.hidden = false;
            // Force reflow so transition runs
            void detail.offsetHeight;
            detail.classList.add("is-open");
          } else {
            detail.classList.remove("is-open");
            setTimeout(() => {
              if (!card.classList.contains("is-expanded")) detail.hidden = true;
            }, 280);
          }
        }
      }

      // Toggle Bunpou accordion
      const toggleBunpou = e.target.closest("[data-toggle-bunpou]");
      if (toggleBunpou) {
        const card = toggleBunpou.closest(".k-card");
        const detail = card?.querySelector(".k-card__detail");
        if (card && detail) {
          const isOpen = card.classList.toggle("is-expanded");
          toggleBunpou.setAttribute("aria-expanded", String(isOpen));
          if (isOpen) {
            detail.hidden = false;
            void detail.offsetHeight;
            detail.classList.add("is-open");
          } else {
            detail.classList.remove("is-open");
            setTimeout(() => {
              if (!card.classList.contains("is-expanded")) detail.hidden = true;
            }, 280);
          }
        }
      }

      // Toggle Note (catatan) accordion
      const toggleNote = e.target.closest("[data-toggle-note]");
      if (toggleNote) {
        const card = toggleNote.closest(".note-card");
        const detail = card?.querySelector(".note-card__detail");
        if (card && detail) {
          const isOpen = card.classList.toggle("is-expanded");
          toggleNote.setAttribute("aria-expanded", String(isOpen));
          if (isOpen) {
            detail.hidden = false;
            void detail.offsetHeight;
            detail.classList.add("is-open");
          } else {
            detail.classList.remove("is-open");
            setTimeout(() => {
              if (!card.classList.contains("is-expanded")) detail.hidden = true;
            }, 280);
          }
        }
      }

      // Toggle Hafalan row
      const toggleHafRow = e.target.closest("[data-toggle-hafalan-row]");
      if (toggleHafRow) {
        const row = toggleHafRow.closest(".hafalan-row");
        const detail = row?.querySelector(".hafalan-row__detail");
        if (row && detail) {
          const isOpen = row.classList.toggle("is-expanded");
          toggleHafRow.setAttribute("aria-expanded", String(isOpen));
          if (isOpen) {
            detail.hidden = false;
            void detail.offsetHeight;
            detail.classList.add("is-open");
          } else {
            detail.classList.remove("is-open");
            setTimeout(() => {
              if (!row.classList.contains("is-expanded")) detail.hidden = true;
            }, 280);
          }
        }
      }

      // Hafalan mode card
      const hafModeCard = e.target.closest("[data-hafalan-mode]");
      if (hafModeCard) {
        hafalanMode = hafModeCard.dataset.hafalanMode;
        hafalanSlideIndex = 0;
        hafalanTempShuffleIds = null;
        renderHafalan();
      }

      // Hafalan slide nav
      if (e.target.closest('[data-action="hafalan-prev"]')) {
        if (hafalanSlideIndex > 0) {
          hafalanSlideIndex--;
          hafalanTempShuffleIds = null;
          renderHafalan();
        }
      }
      if (e.target.closest('[data-action="hafalan-next"]')) {
        const total = chunkFixedSlides(buildHafalanItems(hafalanMode), 20).length;
        if (hafalanSlideIndex < total - 1) {
          hafalanSlideIndex++;
          hafalanTempShuffleIds = null;
          renderHafalan();
        }
      }

      // Toggle hafalan meaning
      if (e.target.closest('[data-action="toggle-hafalan-meaning"]')) {
        hafalanShowMeaning = !hafalanShowMeaning;
        renderHafalan();
      }

      // Shuffle current slide (temporary)
      if (e.target.closest('[data-action="shuffle-current-slide"]')) {
        const slides = chunkFixedSlides(buildHafalanItems(hafalanMode), 20);
        const current = slides[hafalanSlideIndex] || [];
        const ids = current.map(c => `${c._type}-${c.id}`);
        // Shuffle ids
        for (let i = ids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        hafalanTempShuffleIds = ids;
        renderHafalan();
        toast("Slide ini diacak sementara", "info");
      }

      // Mark mastery from hafalan row
      const markBtn = e.target.closest("[data-mark-mastery]");
      if (markBtn) {
        const newMastery = markBtn.dataset.markMastery;
        const key = markBtn.dataset.markKey || "";
        const [type, idRaw] = key.split(/-(.+)/);
        const id = isNaN(parseInt(idRaw)) ? idRaw : parseInt(idRaw);
        if (type === "kotoba") {
          const it = KOTOBA.find(k => String(k.id) === String(id));
          if (it) { it.mastery = newMastery; persistKotoba(); }
        } else if (type === "bunpou") {
          const it = BUNPOU.find(b => String(b.id) === String(id));
          if (it) { it.mastery = newMastery; persistBunpou(); }
        } else {
          // HAFALAN_EXTRA mock items — mutate for visible feedback
          const it = HAFALAN_EXTRA.find(h => `${h._type}-${h.id}` === key);
          if (it) it.mastery = newMastery;
        }
        renderHafalan();
        renderCatatan();
        toast(newMastery === "good" ? "Ditandai hafal" : "Ditandai lemah", "info");
      }

      // Review queue item click
      const queueItem = e.target.closest("[data-review-card-index]");
      if (queueItem) {
        const idx = parseInt(queueItem.dataset.reviewCardIndex);
        if (!isNaN(idx) && Array.isArray(FLASHCARDS) && FLASHCARDS[idx]) {
          fcIndex = idx;
          renderFlashcard();
          toast("Kartu dipilih untuk review", "info");
        } else {
          toast("Kartu dipilih untuk review", "info");
        }
      }

      // Edit kotoba
      const editKotoba = e.target.closest("[data-edit-kotoba]");
      if (editKotoba) {
        const id = parseInt(editKotoba.dataset.editKotoba);
        const item = KOTOBA.find(k => k.id === id);
        if (item) openKotobaModal(item);
      }

      // Edit bunpou
      const editBunpou = e.target.closest("[data-edit-bunpou]");
      if (editBunpou) {
        const id = parseInt(editBunpou.dataset.editBunpou);
        const item = BUNPOU.find(b => b.id === id);
        if (item) openBunpouModal(item);
      }

      // Theme toggle (top icon)
      if (e.target.closest("#themeToggle")) {
        const cur = document.documentElement.getAttribute("data-theme");
        const next = cur === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("ifnote.theme", next);
      }

      // Theme picker in settings
      const themeOpt = e.target.closest(".theme-opt");
      if (themeOpt) {
        setTheme(themeOpt.dataset.theme);
        localStorage.setItem("ifnote.theme", themeOpt.dataset.theme);
      }

      // Kotoba filter dropdown toggle
      const kotobaFilterToggle = e.target.closest('[data-filter-toggle="kotoba"]');
      if (kotobaFilterToggle) {
        toggleFilterPanel("kotoba", kotobaFilterToggle);
      }

      // Bunpou filter dropdown toggle
      const bunpouFilterToggle = e.target.closest('[data-filter-toggle="bunpou"]');
      if (bunpouFilterToggle) {
        toggleFilterPanel("bunpou", bunpouFilterToggle);
      }

      // Catatan filter dropdown toggle
      const catatanFilterToggle = e.target.closest('[data-filter-toggle="catatan"]');
      if (catatanFilterToggle) {
        toggleFilterPanel("catatan", catatanFilterToggle);
      }

      // Filter option click
      const filterOpt = e.target.closest("[data-filter-target]");
      if (filterOpt) {
        const target = filterOpt.dataset.filterTarget;
        const value = filterOpt.dataset.filter;
        applyFilter(target, value);
      }

      // Clear active filter button
      const clearFilter = e.target.closest("[data-clear-filter]");
      if (clearFilter) {
        const target = clearFilter.dataset.clearFilter;
        // If clear button is inside the empty state, also reset the search input
        const inEmptyState = clearFilter.closest("#kotobaEmpty, #bunpouEmpty, #noteEmpty");
        if (inEmptyState) {
          const searchSelector = target === "catatan"
            ? '#catatanSearch'
            : `.screen[data-screen="${target}"] .search input`;
          const searchInput = $(searchSelector);
          if (searchInput) searchInput.value = "";
          if (target === "kotoba") kotobaQuery = "";
          else if (target === "bunpou") bunpouQuery = "";
          else if (target === "catatan") catatanQuery = "";
        }
        applyFilter(target, "Semua");
      }

      // Click outside closes any open filter panel
      if (!e.target.closest(".search-filter")) {
        closeAllFilterPanels();
      }

      // Flashcard mode chips
      const fcModeChip = e.target.closest("[data-fcmode]");
      if (fcModeChip) {
        $$("#fcModeChips .chip-btn").forEach(c => c.classList.remove("is-active"));
        fcModeChip.classList.add("is-active");
        fcMode = fcModeChip.dataset.fcmode;
        fcIndex = 0;
        renderFlashcard();
        toast(`Mode: ${fcModeChip.textContent.trim()}`, "info");
      }

      // Flashcard reveal
      if (e.target.id === "fcReveal") {
        flipFlashcard();
      } else if (e.target.closest("#flashcard") && !e.target.closest(".rating") && !e.target.closest(".btn")) {
        flipFlashcard();
      }

      // Flashcard rating
      const rate = e.target.closest("[data-rate]");
      if (rate) {
        const labels = { again: "Akan diulang lebih sering", hard: "Ditandai sulit", good: "Lumayan, lanjut", easy: "Sudah hafal!" };
        toast(labels[rate.dataset.rate] || "Tersimpan", "success");
        fcIndex++;
        renderFlashcard();
      }

      // Quiz answer (multiple choice)
      const opt = e.target.closest(".quiz-opt");
      if (opt) answerQuiz(opt);

      // Quiz blank check
      if (e.target.id === "checkBlank") checkBlankAnswer();

      // Quiz next
      if (e.target.id === "quizNext") nextQuiz();

      // Quiz type chips
      const quizTypeChip = e.target.closest("[data-quiztype]");
      if (quizTypeChip) {
        $$("#quizTypeChips .chip-btn").forEach(c => c.classList.remove("is-active"));
        quizTypeChip.classList.add("is-active");
        const newType = quizTypeChip.dataset.quiztype;
        const switching = newType !== quizType;
        quizType = newType;
        if (switching) {
          quizIdx = 0;
          quizCorrect = 0;
          quizWrong = 0;
        }
        // AI Generated awareness: if AI not configured, fall back to mock + toast
        if (quizType === "ai" && typeof isAiConfigured === "function" && !isAiConfigured()) {
          toast("AI belum diatur — pakai soal mock lokal.", "info");
        } else {
          toast("Quiz dimulai.", "info");
        }
        persistQuizProgress();
        renderQuiz();
      }

      // Quiz type cards (the big buttons)
      const qt = e.target.closest(".quiz-type");
      if (qt) {
        const title = qt.querySelector(".quiz-type__title")?.textContent || "Quiz";
        const typeMap = { "Kotoba Quiz": "kotoba", "Bunpou Quiz": "bunpou", "Mixed Quiz": "mixed", "AI Generated Quiz": "ai" };
        const mapped = typeMap[title];
        if (mapped) {
          quizType = mapped;
          quizIdx = 0;
          $$("#quizTypeChips .chip-btn").forEach(c => c.classList.toggle("is-active", c.dataset.quiztype === mapped));
          renderQuiz();
        }
        toast(`${title} dimulai.`, "info");
      }

      // AI mode card click
      const aiModeBtn = e.target.closest("[data-ai-mode]");
      if (aiModeBtn) {
        aiMode = aiModeBtn.dataset.aiMode;
        updateAIContext();
        const cfg = AI_MODES[aiMode] || AI_MODES.default;
        toast(`Mode AI: ${cfg.label}`, "info");
      }

      // AI action buttons
      const aiAction = e.target.closest("[data-ai-action]");
      if (aiAction) {
        const act = aiAction.dataset.aiAction;
        if (act === "save-kotoba") {
          openKotobaModal({ jp: "", romaji: "", arti: "", jenis: "kata kerja", level: "N5" });
        } else if (act === "save-bunpou") {
          openBunpouModal({ jp: "", arti: "", rumus: "", kapan: "", level: "N5" });
        } else if (act === "make-flashcard") {
          toast("Kartu hafalan dibuat dari jawaban AI.", "success");
        } else if (act === "make-quiz") {
          toast("Quiz dibuat dari jawaban AI.", "success");
        } else if (act === "copy") {
          const bubble = aiAction.closest(".msg__bubble");
          if (bubble) {
            const text = bubble.innerText.replace(/Simpan ke Kotoba.*$/s, "").trim();
            navigator.clipboard?.writeText(text).then(() => {
              toast("Jawaban disalin.", "success");
            }).catch(() => {
              toast("Jawaban disalin.", "success");
            });
          } else {
            toast("Jawaban disalin.", "success");
          }
        }
      }

      // (Old AI prompt chips removed; mode cards replace them.)

      // Save AI settings
      if (e.target.id === "saveAiBtn") {
        const settings = collectAiSettingsFromForm();
        saveAiSettings(settings);
        renderAiSettingsForm();
        renderAiStatusCard();
        if (typeof updateAIContext === "function") updateAIContext();
        toast("AI settings tersimpan lokal.", "success");
      }

      // Clear AI settings
      if (e.target.id === "clearAiBtn") {
        openConfirm({
          title: "Hapus AI settings?",
          text: "Provider, Base URL, API Key, dan Model ID akan dihapus dari penyimpanan lokal.",
          icon: "⚠",
          okLabel: "Hapus",
          danger: true,
        }, () => {
          clearAiSettings();
          renderAiSettingsForm();
          renderAiStatusCard();
          if (typeof updateAIContext === "function") updateAIContext();
          toast("AI settings dihapus.", "info");
        });
      }

      // Test AI connection (mock)
      if (e.target.id === "testAiBtn") {
        const btn = e.target;
        const original = btn.textContent;
        btn.textContent = "Menguji...";
        btn.disabled = true;
        // Save current form first so test uses live values
        saveAiSettings(collectAiSettingsFromForm());
        testAiConnectionMock().then(result => {
          btn.textContent = original;
          btn.disabled = false;
          if (result.ok) toast("Test connection berhasil mock.", "success");
          else toast(result.message || "Test connection gagal mock.", "error");
          renderAiSettingsForm();
          renderAiStatusCard();
          if (typeof updateAIContext === "function") updateAIContext();
        });
      }

      // Use Mock AI shortcut from AI Tutor warning card
      if (e.target.closest('[data-action="use-mock-ai"]')) {
        // Just acknowledge — the chat already uses mock responses
        toast("Pakai Mock AI lokal.", "info");
        const card = e.target.closest(".ai-status-card");
        if (card) {
          card.classList.remove("ai-status-card--warning");
          card.classList.add("ai-status-card--mock");
          const t = card.querySelector(".ai-status-card__title"); if (t) t.textContent = "Mock AI";
          const x = card.querySelector(".ai-status-card__text"); if (x) x.textContent = "Pakai jawaban contoh lokal.";
        }
      }

      // Refresh models
      if (e.target.id === "refreshModelsBtn" || e.target.closest("#refreshModelsBtn")) {
        mockRefreshModels();
      }

      // AI enabled toggle
      if (e.target.matches && e.target.matches(".switch input")) {
        const settingLabel = e.target.closest(".setting")?.querySelector(".setting__label > div")?.textContent?.trim();
        if (settingLabel === "AI enabled") {
          const enabled = e.target.checked;
          const aiEmpty = $("#aiEmpty");
          const chat = $("#chat");
          const prompts = $("#aiPrompts");
          const form = $("#aiForm");
          if (aiEmpty) aiEmpty.hidden = enabled;
          if (chat) chat.hidden = !enabled;
          if (prompts) prompts.hidden = !enabled;
          if (form) form.hidden = !enabled;
          toast(enabled ? "AI Tutor diaktifkan" : "AI Tutor dimatikan", enabled ? "success" : "info");
        }
      }

      // Toggle API key visibility
      if (e.target.id === "toggleKey" || e.target.closest("#toggleKey")) {
        const inp = $("#aiApiKey");
        if (inp) inp.type = inp.type === "password" ? "text" : "password";
      }

      // Empty state Reset Filter is now handled by [data-clear-filter] above.
    });

    /* ---------- Search inputs ---------- */
    const kotobaSearch = $('.screen[data-screen="kotoba"] .search input');
    if (kotobaSearch) {
      kotobaSearch.addEventListener("input", (e) => {
        kotobaQuery = e.target.value;
        renderKotoba();
      });
    }
    const bunpouSearch = $('.screen[data-screen="bunpou"] .search input');
    if (bunpouSearch) {
      bunpouSearch.addEventListener("input", (e) => {
        bunpouQuery = e.target.value;
        renderBunpou();
      });
    }
    const catatanSearch = $("#catatanSearch");
    if (catatanSearch) {
      catatanSearch.addEventListener("input", (e) => {
        catatanQuery = e.target.value;
        renderCatatan();
      });
    }

    /* ---------- JP display mode radios ---------- */
    $$('input[name="jpdisplay"]').forEach(r => {
      r.addEventListener("change", handleJpModeChange);
    });

    /* ---------- AI form submit ---------- */
    const aiForm = $("#aiForm");
    if (aiForm) {
      aiForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = $("#aiInput");
        if (!inp || !inp.value.trim()) return;
        askAI(inp.value);
        inp.value = "";
        // Re-apply placeholder + sample if mode requires it
        const cfg = AI_MODES[aiMode] || AI_MODES.default;
        inp.placeholder = cfg.placeholder;
      });
    }

    // Enter to submit on textarea (Shift+Enter for newline)
    const aiInput = $("#aiInput");
    if (aiInput) {
      aiInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && aiMode !== "bulk-kotoba" && aiMode !== "sentence-analysis") {
          e.preventDefault();
          aiForm?.dispatchEvent(new Event("submit", { cancelable: true }));
        } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          aiForm?.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      });
    }

    /* ---------- ESC closes modal ---------- */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllFilterPanels();
        closeConfirm();
        closeKanjiPopup();
        closeModal();
      }
    });

    /* ---------- Enter on blank quiz input ---------- */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.id === "blankInput") {
        e.preventDefault();
        checkBlankAnswer();
      }
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
