import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Admin / database viewer service (owner-only — guarded di controller).
 *
 * Membaca isi PostgreSQL lewat Prisma per-model (TANPA SQL mentah → tidak
 * ada permukaan injection, dan tabel yang bisa diakses dibatasi registry
 * di bawah).
 *
 * KEAMANAN:
 *  - `secretFields` (mis. passwordHash, aiApiKeyEnc) TIDAK PERNAH dikirim ke
 *    browser. Nilainya disensor jadi penanda, bukan dikirim mentah.
 *  - update/delete menolak menyentuh id / userId / timestamp / secret.
 */

interface TableDef {
  /** Nama tabel PostgreSQL (sesuai @@map) — dipakai di URL + display. */
  name: string;
  /** Properti delegate Prisma (camelCase model). */
  delegate: string;
  label: string;
  /** Kolom rahasia: disensor di read, ditolak di update. */
  secretFields: string[];
}

const TABLES: TableDef[] = [
  { name: "users", delegate: "user", label: "Users", secretFields: ["passwordHash"] },
  { name: "profiles", delegate: "profile", label: "Profiles", secretFields: [] },
  { name: "kotoba", delegate: "kotoba", label: "Kotoba", secretFields: [] },
  { name: "bunpou", delegate: "bunpou", label: "Bunpou", secretFields: [] },
  { name: "hafalan_order", delegate: "hafalanOrder", label: "Hafalan Order", secretFields: [] },
  { name: "quiz_progress", delegate: "quizProgress", label: "Quiz Progress", secretFields: [] },
  { name: "kanji_cache", delegate: "kanjiCache", label: "Kanji Cache", secretFields: [] },
  { name: "user_settings", delegate: "userSettings", label: "User Settings", secretFields: ["aiApiKeyEnc"] },
  { name: "ai_logs", delegate: "aiLog", label: "AI Logs", secretFields: [] },
];

/** Field yang tidak boleh diubah lewat panel (selain secretFields). */
const IMMUTABLE_FIELDS = ["id", "userId", "createdAt", "updatedAt"];

const SECRET_MARKER = "•••••• (disensor)";

type PrismaDelegate = {
  count: (args?: unknown) => Promise<number>;
  findMany: (args?: unknown) => Promise<Record<string, unknown>[]>;
  findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  create: (args: unknown) => Promise<Record<string, unknown>>;
  update: (args: unknown) => Promise<Record<string, unknown>>;
  delete: (args: unknown) => Promise<Record<string, unknown>>;
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private def(table: string): TableDef {
    const def = TABLES.find((t) => t.name === table);
    if (!def) throw new NotFoundException(`Tabel "${table}" tidak dikenal`);
    return def;
  }

  private delegate(def: TableDef): PrismaDelegate {
    const client = this.prisma as unknown as Record<string, PrismaDelegate>;
    return client[def.delegate];
  }

  /** Sensor kolom rahasia sebelum keluar dari server. */
  private redact(rows: Record<string, unknown>[], def: TableDef): Record<string, unknown>[] {
    if (def.secretFields.length === 0) return rows;
    return rows.map((row) => {
      const copy = { ...row };
      for (const f of def.secretFields) {
        if (f in copy && copy[f] != null) copy[f] = SECRET_MARKER;
      }
      return copy;
    });
  }

  /** Daftar tabel + jumlah baris (untuk sidebar admin). */
  async listTables() {
    const tables = await Promise.all(
      TABLES.map(async (t) => ({
        name: t.name,
        label: t.label,
        count: await this.delegate(t).count(),
        hasSecrets: t.secretFields.length > 0,
      })),
    );
    return { tables };
  }

  /** Baca baris satu tabel, paginated. Terbaru dulu (createdAt desc). */
  async getRows(table: string, page = 1, limit = 25) {
    const def = this.def(table);
    const safePage = page > 0 ? page : 1;
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;
    const delegate = this.delegate(def);

    const [total, rows] = await Promise.all([
      delegate.count(),
      delegate.findMany({
        skip,
        take: safeLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      table: def.name,
      label: def.label,
      secretFields: def.secretFields,
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      rows: this.redact(rows, def),
      pagination: { page: safePage, limit: safeLimit, total },
    };
  }

  /** Update satu baris (by id). Menolak field immutable + secret. */
  async updateRow(table: string, id: string, data: Record<string, unknown>) {
    const def = this.def(table);
    const blocked = new Set([...IMMUTABLE_FIELDS, ...def.secretFields]);
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (blocked.has(k)) continue;
      clean[k] = v;
    }
    if (Object.keys(clean).length === 0) {
      throw new BadRequestException("Tidak ada field yang boleh diubah.");
    }
    const delegate = this.delegate(def);
    const updated = await delegate.update({ where: { id }, data: clean });
    return this.redact([updated], def)[0];
  }

  /** Hapus satu baris (by id). Relasi cascade mengikuti schema. */
  async deleteRow(table: string, id: string) {
    const def = this.def(table);
    await this.delegate(def).delete({ where: { id } });
    return { ok: true };
  }

  /**
   * FULL DATABASE EXPORT (owner-only, migrasi server).
   *
   * Berbeda dari backup per-user di SettingsModule: ini menarik SEMUA baris
   * dari SEMUA user, dan SENGAJA menyertakan kolom rahasia (passwordHash,
   * aiApiKeyEnc) APA ADANYA — supaya setelah restore di server baru, user
   * tetap bisa login dan API key tetap berfungsi.
   *
   * ⚠️ File hasil export SANGAT SENSITIF. Hanya owner yang bisa memanggil.
   */
  async exportAll() {
    const data: Record<string, unknown[]> = {};
    for (const t of TABLES) {
      // findMany tanpa select → semua kolom (termasuk secret), apa adanya.
      data[t.name] = await this.delegate(t).findMany();
    }
    return {
      meta: {
        format: "ifnote-full-db",
        version: 1,
        // Caller (controller) menstempel waktu; service tidak akses Date
        // global supaya deterministik & mudah dites.
        tables: TABLES.map((t) => t.name),
      },
      data,
    };
  }

  /**
   * FULL DATABASE IMPORT (owner-only). Strategi: MERGE / upsert per baris,
   * preserve id + timestamp asli supaya relasi antar-tabel tetap nyambung.
   *
   * Urutan penting (FK): users dulu (parent), lalu profiles/settings dan
   * tabel anak. Tiap baris di-upsert by id; baris rusak dilewati (tidak
   * membatalkan seluruh import).
   */
  async importAll(payload: { data?: Record<string, unknown[]> }) {
    const data = payload?.data;
    if (!data || typeof data !== "object") {
      throw new BadRequestException("Payload import tidak valid (butuh { data }).");
    }

    // Urutan import: parent → child (hormati foreign key).
    const ORDER = [
      "users",
      "profiles",
      "user_settings",
      "kotoba",
      "bunpou",
      "hafalan_order",
      "quiz_progress",
      "kanji_cache",
      "ai_logs",
    ];

    const counts: Record<string, { ok: number; skipped: number }> = {};

    for (const tableName of ORDER) {
      const def = TABLES.find((t) => t.name === tableName);
      const rows = data[tableName];
      if (!def || !Array.isArray(rows)) continue;

      const delegate = this.delegate(def);
      const c = { ok: 0, skipped: 0 };

      for (const raw of rows) {
        if (!raw || typeof raw !== "object") {
          c.skipped++;
          continue;
        }
        const row = raw as Record<string, unknown>;
        const id = row.id;
        if (typeof id !== "string") {
          c.skipped++;
          continue;
        }
        // Normalisasi tanggal: JSON membawa string ISO, Prisma butuh Date.
        const normalized = this.coerceDates(row);
        try {
          await delegate.update({ where: { id }, data: normalized }).catch(async () => {
            // Belum ada → buat baru (preserve id + timestamp).
            await delegate.create({ data: normalized });
          });
          c.ok++;
        } catch {
          c.skipped++;
        }
      }
      counts[tableName] = c;
    }

    return { ok: true, counts };
  }

  /** Ubah field bertanggal (createdAt/updatedAt) dari string ISO → Date. */
  private coerceDates(row: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = { ...row };
    for (const key of ["createdAt", "updatedAt"]) {
      const v = out[key];
      if (typeof v === "string") {
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) out[key] = d;
      }
    }
    return out;
  }
}
