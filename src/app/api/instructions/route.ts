import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const instructions = await prisma.instructionSet.findMany({
      include: {
        steps: {
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { 
            steps: true,
            tasks: true 
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return successResponse(instructions);
  } catch (error) {
    console.error('Error fetching instructions:', error);
    return errorResponse('Failed to fetch instructions');
  }
}

export async function POST(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name, description, steps } = body;

    if (!name) {
      return errorResponse('Name is required', 400);
    }

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return errorResponse('At least one step is required', 400);
    }

    // Validate steps
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].text || !steps[i].text.trim()) {
        return errorResponse(`Step ${i + 1} cannot be empty`, 400);
      }
    }

    const instruction = await prisma.instructionSet.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        steps: {
          create: steps.map((step: any, index: number) => ({
            text: step.text.trim(),
            orderIndex: index
          }))
        }
      },
      include: {
        steps: {
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { 
            steps: true,
            tasks: true 
          }
        }
      }
    });

    return successResponse(instruction, 201);
  } catch (error: any) {
    console.error('Error creating instruction:', error);
    
    if (error.code === 'P2002') {
      return errorResponse('Instruction with this name already exists', 409);
    }
    
    return errorResponse('Failed to create instruction');
  }
}
