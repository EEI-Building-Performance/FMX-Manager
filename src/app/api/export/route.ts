import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken, errorResponse, successResponse, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateExportData, formatValidationErrors } from '@/lib/exportValidation';
import ExcelJS from 'exceljs';
import path from 'path';

interface ExportRequest {
  buildingIds?: number[];
  equipmentIds?: number[];
  includeAllEquipment?: boolean;
}

export async function POST(request: NextRequest) {
  const isValid = validateAdminToken(request);
  if (!isValid) {
    return unauthorizedResponse();
  }

  try {
    const body: ExportRequest = await request.json();
    const { buildingIds, equipmentIds, includeAllEquipment } = body;

    // Build equipment filter
    let equipmentFilter: any = {};
    
    if (includeAllEquipment) {
      // Include all equipment
      equipmentFilter = {};
    } else if (equipmentIds && equipmentIds.length > 0) {
      // Specific equipment
      equipmentFilter = { id: { in: equipmentIds } };
    } else if (buildingIds && buildingIds.length > 0) {
      // All equipment in specific buildings
      equipmentFilter = { buildingId: { in: buildingIds } };
    } else {
      return errorResponse('No buildings or equipment specified for export');
    }

    // Get all assignments matching the criteria
    const assignments = await prisma.pMTemplateAssignment.findMany({
      where: {
        equipment: equipmentFilter
      },
      include: {
        pmTemplate: {
          include: {
            tasks: {
              include: {
                taskTemplate: {
                  include: {
                    instruction: {
                      include: {
                        steps: {
                          orderBy: { orderIndex: 'asc' }
                        }
                      }
                    },
                    requestType: true
                  }
                }
              }
            }
          }
        },
        equipment: {
          include: {
            building: true
          }
        }
      }
    });

    if (assignments.length === 0) {
      return errorResponse('No assignments found for the specified criteria');
    }

    // Validate export data
    const validationResult = validateExportData(assignments);
    if (!validationResult.isValid) {
      const errorMessage = formatValidationErrors(validationResult.errors);
      return errorResponse(errorMessage);
    }

    // Create a new workbook with the FMX format
    const workbook = new ExcelJS.Workbook();
    
    // Create Instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Steps', key: 'steps', width: 80 }
    ];

    // Create Tasks sheet
    const tasksSheet = workbook.addWorksheet('Time-based tasks');
    tasksSheet.columns = [
      { header: 'Instruction', key: 'instruction', width: 30 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Request Type', key: 'requestType', width: 20 },
      { header: 'Buildings', key: 'buildings', width: 30 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'First due date', key: 'firstDueDate', width: 15 },
      { header: 'Repeat', key: 'repeat', width: 15 },
      { header: 'Daily every X days', key: 'dailyEveryXDays', width: 18 },
      { header: 'Weekly Sun', key: 'weeklySun', width: 12 },
      { header: 'Weekly Mon', key: 'weeklyMon', width: 12 },
      { header: 'Weekly Tues', key: 'weeklyTues', width: 12 },
      { header: 'Weekly Wed', key: 'weeklyWed', width: 12 },
      { header: 'Weekly Thur', key: 'weeklyThur', width: 12 },
      { header: 'Weekly Fri', key: 'weeklyFri', width: 12 },
      { header: 'Weekly Sat', key: 'weeklySat', width: 12 },
      { header: 'Weekly every X weeks', key: 'weeklyEveryXWeeks', width: 20 },
      { header: 'Monthly mode', key: 'monthlyMode', width: 20 },
      { header: 'Monthly every X months', key: 'monthlyEveryXMonths', width: 22 },
      { header: 'Yearly every X years', key: 'yearlyEveryXYears', width: 20 },
      { header: 'Exclude dates From', key: 'excludeFrom', width: 18 },
      { header: 'Exclude dates Thru', key: 'excludeThru', width: 18 },
      { header: 'Next due date mode', key: 'nextDueMode', width: 18 },
      { header: 'Inventory used Names', key: 'inventoryNames', width: 25 },
      { header: 'Inventory used Quantities', key: 'inventoryQuantities', width: 28 },
      { header: 'Estimated time (hours)', key: 'estTimeHours', width: 20 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];

    // Create Occurrences sheet
    const occurrencesSheet = workbook.addWorksheet('Occurrences');
    occurrencesSheet.columns = [
      { header: 'Task name', key: 'taskName', width: 30 },
      { header: 'Equipment items', key: 'equipmentItems', width: 40 },
      { header: 'Assigned users', key: 'assignedUsers', width: 30 },
      { header: 'Outsourced', key: 'outsourced', width: 12 },
      { header: 'Email reminder days before (primary)', key: 'remindBeforeDaysPrimary', width: 35 },
      { header: 'Email reminder days before (secondary)', key: 'remindBeforeDaysSecondary', width: 38 },
      { header: 'Email reminder days after', key: 'remindAfterDays', width: 25 }
    ];

    // Collect unique instructions
    const instructionsMap = new Map();
    const tasksMap = new Map();
    const occurrencesList: any[] = [];

    // Process assignments to build data
    assignments.forEach(assignment => {
      assignment.pmTemplate.tasks.forEach(pmTemplateTask => {
        const task = pmTemplateTask.taskTemplate;
        const instruction = task.instruction;

        // Add instruction if not already added
        if (!instructionsMap.has(instruction.id)) {
          const stepsText = instruction.steps.map(step => step.text).join('\n');
          instructionsMap.set(instruction.id, {
            name: instruction.name,
            description: instruction.description || '',
            steps: stepsText
          });
        }

        // Add task if not already added (group by building)
        const taskKey = `${task.id}-${assignment.equipment.building.id}`;
        if (!tasksMap.has(taskKey)) {
          tasksMap.set(taskKey, {
            instruction: instruction.name,
            name: task.name,
            requestType: task.requestType.name,
            buildings: assignment.equipment.building.fmxBuildingName,
            location: task.location || '',
            firstDueDate: task.firstDueDate.toISOString().split('T')[0], // YYYY-MM-DD format
            repeat: task.repeatEnum,
            dailyEveryXDays: task.repeatEnum === 'DAILY' ? task.dailyEveryXDays : '',
            weeklySun: task.repeatEnum === 'WEEKLY' ? (task.weeklySun ? 'Y' : '') : '',
            weeklyMon: task.repeatEnum === 'WEEKLY' ? (task.weeklyMon ? 'Y' : '') : '',
            weeklyTues: task.repeatEnum === 'WEEKLY' ? (task.weeklyTues ? 'Y' : '') : '',
            weeklyWed: task.repeatEnum === 'WEEKLY' ? (task.weeklyWed ? 'Y' : '') : '',
            weeklyThur: task.repeatEnum === 'WEEKLY' ? (task.weeklyThur ? 'Y' : '') : '',
            weeklyFri: task.repeatEnum === 'WEEKLY' ? (task.weeklyFri ? 'Y' : '') : '',
            weeklySat: task.repeatEnum === 'WEEKLY' ? (task.weeklySat ? 'Y' : '') : '',
            weeklyEveryXWeeks: task.repeatEnum === 'WEEKLY' ? task.weeklyEveryXWeeks : '',
            monthlyMode: task.repeatEnum === 'MONTHLY' ? task.monthlyMode : '',
            monthlyEveryXMonths: task.repeatEnum === 'MONTHLY' ? task.monthlyEveryXMonths : '',
            yearlyEveryXYears: task.repeatEnum === 'YEARLY' ? task.yearlyEveryXYears : '',
            excludeFrom: task.excludeFrom ? task.excludeFrom.toISOString().split('T')[0] : '',
            excludeThru: task.excludeThru ? task.excludeThru.toISOString().split('T')[0] : '',
            nextDueMode: task.nextDueMode,
            inventoryNames: task.inventoryNames || '',
            inventoryQuantities: task.inventoryQuantities || '',
            estTimeHours: task.estTimeHours ? task.estTimeHours.toString() : '',
            notes: task.notes || ''
          });
        }

        // Add occurrence for this specific assignment
        occurrencesList.push({
          taskName: task.name,
          equipmentItems: assignment.equipment.fmxEquipmentName,
          assignedUsers: assignment.assignedUsers || '',
          outsourced: assignment.outsourced ? 'Y' : '',
          remindBeforeDaysPrimary: assignment.remindBeforeDaysPrimary || '',
          remindBeforeDaysSecondary: assignment.remindBeforeDaysSecondary || '',
          remindAfterDays: assignment.remindAfterDays || ''
        });
      });
    });

    // Add data to sheets
    Array.from(instructionsMap.values()).forEach(instruction => {
      instructionsSheet.addRow(instruction);
    });

    Array.from(tasksMap.values()).forEach(task => {
      tasksSheet.addRow(task);
    });

    occurrencesList.forEach(occurrence => {
      occurrencesSheet.addRow(occurrence);
    });

    // Style the headers
    [instructionsSheet, tasksSheet, occurrencesSheet].forEach(sheet => {
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the file
    const fileName = `fmx-planned-maintenance-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return errorResponse('Failed to generate export file');
  }
}
