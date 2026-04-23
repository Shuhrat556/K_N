-- CreateTable
CREATE TABLE "specializations" (
    "id" SERIAL NOT NULL,
    "external_id" INTEGER,
    "direction" TEXT,
    "code_name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "city" TEXT,
    "education_form" TEXT,
    "education_type" TEXT,
    "language" TEXT,
    "quota" INTEGER,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "specializations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "specialization_code_institution" ON "specializations"("code_name", "institution");

-- CreateIndex
CREATE INDEX "specializations_city_idx" ON "specializations"("city");

-- CreateIndex
CREATE INDEX "specializations_institution_idx" ON "specializations"("institution");

-- CreateIndex
CREATE INDEX "specializations_category_idx" ON "specializations"("category");
