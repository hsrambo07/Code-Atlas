'use client';

import React, { useState, useEffect } from 'react';

interface AnalysisResultsProps {
  jobId: string;
}

interface FileAnalysis {
  id: string;
  path: string;
  lang: string;
  size: number;
  summary?: string;
  functions: Array<{
    id: string;
    name: string;
    summary?: string;
    startLine: number;
    endLine: number;
  }>;
}

interface AnalysisData {
  files: FileAnalysis[];
  totalFunctions: number;
  languages: { [key: string]: number };
  functionComplexity: {
    low: number;
    medium: number;
    high: number;
  };
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ jobId }) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisResults();
  }, [jobId]);

  const fetchAnalysisResults = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analysis/results?jobId=${jobId}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data.analysis);
        if (data.analysis.files.length > 0) {
          setSelectedFile(data.analysis.files[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analysis results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analysis results...</span>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Data</h3>
          <p className="text-gray-600">Analysis results are not yet available.</p>
        </div>
      </div>
    );
  }

  const getLanguageIcon = (lang: string) => {
    const icons: { [key: string]: string } = {
      'js': '🟨',
      'ts': '🔷',
      'jsx': '⚛️',
      'tsx': '⚛️',
      'py': '🐍',
      'java': '☕',
      'go': '🔄',
      'rs': '🦀',
    };
    return icons[lang] || '📄';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">🧠 AI Code Analysis Results</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{analysisData.files.length}</div>
            <div className="text-blue-100">Files Analyzed</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{analysisData.totalFunctions}</div>
            <div className="text-blue-100">Functions Found</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{Object.keys(analysisData.languages).length}</div>
            <div className="text-blue-100">Languages</div>
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* File List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Analyzed Files</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {analysisData.files.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedFile?.id === file.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getLanguageIcon(file.lang)}</span>
                  <span className="font-medium text-gray-900 truncate">
                    {file.path.split('/').pop()}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {file.functions.length} functions • {Math.round(file.size / 1024)}KB
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {file.path}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* File Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedFile ? (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getLanguageIcon(selectedFile.lang)}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedFile.path.split('/').pop()}
                    </h3>
                    <p className="text-gray-600">{selectedFile.path}</p>
                  </div>
                </div>
                
                {selectedFile.summary && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🤖 AI Summary</h4>
                    <p className="text-blue-800">{selectedFile.summary}</p>
                  </div>
                )}
              </div>

              {/* Functions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Functions ({selectedFile.functions.length})
                </h4>
                {selectedFile.functions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedFile.functions.map((func) => (
                      <div key={func.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {func.name}()
                          </span>
                          <span className="text-xs text-gray-500">
                            Lines {func.startLine}-{func.endLine}
                          </span>
                        </div>
                        {func.summary && (
                          <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                            💡 {func.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <p>No functions detected in this file</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📄</div>
                <p>Select a file to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">Languages:</span>
            {Object.entries(analysisData.languages).map(([lang, count]) => (
              <div key={lang} className="flex items-center gap-1">
                <span>{getLanguageIcon(lang)}</span>
                <span className="text-sm font-medium">{lang}</span>
                <span className="text-xs text-gray-500">({count})</span>
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-500">
            Total size: {Math.round(analysisData.files.reduce((sum, f) => sum + f.size, 0) / 1024)}KB
          </div>
        </div>
      </div>
    </div>
  );
}; 