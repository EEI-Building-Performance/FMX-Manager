import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');

    const where = buildingId ? { buildingId: parseInt(buildingId) } : {};

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        building: {
          select: {
            id: true,
            name: true,
            fmxBuildingName: true,
          }
        },
        _count: {
          select: { assignments: true }
        }
      },
      orderBy: [
        { building: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    return successResponse(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return errorResponse('Failed to fetch equipment');
  }
}

export async function POST(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { buildingId, name, type, fmxEquipmentName } = body;

    if (!buildingId || !name || !type || !fmxEquipmentName) {
      return errorResponse('Building ID, name, type, and FMX Equipment Name are required', 400);
    }

    // Verify building exists
    const building = await prisma.building.findUnique({
      where: { id: parseInt(buildingId) }
    });

    if (!building) {
      return errorResponse('Building not found', 400);
    }

    const equipment = await prisma.equipment.create({
      data: {
        buildingId: parseInt(buildingId),
        name: name.trim(),
        type: type.trim(),
        fmxEquipmentName: fmxEquipmentName.trim(),
      },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            fmxBuildingName: true,
          }
        },
        _count: {
          select: { assignments: true }
        }
      }
    });

    return successResponse(equipment, 201);
  } catch (error: any) {
    console.error('Error creating equipment:', error);
    
    if (error.code === 'P2002') {
      return errorResponse('Equipment with this FMX name already exists', 409);
    }
    
    return errorResponse('Failed to create equipment');
  }
}
