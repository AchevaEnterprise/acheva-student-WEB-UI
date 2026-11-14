/**
 * A payment's due date is its DEADLINE (the user, 2026-11-11 — "that's what
 * due date means everywhere on the app"): a student may pay any time before
 * it, and it has passed only once the whole of that day is over.
 */
export function deadlinePassed(
  dueDate: string | Date | null | undefined,
  now = new Date()
): boolean {
  if (!dueDate) return false;
  const endOfDay = new Date(dueDate);
  if (Number.isNaN(endOfDay.getTime())) return false;
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() < now.getTime();
}
