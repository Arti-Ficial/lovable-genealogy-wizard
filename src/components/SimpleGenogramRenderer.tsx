import React from 'react';

type GenogramNode = {
  id: string;
  name: string;
  shape: 'circle' | 'rect' | 'square';
  x: number;
  y: number;
  isEgo?: boolean;
};

type GenogramLine = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

type GenogramData = {
  nodes: GenogramNode[];
  lines: GenogramLine[];
};

type SimpleGenogramRendererProps = {
  data: GenogramData;
};

const SimpleGenogramRenderer = ({ data }: SimpleGenogramRendererProps) => {
  const { nodes, lines } = data;
  
  // Calculate SVG dimensions based on node positions
  const margin = 100;
  const nodeSize = 80;
  const minX = Math.min(...nodes.map(n => n.x)) - nodeSize/2 - margin;
  const maxX = Math.max(...nodes.map(n => n.x)) + nodeSize/2 + margin;
  const minY = Math.min(...nodes.map(n => n.y)) - nodeSize/2 - margin;
  const maxY = Math.max(...nodes.map(n => n.y)) + nodeSize/2 + margin;
  
  const svgWidth = maxX - minX;
  const svgHeight = maxY - minY;
  
  // Adjust coordinates to SVG coordinate system
  const adjustedNodes = nodes.map(node => ({
    ...node,
    x: node.x - minX,
    y: node.y - minY
  }));
  
  const adjustedLines = lines.map(line => ({
    ...line,
    fromX: line.fromX - minX,
    fromY: line.fromY - minY,
    toX: line.toX - minX,
    toY: line.toY - minY
  }));

  // Function to create orthogonal paths
  const createOrthogonalPath = (line: any) => {
    const { fromX, fromY, toX, toY, type } = line;
    
    // For partnership lines (horizontal connections on same level)
    if (Math.abs(fromY - toY) < 10 && type === 'partner') {
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }
    
    // For parent-child relationships (vertical connections with orthogonal routing)
    if (type === 'parent-child' || Math.abs(fromY - toY) > 10) {
      const midY = fromY + (toY - fromY) / 2;
      return `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
    }
    
    // Default orthogonal routing for other connections
    if (Math.abs(fromX - toX) > Math.abs(fromY - toY)) {
      // Horizontal routing
      const midX = fromX + (toX - fromX) / 2;
      return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
    } else {
      // Vertical routing
      const midY = fromY + (toY - fromY) / 2;
      return `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
    }
  };

  const PersonNode = ({ node }: { node: GenogramNode }) => {
    const size = 80;
    const halfSize = size / 2;
    const isCircle = node.shape === 'circle';
    const isSquare = node.shape === 'rect' || node.shape === 'square';
    
    return (
      <g key={node.id}>
        {isCircle ? (
          <circle
            cx={node.x}
            cy={node.y}
            r={halfSize}
            fill="#fce7f3"
            stroke="#ec4899"
            strokeWidth="2"
          />
        ) : isSquare ? (
          <rect
            x={node.x - halfSize}
            y={node.y - halfSize}
            width={size}
            height={size}
            fill="#e6f3ff"
            stroke="#2563eb"
            strokeWidth="2"
          />
        ) : null}
        <text
          x={node.x}
          y={node.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#1f2937"
        >
          {node.name}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="max-w-full max-h-full"
      >
        {/* Render all lines first (behind nodes) */}
        {adjustedLines.map((line, index) => (
          <path
            key={`line-${index}`}
            d={createOrthogonalPath(line)}
            stroke="#6b7280"
            strokeWidth="2"
            fill="none"
          />
        ))}
        
        {/* Render all nodes on top of lines */}
        {adjustedNodes.map(node => (
          <PersonNode key={node.id} node={node} />
        ))}
      </svg>
    </div>
  );
};

export default SimpleGenogramRenderer;