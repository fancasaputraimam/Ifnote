/**
 * ifNote — Prisma seed
 *
 * IMPORTANT: This script does NOT create fake / mock users.
 *
 * It only seeds default Japanese learning content (real N5 vocabulary
 * and grammar patterns) into a REAL user account that already exists
 * in the database.
 *
 * The user must register through the auth flow first. After that:
 *
 *   - set SEED_USER_EMAIL=user@example.com in .env, OR
 *   - run: npx ts-node prisma/seed.ts user@example.com
 *
 * The seed is idempotent: it skips items that already exist for that
 * user (matched by `jp` for Kotoba and by `pattern` for Bunpou).
 *
 * After inserting notes, it appends them to that user's HafalanOrder
 * starting at MAX(orderIndex) + 1 — never rebalancing or reordering
 * existing entries.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface KotobaSeed {
  jp: string;
  romaji: string;
  meaning: string;
  type: string;
  level: string;
  tags: string[];
  beginnerExample: string;
  normalExample: string;
  furiganaExample: string;
  exampleMeaning: string;
}

interface BunpouSeed {
  pattern: string;
  meaning: string;
  formula: string;
  usage: string;
  level: string;
  tags: string[];
  beginnerExample: string;
  normalExample: string;
  furiganaExample: string;
  exampleMeaning: string;
  note: string;
  commonMistake: string;
}

const KOTOBA_DEFAULTS: KotobaSeed[] = [
  {
    jp: "たべます",
    romaji: "tabemasu",
    meaning: "makan",
    type: "kata kerja",
    level: "N5",
    tags: ["makanan", "verb-1"],
    beginnerExample: "ごはんを たべます。",
    normalExample: "ごはんを食べます。",
    furiganaExample: "ごはんを 食(た)べます。",
    exampleMeaning: "Saya makan nasi.",
  },
  {
    jp: "のみます",
    romaji: "nomimasu",
    meaning: "minum",
    type: "kata kerja",
    level: "N5",
    tags: ["minuman", "verb-1"],
    beginnerExample: "おちゃを のみます。",
    normalExample: "お茶を飲みます。",
    furiganaExample: "お茶(おちゃ)を 飲(の)みます。",
    exampleMeaning: "Saya minum teh.",
  },
  {
    jp: "いきます",
    romaji: "ikimasu",
    meaning: "pergi",
    type: "kata kerja",
    level: "N5",
    tags: ["aktivitas", "verb-1"],
    beginnerExample: "がっこうに いきます。",
    normalExample: "学校に行きます。",
    furiganaExample: "学校(がっこう)に 行(い)きます。",
    exampleMeaning: "Saya pergi ke sekolah.",
  },
  {
    jp: "きれい",
    romaji: "kirei",
    meaning: "cantik / bersih",
    type: "sifat-na",
    level: "N5",
    tags: ["sifat"],
    beginnerExample: "へやが きれいです。",
    normalExample: "部屋がきれいです。",
    furiganaExample: "部屋(へや)が きれいです。",
    exampleMeaning: "Kamarnya bersih.",
  },
  {
    jp: "たかい",
    romaji: "takai",
    meaning: "tinggi / mahal",
    type: "sifat-i",
    level: "N5",
    tags: ["sifat"],
    beginnerExample: "やまが たかいです。",
    normalExample: "山が高いです。",
    furiganaExample: "山(やま)が 高(たか)いです。",
    exampleMeaning: "Gunungnya tinggi.",
  },
  {
    jp: "ゆっくり",
    romaji: "yukkuri",
    meaning: "pelan-pelan",
    type: "kata keterangan",
    level: "N4",
    tags: ["keterangan"],
    beginnerExample: "ゆっくり はなして ください。",
    normalExample: "ゆっくり話してください。",
    furiganaExample: "ゆっくり 話(はな)して ください。",
    exampleMeaning: "Tolong bicara pelan-pelan.",
  },
];

const BUNPOU_DEFAULTS: BunpouSeed[] = [
  {
    pattern: "〜ながら",
    meaning: "sambil",
    formula: "Vます tanpa ます + ながら",
    usage: "Dua kegiatan dilakukan bersamaan oleh subjek yang sama.",
    level: "N4",
    tags: ["grammar"],
    beginnerExample: "おんがくを ききながら、べんきょうします。",
    normalExample: "音楽を聞きながら、勉強します。",
    furiganaExample: "音楽(おんがく)を 聞(き)きながら、勉強(べんきょう)します。",
    exampleMeaning: "Saya belajar sambil mendengarkan musik.",
    note: "Kegiatan utama selalu di belakang kalimat.",
    commonMistake: "Tidak dipakai untuk dua kegiatan yang tidak bisa serempak.",
  },
  {
    pattern: "〜たい",
    meaning: "ingin",
    formula: "Vます tanpa ます + たい",
    usage: "Mengungkapkan keinginan diri sendiri.",
    level: "N5",
    tags: ["grammar"],
    beginnerExample: "すしを たべたいです。",
    normalExample: "寿司を食べたいです。",
    furiganaExample: "寿司(すし)を 食(た)べたいです。",
    exampleMeaning: "Saya ingin makan sushi.",
    note: "Untuk keinginan orang lain biasanya pakai 〜たがる.",
    commonMistake: "Jangan tambah です di tengah kalimat.",
  },
  {
    pattern: "〜に / 〜で",
    meaning: "partikel tujuan / tempat",
    formula: "Tempat + に (tujuan) / Tempat + で (lokasi aksi)",
    usage: "Membedakan tujuan vs lokasi terjadinya aksi.",
    level: "N5",
    tags: ["partikel"],
    beginnerExample: "がっこうに いきます。 / がっこうで べんきょうします。",
    normalExample: "学校に行きます。 / 学校で勉強します。",
    furiganaExample: "学校(がっこう)に 行(い)きます。 / 学校(がっこう)で 勉強(べんきょう)します。",
    exampleMeaning: "Pergi ke sekolah / Belajar di sekolah.",
    note: "に untuk tujuan / arah, で untuk tempat melakukan aktivitas.",
    commonMistake: "Sering tertukar saat verb-nya bukan kata kerja gerakan.",
  },
  {
    pattern: "〜てから",
    meaning: "setelah",
    formula: "Vて + から",
    usage: "Mengurutkan dua kegiatan: A dulu, baru B.",
    level: "N4",
    tags: ["grammar"],
    beginnerExample: "ごはんを たべてから、テレビを みます。",
    normalExample: "ごはんを食べてから、テレビを見ます。",
    furiganaExample: "ごはんを 食(た)べてから、テレビを 見(み)ます。",
    exampleMeaning: "Setelah makan, saya menonton TV.",
    note: "Berbeda dengan 〜あとで yang lebih netral pada urutan.",
    commonMistake: "Sering dipakai bareng setelah aksi tunggal padahal bukan kelanjutan.",
  },
];

function resolveSeedEmail(): string {
  const fromArg = process.argv[2];
  if (fromArg && fromArg.includes("@")) return fromArg.trim();
  const fromEnv = process.env.SEED_USER_EMAIL;
  if (fromEnv && fromEnv.includes("@")) return fromEnv.trim();
  throw new Error(
    [
      "",
      "SEED_USER_EMAIL is not set.",
      "",
      "This seed script does NOT create fake users.",
      "It only seeds Japanese content into a REAL user account.",
      "",
      "Usage:",
      "  1. Register a real user through the API auth flow first.",
      "  2. Then run one of:",
      "       SEED_USER_EMAIL=user@example.com npx prisma db seed",
      "       npx ts-node prisma/seed.ts user@example.com",
      "",
    ].join("\n"),
  );
}

async function main() {
  const email = resolveSeedEmail();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(
      `User with email "${email}" not found. Register through the auth API first; the seed never creates users.`,
    );
  }
  console.log(`✓ Seeding content for real user: ${email} (${user.id})`);

  // ---------- Kotoba (skip if already exists by jp) ----------
  let kotobaInserted = 0;
  const insertedKotoba: { id: string }[] = [];
  for (const k of KOTOBA_DEFAULTS) {
    const exists = await prisma.kotoba.findFirst({
      where: { userId: user.id, jp: k.jp },
      select: { id: true },
    });
    if (exists) continue;
    const created = await prisma.kotoba.create({
      data: {
        userId: user.id,
        jp: k.jp,
        romaji: k.romaji,
        meaning: k.meaning,
        type: k.type,
        level: k.level,
        tags: k.tags,
        beginnerExample: k.beginnerExample,
        normalExample: k.normalExample,
        furiganaExample: k.furiganaExample,
        exampleMeaning: k.exampleMeaning,
        mastery: "mid",
      },
      select: { id: true },
    });
    insertedKotoba.push(created);
    kotobaInserted++;
  }

  // ---------- Bunpou (skip if already exists by pattern) ----------
  let bunpouInserted = 0;
  const insertedBunpou: { id: string }[] = [];
  for (const b of BUNPOU_DEFAULTS) {
    const exists = await prisma.bunpou.findFirst({
      where: { userId: user.id, pattern: b.pattern },
      select: { id: true },
    });
    if (exists) continue;
    const created = await prisma.bunpou.create({
      data: {
        userId: user.id,
        pattern: b.pattern,
        meaning: b.meaning,
        formula: b.formula,
        usage: b.usage,
        level: b.level,
        tags: b.tags,
        beginnerExample: b.beginnerExample,
        normalExample: b.normalExample,
        furiganaExample: b.furiganaExample,
        exampleMeaning: b.exampleMeaning,
        note: b.note,
        commonMistake: b.commonMistake,
        mastery: "mid",
      },
      select: { id: true },
    });
    insertedBunpou.push(created);
    bunpouInserted++;
  }

  // ---------- HafalanOrder: append-only, never rebalance ----------
  // Resolve current MAX(orderIndex) for this user, then append.
  const last = await prisma.hafalanOrder.aggregate({
    where: { userId: user.id },
    _max: { orderIndex: true },
  });
  let nextIndex = (last._max.orderIndex ?? 0) + 1;

  let orderInserted = 0;
  for (const k of insertedKotoba) {
    // unique guard via composite (userId + itemType + itemId)
    const dup = await prisma.hafalanOrder.findUnique({
      where: { uniq_user_item: { userId: user.id, itemType: "kotoba", itemId: k.id } },
      select: { id: true },
    });
    if (dup) continue;
    await prisma.hafalanOrder.create({
      data: {
        userId: user.id,
        itemType: "kotoba",
        itemId: k.id,
        orderIndex: nextIndex,
      },
    });
    nextIndex++;
    orderInserted++;
  }
  for (const b of insertedBunpou) {
    const dup = await prisma.hafalanOrder.findUnique({
      where: { uniq_user_item: { userId: user.id, itemType: "bunpou", itemId: b.id } },
      select: { id: true },
    });
    if (dup) continue;
    await prisma.hafalanOrder.create({
      data: {
        userId: user.id,
        itemType: "bunpou",
        itemId: b.id,
        orderIndex: nextIndex,
      },
    });
    nextIndex++;
    orderInserted++;
  }

  // ---------- UserSettings: ensure exists with defaults ----------
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  // ---------- Profile: ensure exists ----------
  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, dailyTarget: 10 },
    update: {},
  });

  console.log(`✓ Kotoba inserted:        ${kotobaInserted} (skipped ${KOTOBA_DEFAULTS.length - kotobaInserted} duplicates)`);
  console.log(`✓ Bunpou inserted:        ${bunpouInserted} (skipped ${BUNPOU_DEFAULTS.length - bunpouInserted} duplicates)`);
  console.log(`✓ HafalanOrder appended:  ${orderInserted} (next orderIndex = ${nextIndex})`);
  console.log(`✓ UserSettings + Profile: ensured`);
  console.log("");
  console.log("Seed selesai. Untuk verify:");
  console.log("   npx prisma studio");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
