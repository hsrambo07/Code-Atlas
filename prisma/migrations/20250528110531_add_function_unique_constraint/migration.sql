/*
  Warnings:

  - A unique constraint covering the columns `[fileId,name,start]` on the table `Function` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Function_fileId_name_start_key" ON "Function"("fileId", "name", "start");
