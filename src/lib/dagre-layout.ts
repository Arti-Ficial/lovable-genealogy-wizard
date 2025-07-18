import dagre from 'dagre';

export type GenogramNode = {
  id: string;
  name: string;
  shape: 'circle' | 'rect';
  isEgo?: boolean;
};

export type GenogramRelationship = {
  from: string;
  to: string;
  type: 'partner' | 'parent-child' | 'sibling';
  relationshipStatus?: 'married' | 'divorced' | 'conflicted' | 'separated';
};

export type GenogramInput = {
  persons: Array<{
    id: number;
    name: string;
    gender: 'male' | 'female';
    isEgo?: boolean;
    isDeceased?: boolean;
  }>;
  relationships: Array<{
    from: number;
    to: number;
    type: 'partner' | 'parent-child' | 'sibling';
    relationshipStatus?: 'married' | 'divorced' | 'conflicted' | 'separated';
  }>;
};

export type GenogramBackendData = {
  nodes: Array<{
    id: string;
    label: string;
    width?: number;
    height?: number;
    shape: string;
    isEgo?: boolean;
    isDummy?: boolean;
    isDeceased?: boolean;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type?: string;
    relationshipStatus?: 'married' | 'divorced' | 'conflicted' | 'separated';
  }>;
};

export type GenogramLayoutResult = {
  nodes: Array<{
    id: string;
    name: string;
    shape: 'circle' | 'rect';
    x: number;
    y: number;
    isEgo?: boolean;
    isDeceased?: boolean;
  }>;
  lines: Array<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    type: string;
    relationshipStatus?: 'married' | 'divorced' | 'conflicted' | 'separated';
    id?: string;
    fromId?: string;
    toId?: string;
  }>;
};

export function calculateGenogramLayoutFromBackend(input: GenogramBackendData): GenogramLayoutResult {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  
  // Set graph attributes for proper genogram layout
  g.setGraph({
    rankdir: 'TB',    // Top to bottom layout (grandparents -> parents -> children)
    nodesep: 150,     // More horizontal spacing between nodes
    ranksep: 200,     // More vertical spacing between generations
    marginx: 100,     // More margin for proper spacing
    marginy: 100,
    align: 'UL'       // Align upper left for consistent positioning
  });
  
  // Set default edge and node attributes
  g.setDefaultEdgeLabel(() => ({}));
  g.setDefaultNodeLabel(() => ({}));
  
  // Add nodes to the graph (include dummy nodes for layout calculation)
  input.nodes.forEach(node => {
    g.setNode(node.id, {
      label: node.isDummy ? '' : node.label,
      width: node.isDummy ? 10 : 120,  // Consistent sizing for proper layout
      height: node.isDummy ? 10 : 80,  // Consistent sizing for proper layout
      shape: node.isDummy ? 'rect' : (node.shape === 'square' ? 'rect' : 'circle')
    });
  });
  
  // Add edges to the graph
  input.edges.forEach(edge => {
    g.setEdge(edge.from, edge.to, { 
      type: edge.type || 'default',
      relationshipStatus: edge.relationshipStatus
    });
  });
  
  // Calculate layout
  dagre.layout(g);
  
  // Extract nodes with calculated positions (filter out dummy nodes from final result)
  const nodes = g.nodes()
    .filter(nodeId => {
      const originalNode = input.nodes.find(n => n.id === nodeId);
      return originalNode && !originalNode.isDummy;
    })
    .map(nodeId => {
      const node = g.node(nodeId);
      const originalNode = input.nodes.find(n => n.id === nodeId);
      
      return {
        id: nodeId,
        name: node.label,
        shape: node.shape as 'circle' | 'rect',
        x: node.x,
        y: node.y,
        isEgo: originalNode?.isEgo || false,
        isDeceased: originalNode?.isDeceased || false
      };
    });
  
  // Extract edges with calculated positions and create proper family lines
  const processedEdges = new Set<string>();
  const lines: any[] = [];
  const partnershipLines: any[] = [];
  const childConnections: any[] = [];
  
  g.edges().forEach(edgeId => {
    const edge = g.edge(edgeId);
    const sourceNode = g.node(edgeId.v);
    const targetNode = g.node(edgeId.w);
    const originalEdge = input.edges.find(e => e.from === edgeId.v && e.to === edgeId.w);
    
    // Handle partnership connections via dummy node
    if (edgeId.w.startsWith('partner-') && edgeId.v.startsWith('person-')) {
      const dummyNodeId = edgeId.w;
      // Find the other person connected to this dummy node
      const otherEdge = g.edges().find(e => 
        e.w === dummyNodeId && e.v !== edgeId.v && e.v.startsWith('person-')
      );
      
      if (otherEdge && !processedEdges.has(`${edgeId.v}-${otherEdge.v}`) && !processedEdges.has(`${otherEdge.v}-${edgeId.v}`)) {
        // Create direct partnership line between the two persons
        const otherPersonNode = g.node(otherEdge.v);
        
        // Find the original relationship status from the input edges
        // Look for edges that connect to this partnership dummy node and have relationshipStatus
        let relationshipStatus = 'married'; // default
        const partnershipEdges = input.edges.filter(e => 
          e.to === dummyNodeId && e.relationshipStatus
        );
        if (partnershipEdges.length > 0) {
          relationshipStatus = partnershipEdges[0].relationshipStatus;
        }
        
        const partnershipLine = {
          fromX: sourceNode.x,
          fromY: sourceNode.y,
          toX: otherPersonNode.x,
          toY: otherPersonNode.y,
          type: 'partner',
          relationshipStatus: relationshipStatus,
          id: `${edgeId.v}-${otherEdge.v}`,
          fromId: edgeId.v,
          toId: otherEdge.v,
          dummyNodeId: dummyNodeId
        };
        lines.push(partnershipLine);
        partnershipLines.push(partnershipLine);
        processedEdges.add(`${edgeId.v}-${otherEdge.v}`);
        processedEdges.add(`${otherEdge.v}-${edgeId.v}`);
      }
    }
    // Handle parent-child relationships (from dummy nodes to children)
    else if (edgeId.v.startsWith('partner-') && edgeId.w.startsWith('person-')) {
      const dummyNode = g.node(edgeId.v);
      childConnections.push({
        dummyNodeId: edgeId.v,
        dummyX: dummyNode.x,
        dummyY: dummyNode.y,
        childX: targetNode.x,
        childY: targetNode.y,
        childId: edgeId.w,
        relationshipStatus: originalEdge?.relationshipStatus
      });
    }
  });

  // Now create the vertical generation lines
  partnershipLines.forEach(partnershipLine => {
    const children = childConnections.filter(child => child.dummyNodeId === partnershipLine.dummyNodeId);
    
    if (children.length > 0) {
      // Calculate midpoint of partnership line
      const midX = (partnershipLine.fromX + partnershipLine.toX) / 2;
      const midY = (partnershipLine.fromY + partnershipLine.toY) / 2;
      
      // Create vertical line from partnership midpoint to horizontal line connecting children
      const childrenY = children[0].childY; // All children should be on same Y level
      const verticalLineY = midY + (childrenY - midY) / 2;
      
      // Add vertical line from partnership to children level
      lines.push({
        fromX: midX,
        fromY: midY,
        toX: midX,
        toY: verticalLineY,
        type: 'generation-connector',
        id: `vertical-${partnershipLine.dummyNodeId}`
      });
      
      if (children.length > 1) {
        // Add horizontal line connecting all children
        const leftmostChild = Math.min(...children.map(c => c.childX));
        const rightmostChild = Math.max(...children.map(c => c.childX));
        
        lines.push({
          fromX: leftmostChild,
          fromY: verticalLineY,
          toX: rightmostChild,
          toY: verticalLineY,
          type: 'sibling-connector',
          id: `horizontal-${partnershipLine.dummyNodeId}`
        });
      }
      
      // Add vertical lines from horizontal connector to each child
      children.forEach((child, index) => {
        lines.push({
          fromX: child.childX,
          fromY: verticalLineY,
          toX: child.childX,
          toY: child.childY,
          type: 'parent-child',
          relationshipStatus: child.relationshipStatus,
          id: `child-${partnershipLine.dummyNodeId}-${index}`,
          fromId: partnershipLine.dummyNodeId,
          toId: child.childId
        });
      });
    }
  });
  
  return { nodes, lines };
}

export function calculateGenogramLayout(input: GenogramInput): GenogramLayoutResult {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  
  // Set graph attributes
  g.setGraph({
    rankdir: 'TB', // Top to bottom layout
    nodesep: 100,  // Horizontal spacing between nodes
    ranksep: 120,  // Vertical spacing between ranks
    marginx: 50,
    marginy: 50
  });
  
  // Set default edge and node attributes
  g.setDefaultEdgeLabel(() => ({}));
  g.setDefaultNodeLabel(() => ({}));
  
  // Add nodes to the graph
  input.persons.forEach(person => {
    g.setNode(person.id.toString(), {
      label: person.name,
      width: 80,
      height: 80,
      shape: person.gender === 'male' ? 'rect' : 'circle'
    });
  });
  
  // Add edges to the graph
  input.relationships.forEach(rel => {
    // For dagre, we need to determine the direction of parent-child relationships
    if (rel.type === 'parent-child') {
      // Parent points to child
      g.setEdge(rel.from.toString(), rel.to.toString(), { 
        type: rel.type,
        relationshipStatus: rel.relationshipStatus
      });
    } else {
      // For partner and sibling relationships, add undirected edges
      g.setEdge(rel.from.toString(), rel.to.toString(), { 
        type: rel.type,
        relationshipStatus: rel.relationshipStatus
      });
    }
  });
  
  // Calculate layout
  dagre.layout(g);
  
  // Extract nodes with calculated positions
  const nodes = g.nodes().map(nodeId => {
    const node = g.node(nodeId);
    const person = input.persons.find(p => p.id.toString() === nodeId);
    
    return {
      id: nodeId,
      name: node.label,
      shape: node.shape as 'circle' | 'rect',
      x: node.x,
      y: node.y,
      isEgo: person?.isEgo || false,
      isDeceased: person?.isDeceased || false
    };
  });
  
  // Extract edges with calculated positions
  const lines = g.edges().map(edgeId => {
    const edge = g.edge(edgeId);
    const sourceNode = g.node(edgeId.v);
    const targetNode = g.node(edgeId.w);
    const originalRel = input.relationships.find(r => 
      r.from.toString() === edgeId.v && r.to.toString() === edgeId.w
    );
    
    // Calculate line positions from node centers
    return {
      fromX: sourceNode.x,
      fromY: sourceNode.y,
      toX: targetNode.x,
      toY: targetNode.y,
      type: edge.type || 'default',
      relationshipStatus: originalRel?.relationshipStatus,
      id: `${edgeId.v}-${edgeId.w}`,
      fromId: edgeId.v,
      toId: edgeId.w
    };
  });
  
  return { nodes, lines };
}