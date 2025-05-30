import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TreeNode } from '@/types';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all files and functions from database
    const files = await prisma.file.findMany({
      include: {
        functions: true
      }
    });

    const folders = await prisma.folder.findMany();

    if (files.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No analyzed files found. Please upload and process a project first.' 
      });
    }

    // Build tree structure with functions
    const tree = buildEnhancedTree(files, folders);

    return NextResponse.json({ 
      success: true, 
      tree,
      stats: {
        files: files.length,
        folders: folders.length,
        functions: files.reduce((sum, file) => sum + file.functions.length, 0)
      }
    });
  } catch (error) {
    console.error('Tree generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate tree' },
      { status: 500 }
    );
  }
}

function buildEnhancedTree(files: any[], folders: any[]): TreeNode {
  // Create a map to store all nodes
  const nodeMap = new Map<string, TreeNode>();
  
  // Add root node
  const rootNode: TreeNode = {
    id: 'root',
    name: 'Project Root',
    type: 'dir',
    path: '',
    children: [],
    metadata: {
      summary: 'Project root directory',
      fileCount: files.length,
      functionCount: files.reduce((sum, file) => sum + file.functions.length, 0)
    }
  };
  nodeMap.set('', rootNode);

  // Add folders
  folders.forEach(folder => {
    const folderNode: TreeNode = {
      id: `folder-${folder.id}`,
      name: folder.path.split('/').pop() || folder.path,
      type: 'dir',
      path: folder.path,
      children: [],
      metadata: {
        summary: folder.summary || 'Folder containing source files',
        type: 'folder'
      }
    };
    nodeMap.set(folder.path, folderNode);
  });

  // Add files with functions
  files.forEach(file => {
    const fileName = file.path.split('/').pop() || file.path;
    const fileNode: TreeNode = {
      id: `file-${file.id}`,
      name: fileName,
      type: 'file',
      path: file.path,
      children: [],
      metadata: {
        summary: file.summary || 'Source code file',
        language: file.lang,
        size: file.size,
        functionCount: file.functions.length,
        type: 'file'
      }
    };

    // Add functions as children of the file
    file.functions.forEach((func: any) => {
      const functionNode: TreeNode = {
        id: `function-${func.id}`,
        name: `🔧 ${func.name}()`,
        type: 'function',
        path: `${file.path}#${func.name}`,
        metadata: {
          summary: func.summary || `Function ${func.name}`,
          startLine: func.start,
          endLine: func.end,
          type: 'function',
          complexity: calculateLineComplexity(func.start, func.end)
        }
      };
      fileNode.children!.push(functionNode);
    });

    nodeMap.set(file.path, fileNode);
  });

  // Build hierarchy
  const processedPaths = new Set<string>();
  
  // Process all paths to create proper hierarchy
  [...folders.map(f => f.path), ...files.map(f => f.path)]
    .sort()
    .forEach(fullPath => {
      if (processedPaths.has(fullPath)) return;
      
      const pathParts = fullPath.split('/').filter(part => part.length > 0);
      let currentPath = '';
      
      pathParts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (processedPaths.has(currentPath)) return;
        
        // If this path doesn't exist as a node, create a directory node
        if (!nodeMap.has(currentPath)) {
          const dirNode: TreeNode = {
            id: `dir-${currentPath}`,
            name: part,
            type: 'dir',
            path: currentPath,
            children: [],
            metadata: {
              summary: `Directory: ${part}`,
              type: 'directory'
            }
          };
          nodeMap.set(currentPath, dirNode);
        }
        
        // Add to parent
        const parentNode = nodeMap.get(parentPath);
        const currentNode = nodeMap.get(currentPath);
        
        if (parentNode && currentNode && !parentNode.children?.find(child => child.id === currentNode.id)) {
          parentNode.children!.push(currentNode);
        }
        
        processedPaths.add(currentPath);
      });
    });

  // Sort children at each level
  const sortChildren = (node: TreeNode) => {
    if (node.children) {
      node.children.sort((a, b) => {
        // Directories first, then files, then functions
        const typeOrder = { 'dir': 0, 'file': 1, 'function': 2 };
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        return a.name.localeCompare(b.name);
      });
      
      node.children.forEach(sortChildren);
    }
  };
  
  sortChildren(rootNode);
  return rootNode;
}

function calculateLineComplexity(start: number, end: number): 'low' | 'medium' | 'high' {
  const lines = end - start;
  if (lines < 10) return 'low';
  if (lines < 50) return 'medium';
  return 'high';
} 