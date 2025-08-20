/*
  Warnings:

  - You are about to drop the column `steps` on the `InstructionSet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `InstructionSet` DROP COLUMN `steps`;

-- CreateTable
CREATE TABLE `InstructionStep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instructionSetId` INTEGER NOT NULL,
    `orderIndex` INTEGER NOT NULL,
    `text` VARCHAR(191) NOT NULL,

    INDEX `InstructionStep_instructionSetId_orderIndex_idx`(`instructionSetId`, `orderIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InstructionStep` ADD CONSTRAINT `InstructionStep_instructionSetId_fkey` FOREIGN KEY (`instructionSetId`) REFERENCES `InstructionSet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
