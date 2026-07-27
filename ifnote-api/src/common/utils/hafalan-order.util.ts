import { PrismaService } from "../../prisma/prisma.service";

/**
 * Hafalan order is append-only.
 *
 * Returns the next free orderIndex for the user.
 * MUST run inside a transaction with a write to keep this race-safe.
 *
 * The Prisma side enforces UNIQUE(userId, orderIndex) — if two concurrent
 * requests pick the same number, the loser will throw P2002 and should
 * retry. The service layer can wrap with retryOnUniqueViolation().
 */
export async function nextHafalanOrderIndex(
  prisma: PrismaService,
  userId: string,
): Promise<number> {
  const last = await prisma.hafalanOrder.aggregate({
    where: { userId },
    _max: { orderIndex: true },
  });
  return (last._max.orderIndex ?? 0) + 1;
}

/**
 * Append an item to the user's hafalan order. Idempotent on
 * (userId, itemType, itemId).
 */
export async function appendHafalanOrder(
  prisma: PrismaService,
  userId: string,
  itemType: "kotoba" | "bunpou",
  itemId: string,
): Promise<void> {
  const existing = await prisma.hafalanOrder.findUnique({
    where: { uniq_user_item: { userId, itemType, itemId } },
    select: { id: true },
  });
  if (existing) return;
  const nextIndex = await nextHafalanOrderIndex(prisma, userId);
  await prisma.hafalanOrder.create({
    data: { userId, itemType, itemId, orderIndex: nextIndex },
  });
}

/**
 * Wrap an arbitrary write that might race on UNIQUE(userId, orderIndex).
 * Retry up to 3 times before giving up.
 */
export async function retryOnUniqueViolation<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== "P2002") throw e;
      lastErr = e;
    }
  }
  throw lastErr;
}
