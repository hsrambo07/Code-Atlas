#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import os from 'os';

const prisma = new PrismaClient();

async function debugExtraction() {
  console.log('🔍 Debugging File Extraction Issues\n');

  try {
    // Check recent jobs
    const recentJob = await prisma.job.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!recentJob) {
      console.log('❌ No jobs found');
      return;
    }

    console.log(`📋 Recent Job: ${recentJob.id}`);
    console.log(`   Status: ${recentJob.status}`);
    console.log(`   Extract Path: ${recentJob.extractPath}`);
    console.log(`   Message: ${recentJob.message}\n`);

    // Check if extract path exists
    if (recentJob.extractPath) {
      try {
        const extractStats = await stat(recentJob.extractPath);
        console.log(`📂 Extract path exists: ${recentJob.extractPath}`);
        
        // List contents
        const contents = await readdir(recentJob.extractPath);
        console.log(`   Contents (${contents.length} items):`);
        
        for (const item of contents) {
          const itemPath = path.join(recentJob.extractPath, item);
          try {
            const itemStats = await stat(itemPath);
            const type = itemStats.isDirectory() ? '📁' : '📄';
            console.log(`     ${type} ${item}`);
            
            // If it's a directory, show its contents too
            if (itemStats.isDirectory()) {
              try {
                const subContents = await readdir(itemPath);
                console.log(`       └─ ${subContents.length} items: ${subContents.slice(0, 5).join(', ')}${subContents.length > 5 ? '...' : ''}`);
              } catch (error) {
                console.log(`       └─ Error reading: ${error}`);
              }
            }
          } catch (error) {
            console.log(`     ❌ ${item} (error: ${error})`);
          }
        }
        console.log();
      } catch (error) {
        console.log(`❌ Extract path doesn't exist: ${error}\n`);
      }
    }

    // Check temp directory for recent extracts
    console.log('🗂️ Checking temp directory for recent extracts...');
    const tempDir = os.tmpdir();
    try {
      const tempContents = await readdir(tempDir);
      const extractDirs = tempContents.filter(item => item.startsWith('extract-'));
      
      console.log(`   Found ${extractDirs.length} extract directories in temp:`);
      for (const dir of extractDirs.slice(0, 3)) {
        const dirPath = path.join(tempDir, dir);
        try {
          const dirStats = await stat(dirPath);
          const age = Date.now() - dirStats.mtime.getTime();
          const ageMinutes = Math.floor(age / (1000 * 60));
          console.log(`     📁 ${dir} (${ageMinutes} minutes old)`);
          
          const dirContents = await readdir(dirPath);
          console.log(`       └─ ${dirContents.length} items: ${dirContents.slice(0, 3).join(', ')}${dirContents.length > 3 ? '...' : ''}`);
        } catch (error) {
          console.log(`     ❌ ${dir} (error: ${error})`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error reading temp directory: ${error}`);
    }
    console.log();

    // Check database files
    console.log('💾 Checking database files...');
    const files = await prisma.file.findMany({
      include: {
        functions: true
      }
    });

    console.log(`   📁 Found ${files.length} files in database:`);
    files.forEach(file => {
      console.log(`     📄 ${file.path} (${file.lang}, ${file.functions.length} functions)`);
      console.log(`        Size: ${file.size} bytes`);
      console.log(`        Summary: ${file.summary?.substring(0, 100)}...`);
    });

    // Check tree API
    console.log('\n🌳 Testing tree API...');
    try {
      const response = await fetch('http://localhost:3000/api/tree');
      const treeData = await response.json();
      
      if (treeData.success) {
        console.log(`   ✅ Tree API working`);
        console.log(`   📊 Stats:`, treeData.stats);
        
        // Show tree structure
        const showTree = (node: any, indent = '') => {
          const icon = node.type === 'dir' ? '📁' : node.type === 'function' ? '🔧' : '📄';
          console.log(`${indent}${icon} ${node.name} (${node.type})`);
          if (node.children) {
            node.children.slice(0, 5).forEach((child: any) => showTree(child, indent + '  '));
            if (node.children.length > 5) {
              console.log(`${indent}  ... and ${node.children.length - 5} more`);
            }
          }
        };
        
        console.log('\n   🌳 Tree structure:');
        showTree(treeData.tree);
      } else {
        console.log(`   ❌ Tree API error:`, treeData.error);
      }
    } catch (error) {
      console.log(`   ❌ Tree API request failed:`, error);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugExtraction(); 