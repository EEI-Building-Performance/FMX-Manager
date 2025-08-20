import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const requestTypes = await prisma.requestType.findMany({
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return successResponse(requestTypes);
  } catch (error) {
    console.error('Error fetching request types:', error);
    return errorResponse('Failed to fetch request types');
  }
}

export async function POST(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return errorResponse('Name is required', 400);
    }

    const requestType = await prisma.requestType.create({
      data: {
        name: name.trim(),
      },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    });

    return successResponse(requestType, 201);
  } catch (error: any) {
    console.error('Error creating request type:', error);
    
    if (error.code === 'P2002') {
      return errorResponse('Request type with this name already exists', 409);
    }
    
    return errorResponse('Failed to create request type');
  }
}
