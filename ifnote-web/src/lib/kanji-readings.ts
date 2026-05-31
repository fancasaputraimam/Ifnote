/**
 * Per-kanji furigana splitter.
 *
 * Tujuan: ubah furigana yang tadinya **per-kotoba** (satu `<ruby>` di atas
 * seluruh rangkaian kanji, mis. 勉強 → べんきょう) menjadi **per-kanji**
 * (mis. 勉(べん) 強(きょう)).
 *
 * Caranya: kita punya kamus pembacaan per-kanji (on'yomi + kun'yomi dalam
 * hiragana). Untuk sebuah RUN kanji + reading gabungannya, kita coba
 * memecah reading itu menjadi potongan per-kanji dengan pencocokan
 * rekursif yang toleran terhadap perubahan bunyi:
 *
 *   - Rendaku (連濁)   : konsonan awal kanji ke-2+ bisa bersuara
 *                        (か→が, は→ば/ぱ, さ→ざ, た→だ, ...).
 *   - Sokuon (促音)    : kana akhir く/き/つ/ち jadi っ kalau diikuti kanji
 *                        lain (gemination), mis. 学(がく)+校 → がっこう.
 *
 * SAFETY: kalau reading tidak bisa dipecah penuh (kanji tak dikenal,
 * pembacaan tidak biasa, dll), fungsi mengembalikan segmen tunggal
 * (run utuh + reading) — persis perilaku lama. Jadi entri kamus yang
 * salah/hilang hanya berarti "tidak dipecah", BUKAN furigana salah.
 */

import type { RubySegment } from "./japanese-text";

/* ------------------------------------------------------------------ */
/* Kana helpers                                                        */
/* ------------------------------------------------------------------ */

/** Katakana → hiragana (1:1, panjang string tetap). */
function toHiragana(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCharCode(code - 0x60);
    } else {
      out += ch;
    }
  }
  return out;
}

const KANJI_ONLY_RE = /^[\u4E00-\u9FFF\u3400-\u4DBF]+$/;

function isAllKanji(s: string): boolean {
  return KANJI_ONLY_RE.test(s);
}

const SMALL_TSU = "\u3063"; // っ

// Rendaku (dakuten) — konsonan awal bersuara.
const RENDAKU: Record<string, string> = {
  "\u304B": "\u304C", // か→が
  "\u304D": "\u304E", // き→ぎ
  "\u304F": "\u3050", // く→ぐ
  "\u3051": "\u3052", // け→げ
  "\u3053": "\u3054", // こ→ご
  "\u3055": "\u3056", // さ→ざ
  "\u3057": "\u3058", // し→じ
  "\u3059": "\u305A", // す→ず
  "\u305B": "\u305C", // せ→ぜ
  "\u305D": "\u305E", // そ→ぞ
  "\u305F": "\u3060", // た→だ
  "\u3061": "\u3062", // ち→ぢ
  "\u3064": "\u3065", // つ→づ
  "\u3066": "\u3067", // て→で
  "\u3068": "\u3069", // と→ど
  "\u306F": "\u3070", // は→ば
  "\u3072": "\u3073", // ひ→び
  "\u3075": "\u3076", // ふ→ぶ
  "\u3078": "\u3079", // へ→べ
  "\u307B": "\u307C", // ほ→ぼ
};

// Handakuten — khusus baris は (は→ぱ, dst).
const HANDAKU: Record<string, string> = {
  "\u306F": "\u3071", // は→ぱ
  "\u3072": "\u3074", // ひ→ぴ
  "\u3075": "\u3077", // ふ→ぷ
  "\u3078": "\u307A", // へ→ぺ
  "\u307B": "\u307D", // ほ→ぽ
};

// Kana akhir yang bisa berubah jadi っ (sokuon) saat diikuti kanji lain.
const GEMINATABLE = new Set(["\u304F", "\u304D", "\u3064", "\u3061"]); // く き つ ち

/**
 * Bangun semua varian reading yang mungkin untuk satu kanji dalam konteks
 * run, dengan toleransi rendaku (kalau bukan kanji pertama) dan sokuon
 * (kalau masih ada kanji setelahnya).
 */
function readingVariants(
  base: string,
  allowRendaku: boolean,
  allowGemination: boolean,
): string[] {
  const firsts = new Set<string>([base]);
  if (allowRendaku && base.length > 0) {
    const f = base[0];
    if (RENDAKU[f]) firsts.add(RENDAKU[f] + base.slice(1));
    if (HANDAKU[f]) firsts.add(HANDAKU[f] + base.slice(1));
  }

  const out = new Set<string>();
  for (const v of firsts) {
    out.add(v);
    if (allowGemination && v.length > 0) {
      const last = v[v.length - 1];
      if (GEMINATABLE.has(last)) {
        out.add(v.slice(0, -1) + SMALL_TSU);
      }
    }
  }
  return [...out];
}

/* ------------------------------------------------------------------ */
/* Kamus pembacaan kanji (hiragana)                                    */
/* ------------------------------------------------------------------ */

/**
 * Map kanji → daftar pembacaan (hiragana). On'yomi + kun'yomi (stem tanpa
 * okurigana). Fokus pada kanji umum N5–N3 yang sering muncul di konten
 * belajar. Daftar tidak perlu lengkap: kanji yang tidak ada di sini hanya
 * membuat run-nya tidak dipecah (tetap aman, lihat header file).
 */
export const KANJI_READINGS: Record<string, string[]> = {
  // --- angka & dasar ---
  "\u4E00": ["\u3044\u3061", "\u3044\u3063", "\u3072\u3068"], // 一
  "\u4E8C": ["\u306B", "\u3075\u305F"], // 二
  "\u4E09": ["\u3055\u3093", "\u307F"], // 三
  "\u56DB": ["\u3057", "\u3088"], // 四
  "\u4E94": ["\u3054", "\u3044\u3064"], // 五
  "\u516D": ["\u308D\u304F", "\u3080"], // 六
  "\u4E03": ["\u3057\u3061", "\u306A\u306A"], // 七
  "\u516B": ["\u306F\u3061", "\u3084"], // 八
  "\u4E5D": ["\u304D\u3085\u3046", "\u304F", "\u3053\u3053\u306E"], // 九
  "\u5341": ["\u3058\u3085\u3046", "\u3068\u304A"], // 十
  "\u767E": ["\u3072\u3083\u304F"], // 百
  "\u5343": ["\u305B\u3093", "\u3061"], // 千
  "\u4E07": ["\u307E\u3093", "\u3070\u3093"], // 万
  "\u5186": ["\u3048\u3093", "\u307E\u308B"], // 円

  // --- waktu & kalender ---
  "\u65E5": ["\u306B\u3061", "\u3058\u3064", "\u3072", "\u3073", "\u304B"], // 日
  "\u6708": ["\u3052\u3064", "\u304C\u3064", "\u3064\u304D"], // 月
  "\u706B": ["\u304B", "\u3072"], // 火
  "\u6C34": ["\u3059\u3044", "\u307F\u305A"], // 水
  "\u6728": ["\u3082\u304F", "\u304D", "\u3053"], // 木
  "\u91D1": ["\u304D\u3093", "\u3053\u3093", "\u304B\u306D"], // 金
  "\u571F": ["\u3069", "\u3068", "\u3064\u3061"], // 土
  "\u66DC": ["\u3088\u3046"], // 曜
  "\u5E74": ["\u306D\u3093", "\u3068\u3057"], // 年
  "\u6642": ["\u3058", "\u3068\u304D"], // 時
  "\u9593": ["\u304B\u3093", "\u3051\u3093", "\u3042\u3044\u3060", "\u307E"], // 間
  "\u5206": ["\u3075\u3093", "\u3076\u3093", "\u308F", "\u3077\u3093"], // 分
  "\u534A": ["\u306F\u3093", "\u306A\u304B"], // 半
  "\u4ECA": ["\u3053\u3093", "\u3044\u307E", "\u304D\u3093"], // 今
  "\u5148": ["\u305B\u3093", "\u3055\u304D"], // 先
  "\u6BCE": ["\u307E\u3044"], // 毎
  "\u9031": ["\u3057\u3085\u3046"], // 週
  "\u672B": ["\u307E\u3064", "\u3070\u3064", "\u3059\u3048"], // 末
  "\u671D": ["\u3061\u3087\u3046", "\u3042\u3055"], // 朝
  "\u663C": ["\u3061\u3085\u3046", "\u3072\u308B"], // 昼
  "\u591C": ["\u3084", "\u3088\u308B", "\u3088"], // 夜
  "\u665A": ["\u3070\u3093", "\u304F\u308C"], // 晩
  "\u5348": ["\u3054"], // 午

  // --- arah & posisi ---
  "\u4E0A": ["\u3058\u3087\u3046", "\u3057\u3087\u3046", "\u3046\u3048", "\u3042", "\u306E\u307C", "\u304B\u307F"], // 上
  "\u4E0B": ["\u304B", "\u3052", "\u3057\u305F", "\u3055", "\u304F\u3060", "\u304A", "\u3057\u3082", "\u3082\u3068"], // 下
  "\u4E2D": ["\u3061\u3085\u3046", "\u306A\u304B", "\u3058\u3085\u3046"], // 中
  "\u5916": ["\u304C\u3044", "\u3052", "\u305D\u3068", "\u307B\u304B", "\u306F\u305A"], // 外
  "\u524D": ["\u305C\u3093", "\u307E\u3048"], // 前
  "\u5F8C": ["\u3054", "\u3053\u3046", "\u3042\u3068", "\u3046\u3057", "\u306E\u3061"], // 後
  "\u5DE6": ["\u3055", "\u3072\u3060\u308A"], // 左
  "\u53F3": ["\u3046", "\u3086\u3046", "\u307F\u304E"], // 右
  "\u6771": ["\u3068\u3046", "\u3072\u304C\u3057"], // 東
  "\u897F": ["\u305B\u3044", "\u3055\u3044", "\u306B\u3057"], // 西
  "\u5357": ["\u306A\u3093", "\u307F\u306A\u307F"], // 南
  "\u5317": ["\u307B\u304F", "\u304D\u305F"], // 北
  "\u5185": ["\u306A\u3044", "\u3046\u3061"], // 内

  // --- orang & keluarga ---
  "\u4EBA": ["\u3058\u3093", "\u306B\u3093", "\u3072\u3068"], // 人
  "\u79C1": ["\u308F\u305F\u3057", "\u3057"], // 私
  "\u7537": ["\u3060\u3093", "\u306A\u3093", "\u304A\u3068\u3053"], // 男
  "\u5973": ["\u3058\u3087", "\u306B\u3087", "\u304A\u3093\u306A", "\u3081"], // 女
  "\u5B50": ["\u3057", "\u3059", "\u3053"], // 子
  "\u7236": ["\u3075", "\u3061\u3061", "\u3068\u3046"], // 父
  "\u6BCD": ["\u307C", "\u306F\u306F", "\u304B\u3042"], // 母
  "\u53CB": ["\u3086\u3046", "\u3068\u3082"], // 友
  "\u540D": ["\u3081\u3044", "\u307F\u3087\u3046", "\u306A"], // 名
  "\u8005": ["\u3057\u3083", "\u3082\u306E"], // 者
  "\u54E1": ["\u3044\u3093"], // 員

  // --- belajar & sekolah ---
  "\u5B66": ["\u304C\u304F", "\u307E\u306A"], // 学
  "\u6821": ["\u3053\u3046"], // 校
  "\u751F": ["\u305B\u3044", "\u3057\u3087\u3046", "\u3044", "\u3046", "\u306F", "\u306A\u307E", "\u304D"], // 生
  "\u6559": ["\u304D\u3087\u3046", "\u304A\u3057", "\u304A\u305D"], // 教
  "\u5BA4": ["\u3057\u3064", "\u3080\u308D"], // 室
  "\u52C9": ["\u3079\u3093"], // 勉
  "\u5F37": ["\u304D\u3087\u3046", "\u3054\u3046", "\u3064\u3088", "\u3057"], // 強
  "\u5F31": ["\u3058\u3083\u304F", "\u3088\u308F"], // 弱
  "\u7FD2": ["\u3057\u3085\u3046", "\u306A\u3089"], // 習
  "\u7DF4": ["\u308C\u3093", "\u306D"], // 練
  "\u8A66": ["\u3057", "\u3053\u3053\u308D", "\u305F\u3081"], // 試
  "\u9A13": ["\u3051\u3093", "\u3052\u3093"], // 験
  "\u554F": ["\u3082\u3093", "\u3068", "\u3068\u3044"], // 問
  "\u984C": ["\u3060\u3044"], // 題
  "\u7B54": ["\u3068\u3046", "\u3053\u305F"], // 答
  "\u5FA9": ["\u3075\u304F", "\u3075\u3046"], // 復
  "\u8AAD": ["\u3069\u304F", "\u3068\u304F", "\u3088"], // 読
  "\u66F8": ["\u3057\u3087", "\u304B"], // 書
  "\u8A9E": ["\u3054", "\u304B\u305F"], // 語
  "\u82F1": ["\u3048\u3044"], // 英
  "\u8A71": ["\u308F", "\u306F\u306A", "\u306F\u306A\u3057"], // 話
  "\u6587": ["\u3076\u3093", "\u3082\u3093", "\u3075\u307F"], // 文
  "\u5B57": ["\u3058", "\u3042\u3056"], // 字
  "\u7D19": ["\u3057", "\u304B\u307F"], // 紙
  "\u672C": ["\u307B\u3093", "\u3082\u3068"], // 本
  "\u756A": ["\u3070\u3093"], // 番
  "\u53F7": ["\u3054\u3046"], // 号
  "\u56DE": ["\u304B\u3044", "\u3048", "\u307E\u308F"], // 回
  "\u56F3": ["\u305A", "\u3068", "\u306F\u304B"], // 図

  // --- aktivitas / kata kerja umum ---
  "\u898B": ["\u3051\u3093", "\u307F"], // 見
  "\u805E": ["\u3076\u3093", "\u3082\u3093", "\u304D"], // 聞
  "\u8A00": ["\u3052\u3093", "\u3054\u3093", "\u3044", "\u3053\u3068"], // 言
  "\u98DF": ["\u3057\u3087\u304F", "\u3058\u304D", "\u305F", "\u304F", "\u306F"], // 食
  "\u98F2": ["\u3044\u3093", "\u306E"], // 飲
  "\u884C": ["\u3053\u3046", "\u304E\u3087\u3046", "\u3042\u3093", "\u3044", "\u3086", "\u304A\u3053\u306A"], // 行
  "\u6765": ["\u3089\u3044", "\u304F", "\u304D", "\u3053"], // 来
  "\u5E30": ["\u304D", "\u304B\u3048"], // 帰
  "\u51FA": ["\u3057\u3085\u3064", "\u3059\u3044", "\u3067", "\u3060"], // 出
  "\u5165": ["\u306B\u3085\u3046", "\u3044", "\u306F\u3044"], // 入
  "\u7ACB": ["\u308A\u3064", "\u308A\u3085\u3046", "\u305F"], // 立
  "\u4F11": ["\u304D\u3085\u3046", "\u3084\u3059"], // 休
  "\u8CB7": ["\u3070\u3044", "\u304B"], // 買
  "\u58F2": ["\u3070\u3044", "\u3046"], // 売
  "\u6301": ["\u3058", "\u3082"], // 持
  "\u5F85": ["\u305F\u3044", "\u307E"], // 待
  "\u601D": ["\u3057", "\u304A\u3082"], // 思
  "\u8003": ["\u3053\u3046", "\u304B\u3093\u304C"], // 考
  "\u77E5": ["\u3061", "\u3057"], // 知
  "\u4F5C": ["\u3055\u304F", "\u3055", "\u3064\u304F"], // 作
  "\u4F7F": ["\u3057", "\u3064\u304B"], // 使
  "\u59CB": ["\u3057", "\u306F\u3058"], // 始
  "\u7D42": ["\u3057\u3085\u3046", "\u304A"], // 終
  "\u6B69": ["\u307B", "\u3076", "\u3075", "\u3042\u308B", "\u3042\u3086"], // 歩
  "\u8D70": ["\u305D\u3046", "\u306F\u3057"], // 走
  "\u6CF3": ["\u3048\u3044", "\u304A\u3088"], // 泳
  "\u904B": ["\u3046\u3093", "\u306F\u3053"], // 運
  "\u52D5": ["\u3069\u3046", "\u3046\u3054"], // 動
  "\u6B62": ["\u3057", "\u3068", "\u3084"], // 止
  "\u958B": ["\u304B\u3044", "\u3042", "\u3072\u3089"], // 開
  "\u9589": ["\u3078\u3044", "\u3057", "\u3068"], // 閉
  "\u5207": ["\u305B\u3064", "\u3055\u3044", "\u304D"], // 切
  "\u8CB8": ["\u305F\u3044", "\u304B"], // 貸
  "\u501F": ["\u3057\u3083\u304F", "\u304B"], // 借
  "\u8FD4": ["\u3078\u3093", "\u304B\u3048"], // 返
  "\u9001": ["\u305D\u3046", "\u304A\u304F"], // 送
  "\u53D7": ["\u3058\u3085", "\u3046"], // 受
  "\u53D6": ["\u3057\u3085", "\u3068"], // 取
  "\u5750": ["\u3056", "\u3059\u308F"], // 座
  "\u5BDD": ["\u3057\u3093", "\u306D"], // 寝
  "\u8D77": ["\u304D", "\u304A"], // 起
  "\u7740": ["\u3061\u3083\u304F", "\u3058\u3083\u304F", "\u304D", "\u3064"], // 着
  "\u4F4F": ["\u3058\u3085\u3046", "\u3059"], // 住
  "\u5EFA": ["\u3051\u3093", "\u305F"], // 建
  "\u6D17": ["\u305B\u3093", "\u3042\u3089"], // 洗
  "\u50CD": ["\u3069\u3046", "\u306F\u305F\u3089"], // 働
  "\u4ED5": ["\u3057", "\u3064\u304B"], // 仕
  "\u4E8B": ["\u3058", "\u305A", "\u3053\u3068"], // 事
  "\u696D": ["\u304E\u3087\u3046", "\u3054\u3046", "\u308F\u3056"], // 業

  // --- tempat & benda ---
  "\u5BB6": ["\u304B", "\u3051", "\u3044\u3048", "\u3084"], // 家
  "\u5C4B": ["\u304A\u304F", "\u3084"], // 屋
  "\u90E8": ["\u3076", "\u3078"], // 部
  "\u9928": ["\u304B\u3093", "\u3084\u304B\u305F"], // 館
  "\u5E97": ["\u3066\u3093", "\u307F\u305B"], // 店
  "\u793E": ["\u3057\u3083", "\u3084\u3057\u308D"], // 社
  "\u4F1A": ["\u304B\u3044", "\u3048", "\u3042"], // 会
  "\u56FD": ["\u3053\u304F", "\u304F\u306B"], // 国
  "\u9A45": ["\u3048\u304D"], // 駅 (簡体? use 駅 U+99C5)
  "\u99C5": ["\u3048\u304D"], // 駅
  "\u8ECA": ["\u3057\u3083", "\u304F\u308B\u307E"], // 車
  "\u96FB": ["\u3067\u3093"], // 電
  "\u9053": ["\u3069\u3046", "\u3068\u3046", "\u307F\u3061"], // 道
  "\u753A": ["\u3061\u3087\u3046", "\u307E\u3061"], // 町
  "\u6751": ["\u305D\u3093", "\u3080\u3089"], // 村
  "\u5E97\u8217": [], // placeholder (unused)
  "\u75C5": ["\u3073\u3087\u3046", "\u3078\u3044", "\u3084"], // 病
  "\u9662": ["\u3044\u3093"], // 院
  "\u533B": ["\u3044"], // 医
  "\u9280": ["\u304E\u3093"], // 銀
  "\u516C": ["\u3053\u3046", "\u304A\u304A\u3084\u3051"], // 公
  "\u5712": ["\u3048\u3093", "\u305D\u306E"], // 園
  "\u5BFF": ["\u3058\u3085", "\u3059", "\u3053\u3068\u3076\u304D"], // 寿
  "\u53F8": ["\u3057", "\u3064\u304B\u3055"], // 司

  // --- alam ---
  "\u5C71": ["\u3055\u3093", "\u3084\u307E"], // 山
  "\u5DDD": ["\u305B\u3093", "\u304B\u308F"], // 川
  "\u7530": ["\u3067\u3093", "\u305F"], // 田
  "\u82B1": ["\u304B", "\u306F\u306A"], // 花
  "\u9B5A": ["\u304E\u3087", "\u3046\u304A", "\u3055\u304B\u306A"], // 魚
  "\u72AC": ["\u3051\u3093", "\u3044\u306C"], // 犬
  "\u732B": ["\u3073\u3087\u3046", "\u306D\u3053"], // 猫
  "\u9CE5": ["\u3061\u3087\u3046", "\u3068\u308A"], // 鳥
  "\u725B": ["\u304E\u3085\u3046", "\u3046\u3057"], // 牛
  "\u7A7A": ["\u304F\u3046", "\u305D\u3089", "\u3042", "\u304B\u3089"], // 空
  "\u96E8": ["\u3046", "\u3042\u3081", "\u3042\u307E"], // 雨
  "\u5929": ["\u3066\u3093", "\u3042\u307E", "\u3042\u3081"], // 天
  "\u6C17": ["\u304D", "\u3051"], // 気

  // --- makanan ---
  "\u8336": ["\u3061\u3083", "\u3055"], // 茶
  "\u9152": ["\u3057\u3085", "\u3055\u3051", "\u3055\u304B"], // 酒
  "\u98EF": ["\u306F\u3093", "\u3081\u3057"], // 飯
  "\u8089": ["\u306B\u304F"], // 肉
  "\u7C73": ["\u3079\u3044", "\u307E\u3044", "\u3053\u3081"], // 米
  "\u9B5A\u8089": [], // placeholder
  "\u54C1": ["\u3072\u3093", "\u3057\u306A"], // 品
  "\u7269": ["\u3076\u3064", "\u3082\u3064", "\u3082\u306E"], // 物
  "\u624B": ["\u3057\u3085", "\u3066", "\u305F"], // 手
  "\u8DB3": ["\u305D\u304F", "\u3042\u3057", "\u305F"], // 足
  "\u76EE": ["\u3082\u304F", "\u3081", "\u307E"], // 目
  "\u8033": ["\u3058", "\u307F\u307F"], // 耳
  "\u53E3": ["\u3053\u3046", "\u304F", "\u304F\u3061"], // 口
  "\u529B": ["\u308A\u3087\u304F", "\u308A\u304D", "\u3061\u304B\u3089"], // 力

  // --- sifat & warna ---
  "\u9AD8": ["\u3053\u3046", "\u305F\u304B"], // 高
  "\u5B89": ["\u3042\u3093", "\u3084\u3059"], // 安
  "\u65B0": ["\u3057\u3093", "\u3042\u305F\u3089", "\u3042\u3089", "\u306B\u3044"], // 新
  "\u53E4": ["\u3053", "\u3075\u308B"], // 古
  "\u9577": ["\u3061\u3087\u3046", "\u306A\u304C"], // 長
  "\u77ED": ["\u305F\u3093", "\u307F\u3058\u304B"], // 短
  "\u591A": ["\u305F", "\u304A\u304A"], // 多
  "\u5C11": ["\u3057\u3087\u3046", "\u3059\u304F", "\u3059\u3053"], // 少
  "\u65E9": ["\u305D\u3046", "\u306F\u3084"], // 早
  "\u5927": ["\u3060\u3044", "\u305F\u3044", "\u304A\u304A"], // 大
  "\u5C0F": ["\u3057\u3087\u3046", "\u3061\u3044", "\u3053", "\u304A"], // 小
  "\u9577\u3044": [], // placeholder
  "\u8272": ["\u3057\u3087\u304F", "\u3057\u304D", "\u3044\u308D"], // 色
  "\u9752": ["\u305B\u3044", "\u3057\u3087\u3046", "\u3042\u304A"], // 青
  "\u8D64": ["\u305B\u304D", "\u3057\u3083\u304F", "\u3042\u304B"], // 赤
  "\u767D": ["\u306F\u304F", "\u3073\u3083\u304F", "\u3057\u308D", "\u3057\u3089"], // 白
  "\u9ED2": ["\u3053\u304F", "\u304F\u308D"], // 黒
  "\u660E": ["\u3081\u3044", "\u307F\u3087\u3046", "\u3042\u304B", "\u3042", "\u3042\u304D"], // 明
  "\u6697": ["\u3042\u3093", "\u304F\u3089"], // 暗

  // --- lain yang umum di contoh ---
  "\u5FC5": ["\u3072\u3064", "\u304B\u306A\u3089"], // 必
  "\u5F01": ["\u3079\u3093"], // 弁
  "\u5F53": ["\u3068\u3046", "\u3042", "\u3072"], // 当
  "\u65B9": ["\u307B\u3046", "\u304B\u305F"], // 方
  "\u97F3": ["\u304A\u3093", "\u3044\u3093", "\u304A\u3068", "\u306D"], // 音
  "\u697D": ["\u304C\u304F", "\u3089\u304F", "\u305F\u306E"], // 楽
  "\u6620": ["\u3048\u3044", "\u3046\u3064", "\u306F"], // 映
  "\u753B": ["\u304C", "\u304B\u304F"], // 画
  "\u771F": ["\u3057\u3093", "\u307E"], // 真
  "\u5199": ["\u3057\u3083", "\u3046\u3064"], // 写
  "\u9032": ["\u3057\u3093", "\u3059\u3059"], // 進
  "\u4E16": ["\u305B", "\u305B\u3044", "\u3088"], // 世
  "\u754C": ["\u304B\u3044"], // 界
  "\u751F\u6D3B": [], // placeholder
  "\u6D3B": ["\u304B\u3064"], // 活
  "\u751F\u3046": [], // placeholder
  "\u96FB\u8A71": [], // placeholder
  "\u8A18": ["\u304D", "\u3057\u308B"], // 記
  "\u610F": ["\u3044"], // 意
  "\u5473": ["\u307F", "\u3042\u3058"], // 味
  "\u7528": ["\u3088\u3046", "\u3082\u3061"], // 用
  "\u4E8B\u52D9": [], // placeholder
  "\u52D9": ["\u3080", "\u3064\u3068"], // 務
  "\u5236": ["\u305B\u3044"], // 制
  "\u610F\u5473": [], // placeholder
};

// Buang entri placeholder kosong supaya tidak mengganggu pencocokan.
for (const k of Object.keys(KANJI_READINGS)) {
  if (!KANJI_READINGS[k] || KANJI_READINGS[k].length === 0) {
    delete KANJI_READINGS[k];
  }
}

/* ------------------------------------------------------------------ */
/* Matcher                                                             */
/* ------------------------------------------------------------------ */

interface PieceMatch {
  base: string;
  /** Panjang potongan reading (dalam karakter) yang dikonsumsi kanji ini. */
  len: number;
}

/**
 * Pencocokan rekursif: pecah `readingHira` (sudah hiragana) menjadi
 * potongan untuk tiap kanji di `chars`. Mengembalikan daftar panjang
 * potongan, atau null kalau tidak bisa dipecah penuh.
 */
function matchPieces(
  chars: string[],
  readingHira: string,
  index: number,
): PieceMatch[] | null {
  if (chars.length === 0) {
    return readingHira.length === 0 ? [] : null;
  }

  const kanji = chars[0];
  const isFirst = index === 0;
  const hasNext = chars.length > 1;

  const raw = KANJI_READINGS[kanji];
  if (!raw || raw.length === 0) return null;

  // Coba pembacaan terpanjang lebih dulu supaya tidak salah potong di kana
  // pendek yang kebetulan cocok.
  const cands = [...raw].sort((a, b) => b.length - a.length);

  for (const cand of cands) {
    const candHira = toHiragana(cand);
    for (const variant of readingVariants(candHira, !isFirst, hasNext)) {
      const vlen = variant.length;
      if (vlen === 0 || vlen > readingHira.length) continue;
      if (readingHira.slice(0, vlen) !== variant) continue;
      const rest = matchPieces(chars.slice(1), readingHira.slice(vlen), index + 1);
      if (rest) {
        return [{ base: kanji, len: vlen }, ...rest];
      }
    }
  }
  return null;
}

/**
 * Pecah satu RUN kanji + reading gabungannya menjadi segmen per-kanji.
 * Kalau tidak bisa dipecah penuh, kembalikan satu segmen utuh (perilaku
 * lama, tetap benar).
 */
export function splitKanjiRunReading(
  run: string,
  reading: string,
): RubySegment[] {
  const chars = Array.from(run);
  if (chars.length < 2 || !reading) {
    return [{ base: run, reading: reading || undefined }];
  }
  if (!isAllKanji(run)) {
    return [{ base: run, reading }];
  }

  const readingHira = toHiragana(reading);
  const pieces = matchPieces(chars, readingHira, 0);
  if (!pieces || pieces.length !== chars.length) {
    return [{ base: run, reading }];
  }

  // Petakan panjang potongan kembali ke substring reading ASLI (bukan hira)
  // supaya kana asli (mis. katakana, walau jarang di reading) tetap utuh.
  const out: RubySegment[] = [];
  let pos = 0;
  for (const p of pieces) {
    const slice = reading.slice(pos, pos + p.len);
    out.push({ base: p.base, reading: slice });
    pos += p.len;
  }
  return out;
}

/**
 * Pecah semua segmen di array supaya furigana jadi per-kanji. Segmen yang
 * base-nya bukan kanji murni (mis. ada okurigana) atau tidak punya reading
 * dibiarkan apa adanya.
 */
export function expandSegmentsPerKanji(segments: RubySegment[]): RubySegment[] {
  const out: RubySegment[] = [];
  for (const seg of segments) {
    if (
      seg.reading &&
      isAllKanji(seg.base) &&
      Array.from(seg.base).length >= 2
    ) {
      out.push(...splitKanjiRunReading(seg.base, seg.reading));
    } else {
      out.push(seg);
    }
  }
  return out;
}
