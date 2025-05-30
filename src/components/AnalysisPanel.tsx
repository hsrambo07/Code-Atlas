'use client';

import React, { useState, useEffect } from 'react';

interface AnalysisPanelProps {
  jobId?: string;
}

interface AnalysisStats {
  totalFiles: number;
  totalFunctions: number;
  totalImports: number;
  languageBreakdown: { [lang: string]: number };
  complexityStats: {
    low: number;
    medium: number;
    high: number;
  };
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ jobId }) => {
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (jobId) {
      // Fetch analysis stats
      fetch(`/api/analysis/stats?jobId=${jobId}`)
        .then(res => res.json())
        .then(data => {
          // Ensure we have valid data structure
          if (data && typeof data === 'object') {
            setStats({
              totalFiles: data.totalFiles || 0,
              totalFunctions: data.totalFunctions || 0,
              totalImports: data.totalImports || 0,
              languageBreakdown: data.languageBreakdown || {},
              complexityStats: {
                low: data.complexityStats?.low || 0,
                medium: data.complexityStats?.medium || 0,
                high: data.complexityStats?.high || 0,
              }
            });
          }
        })
        .catch(error => console.warn('Failed to fetch analysis stats:', error));
    }
  }, [jobId]);

  // Don't render if no stats available
  if (!stats) {
    return null;
  }

  // Calculate total complexity items safely
  const totalComplexityItems = (stats.complexityStats?.low || 0) + 
                              (stats.complexityStats?.medium || 0) + 
                              (stats.complexityStats?.high || 0);

  const agents = [
    { 
      icon: '🗂️', 
      name: 'Unzipper Agent', 
      description: 'File extraction and tree generation',
      status: 'completed'
    },
    { 
      icon: '🧠', 
      name: 'Summarizer Agent', 
      description: 'AI-powered code understanding using GPT',
      status: 'completed'
    },
    { 
      icon: '🔍', 
      name: 'Linker Agent', 
      description: 'Dependency and connection detection',
      status: 'completed'
    },
    { 
      icon: '📦', 
      name: 'Chunker Agent', 
      description: 'Content optimization for AI processing',
      status: 'completed'
    },
    { 
      icon: '🔍', 
      name: 'Embedder Agent', 
      description: 'Vector search using OpenAI embeddings',
      status: 'completed'
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-16'
      }`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            {isExpanded && (
              <span className="font-medium text-gray-700">AI Analysis</span>
            )}
          </div>
          {isExpanded && (
            <svg 
              className="w-4 h-4 text-gray-400 transform transition-transform"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 pt-0">
            {/* Multi-Agent Status */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Multi-Agent System</h3>
              <div className="space-y-2">
                {agents.map((agent, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className="text-base">{agent.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-700">{agent.name}</div>
                      <div className="text-gray-500">{agent.description}</div>
                    </div>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Statistics */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Analysis Results</h3>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.totalFiles}</div>
                  <div className="text-xs text-blue-700">Files</div>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-green-600">{stats.totalFunctions}</div>
                  <div className="text-xs text-green-700">Functions</div>
                </div>
                <div className="bg-yellow-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-yellow-600">{stats.totalImports}</div>
                  <div className="text-xs text-yellow-700">Imports</div>
                </div>
                <div className="bg-purple-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {totalComplexityItems}
                  </div>
                  <div className="text-xs text-purple-700">Analyzed</div>
                </div>
              </div>

              {/* Language Breakdown */}
              <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-600 mb-2">Languages Detected</h4>
                <div className="space-y-1">
                  {Object.entries(stats.languageBreakdown).map(([lang, count]) => (
                    <div key={lang} className="flex justify-between items-center text-xs">
                      <span className="text-gray-700">.{lang}</span>
                      <span className="text-gray-500">{count} files</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complexity Distribution */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Code Complexity</h4>
                {totalComplexityItems > 0 ? (
                  <>
                    <div className="flex gap-1">
                      <div 
                        className="bg-green-500 h-2 rounded-l"
                        style={{ 
                          width: `${(stats.complexityStats.low / totalComplexityItems) * 100}%` 
                        }}
                      ></div>
                      <div 
                        className="bg-yellow-500 h-2"
                        style={{ 
                          width: `${(stats.complexityStats.medium / totalComplexityItems) * 100}%` 
                        }}
                      ></div>
                      <div 
                        className="bg-red-500 h-2 rounded-r"
                        style={{ 
                          width: `${(stats.complexityStats.high / totalComplexityItems) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-500 italic">No complexity data available</div>
                )}
              </div>
            </div>

            {/* Features Available */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Features</h3>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <span>✅</span>
                  <span>AI-powered hover tooltips</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>✅</span>
                  <span>Function complexity analysis</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>✅</span>
                  <span>Import dependency mapping</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>✅</span>
                  <span>Vector search capabilities</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>✅</span>
                  <span>Language-specific parsing</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 