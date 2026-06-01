import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { OwnerGuard } from "../common/auth/owner.guard";
import { AdminService } from "./admin.service";
import { AdminRowsQueryDto, AdminUpdateRowDto, AdminImportDto } from "./dto";

/**
 * Admin / database viewer — OWNER ONLY.
 *
 * JwtAuthGuard mengisi req.user; OwnerGuard menolak non-owner (403).
 * Semua akses DB lewat AdminService (Prisma per-model, kolom rahasia
 * disensor server-side).
 */
@Controller("api/admin")
@UseGuards(JwtAuthGuard, OwnerGuard)
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  /** Daftar tabel + jumlah baris. */
  @Get("tables")
  listTables() {
    return this.svc.listTables();
  }

  /** Baca baris satu tabel (paginated). */
  @Get("tables/:table/rows")
  getRows(@Param("table") table: string, @Query() q: AdminRowsQueryDto) {
    return this.svc.getRows(table, q.page ?? 1, q.limit ?? 25);
  }

  /** Update satu baris. */
  @Put("tables/:table/rows/:id")
  updateRow(
    @Param("table") table: string,
    @Param("id") id: string,
    @Body() dto: AdminUpdateRowDto,
  ) {
    return this.svc.updateRow(table, id, dto.data);
  }

  /** Hapus satu baris. */
  @Delete("tables/:table/rows/:id")
  deleteRow(@Param("table") table: string, @Param("id") id: string) {
    return this.svc.deleteRow(table, id);
  }

  /**
   * FULL DATABASE EXPORT — owner only. Menyertakan semua tabel & user
   * (termasuk secret terenkripsi) untuk migrasi server. File SANGAT sensitif.
   */
  @Get("export")
  async exportAll() {
    const dump = await this.svc.exportAll();
    return { ...dump, meta: { ...dump.meta, exportedAt: new Date().toISOString() } };
  }

  /** FULL DATABASE IMPORT — owner only. Upsert per baris (merge). */
  @Post("import")
  importAll(@Body() dto: AdminImportDto) {
    return this.svc.importAll({ data: dto.data });
  }
}
