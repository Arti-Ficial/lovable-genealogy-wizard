import React from 'react';
import PersonContextMenu from './PersonContextMenu';

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
  type?: string;
  relationshipStatus?: 'married' | 'divorced' | 'conflicted' | 'separated';
  id?: string;
  fromId?: string;
  toId?: string;
};

type GenogramData = {
  nodes: GenogramNode[];
  lines: GenogramLine[];
};

type SimpleGenogramRendererProps = {
  data: GenogramData;
  onPersonAction?: (nodeId: string, action: 'addPartner' | 'addChild' | 'addFather' | 'addMother' | 'addSibling' | 'edit' | 'delete') => void;
  onRelationshipAction?: (lineId: string, fromId: string, toId: string, action: 'edit') => void;
};

const SimpleGenogramRenderer = ({ data, onPersonAction, onRelationshipAction }: SimpleGenogramRendererProps) => {
  // Transform n8n genogram data to our format
  const transformedData = transformN8nData(data);
  const { nodes, lines } = transformedData;
  
  // Helper function to transform n8n data format
  function transformN8nData(n8nData: any): GenogramData {
    if (n8nData.nodes && n8nData.edges) {
      // n8n format
      const allNodes = n8nData.nodes.filter((node: any) => !node.isDummy);
      const nodes: GenogramNode[] = allNodes.map((node: any) => ({
        id: node.id,
        name: node.label,
        shape: node.shape === 'square' ? 'rect' : node.shape,
        x: node.x || 0,
        y: node.y || 0,
        isEgo: node.isEgo || false
      }));
      
      // Create lines from edges
      const lines: GenogramLine[] = [];
      n8nData.edges?.forEach((edge: any) => {
        const fromNode = allNodes.find((n: any) => n.id === edge.from);
        const toNode = allNodes.find((n: any) => n.id === edge.to);
        
        if (fromNode && toNode) {
          lines.push({
            fromX: fromNode.x || 0,
            fromY: fromNode.y || 0,
            toX: toNode.x || 0,
            toY: toNode.y || 0,
            type: edge.type || 'partner',
            relationshipStatus: edge.relationshipStatus,
            id: edge.id,
            fromId: edge.from,
            toId: edge.to
          });
        }
      });
      
      return { nodes, lines };
    }
    
    // If already in our format
    return data;
  }
  
  // Calculate SVG dimensions with generous margins to prevent clipping
  const margin = 150;     // Increased margin to prevent clipping
  const nodeSize = 120;   // Account for larger node sizes from dagre
  
  // Handle empty nodes case
  if (nodes.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-gray-500">Keine Daten zum Anzeigen</div>;
  }
  
  const minX = Math.min(...nodes.map(n => n.x)) - nodeSize/2 - margin;
  const maxX = Math.max(...nodes.map(n => n.x)) + nodeSize/2 + margin;
  const minY = Math.min(...nodes.map(n => n.y)) - nodeSize/2 - margin;
  const maxY = Math.max(...nodes.map(n => n.y)) + nodeSize/2 + margin;
  
  const svgWidth = Math.max(800, maxX - minX);   // Minimum width to prevent too small SVGs
  const svgHeight = Math.max(600, maxY - minY);  // Minimum height to prevent too small SVGs
  
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
    
    // For generation connectors and sibling connectors (straight lines)
    if (type === 'generation-connector' || type === 'sibling-connector') {
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

  // Function to create special line patterns for different relationship statuses
  const createRelationshipPath = (line: GenogramLine) => {
    const { fromX, fromY, toX, toY, relationshipStatus, type } = line;
    
    // Only apply special patterns to partner relationships
    if (type !== 'partner' || !relationshipStatus || relationshipStatus === 'married') {
      return createOrthogonalPath(line);
    }

    const basePath = `M ${fromX} ${fromY} L ${toX} ${toY}`;
    
    switch (relationshipStatus) {
      case 'divorced':
        // Two diagonal lines (//) over the partnership line
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const offset = 8;
        return {
          basePath,
          decorations: [
            `M ${midX - offset} ${midY - offset} L ${midX - offset + 10} ${midY + offset + 10}`,
            `M ${midX + offset - 10} ${midY - offset} L ${midX + offset} ${midY + offset + 10}`
          ]
        };
      
      case 'conflicted':
        // Zigzag line
        const segments = 4;
        const segmentLength = (toX - fromX) / segments;
        const amplitude = 8;
        let zigzagPath = `M ${fromX} ${fromY}`;
        for (let i = 1; i <= segments; i++) {
          const x = fromX + i * segmentLength;
          const y = fromY + (i % 2 === 0 ? amplitude : -amplitude);
          zigzagPath += ` L ${x} ${y}`;
        }
        zigzagPath += ` L ${toX} ${toY}`;
        return { basePath: zigzagPath };
      
      case 'separated':
        // Dashed line
        return { basePath, strokeDasharray: '8,4' };
      
      default:
        return { basePath };
    }
  };

  const RelationshipLine = ({ line, index }: { line: GenogramLine; index: number }) => {
    const lineStyle = createRelationshipPath(line);
    const isPartnerLine = line.type === 'partner';
    const isParentChildLine = line.type === 'parent-child';
    const isGenerationConnector = line.type === 'generation-connector';
    const isSiblingConnector = line.type === 'sibling-connector';
    const isClickable = isPartnerLine && !!onRelationshipAction && !!line.fromId && !!line.toId;
    
    const handleLineClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isClickable && line.fromId && line.toId) {
        onRelationshipAction(line.id || `${line.fromId}-${line.toId}`, line.fromId, line.toId, 'edit');
      }
    };

    // Different styling for different line types
    const getLineStroke = () => {
      if (isPartnerLine) return "#374151"; // Darker for partnerships
      if (isParentChildLine || isGenerationConnector || isSiblingConnector) return "#6b7280"; // Standard for family connections
      return "#9ca3af"; // Lighter for other relationships
    };

    const getLineWidth = () => {
      if (isPartnerLine) return "3"; // Thicker for partnerships
      if (isParentChildLine || isGenerationConnector || isSiblingConnector) return "2"; // Standard for family connections
      return "1"; // Thinner for other relationships
    };

    return (
      <g key={`line-${index}`}>
        <path
          d={typeof lineStyle === 'object' ? lineStyle.basePath : lineStyle}
          stroke={getLineStroke()}
          strokeWidth={getLineWidth()}
          strokeDasharray={typeof lineStyle === 'object' ? lineStyle.strokeDasharray : undefined}
          fill="none"
          className={isClickable ? "cursor-pointer hover:stroke-blue-500" : ""}
          onClick={isClickable ? handleLineClick : undefined}
        />
        {/* Render decorations for divorced relationships */}
        {typeof lineStyle === 'object' && lineStyle.decorations && 
          lineStyle.decorations.map((decoration, decorIndex) => (
            <path
              key={`decoration-${index}-${decorIndex}`}
              d={decoration}
              stroke={getLineStroke()}
              strokeWidth={getLineWidth()}
              fill="none"
              className={isClickable ? "cursor-pointer hover:stroke-blue-500" : ""}
              onClick={isClickable ? handleLineClick : undefined}
            />
          ))
        }
      </g>
    );
  };

  const PersonNode = ({ node }: { node: GenogramNode }) => {
    const size = 120;  // Larger size to match dagre configuration
    const halfSize = size / 2;
    const isCircle = node.shape === 'circle';
    const isSquare = node.shape === 'rect' || node.shape === 'square';
    const isDeceased = (node as any).isDeceased;
    
    const handlePersonAction = (action: 'addPartner' | 'addChild' | 'addFather' | 'addMother' | 'addSibling' | 'edit' | 'delete') => {
      if (onPersonAction) {
        onPersonAction(node.id, action);
      }
    };

    const PersonShape = () => (
      <>
        {isCircle ? (
          <circle
            cx={node.x}
            cy={node.y}
            r={halfSize}
            fill="#fce7f3"
            stroke="#ec4899"
            strokeWidth="2"
            className="cursor-pointer hover:opacity-80"
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
            className="cursor-pointer hover:opacity-80"
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
          className="pointer-events-none"
        >
          {node.name}
        </text>
        
        {/* Show X for deceased persons */}
        {isDeceased && (
          <g>
            <line
              x1={node.x - halfSize + 10}
              y1={node.y - halfSize + 10}
              x2={node.x + halfSize - 10}
              y2={node.y + halfSize - 10}
              stroke="rgb(55, 65, 81)"
              strokeWidth="3"
              className="pointer-events-none"
            />
            <line
              x1={node.x + halfSize - 10}
              y1={node.y - halfSize + 10}
              x2={node.x - halfSize + 10}
              y2={node.y + halfSize - 10}
              stroke="rgb(55, 65, 81)"
              strokeWidth="3"
              className="pointer-events-none"
            />
          </g>
        )}
      </>
    );
    
    if (!onPersonAction) {
      // If no action handler, render as before
      return (
        <g key={node.id}>
          <PersonShape />
        </g>
      );
    }

    return (
      <g key={node.id}>
        <PersonContextMenu
          onAddPartner={() => handlePersonAction('addPartner')}
          onAddChild={() => handlePersonAction('addChild')}
          onAddFather={() => handlePersonAction('addFather')}
          onAddMother={() => handlePersonAction('addMother')}
          onAddSibling={() => handlePersonAction('addSibling')}
          onEditPerson={() => handlePersonAction('edit')}
          onDeletePerson={() => handlePersonAction('delete')}
        >
          <g>
            <PersonShape />
          </g>
        </PersonContextMenu>
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
          <RelationshipLine key={`line-${index}`} line={line} index={index} />
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