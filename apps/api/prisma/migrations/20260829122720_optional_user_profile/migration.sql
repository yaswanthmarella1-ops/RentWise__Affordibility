-- AlterTable
ALTER TABLE "users" ADD COLUMN     "age_group" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "household_size" INTEGER,
ADD COLUMN     "monthly_income" DECIMAL(14,2),
ADD COLUMN     "occupation" TEXT;

-- CreateIndex
CREATE INDEX "users_city_default_currency_idx" ON "users"("city", "default_currency");
