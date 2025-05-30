'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { useState, useEffect } from 'react';
import { NodeTooltip } from './NodeTooltip';

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

interface NodeAnalysisData {
  id: string;
  path: string;
  name: string;
  type: string;
  language: string;
  size: number;
  summary: string;
  metrics: {
    complexity: number;
    functionCount: number;
    importCount: number;
    dependentCount: number;
  };
  functions: Array<{
    id: string;
    name: string;
    summary: string;
    startLine: number;
    endLine: number;
    complexity: number;
  }>;
  imports: Array<{ to: string; type: string }>;
  importedBy: Array<{ from: string; type: string }>;
  lastAnalyzed: string;
}

export default function CustomNode({ data }: NodeProps<CustomNodeData>) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [nodeAnalysis, setNodeAnalysis] = useState<NodeAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isDirectory = data.type === 'dir';
  const isFile = data.type === 'file';
  const isFunction = data.type === 'function';

  // Fetch detailed analysis data for files when hovering
  useEffect(() => {
    if (showTooltip && isFile && !nodeAnalysis && !isLoading) {
      setIsLoading(true);
      fetch(`/api/nodes/${encodeURIComponent(data.path)}`)
        .then(res => res.json())
        .then(analysisData => {
          // Ensure we have valid data structure with safe defaults
          if (analysisData && typeof analysisData === 'object') {
            setNodeAnalysis({
              ...analysisData,
              metrics: {
                complexity: analysisData.metrics?.complexity || 0,
                functionCount: analysisData.metrics?.functionCount || 0,
                importCount: analysisData.metrics?.importCount || 0,
                dependentCount: analysisData.metrics?.dependentCount || 0,
              },
              functions: analysisData.functions || [],
              imports: analysisData.imports || [],
              importedBy: analysisData.importedBy || [],
            });
          }
        })
        .catch(error => {
          console.warn('Failed to fetch node analysis:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [showTooltip, isFile, data.path]);

  const handleMouseEnter = (event: React.MouseEvent) => {
    setShowTooltip(true);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (showTooltip) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const getFileExtension = (path: string) => {
    return path.split('.').pop()?.toLowerCase() || '';
  };

  const getLanguageIcon = (path: string) => {
    const ext = getFileExtension(path);
    const icons: { [key: string]: string } = {
      'js': '🟨',
      'ts': '🔷',
      'jsx': '⚛️',
      'tsx': '⚛️',
      'py': '🐍',
      'java': '☕',
      'go': '🔄',
      'rs': '🦀',
      'json': '📄',
      'md': '📝',
      'css': '🎨',
      'html': '🌐',
    };
    return icons[ext] || '📄';
  };

  const getComplexityColor = (complexity: 'low' | 'medium' | 'high') => {
    const colors = {
      'low': 'text-green-400',
      'medium': 'text-yellow-400',
      'high': 'text-red-400'
    };
    return colors[complexity] || 'text-gray-400';
  };

  const getNodeColor = () => {
    if (data.isRoot) return 'border-blue-400 ring-2 ring-blue-400/20';
    
    if (isFunction) {
      // Color functions by complexity
      const complexity = data.metadata?.complexity || 'low';
      const complexityColors = {
        'low': 'bg-green-600 border-green-500 hover:bg-green-500',
        'medium': 'bg-yellow-600 border-yellow-500 hover:bg-yellow-500',
        'high': 'bg-red-600 border-red-500 hover:bg-red-500'
      };
      return complexityColors[complexity];
    }
    
    if (isDirectory) return 'bg-slate-700 border-slate-600 hover:bg-slate-600';
    
    // Color files based on language
    const ext = getFileExtension(data.path);
    const colors: { [key: string]: string } = {
      'js': 'bg-yellow-600 border-yellow-500 hover:bg-yellow-500',
      'ts': 'bg-blue-600 border-blue-500 hover:bg-blue-500',
      'jsx': 'bg-cyan-600 border-cyan-500 hover:bg-cyan-500',
      'tsx': 'bg-cyan-600 border-cyan-500 hover:bg-cyan-500',
      'py': 'bg-green-600 border-green-500 hover:bg-green-500',
      'java': 'bg-orange-600 border-orange-500 hover:bg-orange-500',
      'go': 'bg-teal-600 border-teal-500 hover:bg-teal-500',
      'rs': 'bg-red-600 border-red-500 hover:bg-red-500',
    };
    return colors[ext] || 'bg-slate-600 border-slate-500 hover:bg-slate-500';
  };

  const getNodeSize = () => {
    if (isFunction) return 'px-3 py-2'; // Smaller for functions
    if (isDirectory) return 'px-4 py-3'; // Default for directories
    return 'px-4 py-3'; // Default for files
  };

  return (
    <div className="relative">
      <div
        className={`
          ${getNodeSize()} rounded-lg border-2 shadow-md cursor-pointer transition-all duration-200
          ${getNodeColor()}
          hover:shadow-lg hover:scale-105
        `}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center space-x-2 text-white">
          {/* Enhanced Icon */}
          <div className="w-5 h-5 flex-shrink-0">
            {isDirectory ? (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            ) : isFunction ? (
              <span className="text-sm">🔧</span>
            ) : (
              <span className="text-sm">
                {getLanguageIcon(data.path)}
              </span>
            )}
          </div>
          
          {/* Label */}
          <span className={`text-sm font-medium truncate ${isFunction ? 'max-w-[100px]' : 'max-w-[120px]'}`}>
            {data.label}
          </span>

          {/* Metadata indicators */}
          <div className="flex items-center space-x-1 ml-auto">
            {/* Function complexity indicator */}
            {isFunction && data.metadata?.complexity && (
              <span className={`text-xs ${getComplexityColor(data.metadata.complexity)}`}>
                ●
              </span>
            )}
            
            {/* File analysis indicators */}
            {isFile && nodeAnalysis && nodeAnalysis.metrics && (
              <>
                {(nodeAnalysis.metrics.functionCount || 0) > 0 && (
                  <span className="text-xs bg-white/20 px-1 rounded">
                    {nodeAnalysis.metrics.functionCount}f
                  </span>
                )}
                {(nodeAnalysis.metrics.importCount || 0) > 0 && (
                  <span className="text-xs bg-white/20 px-1 rounded">
                    {nodeAnalysis.metrics.importCount}i
                  </span>
                )}
              </>
            )}
            
            {/* Directory indicators */}
            {isDirectory && data.metadata && (
              <>
                {(data.metadata.fileCount || 0) > 0 && (
                  <span className="text-xs bg-white/20 px-1 rounded">
                    {data.metadata.fileCount}📁
                  </span>
                )}
                {(data.metadata.functionCount || 0) > 0 && (
                  <span className="text-xs bg-white/20 px-1 rounded">
                    {data.metadata.functionCount}🔧
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Connection handles - smaller for functions */}
        <Handle
          type="target"
          position={Position.Top}
          className={`${isFunction ? 'w-1 h-1' : 'w-2 h-2'} !bg-gray-400 border-2 border-white`}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className={`${isFunction ? 'w-1 h-1' : 'w-2 h-2'} !bg-gray-400 border-2 border-white`}
        />
      </div>

      {/* Enhanced Tooltip */}
      {showTooltip && (
        <NodeTooltip
          position={tooltipPosition}
          data={data}
          analysisData={nodeAnalysis}
          isLoading={isLoading}
        />
      )}
    </div>
  );
} 