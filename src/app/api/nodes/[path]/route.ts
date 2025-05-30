import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string }> }
) {
  try {
    const { path: encodedPath } = await context.params;
    const filePath = decodeURIComponent(encodedPath);

    // Get file details
    const file = await prisma.file.findUnique({
      where: { path: filePath },
      include: {
        functions: {
          orderBy: { start: 'asc' }
        }
      }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get import relationships
    const imports = await prisma.importEdge.findMany({
      where: { from: filePath }
    });

    const importedBy = await prisma.importEdge.findMany({
      where: { to: filePath }
    });

    // Calculate file metrics
    const fileMetrics = {
      complexity: file.functions.reduce((sum, func) => sum + (func.summary.includes('complexity') ? 1 : 0), 0),
      functionCount: file.functions.length,
      importCount: imports.length,
      dependentCount: importedBy.length,
    };

    // Get function details with enhanced data
    const functionsWithDetails = file.functions.map(func => ({
      id: func.id,
      name: func.name,
      summary: func.summary,
      startLine: Math.floor(func.start / 50), // Rough line estimation
      endLine: Math.floor(func.end / 50),
      complexity: func.summary.includes('complexity') ? 
        parseInt(func.summary.match(/complexity (\d+)/)?.[1] || '1') : 1,
    }));

    const nodeData = {
      id: file.id,
      path: file.path,
      name: path.basename(file.path),
      type: 'file',
      language: file.lang,
      size: file.size,
      summary: file.summary,
      metrics: fileMetrics,
      functions: functionsWithDetails,
      imports: imports.map(imp => ({
        to: imp.to,
        type: 'import'
      })),
      importedBy: importedBy.map(imp => ({
        from: imp.from,
        type: 'imported_by'
      })),
      lastAnalyzed: file.id // Using file ID as a proxy for when it was analyzed
    };

    return NextResponse.json(nodeData);
  } catch (error) {
    console.error('Error fetching node data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 