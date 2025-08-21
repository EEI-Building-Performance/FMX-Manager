import { NextRequest } from 'next/server';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const pmTemplateId = searchParams.get('pmTemplateId');

    if (!buildingId) {
      return errorResponse('Building ID is required', 400);
    }

    const buildingIdInt = parseInt(buildingId);
    if (isNaN(buildingIdInt)) {
      return errorResponse('Invalid building ID', 400);
    }

    // Get all equipment in the building
    const whereClause: Record<string, unknown> = { buildingId: buildingIdInt };

    // If pmTemplateId is provided, we want to exclude equipment already assigned to this template
    let excludeEquipmentIds: number[] = [];
    if (pmTemplateId) {
      const pmTemplateIdInt = parseInt(pmTemplateId);
      if (!isNaN(pmTemplateIdInt)) {
        const existingAssignments = await prisma.pMTemplateAssignment.findMany({
          where: { 
            pmTemplateId: pmTemplateIdInt,
            buildingId: buildingIdInt
          },
          select: { equipmentId: true }
        });
        excludeEquipmentIds = existingAssignments.map(a => a.equipmentId);
        
        if (excludeEquipmentIds.length > 0) {
          whereClause.id = { notIn: excludeEquipmentIds };
        }
      }
    }

    const equipment = await prisma.equipment.findMany({
      where: whereClause,
      include: {
        building: {
          select: {
            id: true,
            name: true,
            fmxBuildingName: true
          }
        },
        _count: {
          select: {
            assignments: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    // Get unique equipment types for filtering
    const equipmentTypes = [...new Set(equipment.map(eq => eq.type))].sort();

    return successResponse({
      equipment,
      equipmentTypes,
      excludedCount: excludeEquipmentIds.length
    });
  } catch (error) {
    console.error('Error fetching available equipment:', error);
    return errorResponse('Failed to fetch available equipment');
  }
}
