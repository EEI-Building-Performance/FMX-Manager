import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const buildings = await prisma.building.findMany({
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        _count: {
          select: { equipment: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return successResponse(buildings);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return errorResponse('Failed to fetch buildings');
  }
}

export async function POST(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name, fmxBuildingName } = body;

    if (!name || !fmxBuildingName) {
      return errorResponse('Name and FMX Building Name are required', 400);
    }

    const building = await prisma.building.create({
      data: {
        name: name.trim(),
        fmxBuildingName: fmxBuildingName.trim(),
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        _count: {
          select: { equipment: true }
        }
      }
    });

    return successResponse(building, 201);
  } catch (error: unknown) {
    console.error('Error creating building:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return errorResponse('Building with this name or FMX name already exists', 409);
    }
    
    return errorResponse('Failed to create building');
  }
}
