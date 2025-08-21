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
    
    // Create Instructions sheet with exact FMX format
    const instructionsSheet = workbook.addWorksheet('Instructions');
    
    // Set column widths
    instructionsSheet.getColumn('A').width = 30;
    instructionsSheet.getColumn('B').width = 50;
    instructionsSheet.getColumn('C').width = 80;
    
    // Row 1-2: Merge A1:A2 (empty), Merge B1:C2 with "INSTRUCTIONS"
    instructionsSheet.mergeCells('A1:A2');
    instructionsSheet.mergeCells('B1:C2');
    
    // Set "INSTRUCTIONS" text in merged B1:C2
    instructionsSheet.getCell('B1').value = 'INSTRUCTIONS';
    instructionsSheet.getCell('B1').alignment = { horizontal: 'center', vertical: 'middle' };
    instructionsSheet.getCell('B1').font = { size: 14, bold: true };
    
    // Row 3-4: Headers with purple background
    instructionsSheet.mergeCells('A3:A4');
    instructionsSheet.mergeCells('B3:B4');
    instructionsSheet.mergeCells('C3:C4');
    
    // Set header values and formatting
    const headerCells = [
      { cell: 'A3', value: 'Name*' },
      { cell: 'B3', value: 'Description' },
      { cell: 'C3', value: 'Steps*' }
    ];
    
    headerCells.forEach(({ cell, value }) => {
      const cellObj = instructionsSheet.getCell(cell);
      cellObj.value = value;
      cellObj.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ffc0504d' }
      };
      cellObj.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cellObj.alignment = { horizontal: 'center', vertical: 'middle' };
      cellObj.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Create Time-based tasks sheet with exact FMX format
    const tasksSheet = workbook.addWorksheet('Time-based tasks');
    
    // Set column widths (A-BC)
    const columnWidths = [15, 20, 15, 20, 15, 15, 12, 12, 8, 8, 8, 8, 8, 8, 8, 12, 12, 12, 12, 15, 15, 15, 15, 15, 15, 15, 15, 15];
    columnWidths.forEach((width, index) => {
      tasksSheet.getColumn(index + 1).width = width;
    });
    
    // Row 1-2: Section headers
    tasksSheet.mergeCells('A1:A2'); // Empty
    tasksSheet.mergeCells('B1:G2'); // TASK
    tasksSheet.mergeCells('H1:H2'); // DAILY
    tasksSheet.mergeCells('I1:P2'); // WEEKLY
    tasksSheet.mergeCells('Q1:R2'); // MONTHLY
    tasksSheet.mergeCells('S1:S2'); // YEARLY
    tasksSheet.mergeCells('T1:BB2'); // TASK
    tasksSheet.mergeCells('BC1:BL2'); // OCCURRENCES
    
    // Set section header values
    const sectionHeaders = [
      { cell: 'B1', value: 'TASK' },
      { cell: 'H1', value: 'DAILY' },
      { cell: 'I1', value: 'WEEKLY' },
      { cell: 'Q1', value: 'MONTHLY' },
      { cell: 'S1', value: 'YEARLY' },
      { cell: 'T1', value: 'TASK' },
      { cell: 'BC1', value: 'OCCURRENCES' }
    ];
    
    sectionHeaders.forEach(({ cell, value }) => {
      const cellObj = tasksSheet.getCell(cell);
      cellObj.value = value;
      cellObj.alignment = { horizontal: 'center', vertical: 'middle' };
      cellObj.font = { size: 12, bold: true };
    });
    
    // Row 3-4: Column headers with specific colors
    const headers = [
      { range: 'A3:A4', value: 'Instructions', color: 'FFF79646' },
      { range: 'B3:B4', value: 'Name*', color: 'FFC0504D' },
      { range: 'C3:C4', value: 'Request type*', color: 'FFC0504D' },
      { range: 'D3:D4', value: 'Buildings*', color: 'FFC0504D' },
      { range: 'E3:E4', value: 'Location', color: 'FFC0504D' },
      { range: 'F3:F4', value: 'First due date*', color: 'FFC0504D' },
      { range: 'G3:G4', value: 'Repeat*', color: 'FFC0504D' },
      { range: 'H3:H4', value: 'Every X days', color: 'FF9BBB59' },
      { range: 'I3:I4', value: 'Sun', color: 'FF8064A2' },
      { range: 'J3:J4', value: 'Mon', color: 'FF8064A2' },
      { range: 'K3:K4', value: 'Tues', color: 'FF8064A2' },
      { range: 'L3:L4', value: 'Wed', color: 'FF8064A2' },
      { range: 'M3:M4', value: 'Thur', color: 'FF8064A2' },
      { range: 'N3:N4', value: 'Fri', color: 'FF8064A2' },
      { range: 'O3:O4', value: 'Sat', color: 'FF8064A2' },
      { range: 'P3:P4', value: 'Every X weeks', color: 'FF8064A2' },
      { range: 'Q3:Q4', value: 'Mode', color: 'FF4BACC6' },
      { range: 'R3:R4', value: 'Every X months', color: 'FF4BACC6' },
      { range: 'S3:S4', value: 'Every X years', color: 'FFF79646' },
      { range: 'V3:V4', value: 'Next due date mode', color: 'FFC0504D' },
      { range: 'Y3:Y4', value: 'Attachments', color: 'FFC0504D' },
      { range: 'Z3:Z4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AA3:AA4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AB3:AB4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AC3:AC4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AD3:AD4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AE3:AE4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AF3:AF4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AG3:AG4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AH3:AH4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AI3:AI4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AJ3:AJ4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AK3:AK4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AL3:AL4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AM3:AM4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AN3:AN4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AO3:AO4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AP3:AP4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AQ3:AQ4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AR3:AR4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AS3:AS4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AT3:AT4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AU3:AU4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AV3:AV4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AW3:AW4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AX3:AX4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AY3:AY4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'AZ3:AZ4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'BA3:BA4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'BB3:BB4', value: '<Custom field>', color: 'FFC0504D' },
      { range: 'BE3:BE4', value: 'Equipment items', color: 'FFF79646' },
      { range: 'BF3:BF4', value: 'Tracked meters', color: 'FFF79646' },
      { range: 'BG3:BG4', value: 'Assigned users', color: 'FFF79646' },
      { range: 'BH3:BH4', value: 'Outsourced', color: 'FFF79646' },
      { range: 'BI3:BI4', value: 'Ask for confirmation X day(s) before due', color: 'FFF79646' }
    ];
    
    // Special headers that span across rows 3-4 but split in row 4
    tasksSheet.mergeCells('T3:U3'); // Exclude dates
    tasksSheet.mergeCells('W3:X3'); // Inventory used
    tasksSheet.mergeCells('BC3:BD3'); // Time
    tasksSheet.mergeCells('BJ3:BL3'); // Email reminder
    
    // Set "Exclude dates" and "Inventory used" headers
    tasksSheet.getCell('T3').value = 'Exclude dates';
    tasksSheet.getCell('W3').value = 'Inventory used';
    tasksSheet.getCell('BC3').value = 'Time';
    tasksSheet.getCell('BJ3').value = 'Send an email reminder';
    
    // Row 4 split headers
    const splitHeaders = [
      { cell: 'T4', value: 'From', color: 'FFC0504D' },
      { cell: 'U4', value: 'Thru', color: 'FFC0504D' },
      { cell: 'W4', value: 'Names', color: 'FFC0504D' },
      { cell: 'X4', value: 'Quantities', color: 'FFC0504D' },
      { cell: 'BC4', value: 'From', color: 'FFF79646' },
      { cell: 'BD4', value: 'To', color: 'FFF79646' },
      { cell: 'BJ4', value: 'X day(s) before due', color: 'FFF79646' },
      { cell: 'BK4', value: '& X day(s) before due', color: 'FFF79646' },
      { cell: 'BL4', value: 'X day(s) after due', color: 'FFF79646' }
    ];
    
    // Apply all header formatting
    headers.forEach(({ range, value, color }) => {
      tasksSheet.mergeCells(range);
      const startCell = range.split(':')[0];
      const cellObj = tasksSheet.getCell(startCell);
      cellObj.value = value;
      cellObj.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color }
      };
      cellObj.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 9 };
      cellObj.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cellObj.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Apply formatting to split headers and their merged parents
    ['T3', 'W3'].forEach(cell => {
      const cellObj = tasksSheet.getCell(cell);
      cellObj.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC0504D' }
      };
      cellObj.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 9 };
      cellObj.alignment = { horizontal: 'center', vertical: 'middle' };
      cellObj.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    splitHeaders.forEach(({ cell, value, color }) => {
      const cellObj = tasksSheet.getCell(cell);
      cellObj.value = value;
      cellObj.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color }
      };
      cellObj.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 9 };
      cellObj.alignment = { horizontal: 'center', vertical: 'middle' };
      cellObj.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

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

    // Add data to Instructions sheet starting from row 5
    let instructionRowIndex = 5;
    Array.from(instructionsMap.values()).forEach(instruction => {
      instructionsSheet.getCell(`A${instructionRowIndex}`).value = instruction.name;
      instructionsSheet.getCell(`B${instructionRowIndex}`).value = instruction.description;
      instructionsSheet.getCell(`C${instructionRowIndex}`).value = instruction.steps;
      
      // Add borders to data rows
      ['A', 'B', 'C'].forEach(col => {
        const cell = instructionsSheet.getCell(`${col}${instructionRowIndex}`);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      instructionRowIndex++;
    });

    // Add data to Tasks sheet starting from row 5
    let taskRowIndex = 5;
    Array.from(tasksMap.values()).forEach(task => {
      // Map task data to the correct columns
      tasksSheet.getCell(`A${taskRowIndex}`).value = task.instruction;
      tasksSheet.getCell(`B${taskRowIndex}`).value = task.name;
      tasksSheet.getCell(`C${taskRowIndex}`).value = task.requestType;
      tasksSheet.getCell(`D${taskRowIndex}`).value = task.buildings;
      tasksSheet.getCell(`E${taskRowIndex}`).value = task.location;
      tasksSheet.getCell(`F${taskRowIndex}`).value = task.firstDueDate;
      tasksSheet.getCell(`G${taskRowIndex}`).value = task.repeat;
      tasksSheet.getCell(`H${taskRowIndex}`).value = task.dailyEveryXDays;
      tasksSheet.getCell(`I${taskRowIndex}`).value = task.weeklySun;
      tasksSheet.getCell(`J${taskRowIndex}`).value = task.weeklyMon;
      tasksSheet.getCell(`K${taskRowIndex}`).value = task.weeklyTues;
      tasksSheet.getCell(`L${taskRowIndex}`).value = task.weeklyWed;
      tasksSheet.getCell(`M${taskRowIndex}`).value = task.weeklyThur;
      tasksSheet.getCell(`N${taskRowIndex}`).value = task.weeklyFri;
      tasksSheet.getCell(`O${taskRowIndex}`).value = task.weeklySat;
      tasksSheet.getCell(`P${taskRowIndex}`).value = task.weeklyEveryXWeeks;
      tasksSheet.getCell(`Q${taskRowIndex}`).value = task.monthlyMode;
      tasksSheet.getCell(`R${taskRowIndex}`).value = task.monthlyEveryXMonths;
      tasksSheet.getCell(`S${taskRowIndex}`).value = task.yearlyEveryXYears;
      tasksSheet.getCell(`T${taskRowIndex}`).value = task.excludeFrom;
      tasksSheet.getCell(`U${taskRowIndex}`).value = task.excludeThru;
      tasksSheet.getCell(`V${taskRowIndex}`).value = task.nextDueMode;
      tasksSheet.getCell(`W${taskRowIndex}`).value = task.inventoryNames;
      tasksSheet.getCell(`X${taskRowIndex}`).value = task.inventoryQuantities;
      tasksSheet.getCell(`Y${taskRowIndex}`).value = task.estTimeHours;
      tasksSheet.getCell(`Z${taskRowIndex}`).value = task.notes;
      
      // Add borders to data rows
      const columns = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','AA','AB','AC'];
      columns.forEach(col => {
        const cell = tasksSheet.getCell(`${col}${taskRowIndex}`);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      taskRowIndex++;
    });

    occurrencesList.forEach(occurrence => {
      occurrencesSheet.addRow(occurrence);
    });

    // Style the Occurrences sheet headers (Instructions and Tasks sheets are already styled above)
    const occurrencesHeaderRow = occurrencesSheet.getRow(1);
    occurrencesHeaderRow.font = { bold: true };
    occurrencesHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

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
