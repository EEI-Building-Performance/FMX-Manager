-- CreateTable
CREATE TABLE `Building` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `fmxBuildingName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Building_name_key`(`name`),
    UNIQUE INDEX `Building_fmxBuildingName_key`(`fmxBuildingName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Equipment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `buildingId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `fmxEquipmentName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Equipment_fmxEquipmentName_key`(`fmxEquipmentName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RequestType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `RequestType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstructionSet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `steps` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `InstructionSet_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaskTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `instructionId` INTEGER NOT NULL,
    `requestTypeId` INTEGER NOT NULL,
    `location` VARCHAR(191) NULL,
    `firstDueDate` DATETIME(3) NOT NULL,
    `repeatEnum` ENUM('NEVER', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    `dailyEveryXDays` INTEGER NULL,
    `weeklySun` BOOLEAN NULL DEFAULT false,
    `weeklyMon` BOOLEAN NULL DEFAULT false,
    `weeklyTues` BOOLEAN NULL DEFAULT false,
    `weeklyWed` BOOLEAN NULL DEFAULT false,
    `weeklyThur` BOOLEAN NULL DEFAULT false,
    `weeklyFri` BOOLEAN NULL DEFAULT false,
    `weeklySat` BOOLEAN NULL DEFAULT false,
    `weeklyEveryXWeeks` INTEGER NULL,
    `monthlyMode` ENUM('DAY_OF_MONTH', 'DAY_OF_WEEK', 'WEEKDAY_OF_MONTH', 'WEEKEND_DAY_OF_MONTH') NULL,
    `monthlyEveryXMonths` INTEGER NULL,
    `yearlyEveryXYears` INTEGER NULL,
    `excludeFrom` DATETIME(3) NULL,
    `excludeThru` DATETIME(3) NULL,
    `nextDueMode` ENUM('FIXED', 'VARIABLE') NOT NULL DEFAULT 'FIXED',
    `inventoryNames` VARCHAR(191) NULL,
    `inventoryQuantities` VARCHAR(191) NULL,
    `estTimeHours` DECIMAL(5, 2) NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `TaskTemplate_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PMTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `PMTemplate_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PMTemplateTask` (
    `pmTemplateId` INTEGER NOT NULL,
    `taskTemplateId` INTEGER NOT NULL,
    `overrideLocation` VARCHAR(191) NULL,
    `overrideEstTimeHours` DECIMAL(5, 2) NULL,
    `overrideNotes` VARCHAR(191) NULL,

    PRIMARY KEY (`pmTemplateId`, `taskTemplateId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PMTemplateAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pmTemplateId` INTEGER NOT NULL,
    `equipmentId` INTEGER NOT NULL,
    `buildingId` INTEGER NOT NULL,
    `assignedUsers` VARCHAR(191) NULL,
    `outsourced` BOOLEAN NOT NULL DEFAULT false,
    `remindBeforeDaysPrimary` INTEGER NULL,
    `remindBeforeDaysSecondary` INTEGER NULL,
    `remindAfterDays` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Equipment` ADD CONSTRAINT `Equipment_buildingId_fkey` FOREIGN KEY (`buildingId`) REFERENCES `Building`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskTemplate` ADD CONSTRAINT `TaskTemplate_instructionId_fkey` FOREIGN KEY (`instructionId`) REFERENCES `InstructionSet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskTemplate` ADD CONSTRAINT `TaskTemplate_requestTypeId_fkey` FOREIGN KEY (`requestTypeId`) REFERENCES `RequestType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PMTemplateTask` ADD CONSTRAINT `PMTemplateTask_pmTemplateId_fkey` FOREIGN KEY (`pmTemplateId`) REFERENCES `PMTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PMTemplateTask` ADD CONSTRAINT `PMTemplateTask_taskTemplateId_fkey` FOREIGN KEY (`taskTemplateId`) REFERENCES `TaskTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PMTemplateAssignment` ADD CONSTRAINT `PMTemplateAssignment_pmTemplateId_fkey` FOREIGN KEY (`pmTemplateId`) REFERENCES `PMTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PMTemplateAssignment` ADD CONSTRAINT `PMTemplateAssignment_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `Equipment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
