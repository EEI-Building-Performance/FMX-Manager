import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const taskTemplates = await prisma.taskTemplate.findMany({
      include: {
        instruction: {
          select: {
            id: true,
            name: true,
          }
        },
        requestType: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: { pmTemplateTasks: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return successResponse(taskTemplates);
  } catch (error) {
    console.error('Error fetching task templates:', error);
    return errorResponse('Failed to fetch task templates');
  }
}

export async function POST(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { 
      name, 
      instructionId, 
      requestTypeId, 
      location,
      firstDueDate, 
      repeatEnum,
      // Daily fields
      dailyEveryXDays,
      // Weekly fields
      weeklySun, weeklyMon, weeklyTues, weeklyWed, weeklyThur, weeklyFri, weeklySat,
      weeklyEveryXWeeks,
      // Monthly fields
      monthlyMode,
      monthlyEveryXMonths,
      // Yearly fields
      yearlyEveryXYears,
      // Optional fields
      excludeFrom,
      excludeThru,
      nextDueMode,
      inventoryNames,
      inventoryQuantities,
      estTimeHours,
      notes
    } = body;

    // Validation
    if (!name || !instructionId || !requestTypeId || !firstDueDate || !repeatEnum) {
      return errorResponse('Name, instruction, request type, first due date, and repeat frequency are required', 400);
    }

    // Validate frequency-specific fields
    const validationError = validateFrequencyFields(repeatEnum, body);
    if (validationError) {
      return errorResponse(validationError, 400);
    }

    // Verify instruction and request type exist
    const [instruction, requestType] = await Promise.all([
      prisma.instructionSet.findUnique({ where: { id: parseInt(instructionId) } }),
      prisma.requestType.findUnique({ where: { id: parseInt(requestTypeId) } })
    ]);

    if (!instruction) {
      return errorResponse('Instruction not found', 400);
    }

    if (!requestType) {
      return errorResponse('Request type not found', 400);
    }

    const taskTemplate = await prisma.taskTemplate.create({
      data: {
        name: name.trim(),
        instructionId: parseInt(instructionId),
        requestTypeId: parseInt(requestTypeId),
        location: location?.trim() || null,
        firstDueDate: new Date(firstDueDate),
        repeatEnum,
        // Daily fields
        dailyEveryXDays: repeatEnum === 'DAILY' ? parseInt(dailyEveryXDays) || 1 : null,
        // Weekly fields
        weeklySun: repeatEnum === 'WEEKLY' ? Boolean(weeklySun) : null,
        weeklyMon: repeatEnum === 'WEEKLY' ? Boolean(weeklyMon) : null,
        weeklyTues: repeatEnum === 'WEEKLY' ? Boolean(weeklyTues) : null,
        weeklyWed: repeatEnum === 'WEEKLY' ? Boolean(weeklyWed) : null,
        weeklyThur: repeatEnum === 'WEEKLY' ? Boolean(weeklyThur) : null,
        weeklyFri: repeatEnum === 'WEEKLY' ? Boolean(weeklyFri) : null,
        weeklySat: repeatEnum === 'WEEKLY' ? Boolean(weeklySat) : null,
        weeklyEveryXWeeks: repeatEnum === 'WEEKLY' ? parseInt(weeklyEveryXWeeks) || 1 : null,
        // Monthly fields
        monthlyMode: repeatEnum === 'MONTHLY' ? (monthlyMode || 'DAY_OF_MONTH') : null,
        monthlyEveryXMonths: repeatEnum === 'MONTHLY' ? parseInt(monthlyEveryXMonths) || 1 : null,
        // Yearly fields
        yearlyEveryXYears: repeatEnum === 'YEARLY' ? parseInt(yearlyEveryXYears) || 1 : null,
        // Optional fields
        excludeFrom: excludeFrom ? new Date(excludeFrom) : null,
        excludeThru: excludeThru ? new Date(excludeThru) : null,
        nextDueMode: nextDueMode || 'FIXED',
        inventoryNames: inventoryNames?.trim() || null,
        inventoryQuantities: inventoryQuantities?.trim() || null,
        estTimeHours: estTimeHours ? parseFloat(estTimeHours) : null,
        notes: notes?.trim() || null,
      },
      include: {
        instruction: {
          select: {
            id: true,
            name: true,
          }
        },
        requestType: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: { pmTemplateTasks: true }
        }
      }
    });

    return successResponse(taskTemplate, 201);
  } catch (error: any) {
    console.error('Error creating task template:', error);
    
    if (error.code === 'P2002') {
      return errorResponse('Task template with this name already exists', 409);
    }
    
    return errorResponse('Failed to create task template');
  }
}

function validateFrequencyFields(repeatEnum: string, data: any): string | null {
  switch (repeatEnum) {
    case 'DAILY':
      if (data.dailyEveryXDays && (data.dailyEveryXDays < 1 || data.dailyEveryXDays > 365)) {
        return 'Daily frequency must be between 1 and 365 days';
      }
      break;
    
    case 'WEEKLY':
      const hasAnyDay = data.weeklySun || data.weeklyMon || data.weeklyTues || 
                       data.weeklyWed || data.weeklyThur || data.weeklyFri || data.weeklySat;
      if (!hasAnyDay) {
        return 'At least one day of the week must be selected for weekly tasks';
      }
      if (data.weeklyEveryXWeeks && (data.weeklyEveryXWeeks < 1 || data.weeklyEveryXWeeks > 52)) {
        return 'Weekly frequency must be between 1 and 52 weeks';
      }
      break;
    
    case 'MONTHLY':
      if (!data.monthlyMode) {
        return 'Monthly mode is required for monthly tasks';
      }
      if (!['DAY_OF_MONTH', 'DAY_OF_WEEK', 'WEEKDAY_OF_MONTH', 'WEEKEND_DAY_OF_MONTH'].includes(data.monthlyMode)) {
        return 'Invalid monthly mode';
      }
      if (data.monthlyEveryXMonths && (data.monthlyEveryXMonths < 1 || data.monthlyEveryXMonths > 12)) {
        return 'Monthly frequency must be between 1 and 12 months';
      }
      break;
    
    case 'YEARLY':
      if (data.yearlyEveryXYears && (data.yearlyEveryXYears < 1 || data.yearlyEveryXYears > 10)) {
        return 'Yearly frequency must be between 1 and 10 years';
      }
      break;
  }
  
  return null;
}
