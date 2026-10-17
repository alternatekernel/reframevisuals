-- AlterTable
ALTER TABLE "Invoice"
  ADD COLUMN "invoiceNumber" TEXT,
  ADD COLUMN "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "paymentReference" TEXT,
  ADD COLUMN "billToName" TEXT,
  ADD COLUMN "billToCompany" TEXT,
  ADD COLUMN "billToAddress" TEXT,
  ADD COLUMN "billToEmail" TEXT;

-- Backfill legacy rows so existing invoices render consistently
UPDATE "Invoice" SET "issueDate" = "createdAt", "subtotal" = "amount";

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "note" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
