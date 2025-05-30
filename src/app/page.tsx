'use client';

import { useState, useEffect } from 'react';
import Dropzone from '@/components/Dropzone';
import TreeCanvas from '@/components/TreeCanvas';
import JobStatus from '@/components/JobStatus';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { AnalysisResults } from '@/components/AnalysisResults';
import { TreeNode } from '@/types';

export default function Home() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Load tree from localStorage on mount
  useEffect(() => {
    const savedTree = localStorage.getItem('lastUploadedTree');
    const savedJobId = localStorage.getItem('lastJobId');
    
    if (savedTree) {
      try {
        setTree(JSON.parse(savedTree));
      } catch (error) {
        console.error('Failed to parse saved tree:', error);
      }
    }
    
    if (savedJobId) {
      setCurrentJobId(savedJobId);
    }
  }, []);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setShowResults(false);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setTree(data.tree);
        setCurrentJobId(data.jobId);
        
        // Save to localStorage
        localStorage.setItem('lastUploadedTree', JSON.stringify(data.tree));
        localStorage.setItem('lastJobId', data.jobId);
        
        console.log('Upload successful:', data);
      } else {
        console.error('Upload failed:', data.error);
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadNew = () => {
    setTree(null);
    setCurrentJobId(null);
    setShowResults(false);
    localStorage.removeItem('lastUploadedTree');
    localStorage.removeItem('lastJobId');
  };

  const handleJobComplete = () => {
    console.log('🎉 Code analysis completed!');
    // Load enhanced tree with functions from database FIRST
    loadEnhancedTree();
    setShowResults(true);
  };

  const loadEnhancedTree = async () => {
    try {
      const response = await fetch('/api/tree');
      const data = await response.json();
      
      if (data.success && data.tree) {
        console.log('📊 Loaded enhanced tree with functions:', data.stats);
        setTree(data.tree);
        // Update localStorage with enhanced tree
        localStorage.setItem('lastUploadedTree', JSON.stringify(data.tree));
      }
    } catch (error) {
      console.error('Failed to load enhanced tree:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Code Atlas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a ZIP file to visualize your codebase structure and analyze your code
          </p>
        </div>

        {!tree ? (
          <div className="max-w-2xl mx-auto">
            <Dropzone onUpload={handleUpload} isUploading={isUploading} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Job Status */}
            {currentJobId && (
              <div className="max-w-4xl mx-auto">
                <JobStatus 
                  jobId={currentJobId} 
                  onComplete={handleJobComplete}
                />
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleUploadNew}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Upload New File
              </button>
              {currentJobId && (
                <>
                  <button
                    onClick={() => setShowResults(!showResults)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    {showResults ? 'Hide Analysis' : 'View Analysis Results'}
                  </button>
                  <button
                    onClick={loadEnhancedTree}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    🔄 Load Enhanced Tree
                  </button>
                </>
              )}
            </div>

            {/* Analysis Results */}
            {showResults && currentJobId && (
              <div className="max-w-6xl mx-auto">
                <AnalysisResults jobId={currentJobId} />
              </div>
            )}

            {/* Tree Visualization */}
            {!showResults && (
              <div className="h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <TreeCanvas tree={tree} />
              </div>
            )}

            {/* Info Panel */}
            {!showResults && (
              <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Code Analysis Features
                </h2>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">File Tree Visualization</h3>
                    <p>Interactive visualization of your project structure with pan and zoom capabilities.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">AI Code Analysis</h3>
                    <p>Multi-agent AI system with file summaries, function analysis, and relationship mapping.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Database Storage</h3>
                    <p>Structured storage of code metadata in SQLite with full-text search capabilities.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Vector Search</h3>
                    <p>Semantic search capabilities powered by OpenAI embeddings and Chroma vector database.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis Panel - shows when analysis is available */}
        {currentJobId && (
          <AnalysisPanel jobId={currentJobId} />
        )}
      </div>
    </div>
  );
}
