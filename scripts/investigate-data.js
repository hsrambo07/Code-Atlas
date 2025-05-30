#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { ChromaClient } = require('chromadb');

async function investigateData() {
  console.log('🔍 Code Atlas Data Investigation');
  console.log('=' .repeat(60));
  
  const prisma = new PrismaClient();
  
  try {
    // Get all jobs with details
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n📋 Jobs (${jobs.length} total):`);
    jobs.forEach((job, i) => {
      console.log(`  ${i+1}. ${job.id}`);
      console.log(`     Status: ${job.status}`);
      console.log(`     Message: ${job.message || 'None'}`);
      console.log(`     Extract Path: ${job.extractPath || 'None'}`);
      console.log(`     Created: ${job.createdAt}`);
      console.log('');
    });
    
    // Get all files with full details
    const files = await prisma.file.findMany({
      include: {
        functions: true
      }
    });
    
    console.log(`\n📁 Files in Database (${files.length} total):`);
    files.forEach((file, i) => {
      console.log(`  ${i+1}. ${file.path}`);
      console.log(`     Language: ${file.lang}`);
      console.log(`     Size: ${file.size} bytes`);
      console.log(`     Functions: ${file.functions.length}`);
      console.log(`     Summary: ${file.summary?.substring(0, 100)}...`);
      console.log('');
      
      // Show functions
      file.functions.forEach((func, j) => {
        console.log(`     Function ${j+1}: ${func.name} (lines ${func.start}-${func.end})`);
        console.log(`       Summary: ${func.summary?.substring(0, 80)}...`);
      });
      console.log('');
    });
    
    // Check import and call edges
    const imports = await prisma.importEdge.findMany();
    const calls = await prisma.callEdge.findMany();
    
    console.log(`\n🔗 Relationships:`);
    console.log(`   Import edges: ${imports.length}`);
    console.log(`   Call edges: ${calls.length}`);
    
    if (imports.length > 0) {
      console.log(`\n   Import Details:`);
      imports.forEach((imp, i) => {
        console.log(`     ${i+1}. ${imp.from} → ${imp.to}`);
      });
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  // Check Chroma vector store
  console.log(`\n🧠 Chroma Vector Store:`);
  try {
    const chroma = new ChromaClient({ 
      path: 'http://localhost:8000' 
    });
    
    const collections = await chroma.listCollections();
    console.log(`   Collections: ${collections.length}`);
    
    for (const collection of collections) {
      console.log(`\n   Collection: ${collection.name}`);
      console.log(`     Metadata: ${JSON.stringify(collection.metadata || {})}`);
      
      try {
        const fullCollection = await chroma.getCollection({ name: collection.name });
        const count = await fullCollection.count();
        console.log(`     Document count: ${count}`);
        
        if (count > 0) {
          // Get some sample documents
          const results = await fullCollection.get({
            limit: 3,
            include: ['metadatas', 'documents']
          });
          
          console.log(`     Sample documents:`);
          results.ids.forEach((id, i) => {
            console.log(`       ID: ${id}`);
            console.log(`       Metadata: ${JSON.stringify(results.metadatas[i])}`);
            console.log(`       Content preview: ${results.documents[i]?.substring(0, 100)}...`);
            console.log('');
          });
        }
      } catch (error) {
        console.log(`     Error accessing collection: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Chroma error:', error.message);
  }
  
  console.log('=' .repeat(60));
}

investigateData().catch(console.error); 