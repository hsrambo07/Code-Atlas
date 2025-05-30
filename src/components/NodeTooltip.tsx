'use client';

import React from 'react';

interface NodeMetrics {
  complexity: number;
  functionCount: number;
  importCount: number;
  dependentCount: number;
}

interface NodeFunction {
  id: string;
  name: string;
  summary: string;
  startLine: number;
  endLine: number;
  complexity: number;
}

interface NodeRelation {
  to?: string;
  from?: string;
  type: string;
}

interface AnalysisData {
  id: string;
  path: string;
  name: string;
  type: string;
  language: string;
  size: number;
  summary: string;
  metrics: NodeMetrics;
  functions: NodeFunction[];
  imports: NodeRelation[];
  importedBy: NodeRelation[];
  lastAnalyzed: string;
}

interface CustomNodeData {
  label: string;
  type: 'file' | 'dir' | 'function';
  path: string;
  isRoot: boolean;
  metadata?: {
    summary?: string;
    language?: string;
    size?: number;
    functionCount?: number;
    fileCount?: number;
    type?: string;
    startLine?: number;
    endLine?: number;
    complexity?: 'low' | 'medium' | 'high';
    parameters?: string[];
    returnType?: string;
  };
}

interface NodeTooltipProps {
  data: CustomNodeData;
  analysisData?: AnalysisData | null;
  position: { x: number; y: number };
  isLoading?: boolean;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({ 
  data, 
  analysisData, 
  position, 
  isLoading = false 
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getComplexityColor = (complexity: number | string) => {
    if (typeof complexity === 'string') {
      const colors = {
        'low': 'text-green-600',
        'medium': 'text-yellow-600',
        'high': 'text-red-600'
      };
      return colors[complexity] || 'text-gray-600';
    }
    if (complexity <= 5) return 'text-green-600';
    if (complexity <= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

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

  const getNodeIcon = () => {
    if (data.type === 'dir') return '📁';
    if (data.type === 'function') return '🔧';
    return getLanguageIcon(data.metadata?.language || '');
  };

  const getNodeTypeLabel = () => {
    if (data.type === 'dir') return 'Directory';
    if (data.type === 'function') return 'Function';
    return 'File';
  };

  // Show loading tooltip for files when analysis is being fetched
  if (data.type === 'file' && isLoading) {
    return (
      <div
        className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3"
        style={{
          left: position.x + 10,
          top: position.y - 10,
          pointerEvents: 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <span className="text-sm text-gray-600">Loading analysis...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        pointerEvents: 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 border-b pb-2">
        <span className="text-lg">{getNodeIcon()}</span>
        <div>
          <h3 className="font-semibold text-gray-800 truncate">{data.label}</h3>
          <p className="text-xs text-gray-500">{getNodeTypeLabel()} • {data.path}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700 mb-1">🧠 Summary</h4>
        <p className="text-sm text-gray-600 italic">
          {analysisData?.summary || data.metadata?.summary || `${getNodeTypeLabel()} in the project`}
        </p>
      </div>

      {/* Function-specific information */}
      {data.type === 'function' && (
        <div className="mb-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-blue-700 font-medium">Lines</div>
              <div className="text-blue-600">
                {data.metadata?.startLine && data.metadata?.endLine 
                  ? `${data.metadata.startLine}-${data.metadata.endLine}`
                  : 'Unknown'
                }
              </div>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <div className="text-yellow-700 font-medium">Complexity</div>
              <div className={getComplexityColor(data.metadata?.complexity || 'low')}>
                {data.metadata?.complexity || 'Low'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File-specific information */}
      {data.type === 'file' && analysisData && (
        <div className="mb-3">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-blue-700 font-medium">Size</div>
              <div className="text-blue-600">{formatFileSize(analysisData.size)}</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <div className="text-green-700 font-medium">Functions</div>
              <div className="text-green-600">{analysisData.metrics.functionCount}</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <div className="text-yellow-700 font-medium">Imports</div>
              <div className="text-yellow-600">{analysisData.metrics.importCount}</div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="text-purple-700 font-medium">Used By</div>
              <div className="text-purple-600">{analysisData.metrics.dependentCount}</div>
            </div>
          </div>

          {/* Functions List */}
          {analysisData.functions.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">🔧 Functions</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {analysisData.functions.slice(0, 5).map((func) => (
                  <div key={func.id} className="bg-gray-50 p-2 rounded text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-gray-800">{func.name}</span>
                      <span className={`text-xs ${getComplexityColor(func.complexity)}`}>
                        C:{func.complexity}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1 italic">{func.summary}</p>
                  </div>
                ))}
                {analysisData.functions.length > 5 && (
                  <div className="text-xs text-gray-500 italic">
                    +{analysisData.functions.length - 5} more functions...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Relationships */}
          {(analysisData.imports.length > 0 || analysisData.importedBy.length > 0) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">🔗 Dependencies</h4>
              
              {analysisData.imports.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-gray-600 mb-1">Imports ({analysisData.imports.length}):</div>
                  <div className="text-xs text-gray-500 space-y-1">
                    {analysisData.imports.slice(0, 3).map((imp, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span>→</span>
                        <span className="font-mono truncate">{imp.to}</span>
                      </div>
                    ))}
                    {analysisData.imports.length > 3 && (
                      <div className="italic">+{analysisData.imports.length - 3} more...</div>
                    )}
                  </div>
                </div>
              )}

              {analysisData.importedBy.length > 0 && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">Used by ({analysisData.importedBy.length}):</div>
                  <div className="text-xs text-gray-500 space-y-1">
                    {analysisData.importedBy.slice(0, 3).map((imp, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span>←</span>
                        <span className="font-mono truncate">{imp.from}</span>
                      </div>
                    ))}
                    {analysisData.importedBy.length > 3 && (
                      <div className="italic">+{analysisData.importedBy.length - 3} more...</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Directory-specific information */}
      {data.type === 'dir' && data.metadata && (
        <div className="mb-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data.metadata.fileCount !== undefined && (
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-blue-700 font-medium">Files</div>
                <div className="text-blue-600">{data.metadata.fileCount}</div>
              </div>
            )}
            {data.metadata.functionCount !== undefined && (
              <div className="bg-green-50 p-2 rounded">
                <div className="text-green-700 font-medium">Functions</div>
                <div className="text-green-600">{data.metadata.functionCount}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Basic tooltip for simple cases */}
      {data.type === 'file' && !analysisData && !isLoading && (
        <div className="text-xs text-gray-500">
          {data.metadata?.language && (
            <div>Language: {data.metadata.language}</div>
          )}
          {data.metadata?.size && (
            <div>Size: {formatFileSize(data.metadata.size)}</div>
          )}
        </div>
      )}
    </div>
  );
}; 