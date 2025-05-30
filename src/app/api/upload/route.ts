import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, stat, readdir } from 'fs/promises';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { TreeNode } from '@/types';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Check file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large (max 25MB)' }, { status: 400 });
    }

    // Create temporary file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = path.join(os.tmpdir(), `upload-${uuidv4()}.zip`);
    
    try {
      await writeFile(tempFilePath, buffer);

      // Extract zip
      const zip = new AdmZip(tempFilePath);
      const extractPath = path.join(os.tmpdir(), `extract-${uuidv4()}`);
      zip.extractAllTo(extractPath, true);

      // Find the actual root directory (skip wrapper directories)
      const actualRoot = await findActualRoot(extractPath);
      console.log('Extract path:', extractPath);
      console.log('Actual root:', actualRoot);

      // Generate tree for immediate display
      const tree = await generateTree(actualRoot, actualRoot);
      console.log('Generated tree:', JSON.stringify(tree, null, 2));

      // Create ingest job
      const job = await prisma.job.create({
        data: {
          status: 'pending',
          message: 'Job created, waiting to start processing...',
          extractPath: actualRoot,
        },
      });

      // Launch ingest worker in background
      launchIngestWorker(job.id, actualRoot);

      // Cleanup original zip file
      await unlink(tempFilePath);
      
      return NextResponse.json({ 
        success: true, 
        tree,
        jobId: job.id,
        message: 'File uploaded and processing started'
      });
    } catch (error) {
      // Cleanup on error
      try {
        await unlink(tempFilePath);
      } catch {}
      
      throw error;
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function launchIngestWorker(jobId: string, extractPath: string) {
  console.log(`🚀 Launching ingest worker for job ${jobId}`);
  
  // Use tsx from node_modules to run the TypeScript worker
  const workerPath = path.join(process.cwd(), 'src/workers/ingest-worker.ts');
  const tsxPath = path.join(process.cwd(), 'node_modules/.bin/tsx');
  
  const worker = spawn(tsxPath, [
    workerPath,
    jobId,
    extractPath
  ], {
    detached: true,
    stdio: 'ignore', // Don't pipe stdio to avoid blocking
    env: { ...process.env }, // Pass environment variables
  });

  // Detach the worker process so it can run independently
  worker.unref();
  
  console.log(`✅ Worker launched with PID: ${worker.pid}`);
}

async function findActualRoot(extractPath: string): Promise<string> {
  try {
    let currentPath = extractPath;
    let depth = 0;
    const maxDepth = 10; // Increased depth for nested projects
    
    console.log(`🔍 Starting search for actual root from: ${extractPath}`);
    
    while (depth < maxDepth) {
      const entries = await readdir(currentPath);
      console.log(`Depth ${depth}, checking path: ${currentPath}`);
      console.log(`Entries found:`, entries);
      
      // Filter out hidden files and system files
      const validEntries = entries.filter(entry => 
        !entry.startsWith('.') && 
        !entry.startsWith('__MACOSX') &&
        entry !== 'Thumbs.db'
      );
      
      console.log(`Valid entries:`, validEntries);
      
      // Check if current directory has actual source files
      const sourceFiles = validEntries.filter(entry => {
        const ext = path.extname(entry).toLowerCase();
        return ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h'].includes(ext);
      });
      
      // Check if current directory has package.json, tsconfig.json, or other project indicators
      const projectFiles = validEntries.filter(entry => {
        return ['package.json', 'tsconfig.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'pom.xml', 'main.ts', 'index.ts', 'src'].includes(entry);
      });
      
      console.log(`Source files found: ${sourceFiles.length} - ${sourceFiles.join(', ')}`);
      console.log(`Project indicators found: ${projectFiles.length} - ${projectFiles.join(', ')}`);
      
      // Score this directory
      let score = sourceFiles.length * 2 + projectFiles.length;
      
      // Bonus points for TypeScript files
      const tsFiles = sourceFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      score += tsFiles.length * 3;
      
      // Bonus for src directory
      if (validEntries.includes('src')) {
        score += 5;
        // Check what's in src directory
        try {
          const srcPath = path.join(currentPath, 'src');
          const srcStats = await stat(srcPath);
          if (srcStats.isDirectory()) {
            const srcContents = await readdir(srcPath);
            const srcSourceFiles = srcContents.filter(entry => {
              const ext = path.extname(entry).toLowerCase();
              return ['.js', '.ts', '.tsx', '.jsx'].includes(ext);
            });
            console.log(`Src directory has ${srcSourceFiles.length} source files: ${srcSourceFiles.join(', ')}`);
            score += srcSourceFiles.length * 2;
          }
        } catch (error) {
          console.log(`Error checking src directory: ${error}`);
        }
      }
      
      console.log(`Directory score: ${score}`);
      
      // If we found a good score, this is likely the root
      if (score >= 3) {
        console.log(`✅ Found good root at: ${currentPath} (score: ${score})`);
        return currentPath;
      }
      
      // If there's only one directory and no source files here, go deeper
      const directories = [];
      for (const entry of validEntries) {
        const entryPath = path.join(currentPath, entry);
        try {
          const stats = await stat(entryPath);
          if (stats.isDirectory()) {
            directories.push(entry);
          }
        } catch (error) {
          console.warn(`Error checking ${entryPath}:`, error);
        }
      }
      
      console.log(`Directories found: ${directories.length} - ${directories.join(', ')}`);
      
      // If there's exactly one directory, go into it
      if (directories.length === 1 && sourceFiles.length === 0) {
        const nextPath = path.join(currentPath, directories[0]);
        console.log(`Going deeper into: ${nextPath}`);
        currentPath = nextPath;
        depth++;
        continue;
      }
      
      // If we have multiple directories, try to find the best one
      if (directories.length > 1 && sourceFiles.length === 0) {
        // Look for common project directory names
        const projectDirNames = ['src', 'app', 'lib', 'components', 'pages', 'api'];
        const projectDir = directories.find(dir => projectDirNames.includes(dir.toLowerCase()));
        
        if (projectDir) {
          const nextPath = path.join(currentPath, projectDir);
          console.log(`Going into project directory: ${nextPath}`);
          currentPath = nextPath;
          depth++;
          continue;
        }
        
        // Otherwise, try the first directory that looks like a project
        for (const dir of directories) {
          if (!dir.startsWith('.') && dir !== 'node_modules' && dir !== 'dist' && dir !== 'build') {
            const nextPath = path.join(currentPath, dir);
            console.log(`Trying directory: ${nextPath}`);
            currentPath = nextPath;
            depth++;
            break;
          }
        }
        continue;
      }
      
      // If we can't go deeper or find indicators, use current path
      break;
    }
    
    console.log(`🎯 Final root selected: ${currentPath}`);
    return currentPath;
  } catch (error) {
    console.warn('Error finding actual root:', error);
    return extractPath;
  }
}

async function generateTree(dirPath: string, basePath: string): Promise<TreeNode> {
  const stats = await stat(dirPath);
  const relativePath = path.relative(basePath, dirPath);
  const name = path.basename(dirPath) || 'root';

  if (stats.isFile()) {
    return {
      id: uuidv4(),
      name,
      type: 'file',
      path: relativePath,
    };
  }

  // Directory
  const children: TreeNode[] = [];
  try {
    const entries = await readdir(dirPath);
    
    // Filter out hidden files, system files, and common build artifacts
    const validEntries = entries.filter(entry => 
      !entry.startsWith('.') && 
      !entry.startsWith('__MACOSX') &&
      entry !== 'Thumbs.db' &&
      entry !== 'node_modules' &&
      entry !== '.git' &&
      entry !== 'dist' &&
      entry !== 'build'
    );
    
    for (const entry of validEntries) {
      const entryPath = path.join(dirPath, entry);
      try {
        const childNode = await generateTree(entryPath, basePath);
        children.push(childNode);
      } catch (error) {
        // Skip problematic entries
        console.warn(`Skipping entry ${entryPath}:`, error);
      }
    }
  } catch (error) {
    console.warn(`Error reading directory ${dirPath}:`, error);
  }

  return {
    id: uuidv4(),
    name,
    type: 'dir',
    path: relativePath,
    children: children.sort((a, b) => {
      // Sort directories first, then files
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }),
  };
} 