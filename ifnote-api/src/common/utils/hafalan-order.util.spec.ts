import {
  nextHafalanOrderIndex,
  appendHafalanOrder,
  retryOnUniqueViolation,
} from "./hafalan-order.util";
import type { PrismaService } from "../../prisma/prisma.service";

/** Minimal Prisma mock shaped to what the util touches. */
function makePrismaMock() {
  return {
    hafalanOrder: {
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as PrismaService & {
    hafalanOrder: {
      aggregate: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
}

describe("hafalan-order: nextHafalanOrderIndex", () => {
  it("returns 1 for an empty deck (no max)", async () => {
    const prisma = makePrismaMock();
    prisma.hafalanOrder.aggregate.mockResolvedValue({ _max: { orderIndex: null } });
    await expect(nextHafalanOrderIndex(prisma, "u1")).resolves.toBe(1);
  });

  it("returns max + 1 (append-only, never reuses gaps)", async () => {
    const prisma = makePrismaMock();
    prisma.hafalanOrder.aggregate.mockResolvedValue({ _max: { orderIndex: 42 } });
    await expect(nextHafalanOrderIndex(prisma, "u1")).resolves.toBe(43);
  });
});

describe("hafalan-order: appendHafalanOrder", () => {
  it("is idempotent — does not create a duplicate row", async () => {
    const prisma = makePrismaMock();
    prisma.hafalanOrder.findUnique.mockResolvedValue({ id: "existing" });
    await appendHafalanOrder(prisma, "u1", "kotoba", "k1");
    expect(prisma.hafalanOrder.create).not.toHaveBeenCalled();
  });

  it("appends at max+1 when the item is new", async () => {
    const prisma = makePrismaMock();
    prisma.hafalanOrder.findUnique.mockResolvedValue(null);
    prisma.hafalanOrder.aggregate.mockResolvedValue({ _max: { orderIndex: 5 } });
    prisma.hafalanOrder.create.mockResolvedValue({ id: "new" });

    await appendHafalanOrder(prisma, "u1", "bunpou", "b1");

    expect(prisma.hafalanOrder.create).toHaveBeenCalledWith({
      data: { userId: "u1", itemType: "bunpou", itemId: "b1", orderIndex: 6 },
    });
  });
});

describe("hafalan-order: retryOnUniqueViolation", () => {
  it("returns the result on first success", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    await expect(retryOnUniqueViolation(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on P2002 then succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ code: "P2002" })
      .mockResolvedValueOnce("ok-second-try");
    await expect(retryOnUniqueViolation(fn)).resolves.toBe("ok-second-try");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("re-throws non-P2002 errors immediately without retrying", async () => {
    const fn = jest.fn().mockRejectedValue({ code: "P2025" });
    await expect(retryOnUniqueViolation(fn)).rejects.toEqual({ code: "P2025" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after the configured attempts on persistent P2002", async () => {
    const fn = jest.fn().mockRejectedValue({ code: "P2002" });
    await expect(retryOnUniqueViolation(fn, 3)).rejects.toEqual({ code: "P2002" });
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
