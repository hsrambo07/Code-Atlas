import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    // Get overall statistics
    const [files, functions, imports] = await Promise.all([
      prisma.file.findMany(),
      prisma.function.findMany(),
      prisma.importEdge.findMany()
    ]);

    // Calculate language breakdown
    const languageBreakdown: { [lang: string]: number } = {};
    files.forEach(file => {
      languageBreakdown[file.lang] = (languageBreakdown[file.lang] || 0) + 1;
    });

    // Calculate complexity stats (simplified)
    const complexityStats = {
      low: 0,
      medium: 0,
      high: 0
    };

    functions.forEach(func => {
      const summaryText = func.summary.toLowerCase();
      if (summaryText.includes('complexity')) {
        // Try to extract complexity number from summary
        const complexityMatch = summaryText.match(/complexity[:\s]*(\d+)/);
        const complexity = complexityMatch ? parseInt(complexityMatch[1]) : 1;
        
        if (complexity <= 5) complexityStats.low++;
        else if (complexity <= 10) complexityStats.medium++;
        else complexityStats.high++;
      } else {
        // Default to low complexity if not specified
        complexityStats.low++;
      }
    });

    const stats = {
      totalFiles: files.length,
      totalFunctions: functions.length,
      totalImports: imports.length,
      languageBreakdown,
      complexityStats
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching analysis stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 