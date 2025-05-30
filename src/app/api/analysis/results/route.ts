import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get the job to verify it exists and is completed
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Job not completed yet' },
        { status: 400 }
      );
    }

    // Get all files with their functions
    const files = await prisma.file.findMany({
      include: {
        functions: {
          orderBy: { start: 'asc' }
        }
      },
      orderBy: { path: 'asc' }
    });

    // Calculate language breakdown
    const languages: { [key: string]: number } = {};
    files.forEach(file => {
      languages[file.lang] = (languages[file.lang] || 0) + 1;
    });

    // Calculate total functions
    const totalFunctions = files.reduce((sum, file) => sum + file.functions.length, 0);

    // Format the response
    const analysisData = {
      files: files.map(file => ({
        id: file.id,
        path: file.path,
        lang: file.lang,
        size: file.size,
        summary: file.summary,
        functions: file.functions.map(func => ({
          id: func.id,
          name: func.name,
          summary: func.summary,
          startLine: func.start,
          endLine: func.end,
        }))
      })),
      totalFunctions,
      languages,
      functionComplexity: {
        low: 0,    // We'll implement complexity calculation later
        medium: 0,
        high: 0,
      }
    };

    return NextResponse.json({
      success: true,
      analysis: analysisData,
      job: {
        id: job.id,
        status: job.status,
        message: job.message,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      }
    });

  } catch (error) {
    console.error('Error fetching analysis results:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 