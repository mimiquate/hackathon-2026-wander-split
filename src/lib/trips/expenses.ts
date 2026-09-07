import { prisma } from "@/lib/prisma";
import { membershipIdsForStop } from "@/lib/trips/stops";
import { isExpenseCategory, isExpenseCurrency, isPaymentMethod } from "@/lib/trips/constants";

export interface ExpenseDetail {
  id: string;
  stopId: string;
  label: string;
  category: string;
  paymentMethod: string;
  originalAmount: number;
  originalCurrency: string;
  // Null until the real statement amount is entered — "Pendiente de
  // ajuste" is this being null, not a separate stored flag.
  adjustedAmount: number | null;
  paidById: string;
  userIds: string[];
}

function toExpenseDetail(expense: {
  id: string;
  stopId: string;
  label: string;
  category: string;
  paymentMethod: string;
  originalAmount: number;
  originalCurrency: string;
  adjustedAmount: number | null;
  paidById: string;
  users: { membershipId: string }[];
}): ExpenseDetail {
  return {
    id: expense.id,
    stopId: expense.stopId,
    label: expense.label,
    category: expense.category,
    paymentMethod: expense.paymentMethod,
    originalAmount: expense.originalAmount,
    originalCurrency: expense.originalCurrency,
    adjustedAmount: expense.adjustedAmount,
    paidById: expense.paidById,
    userIds: expense.users.map((user) => user.membershipId),
  };
}

/** Every expense for a stop, full detail included — same one-query shape
 * bookings.ts's getBookingsForStop uses, so opening one needs no second
 * round trip. */
export async function getExpensesForStop(stopId: string): Promise<ExpenseDetail[]> {
  const expenses = await prisma.expense.findMany({
    where: { stopId },
    orderBy: { createdAt: "asc" },
    include: { users: true },
  });

  return expenses.map(toExpenseDetail);
}

/** Null when the expense doesn't exist or belongs to a different stop. */
export async function getExpense(stopId: string, expenseId: string): Promise<ExpenseDetail | null> {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { users: true },
  });

  if (!expense || expense.stopId !== stopId) return null;

  return toExpenseDetail(expense);
}

interface ExpenseFieldErrors {
  label?: string;
  category?: string;
  paymentMethod?: string;
  originalAmount?: string;
  originalCurrency?: string;
  adjustedAmount?: string;
  paidById?: string;
  userIds?: string;
}

function validateExpenseFields(
  memberIds: Set<string>,
  {
    category,
    paymentMethod,
    originalAmount,
    originalCurrency,
    adjustedAmount,
    paidById,
    userIds,
  }: {
    category?: string;
    paymentMethod?: string;
    originalAmount?: number;
    originalCurrency?: string;
    adjustedAmount?: number;
    paidById?: string;
    userIds?: string[];
  },
): ExpenseFieldErrors | null {
  const fieldErrors: ExpenseFieldErrors = {};

  if (category !== undefined && !isExpenseCategory(category)) {
    fieldErrors.category = "Elegí una categoría.";
  }
  if (paymentMethod !== undefined && !isPaymentMethod(paymentMethod)) {
    fieldErrors.paymentMethod = "Elegí cómo se pagó.";
  }
  if (originalAmount !== undefined && !(Number.isFinite(originalAmount) && originalAmount > 0)) {
    fieldErrors.originalAmount = "Poné un monto válido.";
  }
  if (originalCurrency !== undefined && !isExpenseCurrency(originalCurrency)) {
    fieldErrors.originalCurrency = "Elegí una moneda.";
  }
  if (adjustedAmount !== undefined && !(Number.isFinite(adjustedAmount) && adjustedAmount > 0)) {
    fieldErrors.adjustedAmount = "Poné un monto válido.";
  }
  if (paidById !== undefined && !memberIds.has(paidById)) {
    fieldErrors.paidById = "Elegí quién pagó.";
  }
  if (userIds !== undefined) {
    if (userIds.length === 0) {
      fieldErrors.userIds = "Elegí quién lo usa.";
    } else if (userIds.some((id) => !memberIds.has(id))) {
      fieldErrors.userIds = "Uno de los seleccionados no está en el viaje.";
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

export interface CreateExpenseInput {
  stopId: string;
  label: string;
  category: string;
  paymentMethod: string;
  originalAmount: number;
  originalCurrency: string;
  paidById: string;
  userIds: string[];
}

export type CreateExpenseResult =
  | { ok: true; expenseId: string }
  | { ok: false; fieldErrors?: ExpenseFieldErrors; formError?: string };

/** Always starts with a null adjustedAmount — "Pendiente de ajuste" is set
 * later, once at all, via updateExpense (Phase 4). */
export async function createExpense({
  stopId,
  label,
  category,
  paymentMethod,
  originalAmount,
  originalCurrency,
  paidById,
  userIds,
}: CreateExpenseInput): Promise<CreateExpenseResult> {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    return { ok: false, fieldErrors: { label: "Ponele un nombre al gasto." } };
  }

  const memberIds = await membershipIdsForStop(stopId);
  if (!memberIds) {
    return { ok: false, formError: "La parada no existe." };
  }

  const fieldErrors = validateExpenseFields(memberIds, {
    category,
    paymentMethod,
    originalAmount,
    originalCurrency,
    paidById,
    userIds,
  });
  if (fieldErrors) {
    return { ok: false, fieldErrors };
  }

  const expense = await prisma.expense.create({
    data: {
      stopId,
      label: trimmedLabel,
      category,
      paymentMethod,
      originalAmount,
      originalCurrency,
      paidById,
      users: { create: userIds.map((membershipId) => ({ membershipId })) },
    },
  });

  return { ok: true, expenseId: expense.id };
}

export interface UpdateExpenseInput {
  stopId: string;
  expenseId: string;
  label?: string;
  category?: string;
  paymentMethod?: string;
  originalAmount?: number;
  originalCurrency?: string;
  // Setting this is Phase 4's adjustment flow — the original amount/currency
  // never change once logged, only this field does.
  adjustedAmount?: number;
  paidById?: string;
  userIds?: string[];
}

export type UpdateExpenseResult = { ok: true } | { ok: false; fieldErrors?: ExpenseFieldErrors; formError?: string };

/** Only the fields actually passed are changed — omit one to leave it as is. */
export async function updateExpense({
  stopId,
  expenseId,
  label,
  category,
  paymentMethod,
  originalAmount,
  originalCurrency,
  adjustedAmount,
  paidById,
  userIds,
}: UpdateExpenseInput): Promise<UpdateExpenseResult> {
  const existing = await prisma.expense.findUnique({ where: { id: expenseId }, select: { stopId: true } });
  if (!existing || existing.stopId !== stopId) {
    return { ok: false, formError: "El gasto no existe en esta parada." };
  }

  if (label !== undefined && !label.trim()) {
    return { ok: false, fieldErrors: { label: "Ponele un nombre al gasto." } };
  }

  const memberIds = await membershipIdsForStop(stopId);
  if (!memberIds) {
    return { ok: false, formError: "La parada no existe." };
  }

  const fieldErrors = validateExpenseFields(memberIds, {
    category,
    paymentMethod,
    originalAmount,
    originalCurrency,
    adjustedAmount,
    paidById,
    userIds,
  });
  if (fieldErrors) {
    return { ok: false, fieldErrors };
  }

  await prisma.$transaction(async (tx) => {
    const hasScalarChange =
      label !== undefined ||
      category !== undefined ||
      paymentMethod !== undefined ||
      originalAmount !== undefined ||
      originalCurrency !== undefined ||
      adjustedAmount !== undefined ||
      paidById !== undefined;

    if (hasScalarChange) {
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          ...(label !== undefined ? { label: label.trim() } : {}),
          ...(category !== undefined ? { category } : {}),
          ...(paymentMethod !== undefined ? { paymentMethod } : {}),
          ...(originalAmount !== undefined ? { originalAmount } : {}),
          ...(originalCurrency !== undefined ? { originalCurrency } : {}),
          ...(adjustedAmount !== undefined ? { adjustedAmount } : {}),
          ...(paidById !== undefined ? { paidById } : {}),
        },
      });
    }

    if (userIds !== undefined) {
      await tx.expenseUser.deleteMany({ where: { expenseId } });
      await tx.expenseUser.createMany({
        data: userIds.map((membershipId) => ({ expenseId, membershipId })),
      });
    }
  });

  return { ok: true };
}

export type RemoveExpenseResult = { ok: true } | { ok: false; formError?: string };

export async function removeExpense(stopId: string, expenseId: string): Promise<RemoveExpenseResult> {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId }, select: { stopId: true } });

  if (!expense || expense.stopId !== stopId) {
    return { ok: false, formError: "El gasto no existe en esta parada." };
  }

  await prisma.expense.delete({ where: { id: expenseId } });

  return { ok: true };
}
