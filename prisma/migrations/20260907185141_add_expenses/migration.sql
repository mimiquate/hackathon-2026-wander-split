-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "originalCurrency" TEXT NOT NULL,
    "adjustedAmount" DOUBLE PRECISION,
    "paidById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseUser" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,

    CONSTRAINT "ExpenseUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_stopId_idx" ON "Expense"("stopId");

-- CreateIndex
CREATE INDEX "ExpenseUser_membershipId_idx" ON "ExpenseUser"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseUser_expenseId_membershipId_key" ON "ExpenseUser"("expenseId", "membershipId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "TripStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "TripMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseUser" ADD CONSTRAINT "ExpenseUser_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseUser" ADD CONSTRAINT "ExpenseUser_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "TripMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
