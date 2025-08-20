import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminToken, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const instructionId = parseInt(params.id);
    if (isNaN(instructionId)) {
      return errorResponse('Invalid instruction ID', 400);
    }

    const instruction = await prisma.instructionSet.findUnique({
      where: { id: instructionId },
      include: {
        steps: {
          orderBy: { orderIndex: 'asc' }
        },
        tasks: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: { 
            steps: true,
            tasks: true 
          }
        }
      }
    });

    if (!instruction) {
      return errorResponse('Instruction not found', 404);
    }

    return successResponse(instruction);
  } catch (error) {
    console.error('Error fetching instruction:', error);
    return errorResponse('Failed to fetch instruction');
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const instructionId = parseInt(params.id);
    if (isNaN(instructionId)) {
      return errorResponse('Invalid instruction ID', 400);
    }

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

    // Use transaction to update instruction and replace all steps
    const instruction = await prisma.$transaction(async (tx) => {
      // Delete existing steps
      await tx.instructionStep.deleteMany({
        where: { instructionSetId: instructionId }
      });

      // Update instruction and create new steps
      return await tx.instructionSet.update({
        where: { id: instructionId },
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
    });

    return successResponse(instruction);
  } catch (error: any) {
    console.error('Error updating instruction:', error);
    
    if (error.code === 'P2002') {
      return errorResponse('Instruction with this name already exists', 409);
    }
    
    if (error.code === 'P2025') {
      return errorResponse('Instruction not found', 404);
    }
    
    return errorResponse('Failed to update instruction');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!validateAdminToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const instructionId = parseInt(params.id);
    if (isNaN(instructionId)) {
      return errorResponse('Invalid instruction ID', 400);
    }

    // Check if instruction is used by any task templates
    const taskCount = await prisma.taskTemplate.count({
      where: { instructionId }
    });

    if (taskCount > 0) {
      return errorResponse('Cannot delete instruction that is used by task templates', 409);
    }

    // Delete instruction (steps will be cascade deleted)
    await prisma.instructionSet.delete({
      where: { id: instructionId }
    });

    return successResponse({ message: 'Instruction deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting instruction:', error);
    
    if (error.code === 'P2025') {
      return errorResponse('Instruction not found', 404);
    }
    
    return errorResponse('Failed to delete instruction');
  }
}
