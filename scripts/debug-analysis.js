#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function debugAnalysis() {
  console.log('🔍 Code Atlas Debug Analysis');
  console.log('=' .repeat(50));
  
  // Check database file
  const dbPath = path.join(process.cwd(), 'prisma', 'atlas.db');
  console.log(`📊 Database file (${dbPath}):`, fs.existsSync(dbPath) ? '✅ EXISTS' : '❌ MISSING');
  
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Modified: ${stats.mtime}`);
  }
  
  // Check uploads directory
  const uploadsPath = path.join(process.cwd(), 'uploads');
  console.log(`📁 Uploads directory:`, fs.existsSync(uploadsPath) ? '✅ EXISTS' : '❌ MISSING');
  
  if (fs.existsSync(uploadsPath)) {
    const files = fs.readdirSync(uploadsPath);
    console.log(`   Files: ${files.length}`);
    files.forEach(file => console.log(`   - ${file}`));
  }
  
  // Check database content
  try {
    const prisma = new PrismaClient();
    
    // Check jobs
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log(`\n💼 Recent jobs: ${jobs.length}`);
    jobs.forEach(job => {
      console.log(`   ${job.id}: ${job.status} - ${job.message || 'No message'}`);
      console.log(`      Created: ${job.createdAt}`);
      console.log(`      Extract path: ${job.extractPath || 'None'}`);
    });
    
    // Check files
    const files = await prisma.file.findMany({
      take: 10,
      include: { functions: true }
    });
    console.log(`\n📄 Files in database: ${files.length}`);
    files.forEach(file => {
      console.log(`   ${file.path} (${file.lang}) - ${file.functions.length} functions`);
    });
    
    // Check functions
    const functionCount = await prisma.function.count();
    console.log(`\n🔧 Total functions: ${functionCount}`);
    
    // Check edges
    const importCount = await prisma.importEdge.count();
    const callCount = await prisma.callEdge.count();
    console.log(`\n🔗 Import edges: ${importCount}`);
    console.log(`🔗 Call edges: ${callCount}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.log(`\n❌ Database error: ${error.message}`);
  }
  
  // Check Chroma
  try {
    const response = await fetch('http://localhost:8000/api/v2/heartbeat');
    if (response.ok) {
      console.log('\n🟢 Chroma server: RUNNING');
    } else {
      console.log('\n🔴 Chroma server: ERROR');
    }
  } catch (error) {
    console.log('\n🔴 Chroma server: NOT RUNNING');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 Summary:');
  console.log('- If database is missing: run `npx prisma db push`');
  console.log('- If no uploads: the ingest worker may be failing');
  console.log('- If Chroma not running: start with `python3 scripts/start-chroma.py`');
  console.log('- Check server logs for worker errors');
}

// Run the debug analysis
debugAnalysis().catch(console.error); 