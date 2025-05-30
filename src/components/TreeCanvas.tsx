'use client';

import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TreeNode as TreeNodeType } from '@/types';
import CustomNode from './CustomNode';

interface TreeCanvasProps {
  tree: TreeNodeType;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export default function TreeCanvas({ tree }: TreeCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Convert tree to React Flow nodes and edges
  const convertTreeToFlow = useCallback((treeNode: TreeNodeType) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const processedIds = new Set<string>(); // Prevent duplicates

    // Calculate tree width for better spacing
    const calculateTreeWidth = (node: TreeNodeType): number => {
      if (!node.children || node.children.length === 0) return 1;
      return node.children.reduce((sum, child) => sum + calculateTreeWidth(child), 0);
    };

    const treeWidth = calculateTreeWidth(treeNode);
    const baseSpacing = Math.max(250, Math.min(400, 800 / Math.max(treeWidth, 1)));

    // Recursive function to calculate positions
    const calculatePositions = (
      node: TreeNodeType,
      x: number,
      y: number,
      level: number,
      parentId?: string
    ) => {
      // Prevent duplicate processing
      if (processedIds.has(node.id)) {
        console.warn(`Duplicate node ID detected: ${node.id} (${node.name})`);
        return;
      }
      processedIds.add(node.id);

      // Add node
      nodes.push({
        id: node.id,
        type: 'custom',
        position: { x, y },
        data: {
          label: node.name,
          type: node.type,
          path: node.path,
          isRoot: level === 0,
          metadata: node.metadata,
        },
      });

      // Add edge from parent
      if (parentId) {
        edges.push({
          id: `${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: 'straight',
          style: {
            stroke: '#6b7280',
            strokeWidth: 2,
          },
        });
      }

      // Position children
      if (node.children && node.children.length > 0) {
        const childSpacing = baseSpacing;
        const totalWidth = (node.children.length - 1) * childSpacing;
        const startX = x - totalWidth / 2;

        node.children.forEach((child, index) => {
          const childX = startX + index * childSpacing;
          const childY = y + 180; // Slightly reduced vertical spacing
          calculatePositions(child, childX, childY, level + 1, node.id);
        });
      }
    };

    calculatePositions(treeNode, 0, 0, 0);

    console.log(`Generated ${nodes.length} nodes and ${edges.length} edges`);
    console.log('Nodes:', nodes.map(n => ({ id: n.id, label: n.data.label, type: n.data.type })));

    return { nodes, edges };
  }, []);

  useEffect(() => {
    if (!tree) return;
    
    console.log('Converting tree to flow:', tree);
    const { nodes: flowNodes, edges: flowEdges } = convertTreeToFlow(tree);
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [tree, convertTreeToFlow]);

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 1.2,
        }}
        className="bg-gray-50 dark:bg-gray-900"
      >
        <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
        <MiniMap
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          nodeColor={(node) => {
            if (node.data.type === 'dir') return '#374151';
            if (node.data.type === 'function') {
              const complexity = node.data.metadata?.complexity || 'low';
              const colors = {
                'low': '#16a34a',
                'medium': '#ca8a04',
                'high': '#dc2626'
              };
              return colors[complexity];
            }
            return '#4b5563';
          }}
        />
        <Background
          color="#d1d5db"
          gap={20}
          className="dark:opacity-20"
        />
      </ReactFlow>
    </div>
  );
} 