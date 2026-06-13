-- CreateTable
CREATE TABLE "JobAlert" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "keywords" TEXT,
    "jobType" TEXT,
    "city" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAlert_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobAlert" ADD CONSTRAINT "JobAlert_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
