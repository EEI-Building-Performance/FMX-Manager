import { NextRequest } from 'next/server';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const pmTemplateId = searchParams.get('pmTemplateId');

    const whereClause = pmTemplateId ? { pmTemplateId: parseInt(pmTemplateId) } : {};

    const assignments = await prisma.pMTemplateAssignment.findMany({
      where: whereClause,
      include: {
        pmTemplate: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        equipment: {
          include: {
            building: {
              select: {
                id: true,
                name: true,
                fmxBuildingName: true
              }
            }
          }
        }
      },
      orderBy: [
        { pmTemplate: { name: 'asc' } },
        { equipment: { building: { name: 'asc' } } },
        { equipment: { name: 'asc' } }
      ]
    });

    return successResponse(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return errorResponse('Failed to fetch assignments');
  }
}

export async function POST(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { pmTemplateId, equipmentIds, assignedUsers, outsourced, remindBeforeDaysPrimary, remindBeforeDaysSecondary, remindAfterDays } = await request.json();

    if (!pmTemplateId || !equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return errorResponse('PM Template ID and equipment IDs are required', 400);
    }

    // Validate that the PM template exists
    const pmTemplate = await prisma.pMTemplate.findUnique({
      where: { id: parseInt(pmTemplateId) }
    });

    if (!pmTemplate) {
      return errorResponse('PM Template not found', 404);
    }

    // Get equipment with building info for validation and building ID
    const equipment = await prisma.equipment.findMany({
      where: { id: { in: equipmentIds.map((id: any) => parseInt(id)) } },
      include: { building: true }
    });

    if (equipment.length !== equipmentIds.length) {
      return errorResponse('One or more equipment items not found', 400);
    }

    // Check for existing assignments to prevent duplicates
    const existingAssignments = await prisma.pMTemplateAssignment.findMany({
      where: {
        pmTemplateId: parseInt(pmTemplateId),
        equipmentId: { in: equipmentIds.map((id: any) => parseInt(id)) }
      }
    });

    if (existingAssignments.length > 0) {
      const conflictingEquipment = equipment.filter(eq => 
        existingAssignments.some(assignment => assignment.equipmentId === eq.id)
      );
      return errorResponse(
        `PM Template is already assigned to: ${conflictingEquipment.map(eq => `${eq.name} (${eq.building.name})`).join(', ')}`, 
        400
      );
    }

    // Create assignments
    const assignments = await prisma.pMTemplateAssignment.createMany({
      data: equipmentIds.map((equipmentId: any) => {
        const eq = equipment.find(e => e.id === parseInt(equipmentId));
        return {
          pmTemplateId: parseInt(pmTemplateId),
          equipmentId: parseInt(equipmentId),
          buildingId: eq!.buildingId,
          assignedUsers: assignedUsers?.trim() || null,
          outsourced: Boolean(outsourced),
          remindBeforeDaysPrimary: remindBeforeDaysPrimary ? parseInt(remindBeforeDaysPrimary) : null,
          remindBeforeDaysSecondary: remindBeforeDaysSecondary ? parseInt(remindBeforeDaysSecondary) : null,
          remindAfterDays: remindAfterDays ? parseInt(remindAfterDays) : null
        };
      })
    });

    return successResponse({ created: assignments.count }, 201);
  } catch (error) {
    console.error('Error creating assignments:', error);
    return errorResponse('Failed to create assignments');
  }
}
